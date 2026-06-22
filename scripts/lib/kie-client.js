#!/usr/bin/env node
/**
 * kie-client.js
 * Shared Kie.ai API client for all NoiraCiel asset generation scripts.
 *
 * Supports:
 *   - Image generation via Flux Kontext  (POST /flux/kontext/generate)
 *   - Video clip generation via Veo3     (POST /veo/generate)
 * Both use the same poll pattern: successFlag 0=pending 1=success 2/3=failed
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const https = require('https')
const http  = require('http')

const KIE_BASE     = 'https://api.kie.ai/api/v1'
const MAX_RETRIES  = 3
const RATE_LIMIT_MS = 3500

// ─── Environment ─────────────────────────────────────────────────────────────
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

// ─── Logging ─────────────────────────────────────────────────────────────────
const ts   = () => new Date().toISOString().slice(11, 19)
const log  = (m) => console.log(`[${ts()}] ${m}`)
const warn = (m) => console.warn(`[${ts()}] ⚠  ${m}`)
const err  = (m) => console.error(`[${ts()}] ✗  ${m}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ─── Core HTTP ───────────────────────────────────────────────────────────────
function kieRequest(method, endpoint, body) {
  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) throw new Error('KIE_API_KEY not set — check .env.local')

  return new Promise((resolve, reject) => {
    const url = new URL(`${KIE_BASE}${endpoint}`)
    const payload = body ? JSON.stringify(body) : null
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NoiraCiel/2.0',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.code && parsed.code !== 200) {
            reject(new Error(`Kie.ai ${parsed.code}: ${parsed.msg || JSON.stringify(parsed).slice(0, 120)}`))
          } else {
            resolve(parsed)
          }
        } catch {
          reject(new Error(`Bad JSON: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function kieRequestWithRetry(method, endpoint, body, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await kieRequest(method, endpoint, body)
    } catch (e) {
      if (attempt === retries) throw e
      const wait = attempt * 5000
      warn(`Attempt ${attempt} failed: ${e.message}. Retrying in ${wait / 1000}s…`)
      await sleep(wait)
    }
  }
}

// ─── Download ─────────────────────────────────────────────────────────────────
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    const file = fs.createWriteStream(destPath)
    const protocol = url.startsWith('https') ? https : http
    protocol.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        return resolve(downloadFile(res.headers.location, destPath))
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', (e) => { fs.unlink(destPath, () => {}); reject(e) })
  })
}

// ─── Image API (Flux Kontext) ─────────────────────────────────────────────────
/**
 * Submit an image generation job.
 * @param {string} prompt
 * @param {{ aspectRatio?: string, outputFormat?: string, model?: string }} opts
 * @returns {Promise<string>} taskId
 */
async function submitImageJob(prompt, opts = {}) {
  const res = await kieRequestWithRetry('POST', '/flux/kontext/generate', {
    prompt,
    model:        opts.model        ?? 'flux-kontext-pro',
    aspectRatio:  opts.aspectRatio  ?? '1:1',
    outputFormat: opts.outputFormat ?? 'jpeg',
  })
  const taskId = res.data?.taskId
  if (!taskId) throw new Error('No taskId in image response')
  return taskId
}

/**
 * Poll an image job.
 * @returns {{ done: boolean, failed: boolean, url: string|null }}
 */
async function pollImageJob(taskId) {
  const res = await kieRequestWithRetry('GET', `/flux/kontext/record-info?taskId=${taskId}`)
  const d = res.data ?? {}
  if (d.successFlag === 1) return { done: true, failed: false, url: d.response?.resultImageUrl ?? d.resultImageUrl ?? null }
  if (d.successFlag === 2 || d.successFlag === 3) return { done: true, failed: true, url: null }
  return { done: false, failed: false, url: null }
}

// ─── Video API (Veo3) ─────────────────────────────────────────────────────────
/**
 * Submit a Veo3 video clip job.
 * @returns {Promise<string>} taskId
 */
async function submitVideoClip(prompt, opts = {}) {
  const res = await kieRequestWithRetry('POST', '/veo/generate', {
    prompt,
    model:          'veo3',
    generationType: 'TEXT_2_VIDEO',
    aspect_ratio:   opts.aspectRatio ?? '16:9',
    resolution:     opts.resolution  ?? '720p',
    duration:       opts.duration    ?? 8,
  })
  const taskId = res.data?.taskId
  if (!taskId) throw new Error('No taskId in video response')
  return taskId
}

