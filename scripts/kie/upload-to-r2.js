#!/usr/bin/env node
'use strict'
/**
 * upload-to-r2.js
 * Uploads completed cinemagraph videos + showreel to Cloudflare R2.
 * Updates manifests with public R2 URLs.
 * Uses native HTTPS with AWS Signature V4 (no SDK dependency).
 *
 * Usage:
 *   node scripts/kie/upload-to-r2.js              # upload cinemagraphs + showreel
 *   node scripts/kie/upload-to-r2.js --cinemagraphs
 *   node scripts/kie/upload-to-r2.js --showreel
 *   node scripts/kie/upload-to-r2.js --slug why   # single song
 */

const fs     = require('fs')
const path   = require('path')
const https  = require('https')
const crypto = require('crypto')
const { loadEnv, log, warn, err, sleep } = require('./../../scripts/lib/kie-client')

loadEnv()

const ROOT        = path.join(__dirname, '..', '..')
const SONGS_DIR   = path.join(ROOT, 'public/generated/kie/songs')
const CIN_DIR     = path.join(ROOT, 'public/generated/kie/cinemagraphs')
const SHOWREEL_DIR= path.join(ROOT, 'public/generated/kie/showreel')

const ENDPOINT    = process.env.R2_ENDPOINT        // https://{accountId}.r2.cloudflarestorage.com
const ACCESS_KEY  = process.env.R2_ACCESS_KEY_ID
const SECRET_KEY  = process.env.R2_SECRET_ACCESS_KEY
const BUCKET      = process.env.R2_BUCKET          // noiraciel-media
const PUBLIC_URL  = process.env.R2_PUBLIC_URL      // https://pub-...r2.dev

const SLUG_ARG    = process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : null
const ONLY_CIN    = process.argv.includes('--cinemagraphs')
const ONLY_SHOW   = process.argv.includes('--showreel')
const ONLY_MV     = process.argv.includes('--music-video')
const MV_DIR      = path.join(ROOT, 'public/generated/kie/music-videos')

