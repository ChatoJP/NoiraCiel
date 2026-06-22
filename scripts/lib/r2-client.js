#!/usr/bin/env node
'use strict'
/**
 * r2-client.js
 * Shared Cloudflare R2 client for all NoiraCiel media migration/upload scripts.
 * Native HTTPS + AWS Signature V4 (no SDK dependency) — same approach as the
 * original scripts/kie/upload-to-r2.js, generalized for any file/category.
 *
 * Core guarantee: migrateFile() never deletes a local file unless the upload
 * AND a post-upload remote verification (HEAD + size match) both succeeded.
 */

const fs     = require('fs')
const path   = require('path')
const https  = require('https')
const crypto = require('crypto')
const { execSync } = require('child_process')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.warn('⚠  .env.local not found — create it from .env.example')
    return
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}
loadEnv()

const ENDPOINT   = process.env.R2_ENDPOINT
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET     = process.env.R2_BUCKET
const PUBLIC_URL = process.env.R2_PUBLIC_URL

const ts   = () => new Date().toISOString().slice(11, 19)
const log  = (m) => console.log(`[${ts()}] ${m}`)
const warn = (m) => console.warn(`[${ts()}] ⚠  ${m}`)
const err  = (m) => console.error(`[${ts()}] ✗  ${m}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function assertConfigured() {
  if (!ENDPOINT || !ACCESS_KEY || !SECRET_KEY || !BUCKET || !PUBLIC_URL) {
    throw new Error('R2 not configured — check .env.local for R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL')
  }
}

const CONTENT_TYPES = {
  '.mp4': 'video/mp4', '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.aiff': 'audio/aiff', '.aif': 'audio/aiff',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.pdf': 'application/pdf', '.json': 'application/json', '.txt': 'text/plain',
}
function contentTypeFor(filename) {
  return CONTENT_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream'
}

// ─── AWS Signature V4 ─────────────────────────────────────────────────────────
function hmac(key, data) { return crypto.createHmac('sha256', key).update(data).digest() }
function sha256hex(data) { return crypto.createHash('sha256').update(data).digest('hex') }

// RFC 3986 percent-encoding per path segment (spaces, parens, etc. all need
// to match exactly between the signed canonical request and the actual HTTP
// request path, which encodeURIComponent + this fixup gives us).
function encodeRfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}
function canonicalPath(key) {
  return '/' + [BUCKET, ...key.split('/')].map(encodeRfc3986).join('/')
}

function signedRequest(method, key, { contentType, body } = {}) {
  const reqPath  = canonicalPath(key)
  const hostname = new URL(ENDPOINT).hostname
  const now      = new Date()
  const date     = now.toISOString().replace(/[-:]/g, '').slice(0, 8)
  const datetime = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const region   = 'auto'
  const service  = 's3'
  const payload  = body || Buffer.alloc(0)
  const bodyHash = sha256hex(payload)

  const headers = {
    host:                  hostname,
    'x-amz-date':          datetime,
    'x-amz-content-sha256':bodyHash,
  }
  if (contentType) headers['content-type'] = contentType
  if (body) headers['content-length'] = String(body.length)

  const signedHeaderNames = Object.keys(headers).sort().join(';')
  const canonicalHeaders  = Object.keys(headers).sort().map(k => `${k}:${headers[k]}`).join('\n') + '\n'
  const canonicalRequest  = [method, reqPath, '', canonicalHeaders, signedHeaderNames, bodyHash].join('\n')
  const scope             = `${date}/${region}/${service}/aws4_request`
  const stringToSign      = `AWS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonicalRequest)}`
  const signingKey        = hmac(hmac(hmac(hmac(`AWS4${SECRET_KEY}`, date), region), service), 'aws4_request')
  const signature         = hmac(signingKey, stringToSign).toString('hex')

  headers.authorization = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${scope},SignedHeaders=${signedHeaderNames},Signature=${signature}`
  return { hostname, path: reqPath, headers }
}