/**
 * Poll a Veo3 video clip job.
 * @returns {{ done: boolean, failed: boolean, url: string|null }}
 */
async function pollVideoClip(taskId) {
  const res = await kieRequestWithRetry('GET', `/veo/record-info?taskId=${taskId}`)
  const d = res.data ?? {}
  if (d.successFlag === 1 && d.response?.resultUrls?.[0]) {
    return { done: true, failed: false, url: d.response.resultUrls[0] }
  }
  if (d.successFlag === 2 || d.successFlag === 3) return { done: true, failed: true, url: null }
  return { done: false, failed: false, url: null }
}

// ─── TTS API (ElevenLabs via KIE.AI) ─────────────────────────────────────────
/**
 * Submit a text-to-speech job using ElevenLabs via KIE.AI market.
 * @param {string} text  Full narration text
 * @param {{ voice?: string, stability?: number, language_code?: string }} opts
 * @returns {Promise<string>} taskId
 */
async function submitTTSJob(text, opts = {}) {
  const res = await kieRequestWithRetry('POST', '/jobs/createTask', {
    model: 'elevenlabs/text-to-dialogue-v3',
    input: {
      dialogue: [{ text, voice: opts.voice ?? 'hpp4J3VqNfWAUOO0d1Us' }],
      stability: opts.stability ?? 0.5,
      ...(opts.language_code ? { language_code: opts.language_code } : {}),
    },
  })
  const taskId = res.data?.taskId
  if (!taskId) throw new Error('No taskId in TTS response')
  return taskId
}

/**
 * Poll a TTS job.
 * @returns {{ done: boolean, failed: boolean, url: string|null }}
 */
async function pollTTSJob(taskId) {
  const res = await kieRequestWithRetry('GET', `/jobs/recordInfo?taskId=${taskId}`)
  const d = res.data ?? {}
  if (d.state === 'success') {
    let url = null
    try {
      const parsed = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : d.resultJson
      url = parsed?.resultUrls?.[0] ?? parsed?.url ?? null
    } catch { url = null }
    return { done: true, failed: false, url }
  }
  if (d.state === 'fail') return { done: true, failed: true, url: null }
  return { done: false, failed: false, url: null }
}

// ─── Music API (Suno V4 via KIE.AI) ──────────────────────────────────────────
/**
 * Submit a Suno music generation job.
 * @param {{ lyrics: string, style: string, title: string, instrumental?: boolean }} opts
 * @returns {Promise<string>} taskId
 */
async function submitMusicJob({ lyrics, style, title, instrumental = false, negativeTags, model = 'V4' }) {
  const res = await kieRequestWithRetry('POST', '/generate', {
    model,
    customMode: true,
    prompt: lyrics,
    style,
    title,
    instrumental,
    callBackUrl: 'https://noiraciel.com/api/noop',
    ...(negativeTags ? { negativeTags } : {}),
  })
  const taskId = res.data?.taskId
  if (!taskId) throw new Error('No taskId in music response')
  return taskId
}

/**
 * Poll a Suno music job.
 * @returns {{ done: boolean, failed: boolean, audioUrl: string|null, lyricsText: string|null }}
 */
async function pollMusicJob(taskId) {
  const res = await kieRequestWithRetry('GET', `/generate/record-info?taskId=${taskId}`)
  const data = res.data ?? {}
  const status = data.status ?? 'PENDING'
  const sunoData = data.response?.sunoData ?? []

  if (status === 'SUCCESS' && sunoData.length > 0) {
    const first = sunoData[0]
    return {
      done: true,
      failed: false,
      audioUrl: first.audioUrl ?? first.audio_url ?? null,
      lyricsText: first.lyrics ?? null,
    }
  }
  if (status === 'FAILED' || status === 'ERROR') {
    return { done: true, failed: true, audioUrl: null, lyricsText: null }
  }
  return { done: false, failed: false, audioUrl: null, lyricsText: null }
}

module.exports = {
  loadEnv,
  log, warn, err, sleep, slugify,
  kieRequestWithRetry,
  downloadFile,
  submitImageJob,
  pollImageJob,
  submitVideoClip,
  pollVideoClip,
  submitTTSJob,
  pollTTSJob,
  submitMusicJob,
  pollMusicJob,
  RATE_LIMIT_MS,
}
