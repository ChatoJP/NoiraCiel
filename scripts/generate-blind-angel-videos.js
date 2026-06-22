#!/usr/bin/env node
/**
 * generate-blind-angel-videos.js
 *
 * Generates cinematic music videos for The Blind Angel — Intimate Metal Sessions.
 * Multi-clip strategy: for each song → generate ceil(duration / 8) clips of 8s via Kie.ai Veo3.
 * Once all clips are downloaded → ffmpeg concat + overlay original WAV audio.
 *
 * USAGE
 *   node scripts/generate-blind-angel-videos.js              # dry-run (default — safe, no API calls)
 *   node scripts/generate-blind-angel-videos.js --execute    # submit all clip jobs to Kie.ai
 *   node scripts/generate-blind-angel-videos.js --poll       # poll pending clips, download + stitch
 *   node scripts/generate-blind-angel-videos.js --list       # status overview
 *   node scripts/generate-blind-angel-videos.js --reset      # clear all pending state (start fresh)
 *   node scripts/generate-blind-angel-videos.js --stitch     # re-stitch from already-downloaded clips
 *   node scripts/generate-blind-angel-videos.js --track angel-of-darkness  # single track (partial slug match)
 *
 * SETUP
 *   1. Copy .env.example to .env.local and set KIE_API_KEY
 *   2. Ensure ffmpeg is installed and on PATH (ffmpeg.org)
 *   3. Run dry-run to review clip counts and prompts
 *   4. Run --execute when satisfied, then --poll to download and stitch
 */

'use strict'

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const { spawnSync } = require('child_process')
const os = require('os')

// ─── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.warn('⚠  .env.local not found — create it from .env.example')
    return
  }
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnv()

// ─── Config ───────────────────────────────────────────────────────────────────
const KIE_BASE        = 'https://api.kie.ai/api/v1'
const MUSIC_DIR       = path.join(__dirname, '..', 'Music', 'The  Blind Angel - Intimate Metal Sessions')
const VIDEOS_DIR      = path.join(__dirname, '..', 'public', 'Videos', 'blind-angel')
const VIDEOS_INDEX    = path.join(VIDEOS_DIR, 'index.json')

const SUPPORTED         = /\.(wav|mp3|flac|aiff?|m4a|ogg)$/i
const CLIP_DURATION_S   = 8
const MAX_CLIPS_PER_SONG = 40
const DEFAULT_DURATION_S = 240
const RATE_LIMIT_MS     = 3500
const POLL_INTERVAL_MS  = 15_000
const POLL_TIMEOUT_MS   = 20 * 60 * 1000
const MAX_RETRIES       = 3

// ─── Args ─────────────────────────────────────────────────────────────────────
const args        = process.argv.slice(2)
const DRY_RUN     = !args.includes('--execute') && !args.includes('--poll') &&
                    !args.includes('--list')    && !args.includes('--reset') &&
                    !args.includes('--stitch')
const EXEC_MODE   = args.includes('--execute')
const POLL_MODE   = args.includes('--poll')
const LIST_MODE   = args.includes('--list')
const RESET_MODE  = args.includes('--reset')
const STITCH_MODE = args.includes('--stitch')
const TRACK_ARG   = (() => {
  const idx = args.indexOf('--track')
  return idx !== -1 && args[idx + 1] ? args[idx + 1].toLowerCase() : null
})()