function httpRequest(method, key, opts = {}) {
  return new Promise((resolve, reject) => {
    const { hostname, path: reqPath, headers } = signedRequest(method, key, opts)
    const req = https.request({ hostname, port: 443, path: reqPath, method, headers }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
    })
    req.on('error', reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

// ─── Atomic JSON writes ─────────────────────────────────────────────────────────
/**
 * Write JSON to disk safely: serialize, write to a temp file in the same
 * directory, read it back and re-parse it, then rename over the target.
 * The read-back-and-reparse step is what actually catches a disk-full mid
 * -write (the exact failure mode that truncated lyric-videos.json earlier) —
 * a short write still "succeeds" as far as fs.writeFileSync is concerned, but
 * the bytes on disk don't round-trip through JSON.parse. The rename is atomic
 * on the same filesystem, so readers never observe a half-written file: they
 * see either the old complete version or the new complete version, never a
 * partial one.
 */
function atomicWriteJSON(targetPath, data) {
  const dir   = path.dirname(targetPath)
  const tmp   = path.join(dir, `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.tmp`)
  const text  = JSON.stringify(data, null, 2)
  try {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(tmp, text)
    const roundTrip = fs.readFileSync(tmp, 'utf-8')
    JSON.parse(roundTrip) // throws if the write was truncated/corrupted
    fs.renameSync(tmp, targetPath)
  } catch (e) {
    try { fs.unlinkSync(tmp) } catch { /* tmp may not exist — fine */ }
    throw new Error(`atomicWriteJSON failed for ${targetPath}: ${e.message}`)
  }
}

// ─── Disk space guard ──────────────────────────────────────────────────────────
function checkDiskSpace(minFreeMb = 500) {
  try {
    const out = execSync("df -m / | awk 'NR==2{print $4}'").toString().trim()
    const freeMb = parseInt(out, 10)
    return { freeMb, ok: freeMb >= minFreeMb }
  } catch {
    return { freeMb: null, ok: true } // can't determine — don't block
  }
}

// ─── Core operations ───────────────────────────────────────────────────────────
function publicUrlFor(r2Key) {
  return `${PUBLIC_URL}/${r2Key.split('/').map(encodeRfc3986).join('/')}`
}

async function uploadFile(localPath, r2Key) {
  assertConfigured()
  const body        = fs.readFileSync(localPath)
  const contentType = contentTypeFor(localPath)
  const res = await httpRequest('PUT', r2Key, { contentType, body })
  if (![200, 201, 204].includes(res.statusCode)) {
    throw new Error(`PUT ${r2Key} failed: HTTP ${res.statusCode} ${res.body.toString().slice(0, 200)}`)
  }
  return publicUrlFor(r2Key)
}

async function downloadFile(r2Key, localPath) {
  assertConfigured()
  const res = await httpRequest('GET', r2Key)
  if (res.statusCode !== 200) {
    throw new Error(`GET ${r2Key} failed: HTTP ${res.statusCode}`)
  }
  fs.mkdirSync(path.dirname(localPath), { recursive: true })
  fs.writeFileSync(localPath, res.body)
}

async function verifyUpload(localPath, r2Key) {
  assertConfigured()
  const expectedSize = fs.statSync(localPath).size
  const res = await httpRequest('HEAD', r2Key)
  if (res.statusCode !== 200) {
    return { ok: false, reason: `HEAD ${r2Key} returned HTTP ${res.statusCode}` }
  }
  const remoteSize = parseInt(res.headers['content-length'] || '0', 10)
  if (remoteSize !== expectedSize) {
    return { ok: false, reason: `size mismatch: local ${expectedSize}B vs remote ${remoteSize}B` }
  }
  return { ok: true, remoteSize }
}

/**
 * Upload one local file to R2, verify it landed intact, optionally delete the
 * local copy. Deletion only ever happens after a successful verify — on any
 * failure the local file is left untouched and the error is thrown so callers
 * can stop a batch rather than silently skip a file.
 */
async function migrateFile(localPath, r2Key, { deleteLocal = false } = {}) {
  log(`upload started: ${localPath} → ${r2Key}`)
  const r2Url = await uploadFile(localPath, r2Key)
  const verification = await verifyUpload(localPath, r2Key)
  if (!verification.ok) {
    throw new Error(`verify failed for ${r2Key}: ${verification.reason}`)
  }
  log(`upload completed + verified: ${r2Url}`)
  let deletedLocal = false
  if (deleteLocal) {
    try {
      fs.unlinkSync(localPath)
      deletedLocal = true
      log(`local file deleted: ${localPath}`)
    } catch (e) {
      // Upload is verified on R2 — a failed local delete (e.g. permission
      // denied on a root-owned file) is not data loss, so don't fail the
      // whole batch over it. Caller decides what to do with deletedLocal=false.
      warn(`upload verified but could not delete local file (${e.code || e.message}): ${localPath}`)
    }
  }
  return { r2Url, deletedLocal }
}

module.exports = {
  loadEnv, log, warn, err, sleep,
  ENDPOINT, BUCKET, PUBLIC_URL,
  assertConfigured, contentTypeFor,
  uploadFile, downloadFile, verifyUpload, migrateFile, checkDiskSpace, publicUrlFor,
  atomicWriteJSON,
}