// ─── AWS Signature V4 ─────────────────────────────────────────────────────────
function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest()
}
function sha256hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function signedHeaders(method, key, contentType, body) {
  const url      = new URL(`${ENDPOINT}/${BUCKET}/${key}`)
  const now      = new Date()
  const date     = now.toISOString().replace(/[-:]/g, '').slice(0, 8)
  const datetime = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const region   = 'auto'
  const service  = 's3'
  const bodyHash = sha256hex(body)

  const headers = {
    'host':                 url.hostname,
    'x-amz-date':          datetime,
    'x-amz-content-sha256':bodyHash,
    'content-type':        contentType,
    'content-length':      String(body.length),
  }

  const signedHeaderNames = Object.keys(headers).sort().join(';')
  const canonicalHeaders  = Object.keys(headers).sort().map(k => `${k}:${headers[k]}`).join('\n') + '\n'
  const canonicalRequest  = [method, `/${BUCKET}/${key}`, '', canonicalHeaders, signedHeaderNames, bodyHash].join('\n')
  const scope             = `${date}/${region}/${service}/aws4_request`
  const stringToSign      = `AWS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonicalRequest)}`
  const signingKey        = hmac(hmac(hmac(hmac(`AWS4${SECRET_KEY}`, date), region), service), 'aws4_request')
  const signature         = hmac(signingKey, stringToSign).toString('hex')

  headers['authorization'] = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${scope},SignedHeaders=${signedHeaderNames},Signature=${signature}`
  return { url, headers }
}

function uploadFile(localPath, r2Key) {
  return new Promise((resolve, reject) => {
    const body        = fs.readFileSync(localPath)
    const contentType = localPath.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream'
    const { url, headers } = signedHeaders('PUT', r2Key, contentType, body)

    const req = https.request({
      hostname: url.hostname,
      port:     443,
      path:     url.pathname,
      method:   'PUT',
      headers,
    }, res => {
      let data = ''
      res.on('data', c => (data += c))
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
          resolve(`${PUBLIC_URL}/${r2Key}`)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Cinemagraphs ─────────────────────────────────────────────────────────────
async function uploadCinemagraphs() {
  const files = fs.readdirSync(SONGS_DIR).filter(f => f.endsWith('.json'))
  const targets = files
    .map(f => JSON.parse(fs.readFileSync(path.join(SONGS_DIR, f))))
    .filter(m => {
      if (SLUG_ARG && m.slug !== SLUG_ARG) return false
      return m.generatedAssets.cinemagraph.status === 'complete'
    })

  log(`\nUploading ${targets.length} cinemagraphs to R2...\n`)
  let ok = 0, fail = 0

  for (const m of targets) {
    const localPath = path.join(CIN_DIR, m.slug, 'loop.mp4')
    if (!fs.existsSync(localPath)) { warn(`  missing file: ${m.slug}`); fail++; continue }

    const r2Key    = `generated/kie/cinemagraphs/${m.slug}/loop.mp4`
    const fileSize = (fs.statSync(localPath).size / 1024 / 1024).toFixed(1)

    try {
      const r2Url = await uploadFile(localPath, r2Key)
      m.generatedAssets.cinemagraph.r2Url    = r2Url
      m.generatedAssets.cinemagraph.publicUrl = r2Url
      m.updatedAt = new Date().toISOString()
      fs.writeFileSync(path.join(SONGS_DIR, `${m.slug}.json`), JSON.stringify(m, null, 2))
      log(`  ✓ ${m.slug} (${fileSize}MB) → ${r2Url}`)
      ok++
    } catch (e) {
      err(`  ✗ ${m.slug}: ${e.message}`)
      fail++
    }
    await sleep(200)
  }

  log(`\n  Cinemagraphs: ${ok} uploaded, ${fail} failed\n`)
}

// ─── Showreel ─────────────────────────────────────────────────────────────────
async function uploadShowreel() {
  const localPath = path.join(SHOWREEL_DIR, 'noiraciel-living-artwork.mp4')
  if (!fs.existsSync(localPath)) {
    warn('Showreel not found — run create-showreel.js first'); return
  }

  const r2Key    = 'generated/kie/showreel/noiraciel-living-artwork.mp4'
  const fileSize = (fs.statSync(localPath).size / 1024 / 1024).toFixed(1)
  log(`\nUploading showreel (${fileSize}MB) to R2...`)

  try {
    const r2Url = await uploadFile(localPath, r2Key)
    log(`  ✓ showreel → ${r2Url}`)

    // Save manifest
    const manifest = {
      title:    'NoiraCiel — Living Artwork',
      r2Url,
      localPath: 'public/generated/kie/showreel/noiraciel-living-artwork.mp4',
      uploadedAt: new Date().toISOString(),
    }
    fs.writeFileSync(path.join(SHOWREEL_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  } catch (e) {
    err(`  ✗ showreel: ${e.message}`)
  }
}

// ─── Music Videos ─────────────────────────────────────────────────────────────
async function uploadMusicVideos() {
  if (!fs.existsSync(MV_DIR)) { warn('No music-videos dir found'); return }
  const files = fs.readdirSync(MV_DIR).filter(f => f.endsWith('.mp4'))
  if (!files.length) { warn('No music videos to upload'); return }
  log(`\nUploading ${files.length} music video(s) to R2...`)
  for (const file of files) {
    const localPath = path.join(MV_DIR, file)
    const r2Key     = `generated/kie/music-videos/${file}`
    const fileSize  = (fs.statSync(localPath).size / 1024 / 1024).toFixed(1)
    try {
      const r2Url = await uploadFile(localPath, r2Key)
      log(`  ✓ ${file} (${fileSize}MB) → ${r2Url}`)
      fs.writeFileSync(
        path.join(MV_DIR, file.replace('.mp4', '-manifest.json')),
        JSON.stringify({ file, r2Url, fileSize: fileSize + 'MB', uploadedAt: new Date().toISOString() }, null, 2)
      )
    } catch (e) {
      err(`  ✗ ${file}: ${e.message}`)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!ENDPOINT || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
    err('Missing R2 credentials. Check .env.local for R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET')
    process.exit(1)
  }
  if (!PUBLIC_URL) {
    err('Missing R2_PUBLIC_URL in .env.local')
    process.exit(1)
  }

  log(`\n── R2 Upload ────────────────────────────────────────────────`)
  log(`   Bucket: ${BUCKET}`)
  log(`   CDN:    ${PUBLIC_URL}`)

  if (!ONLY_SHOW && !ONLY_MV) await uploadCinemagraphs()
  if (!ONLY_CIN  && !ONLY_MV) await uploadShowreel()
  if (ONLY_MV || (!ONLY_CIN && !ONLY_SHOW)) await uploadMusicVideos()

  log('── Done.\n')
}

main().catch(e => { err(e.message); process.exit(1) })