// ─── Logging ──────────────────────────────────────────────────────────────────
const ts    = () => new Date().toISOString().slice(11, 19)
const log   = (m) => console.log(`[${ts()}] ${m}`)
const warn  = (m) => console.warn(`[${ts()}] ⚠  ${m}`)
const err   = (m) => console.error(`[${ts()}] ✗  ${m}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function parseFilename(filename) {
  // Handles: "Noiraciel - Angel of Darkness.wav", "Noiraciel -The Last Prayer.wav"
  const noExt = filename.replace(SUPPORTED, '')
  const m = noExt.match(/^Noiraciel\s*-\s*(.+)$/i)
  const title = m ? m[1].trim() : noExt.trim()
  const slug = slugify(noExt)   // e.g. "noiraciel-angel-of-darkness"
  return { title, slug }
}

function readLyrics(filename) {
  const txtPath = path.join(MUSIC_DIR, filename.replace(SUPPORTED, '.txt'))
  if (!fs.existsSync(txtPath)) return null
  try { return fs.readFileSync(txtPath, 'utf-8').trim() } catch { return null }
}

function getDurationFfprobe(filePath) {
  try {
    const r = spawnSync('ffprobe', [
      '-v', 'quiet', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
    ], { encoding: 'utf-8', timeout: 10000 })
    if (r.status !== 0) return null
    const d = parseFloat(r.stdout.trim())
    return isNaN(d) ? null : d
  } catch { return null }
}

function clipsNeeded(durationSecs) {
  return Math.min(Math.ceil(durationSecs / CLIP_DURATION_S), MAX_CLIPS_PER_SONG)
}

// ─── Index ────────────────────────────────────────────────────────────────────
function loadIndex() {
  if (!fs.existsSync(VIDEOS_INDEX)) return {}
  try { return JSON.parse(fs.readFileSync(VIDEOS_INDEX, 'utf-8')) } catch { return {} }
}

function saveIndex(data) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true })
  fs.writeFileSync(VIDEOS_INDEX, JSON.stringify(data, null, 2), 'utf-8')
}

// ─── Kie.ai API ───────────────────────────────────────────────────────────────
function kieRequest(method, endpoint, body) {
  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) throw new Error('KIE_API_KEY is not set. Check .env.local')
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
        'User-Agent': 'NoiraCiel/1.0',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.code && parsed.code !== 200) reject(new Error(`Kie.ai ${parsed.code}: ${parsed.msg}`))
          else resolve(parsed)
        } catch { reject(new Error(`Invalid JSON: ${data.slice(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function kieRequestWithRetry(method, endpoint, body, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try { return await kieRequest(method, endpoint, body) }
    catch (e) {
      if (attempt === retries) throw e
      const wait = attempt * 5000
      warn(`Attempt ${attempt} failed: ${e.message}. Retrying in ${wait / 1000}s…`)
      await sleep(wait)
    }
  }
}

async function submitClip(prompt) {
  const res = await kieRequestWithRetry('POST', '/veo/generate', {
    prompt,
    model: 'veo3',
    generationType: 'TEXT_2_VIDEO',
    aspect_ratio: '16:9',
    resolution: '720p',
    duration: CLIP_DURATION_S,
  })
  return res.data?.taskId ?? null
}

async function fetchClipStatus(taskId) {
  const res = await kieRequestWithRetry('GET', `/veo/record-info?taskId=${taskId}`)
  return res.data ?? null
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

// ─── ffmpeg stitch ────────────────────────────────────────────────────────────
function checkFfmpeg() {
  return spawnSync('ffmpeg', ['-version'], { encoding: 'utf-8', timeout: 5000 }).status === 0
}

function stitchVideo(trackSlug, audioFile, clipPaths, outputPath) {
  if (!checkFfmpeg()) throw new Error('ffmpeg is not installed or not on PATH — https://ffmpeg.org')
  const sorted = [...clipPaths].sort()
  const listFile = path.join(os.tmpdir(), `noiraciel_ba_${trackSlug}_${Date.now()}.txt`)
  fs.writeFileSync(listFile, sorted.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'), 'utf-8')
  const mergedPath = path.join(os.tmpdir(), `noiraciel_ba_${trackSlug}_merged_${Date.now()}.mp4`)

  log(`  [ffmpeg] Concatenating ${sorted.length} clips…`)
  const concatResult = spawnSync('ffmpeg', [
    '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-y', mergedPath,
  ], { encoding: 'utf-8', timeout: 300_000 })
  if (concatResult.status !== 0) { fs.unlink(listFile, () => {}); throw new Error(`ffmpeg concat failed:\n${concatResult.stderr}`) }

  log(`  [ffmpeg] Overlaying original audio from ${path.basename(audioFile)}…`)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  const audioResult = spawnSync('ffmpeg', [
    '-i', mergedPath, '-i', audioFile,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-y', outputPath,
  ], { encoding: 'utf-8', timeout: 300_000 })

  fs.unlink(listFile, () => {})
  fs.unlink(mergedPath, () => {})
  if (audioResult.status !== 0) throw new Error(`ffmpeg audio overlay failed:\n${audioResult.stderr}`)
}

// ─── Visual identity ──────────────────────────────────────────────────────────
const VISUAL_SIGNATURE = `Style: Intimate Metal. 16mm film grain, near-black shadows, cold pale silver and bone-white light.
Camera: Slow dolly through sacred ruins, extreme close-ups of stone and skin, long held shots.
Mood: Weight without despair. Ruin as foundation. Darkness with its own radiance. Ancient stillness.
Setting: Abandoned chapels, collapsed cathedral arches, stone floors covered in ash, single candle or
  shaft of grey light from a broken roof, ancient carved stone, rain on cold glass, iron objects, fire
  in enclosed stone spaces, feathers on stone floor, black wings, crumbling halos.
Do NOT use: neon lights, modern interiors, CGI supernatural effects, fast cuts, cartoon darkness,
  blue colour grading, dancing, concert footage, generic rock video imagery, text overlays.`

// Visual themes keyed by track slug
const SONG_THEMES = {
  'noiraciel-angel-of-darkness':
    'Ancient chapel ruins in moonlight. A figure standing untouched in fire. Black stone and bone-white ash. Wings that emerge from the rubble of the sacred.',
  'noiraciel-ashes-of-heaven':
    'Ash falling like snow from a dark sky onto sacred ruins. Collapsed towers of pale stone. Hands holding ash in an open palm. Something surviving the fall.',
  'noiraciel-black-wings-rising':
    'A figure ascending from a city kneeling in the dark. Black wings spread against cold silver sky. Scars illuminated by pale light. The incontestable rising.',
  'noiraciel-blind-halo':
    'A broken halo lying in dust on stone floor. A figure moving through absolute darkness without a candle, guided by something interior. Chapel interior, fractured stained glass.',
  'noiraciel-blood-on-the-halo':
    'A halo stained by something real in the morning light. Sacred objects bearing the mark of lived life. Two forces — blade and blessing — becoming one thing.',
  'noiraciel-broken-wings-burning-soul':
    'Wings cracked against the void. A body hitting stone earth and rising again. Half consumed by fire, half pale gold. The refusal to remain down.',
  'noiraciel-crown-of-fire':
    'Hands forging metal in fire with bare skill. A crown shaped from ash and broken stone and wire. The apocalypse not as ending but as the raw material.',
  'noiraciel-darkness-made-divine':
    'Total darkness that begins to pulse with its own cold radiance. A figure moving through black cathedral halls who sees clearly without light. Night as a living presence.',
  'noiraciel-fallen-without-fear':
    'A figure in controlled descent, something like a smile. The void opening and clarifying rather than consuming. A body landing on stone and rising without mourning.',
  'noiraciel-heaven-burns-tonight':
    'The sky above a ruined cathedral igniting. Sacred architecture illuminated from within by fire. Angels standing in the blaze without flinching. Horizon as apocalypse.',
  'noiraciel-mercy-in-flames':
    'A hand extended toward fire. A figure giving light until it costs them something. Two figures in a burning space, one giving, one receiving — both transformed.',
  'noiraciel-no-light-left':
    'Candles extinguishing one by one in a stone room until total dark. A figure who does not reach for another flame but remains still. Something glowing faintly from within.',
  'noiraciel-saint-of-the-damned':
    'Stone ruins of a church. A figure standing among others who have been written off, at their level, not above them. An unholy choir in cold firelight.',
  'noiraciel-sin-of-an-angel':
    'A figure removing a white shroud to reveal wings marked with experience. Standing with the evidence of a lived life openly, wearing it as authority. Stone and shadow.',
  'noiraciel-the-devil-knows-my-name':
    'A figure at the exact threshold between light and dark, claimed by both. Scarred skin in cold pale light. A name written by fire in stone. Every mark as acclaim.',
  'noiraciel-when-angels-go-to-war':
    'The interior war — shadows moving inside a stone chapel like memory fighting itself. A figure who does not fall but materialises from within the conflict.',
  'noiraciel-the-last-prayer':
    'A single candle in a stone room. The last prayer spoken to silence. Then the candle goes out. Then a presence in the dark that was not there before. The will as the last sacred thing.',
}

const ARC_SUFFIXES = [
  'Opening: slow reveal from darkness, the world establishing itself, arriving light on stone.',
  'Midpoint: deeper shadow, closer on detail — ash, iron, bone, stone — held breath.',
  'Closing: recession into distance, light fading to a single point or returning cold and clear.',
]

function buildClipPrompt(track, lyrics, clipIndex, totalClips) {
  const theme = SONG_THEMES[track.slug] ?? 'Sacred ruins in cold light. Stone and shadow. Weight and stillness.'
  const lyricExcerpt = lyrics
    ? lyrics.split('\n').filter((l) => l.trim()).slice(0, 3).join(' / ')
    : ''
  const arcIdx = Math.floor((clipIndex / totalClips) * 3)
  const arc = ARC_SUFFIXES[Math.min(arcIdx, 2)]

  return `Cinematic music video — "${track.title}" by NoiraCiel (Intimate Metal). Clip ${clipIndex + 1} of ${totalClips}.

Lyric atmosphere: ${lyricExcerpt || 'Darkness as divine. Sacred ruin. Rising without fear.'}

Scene: ${theme}

${arc}

${VISUAL_SIGNATURE}`
}

// ─── Load tracks ──────────────────────────────────────────────────────────────
function loadTracks() {
  if (!fs.existsSync(MUSIC_DIR)) { err(`Music directory not found: ${MUSIC_DIR}`); process.exit(1) }
  const files = fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED.test(f)).sort()
  return files.map((filename) => {
    const { title, slug } = parseFilename(filename)
    const lyrics = readLyrics(filename)
    const filePath = path.join(MUSIC_DIR, filename)
    const durationSecs = getDurationFfprobe(filePath) ?? DEFAULT_DURATION_S
    const totalClips = clipsNeeded(durationSecs)
    return { title, slug, id: slug, filename, filePath, lyrics, durationSecs, totalClips }
  }).sort((a, b) => a.title.localeCompare(b.title))
}

// ─── --reset ──────────────────────────────────────────────────────────────────
function runReset() {
  if (!fs.existsSync(VIDEOS_INDEX)) { log('Nothing to reset — index.json does not exist.'); return }
  const count = Object.keys(JSON.parse(fs.readFileSync(VIDEOS_INDEX, 'utf-8'))).length
  saveIndex({})
  log(`✓ Reset ${count} entries. All tracks marked as not started.`)
}

// ─── --list ───────────────────────────────────────────────────────────────────
function runList() {
  const index = loadIndex()
  const tracks = loadTracks()
  console.log('\n📋  Blind Angel video generation status:\n')
  for (const track of tracks) {
    const entry = index[track.id]
    if (!entry || entry.status === 'none' || !entry.clips?.length) {
      console.log(`  ○  ${track.title.padEnd(44)} [none]  (${track.totalClips} clips × ${CLIP_DURATION_S}s for ${Math.round(track.durationSecs)}s)`)
      continue
    }
    const complete = entry.clips.filter((c) => c.status === 'complete').length
    const pending  = entry.clips.filter((c) => c.status === 'pending' || c.status === 'generating').length
    const failed   = entry.clips.filter((c) => c.status === 'failed').length
    const sym = { none: '○', submitting: '📤', polling: '⏳', stitching: '🎬', complete: '✅', failed: '✗' }[entry.status] ?? '?'
    const detail = entry.status === 'complete'
      ? `→ ${entry.finalVideoUrl}`
      : `${complete}/${entry.totalClips} clips done${pending ? `  (${pending} pending)` : ''}${failed ? ` (${failed} failed)` : ''}`
    console.log(`  ${sym}  ${track.title.padEnd(44)} [${entry.status}]  ${detail}`)
  }
  console.log()
}

// ─── --execute ────────────────────────────────────────────────────────────────
async function runExecute(tracks) {
  const index = loadIndex()
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY is not set. Create .env.local from .env.example'); process.exit(1) }

  let totalClipsToSubmit = 0
  for (const track of tracks) {
    const entry = index[track.id]
    if (entry?.status === 'complete') continue
    const existing = Array.isArray(entry?.clips) ? entry.clips : []
    const alreadyActive = existing.filter((c) => ['pending', 'generating', 'complete'].includes(c.status)).length
    totalClipsToSubmit += Math.max(0, track.totalClips - alreadyActive)
  }

  log(`Submitting clips for ${tracks.length} track(s) — The Blind Angel`)
  log(`Total clips to submit: ${totalClipsToSubmit}`)
  log(`Estimated submission time: ~${Math.ceil((totalClipsToSubmit * RATE_LIMIT_MS) / 60_000)} minute(s)`)
  log('Press Ctrl+C within 5 seconds to cancel…\n')
  await sleep(5000)

  let submitted = 0

  for (const track of tracks) {
    const entry = index[track.id]
    if (entry?.status === 'complete') { log(`⏭  "${track.title}" — already complete`); continue }

    const existing = Array.isArray(entry?.clips) ? entry.clips : []
    if (!index[track.id]) {
      index[track.id] = { title: track.title, slug: track.slug, audioFile: track.filePath,
        durationSecs: track.durationSecs, totalClips: track.totalClips, clips: [],
        status: 'none', finalVideoPath: null, finalVideoUrl: null }
    }
    const trackEntry = index[track.id]
    trackEntry.audioFile  = track.filePath
    trackEntry.durationSecs = track.durationSecs
    trackEntry.totalClips = track.totalClips
    trackEntry.status = 'submitting'
    saveIndex(index)

    log(`\n▶  "${track.title}"  (${track.totalClips} clips × ${CLIP_DURATION_S}s = ~${Math.round(track.durationSecs)}s)`)

    for (let clipIdx = 0; clipIdx < track.totalClips; clipIdx++) {
      const alreadyExists = existing.find((c) => c.index === clipIdx &&
        ['pending', 'generating', 'complete'].includes(c.status))
      if (alreadyExists) { log(`  ⏭  Clip ${clipIdx + 1} — already submitted`); continue }

      const prompt = buildClipPrompt(track, track.lyrics, clipIdx, track.totalClips)
      if (DRY_RUN) { log(`  [DRY] Clip ${clipIdx + 1}/${track.totalClips} — ${prompt.slice(0, 80)}…`); continue }

      try {
        log(`  📤  Submitting clip ${clipIdx + 1}/${track.totalClips}…`)
        const taskId = await submitClip(prompt)
        if (!taskId) throw new Error('No taskId returned')
        trackEntry.clips = trackEntry.clips.filter((c) => c.index !== clipIdx)
        trackEntry.clips.push({ index: clipIdx, taskId, status: 'pending', remoteUrl: null, localPath: null })
        saveIndex(index)
        submitted++
        log(`  ✓  Clip ${clipIdx + 1} submitted — taskId: ${taskId}`)
      } catch (e) {
        err(`  Clip ${clipIdx + 1} submission failed: ${e.message}`)
        trackEntry.clips.push({ index: clipIdx, taskId: null, status: 'failed', remoteUrl: null, localPath: null })
        saveIndex(index)
      }

      if (clipIdx < track.totalClips - 1) await sleep(RATE_LIMIT_MS)
    }

    trackEntry.status = 'polling'
    saveIndex(index)
  }

  log(`\n✓ Submitted ${submitted} clip(s). Run --poll to check completion and stitch.`)
}

// ─── --poll ───────────────────────────────────────────────────────────────────
async function runPoll(tracks) {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  log(`Polling — will run for up to ${POLL_TIMEOUT_MS / 60_000} minutes. Ctrl+C to stop.`)

  while (Date.now() < deadline) {
    const index = loadIndex()
    let pendingCount = 0

    for (const track of tracks) {
      const entry = index[track.id]
      if (!entry || !entry.clips?.length) continue
      if (entry.status === 'complete') continue

      const pendingClips = entry.clips.filter((c) => c.status === 'pending' || c.status === 'generating')
      pendingCount += pendingClips.length

      for (const clip of pendingClips) {
        try {
          const data = await fetchClipStatus(clip.taskId)
          if (!data) continue

          const statusMap = { SUCCESS: 'complete', FAILED: 'failed', COMPLETED: 'complete' }
          const newStatus = statusMap[data.status] ?? 'pending'

          if (newStatus === 'complete' && data.resultUrl) {
            const ext = data.resultUrl.match(/\.(mp4|webm)/) ? data.resultUrl.match(/\.(mp4|webm)/)[0] : '.mp4'
            const clipDir = path.join(VIDEOS_DIR, 'clips', track.id)
            const localPath = path.join(clipDir, `clip_${String(clip.index).padStart(3, '0')}${ext}`)
            log(`  ⬇  Downloading clip ${clip.index + 1}/${entry.totalClips} for "${track.title}"…`)
            await downloadFile(data.resultUrl, localPath)
            clip.status = 'complete'
            clip.remoteUrl = data.resultUrl
            clip.localPath = localPath
            pendingCount--
          } else if (newStatus === 'failed') {
            warn(`  Clip ${clip.index + 1} failed for "${track.title}"`)
            clip.status = 'failed'
            pendingCount--
          }
          saveIndex(index)
        } catch (e) {
          warn(`  Poll error for clip ${clip.index} of "${track.title}": ${e.message}`)
        }
        await sleep(500)
      }

      // Check if all clips for this track are complete → stitch
      const allClips = entry.clips
      const completeClips = allClips.filter((c) => c.status === 'complete')
      if (completeClips.length === entry.totalClips && entry.status !== 'complete') {
        log(`\n🎬  All clips complete for "${track.title}" — stitching…`)
        entry.status = 'stitching'
        saveIndex(index)
        try {
          const audioFile = entry.audioFile ?? path.join(MUSIC_DIR, track.filename)
          const outputPath = path.join(VIDEOS_DIR, `${track.id}.mp4`)
          stitchVideo(track.id, audioFile, completeClips.map((c) => c.localPath), outputPath)
          entry.finalVideoPath = outputPath
          entry.finalVideoUrl  = `/Videos/blind-angel/${track.id}.mp4`
          entry.status = 'complete'
          saveIndex(index)
          log(`  ✅  "${track.title}" complete → ${entry.finalVideoUrl}`)
        } catch (e) {
          err(`  Stitch failed for "${track.title}": ${e.message}`)
          entry.status = 'failed'
          saveIndex(index)
        }
      }
    }

    if (pendingCount === 0) {
      log('\n✓ No more pending clips. Polling complete.')
      break
    }

    log(`  ${pendingCount} clip(s) still pending — waiting ${POLL_INTERVAL_MS / 1000}s…`)
    await sleep(POLL_INTERVAL_MS)
  }
}

// ─── --stitch ─────────────────────────────────────────────────────────────────
function runStitch(tracks) {
  const index = loadIndex()
  for (const track of tracks) {
    const entry = index[track.id]
    if (!entry?.clips?.length) { log(`  ○  "${track.title}" — no clips recorded`); continue }
    const completeClips = entry.clips.filter((c) => c.status === 'complete' && c.localPath)
    if (completeClips.length < entry.totalClips) {
      warn(`  "${track.title}" — only ${completeClips.length}/${entry.totalClips} clips downloaded, skipping`)
      continue
    }
    log(`  🎬  Stitching "${track.title}" (${completeClips.length} clips)…`)
    try {
      const audioFile = entry.audioFile ?? path.join(MUSIC_DIR, track.filename)
      const outputPath = path.join(VIDEOS_DIR, `${track.id}.mp4`)
      stitchVideo(track.id, audioFile, completeClips.map((c) => c.localPath), outputPath)
      entry.finalVideoPath = outputPath
      entry.finalVideoUrl  = `/Videos/blind-angel/${track.id}.mp4`
      entry.status = 'complete'
      saveIndex(index)
      log(`  ✅  "${track.title}" → ${entry.finalVideoUrl}`)
    } catch (e) {
      err(`  Stitch failed for "${track.title}": ${e.message}`)
    }
  }
}

// ─── Dry-run preview ──────────────────────────────────────────────────────────
function runDryRun(tracks) {
  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('  BLIND ANGEL — VIDEO GENERATION DRY-RUN')
  console.log('═══════════════════════════════════════════════════════════════\n')
  console.log(`  Album directory: ${MUSIC_DIR}`)
  console.log(`  Output directory: ${VIDEOS_DIR}`)
  console.log(`  Clip duration: ${CLIP_DURATION_S}s  |  Max clips/song: ${MAX_CLIPS_PER_SONG}`)
  console.log(`  Tracks: ${tracks.length}\n`)

  let totalClips = 0
  for (const track of tracks) {
    totalClips += track.totalClips
    console.log(`  ${track.title.padEnd(40)} ${track.totalClips} clips  (${Math.round(track.durationSecs)}s)`)
    const previewPrompt = buildClipPrompt(track, track.lyrics, 0, track.totalClips)
    console.log(`    Prompt preview: ${previewPrompt.split('\n')[0]}`)
    console.log()
  }

  console.log(`  Total clips: ${totalClips}`)
  console.log(`  Estimated API time: ~${Math.ceil((totalClips * RATE_LIMIT_MS) / 60_000)} min submission + generation`)
  console.log(`\n  Run with --execute to start. Then --poll to track and stitch.\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  let tracks = loadTracks()

  if (TRACK_ARG) {
    tracks = tracks.filter((t) => t.slug.includes(TRACK_ARG) || t.title.toLowerCase().includes(TRACK_ARG))
    if (!tracks.length) { err(`No tracks matched "--track ${TRACK_ARG}"`); process.exit(1) }
    log(`Filtered to ${tracks.length} track(s) matching "${TRACK_ARG}"`)
  }

  if (RESET_MODE) { runReset(); return }
  if (LIST_MODE)  { runList(); return }

  if (DRY_RUN)    { runDryRun(tracks); return }
  if (EXEC_MODE)  { await runExecute(tracks); return }
  if (POLL_MODE)  { await runPoll(tracks); return }
  if (STITCH_MODE){ runStitch(tracks); return }

  runDryRun(tracks)
}

main().catch((e) => { err(e.message ?? e); process.exit(1) })
