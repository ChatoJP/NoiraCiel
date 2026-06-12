#!/usr/bin/env node
/**
 * generate-music-videos.js
 *
 * Multi-clip strategy:
 *   For each song → generate ceil(duration / 10) clips of 10s each via Kie.ai Runway.
 *   Once all clips for a song are downloaded → ffmpeg concat + overlay original WAV audio.
 *   Result: one full-length music video per song in public/Videos/.
 *
 * USAGE
 *   node scripts/generate-music-videos.js              # dry-run (default — safe, no API calls)
 *   node scripts/generate-music-videos.js --execute    # submit all clip jobs to Kie.ai
 *   node scripts/generate-music-videos.js --poll       # poll pending clips, download + stitch
 *   node scripts/generate-music-videos.js --list       # status overview
 *   node scripts/generate-music-videos.js --reset      # clear all pending state (start fresh)
 *   node scripts/generate-music-videos.js --stitch     # re-stitch from already-downloaded clips
 *   node scripts/generate-music-videos.js --track 3    # single track only (combine with above)
 *
 * SETUP
 *   1. Copy .env.example to .env.local and set KIE_API_KEY
 *   2. Ensure ffmpeg is installed and on PATH  (ffmpeg.org)
 *   3. Run dry-run to review clip counts and prompts
 *   4. Run --execute when satisfied, then --poll to download and stitch
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const { execSync, spawnSync } = require('child_process')
const os = require('os')

// ─── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.warn('⚠  .env.local not found — create it from .env.example')
    return
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
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
const KIE_BASE = 'https://api.kie.ai/api/v1'
const MUSIC_DIR = path.join(__dirname, '..', 'Music')
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'Videos')
const CLIPS_DIR = path.join(VIDEOS_DIR, 'clips')
const VIDEOS_INDEX = path.join(VIDEOS_DIR, 'index.json')
const SONGS_JSON = path.join(__dirname, '..', 'public', 'songs.json')

const SUPPORTED = /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i
const CLIP_DURATION_S = 8          // seconds per generated clip (Veo3 max)
const MAX_CLIPS_PER_SONG = 40      // cap at 40 clips = 6m40s max video
const DEFAULT_DURATION_S = 240     // fallback if duration undetectable
const RATE_LIMIT_MS = 3500         // ms between API submissions
const POLL_INTERVAL_MS = 15_000    // ms between poll sweeps
const POLL_TIMEOUT_MS = 20 * 60 * 1000  // 20 min per run
const MAX_RETRIES = 3

// ─── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN    = !args.includes('--execute') && !args.includes('--poll') &&
                   !args.includes('--list')    && !args.includes('--reset') &&
                   !args.includes('--stitch')
const EXEC_MODE  = args.includes('--execute')
const POLL_MODE  = args.includes('--poll')
const LIST_MODE  = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const STITCH_MODE = args.includes('--stitch')
const TRACK_ARG  = (() => {
  const idx = args.indexOf('--track')
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : null
})()

// ─── Logging ──────────────────────────────────────────────────────────────────
const ts = () => new Date().toISOString().slice(11, 19)
const log  = (m) => console.log(`[${ts()}] ${m}`)
const warn = (m) => console.warn(`[${ts()}] ⚠  ${m}`)
const err  = (m) => console.error(`[${ts()}] ✗  ${m}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function parseFilename(filename) {
  const noExt = filename.replace(SUPPORTED, '')
  const m = noExt.match(/^([a-z]+)_(\d+)\s*-\s*(.+)$/i)
  if (m) return { trackNumber: parseInt(m[2], 10), title: m[3].trim() }
  const m2 = noExt.match(/^(\d+)[\s._-]+(.+)$/)
  if (m2) return { trackNumber: parseInt(m2[1], 10), title: m2[2].trim() }
  return { trackNumber: null, title: noExt.trim() }
}

function readLyrics(audioFilename) {
  const txtPath = path.join(MUSIC_DIR, audioFilename.replace(SUPPORTED, '.txt'))
  if (!fs.existsSync(txtPath)) return null
  try { return fs.readFileSync(txtPath, 'utf-8').trim() } catch { return null }
}

// ─── Duration detection ───────────────────────────────────────────────────────
// Reads duration from public/songs.json (pre-generated), falls back to ffprobe or default.
let _songsJsonCache = null
function getDurationFromSongsJson(trackNumber) {
  if (!_songsJsonCache) {
    if (!fs.existsSync(SONGS_JSON)) return null
    try { _songsJsonCache = JSON.parse(fs.readFileSync(SONGS_JSON, 'utf-8')) } catch { return null }
  }
  const track = _songsJsonCache?.tracks?.find((t) => t.trackNumber === trackNumber)
  return track?.duration ?? null
}

function getDurationFfprobe(filePath) {
  try {
    const result = spawnSync('ffprobe', [
      '-v', 'quiet', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
    ], { encoding: 'utf-8', timeout: 10000 })
    if (result.status !== 0) return null
    const d = parseFloat(result.stdout.trim())
    return isNaN(d) ? null : d
  } catch { return null }
}

function getSongDuration(filePath, trackNumber) {
  const fromJson = getDurationFromSongsJson(trackNumber)
  if (fromJson) return fromJson
  const fromProbe = getDurationFfprobe(filePath)
  if (fromProbe) return fromProbe
  return DEFAULT_DURATION_S
}

function clipsNeeded(durationSecs) {
  return Math.min(Math.ceil(durationSecs / CLIP_DURATION_S), MAX_CLIPS_PER_SONG)
}

// ─── Index (persistent job state) ────────────────────────────────────────────
// Structure per track:
//   {
//     trackNumber, title, audioFile, durationSecs, totalClips,
//     clips: [{ index, taskId, status, remoteUrl, localPath }],
//     status: 'none' | 'submitting' | 'polling' | 'stitching' | 'complete' | 'failed',
//     finalVideoPath, finalVideoUrl
//   }

function loadIndex() {
  if (!fs.existsSync(VIDEOS_INDEX)) return {}
  try { return JSON.parse(fs.readFileSync(VIDEOS_INDEX, 'utf-8')) } catch { return {} }
}

function saveIndex(data) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true })
  fs.writeFileSync(VIDEOS_INDEX, JSON.stringify(data, null, 2), 'utf-8')
}

function isOldFormat(entry) {
  // Old format has taskId directly on entry instead of in clips[]
  return entry && typeof entry.taskId === 'string' && !Array.isArray(entry.clips)
}

function migrateOrReset(index) {
  let migrated = 0
  for (const [id, entry] of Object.entries(index)) {
    if (isOldFormat(entry)) {
      index[id] = {
        trackNumber: entry.trackNumber,
        title: entry.title,
        audioFile: null,
        durationSecs: null,
        totalClips: null,
        clips: [],
        status: 'none',
        finalVideoPath: null,
        finalVideoUrl: null,
      }
      migrated++
    }
  }
  if (migrated) {
    warn(`Migrated ${migrated} old single-clip entries → reset to 'none'. Run --execute to regenerate.`)
    saveIndex(index)
  }
  return index
}

// ─── Kie.ai API ───────────────────────────────────────────────────────────────
function kieRequest(method, endpoint, body) {
  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) throw new Error('KIE_API_KEY is not set. Check .env.local')

  return new Promise((resolve, reject) => {
    const url = new URL(`${KIE_BASE}${endpoint}`)
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NoiraCiel/1.0',
      },
    }

    const payload = body ? JSON.stringify(body) : null
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload)

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.code && parsed.code !== 200) {
            reject(new Error(`Kie.ai error ${parsed.code}: ${parsed.msg || JSON.stringify(parsed)}`))
          } else {
            resolve(parsed)
          }
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`))
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
    }).on('error', (e) => {
      fs.unlink(destPath, () => {})
      reject(e)
    })
  })
}

// ─── ffmpeg stitch ────────────────────────────────────────────────────────────
function checkFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { encoding: 'utf-8', timeout: 5000 })
  return result.status === 0
}

function stitchVideo(trackSlug, audioFile, clipPaths, outputPath) {
  if (!checkFfmpeg()) {
    throw new Error('ffmpeg is not installed or not on PATH. Install from https://ffmpeg.org')
  }

  // Sort clips by index (clip_000.mp4 < clip_001.mp4 ...)
  const sorted = [...clipPaths].sort()

  // Write concat list to a temp file
  const listFile = path.join(os.tmpdir(), `noiraciel_${trackSlug}_${Date.now()}.txt`)
  const listContent = sorted.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n')
  fs.writeFileSync(listFile, listContent, 'utf-8')

  const mergedPath = path.join(os.tmpdir(), `noiraciel_${trackSlug}_merged_${Date.now()}.mp4`)

  // Step 1: concatenate clips
  log(`  [ffmpeg] Concatenating ${sorted.length} clips…`)
  const concatResult = spawnSync('ffmpeg', [
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c', 'copy',
    '-y', mergedPath,
  ], { encoding: 'utf-8', timeout: 300_000 })

  if (concatResult.status !== 0) {
    fs.unlink(listFile, () => {})
    throw new Error(`ffmpeg concat failed:\n${concatResult.stderr}`)
  }

  // Step 2: replace audio with the original WAV
  log(`  [ffmpeg] Overlaying original audio from ${path.basename(audioFile)}…`)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  const audioResult = spawnSync('ffmpeg', [
    '-i', mergedPath,
    '-i', audioFile,
    '-map', '0:v',
    '-map', '1:a',
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    '-y', outputPath,
  ], { encoding: 'utf-8', timeout: 300_000 })

  // Cleanup temp files
  fs.unlink(listFile, () => {})
  fs.unlink(mergedPath, () => {})

  if (audioResult.status !== 0) {
    throw new Error(`ffmpeg audio overlay failed:\n${audioResult.stderr}`)
  }
}

// ─── Prompt generation ────────────────────────────────────────────────────────
const VISUAL_SIGNATURE = `Style: Premium European art cinema, 16mm film grain, soft color grading, slow atmospheric pacing.
Camera: Long slow dolly shots, intimate close-ups of hands and objects, overhead poetic tableaux.
Mood: Emotional dignity without sentimentality. Hope inside darkness. Beauty inside struggle.
Setting: Atlantic coastline at dusk, aged family homes, fog-lit country roads, old wooden boats,
  warm candlelight through aged windows, hands holding photographs, empty chairs, children in fields,
  a woman at a sea cliff, morning light through lace curtains, weathered stone walls.
Do NOT use: generic AI music video clichés, neon lights, fast cuts, CGI backgrounds,
  cartoonish visuals, abstract shapes, text overlays, dancing people.`

const SONG_THEMES = {
  1:  'A person walking country roads at twilight, searching. The ocean visible at the end of a long winding path. Hands reaching toward a horizon. An old book opened in an attic window.',
  2:  'A lone figure standing at the top of a hill after a race, looking down at an empty valley. A trophy on a shelf gathering dust. Reflection in still water.',
  3:  'Ancient tree roots breaking through soil. An elderly woman gardening in silence. Family photographs on a wall. A child watching her grandmother from a doorway.',
  4:  'Two people sitting at a kitchen table in silence, words hovering between them. Letters never sent, scattered on a floor. A hand reaching across the table but not quite touching.',
  5:  'A fishing boat returning through rough Atlantic waves at dawn. A woman waiting at the harbor. Hands still working after years of wear. The sea calming.',
  6:  'Two elderly people walking side by side on a coastal path. Their hands not touching but close. Long shadows in late afternoon light. The same rhythm in their steps.',
  7:  'A parent watching a child sleep from the doorway. A phone illuminating a worried face at 2am. The moment when everything is still and someone you love is safe.',
  8:  'Finding an old photograph and recognizing something that was always there. Light falling through dust in an attic room. A woman touching the frame of a mirror.',
  9:  'A dark night in a small room, rain on the window. A phone call that changes the quality of the darkness. Morning coming slowly through curtains.',
  10: 'An empty house filled with light and absence. A family home seen from outside over decades. Objects left behind. A hand closing a door for the last time.',
  11: 'A woman who only ever knew one kind of love. Old home footage, sun-faded. A coastal village at dawn. Familiar streets, familiar faces.',
  12: 'A window with a light on inside, seen from outside in the dark. A mother waiting. The moment someone comes home. Light as language.',
  13: 'An empty chair at a set table. The light of someone who is gone, still visible in everything. A family gathering where one face is missing from the photograph.',
  14: 'Time-lapse of a tree growing through seasons. An old man tending a garden. Seeds. Patience. The slow accumulation of dignity.',
  15: 'A conversation revisited. Two people, years later, in the same kitchen. The way light changes in a face when it opens. A slow walk towards something.',
  16: 'An old clock. A person holding hands with someone fragile and elderly. The specific quality of light in afternoons that feel borrowed. Gratitude without words.',
  17: 'A man standing in a public square, speaking quietly but clearly. Others who slowly stop and listen. The moment truth changes the air in a room. Freedom as clarity.',
}

// Three visual arcs per song: opening (0-33%), midpoint (34-66%), closing (67-100%)
const ARC_SUFFIXES = [
  'Opening: establish the world, slow reveal, arriving light.',
  'Midpoint: deepening emotion, closer framing, held breath.',
  'Closing: resolution, distance, light fading or returning.',
]

function buildClipPrompt(track, lyrics, clipIndex, totalClips) {
  const songTheme = SONG_THEMES[track.trackNumber] ?? 'Atmospheric coastal scenes, memory and time, emotional human moments.'
  const lyricExcerpt = lyrics
    ? lyrics.split('\n').filter((l) => l.trim()).slice(0, 3).join(' / ')
    : ''

  const arcIdx = Math.floor((clipIndex / totalClips) * 3)
  const arc = ARC_SUFFIXES[Math.min(arcIdx, 2)]

  return `Cinematic music video — "${track.title}" by NoiraCiel. Clip ${clipIndex + 1} of ${totalClips}.

Lyric atmosphere: ${lyricExcerpt}

Scene: ${songTheme}

${arc}

${VISUAL_SIGNATURE}`
}

// ─── Load tracks ──────────────────────────────────────────────────────────────
function loadTracks() {
  if (!fs.existsSync(MUSIC_DIR)) { err(`Music directory not found: ${MUSIC_DIR}`); process.exit(1) }
  const files = fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED.test(f)).sort()
  return files.map((filename) => {
    const parsed = parseFilename(filename)
    const lyrics = readLyrics(filename)
    const filePath = path.join(MUSIC_DIR, filename)
    const durationSecs = getSongDuration(filePath, parsed.trackNumber)
    const totalClips = clipsNeeded(durationSecs)
    return { ...parsed, filename, filePath, id: slugify(filename), lyrics, durationSecs, totalClips }
  }).sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999))
}

// ─── --reset ──────────────────────────────────────────────────────────────────
function runReset() {
  if (!fs.existsSync(VIDEOS_INDEX)) { log('Nothing to reset — index.json does not exist.'); return }
  const index = JSON.parse(fs.readFileSync(VIDEOS_INDEX, 'utf-8'))
  const count = Object.keys(index).length
  fs.writeFileSync(VIDEOS_INDEX, JSON.stringify({}, null, 2), 'utf-8')
  log(`✓ Reset ${count} entries in index.json. All tracks marked as not started.`)
}

// ─── --list ───────────────────────────────────────────────────────────────────
function runList() {
  const raw = loadIndex()
  const index = migrateOrReset(raw)
  const tracks = loadTracks()
  console.log('\n📋  Video generation status:\n')
  for (const track of tracks) {
    const entry = index[track.id]
    if (!entry || entry.status === 'none' || !entry.clips) {
      console.log(`  ○  ${String(track.trackNumber ?? '?').padStart(2)}. ${track.title.padEnd(42)} [none]  (${track.totalClips} clips needed for ${Math.round(track.durationSecs)}s)`)
      continue
    }
    const complete = entry.clips.filter((c) => c.status === 'complete').length
    const pending  = entry.clips.filter((c) => c.status === 'pending' || c.status === 'generating').length
    const failed   = entry.clips.filter((c) => c.status === 'failed').length
    const sym = { none: '○', submitting: '📤', polling: '⏳', stitching: '🎬', complete: '✅', failed: '✗' }[entry.status] ?? '?'
    const detail = entry.status === 'complete'
      ? `→ ${entry.finalVideoUrl}`
      : `${complete}/${entry.totalClips} clips done  ${pending ? `(${pending} pending)` : ''}${failed ? ` (${failed} failed)` : ''}`
    console.log(`  ${sym}  ${String(track.trackNumber ?? '?').padStart(2)}. ${track.title.padEnd(42)} [${entry.status}]  ${detail}`)
  }
  console.log()
}

// ─── --execute ────────────────────────────────────────────────────────────────
async function runExecute(tracks) {
  const raw = loadIndex()
  const index = migrateOrReset(raw)
  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) { err('KIE_API_KEY is not set. Create .env.local from .env.example'); process.exit(1) }

  let totalClipsToSubmit = 0
  for (const track of tracks) {
    const entry = index[track.id]
    if (entry?.status === 'complete') continue
    const existing = Array.isArray(entry?.clips) ? entry.clips : []
    const pendingClips = track.totalClips - existing.filter((c) => c.status === 'pending' || c.status === 'generating' || c.status === 'complete').length
    totalClipsToSubmit += Math.max(0, pendingClips)
  }

  const estimatedMins = Math.ceil((totalClipsToSubmit * RATE_LIMIT_MS) / 60_000)
  log(`Submitting clips for ${tracks.length} track(s)`)
  log(`Total clips to submit: ${totalClipsToSubmit}`)
  log(`Estimated submission time: ~${estimatedMins} minute(s)`)
  log('Press Ctrl+C within 5 seconds to cancel…\n')
  await sleep(5000)

  let submitted = 0

  for (const track of tracks) {
    const entry = index[track.id]

    if (entry?.status === 'complete') {
      log(`⏭  "${track.title}" — already complete`)
      continue
    }

    const existing = Array.isArray(entry?.clips) ? entry.clips : []
    // Initialize entry if new
    if (!index[track.id] || isOldFormat(index[track.id])) {
      index[track.id] = {
        trackNumber: track.trackNumber,
        title: track.title,
        audioFile: track.filePath,
        durationSecs: track.durationSecs,
        totalClips: track.totalClips,
        clips: [],
        status: 'none',
        finalVideoPath: null,
        finalVideoUrl: null,
      }
    }

    const trackEntry = index[track.id]
    trackEntry.audioFile = track.filePath
    trackEntry.durationSecs = track.durationSecs
    trackEntry.totalClips = track.totalClips
    trackEntry.status = 'submitting'
    saveIndex(index)

    log(`\n🎬  "${track.title}"  (${track.totalClips} clips × ${CLIP_DURATION_S}s = ${Math.round(track.totalClips * CLIP_DURATION_S / 60)}m video)`)

    for (let i = 0; i < track.totalClips; i++) {
      const existingClip = trackEntry.clips.find((c) => c.index === i)
      if (existingClip && (existingClip.status === 'pending' || existingClip.status === 'generating' || existingClip.status === 'complete')) {
        log(`  ⏭  Clip ${i + 1}/${track.totalClips} — already submitted (${existingClip.status})`)
        continue
      }

      const prompt = buildClipPrompt(track, track.lyrics, i, track.totalClips)

      try {
        process.stdout.write(`  📤  Clip ${String(i + 1).padStart(3)}/${track.totalClips} — submitting… `)
        const taskId = await submitClip(prompt)
        if (!taskId) throw new Error('No taskId returned')

        const clipEntry = { index: i, taskId, status: 'pending', remoteUrl: null, localPath: null, submittedAt: new Date().toISOString() }
        // Replace or append
        const existingIdx = trackEntry.clips.findIndex((c) => c.index === i)
        if (existingIdx >= 0) trackEntry.clips[existingIdx] = clipEntry
        else trackEntry.clips.push(clipEntry)

        saveIndex(index)
        console.log(`✓ taskId: ${taskId}`)
        submitted++
      } catch (e) {
        console.log(`✗ ${e.message}`)
        const clipEntry = { index: i, taskId: null, status: 'failed', error: e.message }
        const existingIdx = trackEntry.clips.findIndex((c) => c.index === i)
        if (existingIdx >= 0) trackEntry.clips[existingIdx] = clipEntry
        else trackEntry.clips.push(clipEntry)
        saveIndex(index)
      }

      if (i < track.totalClips - 1) await sleep(RATE_LIMIT_MS)
    }

    trackEntry.status = 'polling'
    saveIndex(index)
  }

  log(`\n✅  Submitted ${submitted} clip job(s).`)
  log(`Run --poll to check status, download clips, and stitch final videos.`)
}

// ─── Dry run ──────────────────────────────────────────────────────────────────
async function runDryRun(tracks) {
  console.log('\n🎬  DRY RUN — Multi-clip video plan\n')
  console.log('─'.repeat(80))
  let totalClips = 0
  for (const track of tracks) {
    const mins = (track.totalClips * CLIP_DURATION_S / 60).toFixed(1)
    console.log(`\n▶  Track ${track.trackNumber}: "${track.title}"`)
    console.log(`   Duration: ${Math.round(track.durationSecs)}s  →  ${track.totalClips} clips  →  ~${mins}m video`)
    console.log(`   Lyrics: ${track.lyrics ? 'YES' : 'NO'}`)
    console.log(`\n   Sample clip prompt (clip 1 of ${track.totalClips}):`)
    const sample = buildClipPrompt(track, track.lyrics, 0, track.totalClips)
    console.log(sample.split('\n').map((l) => `   ${l}`).join('\n'))
    totalClips += track.totalClips
    console.log('\n' + '─'.repeat(80))
  }
  const estimatedMins = Math.ceil((totalClips * RATE_LIMIT_MS) / 60_000)
  console.log(`\n📊  ${tracks.length} song(s)  ·  ${totalClips} total clips  ·  ~${estimatedMins}m to submit`)
  console.log(`    Use --execute to start, --poll to monitor and stitch.\n`)
}

// ─── --poll ───────────────────────────────────────────────────────────────────
async function runPoll(tracks) {
  const index = migrateOrReset(loadIndex())

  // Collect all pending clips
  const pending = []
  for (const track of tracks) {
    const entry = index[track.id]
    if (!entry || entry.status === 'complete') continue
    if (!Array.isArray(entry.clips)) continue
    for (const clip of entry.clips) {
      if (clip.taskId && (clip.status === 'pending' || clip.status === 'generating')) {
        pending.push({ trackId: track.id, trackTitle: entry.title, clip })
      }
    }
  }

  if (pending.length === 0) {
    log('No pending clips to poll.')
    // Check if any tracks are ready to stitch
  } else {
    log(`Polling ${pending.length} pending clip(s)…`)
    const deadline = Date.now() + POLL_TIMEOUT_MS
    const remaining = new Set(pending.map((p) => `${p.trackId}:${p.clip.index}`))

    while (remaining.size > 0 && Date.now() < deadline) {
      for (const item of pending) {
        const key = `${item.trackId}:${item.clip.index}`
        if (!remaining.has(key)) continue

        try {
          const data = await fetchClipStatus(item.clip.taskId)
          // successFlag: 0=generating, 1=success, 2=failed, 3=failed
          const flag = data?.successFlag
          process.stdout.write(`  [${item.trackTitle}] clip ${item.clip.index + 1} → flag: ${flag ?? '?'}  `)

          if (flag === 1 && data?.response?.resultUrls?.[0]) {
            const remoteUrl = data.response.resultUrls[0]
            const trackSlug = slugify(item.trackTitle)
            const clipDir = path.join(CLIPS_DIR, trackSlug)
            const localFilename = `clip_${String(item.clip.index).padStart(3, '0')}.mp4`
            const localPath = path.join(clipDir, localFilename)

            process.stdout.write(`downloading… `)
            await downloadFile(remoteUrl, localPath)

            // Update clip in index
            const trackEntry = index[item.trackId]
            const clipEntry = trackEntry.clips.find((c) => c.index === item.clip.index)
            if (clipEntry) {
              clipEntry.status = 'complete'
              clipEntry.remoteUrl = remoteUrl
              clipEntry.localPath = localPath
              clipEntry.completedAt = new Date().toISOString()
            }
            saveIndex(index)
            console.log(`✓ saved`)
            remaining.delete(key)
          } else if (flag === 2 || flag === 3) {
            const trackEntry = index[item.trackId]
            const clipEntry = trackEntry.clips.find((c) => c.index === item.clip.index)
            if (clipEntry) { clipEntry.status = 'failed'; clipEntry.error = JSON.stringify(data) }
            saveIndex(index)
            console.log(`✗ failed`)
            remaining.delete(key)
          } else {
            console.log(`⏳ generating (flag=${flag ?? 'null'})`)
            const trackEntry = index[item.trackId]
            const clipEntry = trackEntry.clips.find((c) => c.index === item.clip.index)
            if (clipEntry && clipEntry.status === 'pending') {
              clipEntry.status = 'generating'
              saveIndex(index)
            }
          }
        } catch (e) {
          console.log(`⚠  poll error: ${e.message}`)
        }

        await sleep(500)
      }

      if (remaining.size > 0) {
        log(`  ${remaining.size} clip(s) still processing. Waiting ${POLL_INTERVAL_MS / 1000}s…`)
        await sleep(POLL_INTERVAL_MS)
      }
    }

    if (remaining.size > 0) {
      warn(`Polling timed out. ${remaining.size} clip(s) still pending. Run --poll again.`)
    }
  }

  // Attempt stitch for tracks where all clips are downloaded
  await stitchReady(tracks, index)
}

// ─── Stitch ready tracks ──────────────────────────────────────────────────────
async function stitchReady(tracks, index) {
  let stitched = 0

  for (const track of tracks) {
    const entry = index[track.id]
    if (!entry || entry.status === 'complete') continue
    if (!Array.isArray(entry.clips) || entry.clips.length === 0) continue

    const completeClips = entry.clips.filter((c) => c.status === 'complete' && c.localPath)
    const totalNeeded = entry.totalClips ?? track.totalClips

    if (completeClips.length < totalNeeded) {
      const pending = entry.clips.filter((c) => c.status === 'pending' || c.status === 'generating').length
      const failed  = entry.clips.filter((c) => c.status === 'failed').length
      if (pending > 0) log(`  "${track.title}" — waiting on ${pending} more clip(s)`)
      else if (failed > 0) warn(`  "${track.title}" — ${failed} clip(s) failed; ${completeClips.length}/${totalNeeded} available`)
      // If we have some clips but not all, still stitch what we have if all submitted are complete
      if (pending > 0) continue
    }

    if (completeClips.length === 0) continue

    log(`\n🎬  Stitching "${track.title}" (${completeClips.length} clips)…`)
    entry.status = 'stitching'
    saveIndex(index)

    try {
      const trackSlug = slugify(track.title)
      const outputPath = path.join(VIDEOS_DIR, `${trackSlug}.mp4`)
      const clipPaths = completeClips.map((c) => c.localPath)
      const audioFile = entry.audioFile ?? track.filePath

      stitchVideo(trackSlug, audioFile, clipPaths, outputPath)

      entry.status = 'complete'
      entry.finalVideoPath = outputPath
      entry.finalVideoUrl = `/Videos/${trackSlug}.mp4`
      saveIndex(index)

      log(`  ✅  Saved: ${outputPath}`)
      stitched++
    } catch (e) {
      entry.status = 'failed'
      saveIndex(index)
      err(`  Stitch failed for "${track.title}": ${e.message}`)
    }
  }

  // Write the website-facing videos.json
  writeVideosJson(index)

  if (stitched > 0) {
    log(`\n✅  Stitched ${stitched} video(s).`)
  }
}

// ─── Website JSON ─────────────────────────────────────────────────────────────
function writeVideosJson(index) {
  const videos = Object.values(index)
    .filter((v) => v.status === 'complete' && v.finalVideoUrl)
    .sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999))
    .map((v) => ({
      id: slugify(v.title),
      title: v.title,
      platform: 'self-hosted',
      url: v.finalVideoUrl,
      thumbnail: null,
      description: null,
      publishedAt: null,
      trackId: slugify(v.title),
    }))

  const output = { generatedAt: new Date().toISOString(), videos }
  fs.mkdirSync(VIDEOS_DIR, { recursive: true })
  fs.writeFileSync(VIDEOS_INDEX, JSON.stringify(output, null, 2), 'utf-8')
  if (videos.length > 0) log(`Website videos.json updated — ${videos.length} video(s) available.`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (RESET_MODE) {
    runReset()
    return
  }

  if (LIST_MODE) {
    runList()
    return
  }

  const allTracks = loadTracks()
  const tracks = TRACK_ARG
    ? allTracks.filter((t) => t.trackNumber === TRACK_ARG)
    : allTracks

  if (TRACK_ARG && tracks.length === 0) {
    err(`Track ${TRACK_ARG} not found.`)
    process.exit(1)
  }

  if (STITCH_MODE) {
    const index = migrateOrReset(loadIndex())
    await stitchReady(tracks, index)
    return
  }

  if (POLL_MODE) {
    await runPoll(tracks)
    return
  }

  if (EXEC_MODE) {
    await runExecute(tracks)
    return
  }

  // Default: dry run
  await runDryRun(tracks)
}

main().catch((e) => {
  err(e.message)
  if (process.env.DEBUG) console.error(e.stack)
  process.exit(1)
})
