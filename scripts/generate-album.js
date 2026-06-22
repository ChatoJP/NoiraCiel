#!/usr/bin/env node
/**
 * generate-album.js
 *
 * Master pipeline for any NoiraCiel album.
 * Give it an album folder name — it runs the full production chain:
 *
 *   1. music      KIE.AI Suno V5_5 — lyrics → select → generate → download
 *   2. stories    Claude API — generate prose story for each track
 *   3. book       Puppeteer PDF — lyrics+art book per track + anthology
 *   4. scores     Python pipeline — stems → MIDI → MusicXML → SVG
 *   5. visuals    KIE.AI Flux Kontext — song art + album cover
 *   6. transcribe faster-whisper — word-level timestamps for karaoke
 *   7. karaoke    Remotion — rendered lyric videos
 *   8. publish    Update songs.json + album registry
 *
 * USAGE
 *   node scripts/generate-album.js --album The_Velvet_Machine --all
 *   node scripts/generate-album.js --album The_Velvet_Machine --music
 *   node scripts/generate-album.js --album The_Velvet_Machine --poll-lyrics
 *   node scripts/generate-album.js --album The_Velvet_Machine --poll-music
 *   node scripts/generate-album.js --album The_Velvet_Machine --stories
 *   node scripts/generate-album.js --album The_Velvet_Machine --book
 *   node scripts/generate-album.js --album The_Velvet_Machine --scores
 *   node scripts/generate-album.js --album The_Velvet_Machine --visuals
 *   node scripts/generate-album.js --album The_Velvet_Machine --transcribe
 *   node scripts/generate-album.js --album The_Velvet_Machine --karaoke
 *   node scripts/generate-album.js --album The_Velvet_Machine --publish
 *   node scripts/generate-album.js --album The_Velvet_Machine --list
 *   node scripts/generate-album.js --album The_Velvet_Machine --track 3 --music
 */

'use strict'

const fs      = require('fs')
const path    = require('path')
const https   = require('https')
const http    = require('http')
const { spawnSync, execSync } = require('child_process')

// ─── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
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

// ─── Args ─────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2)
const ALBUM_ARG  = (() => { const i = args.indexOf('--album'); return i !== -1 ? args[i + 1] : null })()
const TRACK_ARG  = (() => { const i = args.indexOf('--track'); return i !== -1 ? parseInt(args[i + 1], 10) : null })()

const STAGE_MUSIC      = args.includes('--music')
const STAGE_POLL_LYR   = args.includes('--poll-lyrics')
const STAGE_POLL_MUS   = args.includes('--poll-music')
const STAGE_STORIES    = args.includes('--stories')
const STAGE_BOOK       = args.includes('--book')
const STAGE_SCORES     = args.includes('--scores')
const STAGE_VISUALS    = args.includes('--visuals')
const STAGE_TRANSCRIBE = args.includes('--transcribe')
const STAGE_KARAOKE    = args.includes('--karaoke')
const STAGE_PUBLISH    = args.includes('--publish')
const STAGE_ALL        = args.includes('--all')
const STAGE_LIST       = args.includes('--list')
const STAGE_RESET      = args.includes('--reset')

if (!ALBUM_ARG) {
  console.error('Usage: node scripts/generate-album.js --album <AlbumFolderName> [--stage]')
  process.exit(1)
}

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT        = path.join(__dirname, '..')
const ALBUM_DIR   = path.join(ROOT, 'Music', ALBUM_ARG)
const MANIFEST    = path.join(ALBUM_DIR, 'manifest.json')
const LYRICS_DIR  = path.join(ALBUM_DIR, 'lyrics')
const GEN_DIR     = path.join(ALBUM_DIR, 'generations')
const AUDIO_DIR   = path.join(ALBUM_DIR, 'audio')
const LOGS_DIR    = path.join(ALBUM_DIR, 'logs')
const STATE_FILE  = path.join(LOGS_DIR, 'pipeline_state.json')

const PUBLIC_DIR       = path.join(ROOT, 'public')
const SONG_ART_DIR     = path.join(PUBLIC_DIR, 'images', 'song-art')
const ALBUM_COVER_DIR  = path.join(PUBLIC_DIR, 'images', 'album-covers')
const TIMESTAMPS_DIR   = path.join(PUBLIC_DIR, 'Lyrics', 'timestamps')
const KARAOKE_DIR      = path.join(PUBLIC_DIR, 'Videos', 'lyrics')
const STORIES_SRC_DIR  = path.join(ROOT, 'content', 'stories')
const BOOKS_DIR        = path.join(PUBLIC_DIR, 'Books', 'stories')
const SCORES_DIR       = path.join(PUBLIC_DIR, 'Books', 'scores')

// ─── Config ───────────────────────────────────────────────────────────────────
const KIE_BASE          = 'https://api.kie.ai/api/v1'
const RATE_LIMIT_MS     = 3500
const POLL_INTERVAL_MS  = 20_000
const POLL_TIMEOUT_MS   = 30 * 60 * 1000
const MAX_RETRIES       = 3
const MUSIC_PARAMS      = {
  customMode:          true,
  instrumental:        false,
  model:               'V5_5',
  styleWeight:         0.75,
  weirdnessConstraint: 0.65,
  audioWeight:         0.75,
}

// ─── Logging ──────────────────────────────────────────────────────────────────
const ts   = () => new Date().toISOString().slice(11, 19)
const log  = (m) => console.log(`[${ts()}] ${m}`)
const warn = (m) => console.warn(`[${ts()}] ⚠  ${m}`)
const err  = (m) => console.error(`[${ts()}] ✗  ${m}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function trackSlug(track) {
  return `${String(track.number).padStart(2, '0')}_${track.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`
}

// ─── Manifest ─────────────────────────────────────────────────────────────────
function loadManifest() {
  if (!fs.existsSync(MANIFEST)) { err(`manifest.json not found: ${MANIFEST}`); process.exit(1) }
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'))
}

// ─── Pipeline state ───────────────────────────────────────────────────────────
function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {}
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch { return {} }
}

function saveState(state) {
  fs.mkdirSync(LOGS_DIR, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

function ensureEntry(state, track) {
  const slug = trackSlug(track)
  if (!state[slug]) {
    state[slug] = {
      trackNumber: track.number,
      title: track.title,
      slug,
      // Stage 1: music
      lyricsStatus:          'none',
      lyricsTaskId:          null,
      lyricsVariations:      [],
      selectedLyricsVersion: null,
      musicStatus:           'none',
      musicTaskId:           null,
      audioUrls:             [],
      localAudioPaths:       [],
      // Stage 2: stories
      storyStatus:           'none',
      storyPath:             null,
      // Stage 3: book
      bookStatus:            'none',
      bookPath:              null,
      // Stage 4: scores
      scoresStatus:          'none',
      scoresDir:             null,
      // Stage 5: visuals
      songArtStatus:         'none',
      songArtPath:           null,
      songArtTaskId:         null,
      // Stage 6: transcribe
      transcribeStatus:      'none',
      timestampsPath:        null,
      // Stage 7: karaoke
      karaokeStatus:         'none',
      karaokeVideoPath:      null,
    }
  }
  return state[slug]
}

// ─── KIE.AI HTTP ──────────────────────────────────────────────────────────────
function kieRequest(method, endpoint, body) {
  const apiKey = process.env.KIE_API_KEY
  if (!apiKey) throw new Error('KIE_API_KEY not set — check .env.local')
  return new Promise((resolve, reject) => {
    const url     = new URL(`${KIE_BASE}${endpoint}`)
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
            reject(new Error(`KIE.AI ${parsed.code}: ${parsed.msg ?? JSON.stringify(parsed).slice(0, 120)}`))
          } else {
            resolve(parsed)
          }
        } catch { reject(new Error(`Bad JSON: ${data.slice(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function kieRetry(method, endpoint, body, retries = MAX_RETRIES) {
  for (let i = 1; i <= retries; i++) {
    try { return await kieRequest(method, endpoint, body) } catch (e) {
      if (i === retries) throw e
      const wait = i * 5000
      warn(`Attempt ${i} failed: ${e.message} — retrying in ${wait / 1000}s`)
      await sleep(wait)
    }
  }
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true })
    const file     = fs.createWriteStream(destPath)
    const protocol = url.startsWith('https') ? https : http
    protocol.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); return resolve(downloadFile(res.headers.location, destPath))
      }
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
    }).on('error', (e) => { fs.unlink(destPath, () => {}); reject(e) })
  })
}

// ─── ─────────────────────────────────────────────────────────────────────────
// STAGE 1: MUSIC  (KIE.AI Suno V5_5)
// ─────────────────────────────────────────────────────────────────────────────

// Condense full lyrics prompt to ≤200 chars for the KIE.AI lyrics endpoint
function buildLyricsApiPrompt(track) {
  const full = track.lyricsPrompt ?? ''
  const themeM = full.match(/Theme:\s*([^.]+\.)/i)
  const toneM  = full.match(/Tone:\s*([^.]+\.)/i)
  const theme  = themeM ? themeM[1].trim() : `${track.title}: emotional soul theme.`
  const tone   = toneM  ? toneM[1].trim()  : ''
  let p = `"${track.title}": ${theme}`
  if (tone && p.length + tone.length + 1 < 185) p += ` ${tone}`
  p += ' Verse/chorus/bridge. English.'
  return p.length <= 200 ? p : p.slice(0, 197) + '...'
}

async function submitLyricsJob(track) {
  const prompt      = buildLyricsApiPrompt(track)
  const callBackUrl = process.env.KIE_CALLBACK_URL ?? 'https://noiraciel.com/api/webhooks/kie'
  log(`  Lyrics prompt (${prompt.length} chars): ${prompt}`)
  const res    = await kieRetry('POST', '/lyrics', { prompt, callBackUrl })
  const taskId = res.data?.taskId
  if (!taskId) throw new Error('No taskId in lyrics response')
  return taskId
}

async function pollLyricsTask(taskId) {
  const res = await kieRetry('GET', `/lyrics/record-info?taskId=${taskId}`)
  const d   = res.data ?? {}
  const FAIL = ['CREATE_TASK_FAILED', 'GENERATE_LYRICS_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR']
  if (d.status === 'SUCCESS') {
    // response is { taskId, data: [{text, title, status}] }
    const variations = d.response?.data ?? d.response ?? []
    const list = Array.isArray(variations) ? variations : []
    if (list.length > 0) return { done: true, failed: false, variations: list }
  }
  if (FAIL.includes(d.status)) return { done: true, failed: true, variations: [] }
  return { done: false, failed: false, variations: [] }
}

// Lyrics auto-selection scoring
const STRUCTURE_MARKERS   = ['[verse', '[chorus', '[bridge', '[pre-chorus', '[hook', '[outro', '[intro', '[refrain']
const EMOTIONAL_WORDS     = ['soul', 'heart', 'wound', 'survive', 'night', 'memory', 'love', 'broken', 'light', 'dark', 'human', 'breathe', 'blood', 'fire', 'water', 'ghost', 'dream', 'fear', 'hold']
const ARTIST_NAMES        = ['beyoncé', 'adele', 'rihanna', 'drake', 'eminem', 'madonna', 'taylor swift', 'ed sheeran', 'amy winehouse', 'suno', 'openai']
const COPYRIGHT_PHRASES   = ["don't stop believin", 'smells like teen spirit', 'bohemian rhapsody', 'stairway to heaven']
const SPOKEN_WORD_PHRASES = ['let me tell you', 'so i said', 'and then she', 'listen up', 'yo,', 'aye,']

function scoreVariation(text) {
  if (!text || text.trim().length < 80) return { score: -999, reasons: ['too short'] }
  const lower = text.toLowerCase()
  let score = 0
  const reasons = []

  const markers = STRUCTURE_MARKERS.filter(m => lower.includes(m))
  score += markers.length * 15
  if (markers.length >= 2) reasons.push(`structure: ${markers.join(', ')}`)

  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length >= 12) { score += 20; reasons.push('substantial content') }
  if (lines.length >= 20) score += 10

  const contentLines = lines.filter(l => !l.startsWith('['))
  const avgLen = contentLines.reduce((s, l) => s + l.length, 0) / Math.max(contentLines.length, 1)
  if (avgLen >= 20 && avgLen <= 70) { score += 15; reasons.push('singable line lengths') }

  const emotionalHits = EMOTIONAL_WORDS.filter(w => lower.includes(w))
  score += emotionalHits.length * 3
  if (emotionalHits.length >= 5) reasons.push(`emotional vocabulary (${emotionalHits.length} words)`)

  // Healthy repetition = chorus-like
  const unique = new Set(contentLines.map(l => l.trim().toLowerCase()))
  const rep = 1 - unique.size / Math.max(contentLines.length, 1)
  if (rep > 0.1 && rep < 0.5) { score += 10; reasons.push('chorus repetition') }

  if (ARTIST_NAMES.some(a => lower.includes(a))) { score -= 100; reasons.push('PENALTY: artist name') }
  if (COPYRIGHT_PHRASES.some(p => lower.includes(p))) { score -= 200; reasons.push('PENALTY: copyright phrase') }
  if (SPOKEN_WORD_PHRASES.some(p => lower.includes(p))) { score -= 30; reasons.push('PENALTY: spoken-word') }

  return { score, reasons }
}

function selectBestLyrics(variations, track) {
  if (!variations?.length) return null
  const scored = variations.map((v, i) => {
    const { score, reasons } = scoreVariation(v.text ?? '')
    return { versionNumber: i + 1, text: v.text, title: v.title ?? track.title, score, reasons }
  }).sort((a, b) => b.score - a.score)
  const best = scored[0]
  return {
    versionNumber: best.versionNumber,
    text:          best.text,
    title:         best.title,
    score:         best.score,
    reason:        best.reasons.join('; ') || 'highest score',
  }
}

function saveLyricsFile(track, entry) {
  fs.mkdirSync(LYRICS_DIR, { recursive: true })
  const sel = entry.selectedLyricsVersion
  if (!sel) return null
  const filePath = path.join(LYRICS_DIR, `${entry.slug}.md`)
  const content  = [
    `# ${track.title}`,
    '',
    `**Album:** ${loadManifest().album}`,
    `**Selected version:** ${sel.versionNumber} of ${entry.lyricsVariations.length}`,
    `**Selection reason:** ${sel.reason}`,
    `**Score:** ${sel.score}`,
    `**Lyrics task ID:** ${entry.lyricsTaskId}`,
    `**Generated:** ${new Date().toISOString()}`,
    '',
    '---',
    '',
    sel.text,
  ].join('\n')
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}

function saveGenerationJson(track, entry) {
  fs.mkdirSync(GEN_DIR, { recursive: true })
  const manifest = loadManifest()
  const data = {
    trackNumber:     track.number,
    title:           track.title,
    slug:            entry.slug,
    style:           track.style,
    vocalGender:     track.vocalGender,
    negativeTags:    track.negativeTags,
    lyricsTaskId:    entry.lyricsTaskId,
    lyricsStatus:    entry.lyricsStatus,
    selectedLyrics:  entry.selectedLyricsVersion,
    allVariations:   entry.lyricsVariations,
    musicTaskId:     entry.musicTaskId,
    musicStatus:     entry.musicStatus,
    audioUrls:       entry.audioUrls,
    localAudioPaths: entry.localAudioPaths,
    submittedAt:     entry.submittedAt,
    completedAt:     entry.completedAt,
    album:           manifest.album,
  }
  fs.writeFileSync(path.join(GEN_DIR, `${entry.slug}.json`), JSON.stringify(data, null, 2), 'utf-8')
}

async function submitMusicJob(track, selectedLyrics) {
  const callBackUrl = process.env.KIE_CALLBACK_URL ?? 'https://noiraciel.com/api/webhooks/kie'
  const body = {
    ...MUSIC_PARAMS,
    title:        track.title,
    style:        track.style,
    prompt:       selectedLyrics.text,
    negativeTags: track.negativeTags,
    vocalGender:  track.vocalGender,
    callBackUrl,
  }
  const res    = await kieRetry('POST', '/generate', body)
  const taskId = res.data?.taskId
  if (!taskId) throw new Error('No taskId in music response')
  return taskId
}

async function pollMusicTask(taskId) {
  const res    = await kieRetry('GET', `/generate/record-info?taskId=${taskId}`)
  const d      = res.data ?? {}
  const status = d.status ?? 'PENDING'
  const FAIL   = ['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR']
  if (status === 'SUCCESS') return { done: true, failed: false, status, sunoData: d.response?.sunoData ?? [] }
  if (FAIL.includes(status)) return { done: true, failed: true, status, sunoData: [] }
  return { done: false, failed: false, status, sunoData: [] }
}

// Stage 1a: Submit lyrics jobs
async function runLyrics(tracks) {
  const state = loadState()
  let submitted = 0
  log(`\n═══ STAGE 1a: LYRICS — ${tracks.length} track(s) ═══`)

  for (const track of tracks) {
    const entry = ensureEntry(state, track)
    if (['selected', 'ready'].includes(entry.lyricsStatus) && entry.selectedLyricsVersion) {
      log(`⏭  [${track.number}] "${track.title}" — lyrics already selected`); continue
    }
    if (entry.lyricsStatus === 'submitted' && entry.lyricsTaskId) {
      log(`⏭  [${track.number}] "${track.title}" — already submitted (${entry.lyricsTaskId})`); continue
    }
    log(`\n📝  [${track.number}] "${track.title}"`)
    try {
      const taskId = await submitLyricsJob(track)
      entry.lyricsStatus = 'submitted'
      entry.lyricsTaskId = taskId
      entry.submittedAt  = new Date().toISOString()
      saveState(state)
      log(`  ✓ taskId: ${taskId}`)
      submitted++
    } catch (e) {
      err(`  Lyrics failed: ${e.message}`)
    }
    if (tracks.indexOf(track) < tracks.length - 1) await sleep(RATE_LIMIT_MS)
  }
  log(`\n✅ Submitted ${submitted} lyrics job(s). Run --poll-lyrics next.`)
}

// Stage 1b: Poll lyrics, select best, save files
async function runPollLyrics(tracks) {
  const state   = loadState()
  const pending = tracks.filter(t => {
    const e = ensureEntry(state, t)
    return e.lyricsStatus === 'submitted' && e.lyricsTaskId
  })
  if (!pending.length) { log('No pending lyrics tasks.'); return }

  log(`\n═══ STAGE 1b: POLL LYRICS — ${pending.length} track(s) ═══`)
  const remaining = new Set(pending.map(t => trackSlug(t)))
  const deadline  = Date.now() + POLL_TIMEOUT_MS

  while (remaining.size > 0 && Date.now() < deadline) {
    for (const track of pending) {
      const slug  = trackSlug(track)
      if (!remaining.has(slug)) continue
      const entry = state[slug]
      try {
        process.stdout.write(`  [${track.number}] "${track.title}" … `)
        const result = await pollLyricsTask(entry.lyricsTaskId)
        if (result.done && !result.failed) {
          console.log(`✓ ${result.variations.length} variation(s)`)
          entry.lyricsVariations = result.variations.map((v, i) => ({
            versionNumber: i + 1, title: v.title ?? track.title, text: v.text ?? '',
          }))
          entry.selectedLyricsVersion = selectBestLyrics(result.variations, track)
          entry.lyricsStatus = 'selected'
          saveState(state)
          const lyricsPath = saveLyricsFile(track, entry)
          if (lyricsPath) log(`  Lyrics → ${path.relative(ROOT, lyricsPath)}`)
          saveGenerationJson(track, entry)
          remaining.delete(slug)
        } else if (result.done && result.failed) {
          console.log('✗ failed')
          entry.lyricsStatus = 'none'; entry.lyricsTaskId = null
          saveState(state); remaining.delete(slug)
        } else {
          console.log('⏳ pending')
        }
      } catch (e) { console.log(`⚠ ${e.message}`) }
      await sleep(500)
    }
    if (remaining.size > 0) {
      log(`  ${remaining.size} still processing — waiting ${POLL_INTERVAL_MS / 1000}s…`)
      await sleep(POLL_INTERVAL_MS)
    }
  }
  if (remaining.size > 0) warn(`Timed out. ${remaining.size} still pending — run --poll-lyrics again.`)
  else log('\n✅ All lyrics ready. Run --poll-music after --music.')
}

// Stage 1c: Submit music generation jobs
async function runMusic(tracks) {
  const state = loadState()
  const ready = tracks.filter(t => {
    const e = ensureEntry(state, t)
    return e.lyricsStatus === 'selected' && e.selectedLyricsVersion
  })
  if (!ready.length) { warn('No tracks have selected lyrics. Run --music (lyrics) first.'); return }

  log(`\n═══ STAGE 1c: MUSIC GENERATION — ${ready.length} track(s) ═══`)
  log('Starting in 5s — Ctrl+C to abort…'); await sleep(5000)

  let submitted = 0
  for (const track of ready) {
    const entry = ensureEntry(state, track)
    if (entry.musicStatus === 'complete') {
      log(`⏭  [${track.number}] "${track.title}" — already complete`); continue
    }
    if (['submitted', 'pending', 'text_success', 'first_success'].includes(entry.musicStatus) && entry.musicTaskId) {
      log(`⏭  [${track.number}] "${track.title}" — already submitted (${entry.musicTaskId})`); continue
    }
    log(`\n🎵  [${track.number}] "${track.title}"`)
    try {
      const taskId = await submitMusicJob(track, entry.selectedLyricsVersion)
      entry.musicStatus = 'submitted'; entry.musicTaskId = taskId
      entry.submittedAt = new Date().toISOString()
      saveState(state); saveGenerationJson(track, entry)
      log(`  ✓ taskId: ${taskId}`)
      submitted++
    } catch (e) { err(`  Music submit failed: ${e.message}`) }
    if (ready.indexOf(track) < ready.length - 1) await sleep(RATE_LIMIT_MS)
  }
  log(`\n✅ Submitted ${submitted} music job(s). Run --poll-music to download.`)
}

// Stage 1d: Poll music, download audio
async function runPollMusic(tracks) {
  const state   = loadState()
  const ACTIVE  = ['submitted', 'pending', 'text_success', 'first_success']
  const pending = tracks.filter(t => {
    const e = ensureEntry(state, t)
    return ACTIVE.includes(e.musicStatus) && e.musicTaskId
  })
  if (!pending.length) { log('No pending music tasks.'); return }

  log(`\n═══ STAGE 1d: POLL MUSIC — ${pending.length} track(s) ═══`)
  const remaining = new Set(pending.map(t => trackSlug(t)))
  const deadline  = Date.now() + POLL_TIMEOUT_MS

  while (remaining.size > 0 && Date.now() < deadline) {
    for (const track of pending) {
      const slug  = trackSlug(track)
      if (!remaining.has(slug)) continue
      const entry = state[slug]
      try {
        process.stdout.write(`  [${track.number}] "${track.title}" … `)
        const result = await pollMusicTask(entry.musicTaskId)
        console.log(`status: ${result.status}`)
        entry.musicStatus = result.status?.toLowerCase() ?? entry.musicStatus
        if (result.done && !result.failed) {
          entry.musicStatus  = 'complete'
          entry.completedAt  = new Date().toISOString()
          entry.audioUrls    = result.sunoData.map(s => s.audioUrl).filter(Boolean)
          saveState(state)
          // Download first version only
          const firstTrack = result.sunoData[0]
          if (firstTrack?.audioUrl) {
            const filename  = `${entry.slug}.mp3`
            const localPath = path.join(AUDIO_DIR, filename)
            try {
              log(`  Downloading: ${firstTrack.audioUrl}`)
              await downloadFile(firstTrack.audioUrl, localPath)
              entry.localAudioPaths.push(localPath)
              log(`  ✓ ${filename}`)
            } catch (de) { warn(`  Download failed: ${de.message}`) }
          }
          saveState(state); saveGenerationJson(track, entry)
          remaining.delete(slug)
          log(`  ✅ "${track.title}" — ${entry.localAudioPaths.length} file(s) downloaded`)
        } else if (result.done && result.failed) {
          entry.musicStatus = 'failed'; saveState(state); saveGenerationJson(track, entry)
          remaining.delete(slug)
          err(`  ✗ "${track.title}" failed (${result.status})`)
        } else { saveState(state) }
      } catch (e) { console.log(`⚠ ${e.message}`) }
      await sleep(500)
    }
    if (remaining.size > 0) {
      log(`  ${remaining.size} still processing — waiting ${POLL_INTERVAL_MS / 1000}s…`)
      await sleep(POLL_INTERVAL_MS)
    }
  }
  if (remaining.size > 0) warn(`Timed out — run --poll-music again.`)
  else log('\n✅ All music downloaded.')
}

// ─── ─────────────────────────────────────────────────────────────────────────
// STAGE 2: STORIES  (Claude API — prose story per track)
// ─────────────────────────────────────────────────────────────────────────────

async function generateStory(track, manifest) {
  const Anthropic = require('@anthropic-ai/sdk')
  const client    = new Anthropic.default()

  const systemPrompt = `You are a literary author writing short prose stories for NoiraCiel, an Atlantic Noir music project.
The stories accompany songs and are written for young readers aged 9–14.
Each story is 4–6 paragraphs. Tone: literary, warm, melancholic but not dark for children, always hopeful.
Format your response as raw markdown with this exact structure:

# [Story Title]

*[One-line tagline — poetic, 10 words max]*

[Paragraph 1 — sets scene, introduces character]

[Paragraph 2 — develops situation]

[Paragraph 3 — complication or revelation]

[Paragraph 4 — emotional turning point]

[Paragraph 5 — resolution, understated]

---

*[The lesson, stated beautifully in one or two sentences]*`

  const userPrompt = `Write a story for the NoiraCiel song "${track.title}" from the album "${manifest.album}".

Song theme: ${track.storyTheme}
Album concept: ${manifest.coreConcept}

The story should feel like a quiet lesson about life, not a morality tale. Make it specific and human.
The lesson should emerge naturally from the story, never be preached.`

  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: userPrompt }],
    system:     systemPrompt,
  })

  return message.content[0]?.text ?? ''
}

async function runStories(tracks) {
  const state    = loadState()
  const manifest = loadManifest()
  const apiKey   = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { warn('ANTHROPIC_API_KEY not set — skipping story generation'); return }

  log(`\n═══ STAGE 2: STORIES — ${tracks.length} track(s) ═══`)
  fs.mkdirSync(STORIES_SRC_DIR, { recursive: true })

  for (const track of tracks) {
    const entry  = ensureEntry(state, track)
    const slug   = slugify(track.title)
    const stPath = path.join(STORIES_SRC_DIR, `${slug}.md`)

    if (entry.storyStatus === 'done' && fs.existsSync(stPath)) {
      log(`⏭  [${track.number}] "${track.title}" — story exists`); continue
    }

    log(`\n📖  [${track.number}] "${track.title}"`)
    try {
      const storyText = await generateStory(track, manifest)
      fs.writeFileSync(stPath, storyText, 'utf-8')
      entry.storyStatus = 'done'; entry.storyPath = stPath
      saveState(state)
      log(`  ✓ Saved: ${path.relative(ROOT, stPath)}`)
    } catch (e) { err(`  Story failed: ${e.message}`) }
    await sleep(1000)
  }
  log('\n✅ Stories done.')
}

// ─── ─────────────────────────────────────────────────────────────────────────
// STAGE 3: BOOK  (PDF via puppeteer — adapted from generate-story-pdfs.js)
// ─────────────────────────────────────────────────────────────────────────────

function parseStoryMd(markdown) {
  const lines = markdown.split('\n')
  let title = '', tagline = '', lesson = ''
  const paragraphs = []
  let afterDivider = false
  for (const line of lines) {
    const t = line.trim()
    if (t.startsWith('# ')) { title = t.slice(2); continue }
    if (t === '---') { afterDivider = true; continue }
    if (!t) continue
    if (t.startsWith('*') && t.endsWith('*') && !afterDivider && !tagline) { tagline = t.slice(1, -1); continue }
    if (afterDivider && t.startsWith('*') && t.endsWith('*')) { lesson = t.slice(1, -1); continue }
    if (!afterDivider) paragraphs.push(t)
  }
  return { title, tagline, lesson, paragraphs }
}

function imageToBase64(filePath) {
  if (!fs.existsSync(filePath)) return null
  const data = fs.readFileSync(filePath)
  const ext  = path.extname(filePath).slice(1).toLowerCase()
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${data.toString('base64')}`
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const BOOK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:ital,wght@0,300;0,400;1,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: 148mm 210mm; margin: 0; }
  body { font-family: 'Cormorant Garamond', Georgia, serif; background: #04040a; color: #F2EDE3; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 148mm; height: 210mm; position: relative; overflow: hidden; page-break-after: always; break-after: page; }
  .cover-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cover-gradient { position: absolute; inset: 0; background: linear-gradient(to top, #04040a 38%, rgba(4,4,10,0.55) 62%, rgba(4,4,10,0.2) 100%); }
  .cover-brand { position: absolute; top: 9mm; right: 9mm; font-family: 'DM Sans', sans-serif; font-size: 6.5pt; letter-spacing: 0.45em; text-transform: uppercase; color: #c4953a; }
  .cover-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 9mm 10mm 10mm; }
  .cover-chapter-ref { font-family: 'DM Sans', sans-serif; font-size: 6.5pt; letter-spacing: 0.3em; text-transform: uppercase; color: #c4953a; margin-bottom: 3.5mm; }
  .cover-title { font-size: 27pt; font-style: italic; font-weight: 300; line-height: 1.08; margin-bottom: 3.5mm; }
  .cover-tagline { font-family: 'DM Sans', sans-serif; font-size: 7pt; color: rgba(242,237,227,0.45); letter-spacing: 0.1em; font-style: italic; }
  .content-page { width: 148mm; min-height: 210mm; padding: 12mm 13mm; background: #04040a; }
  .page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 3mm; border-bottom: 0.3pt solid rgba(242,237,227,0.08); margin-bottom: 7mm; }
  .page-header-brand { font-family: 'DM Sans', sans-serif; font-size: 5.5pt; letter-spacing: 0.4em; text-transform: uppercase; color: #c4953a; opacity: 0.55; }
  .page-header-chapter { font-family: 'DM Sans', sans-serif; font-size: 5.5pt; letter-spacing: 0.15em; color: rgba(242,237,227,0.2); font-style: italic; }
  .story-title-inner { font-size: 20pt; font-style: italic; font-weight: 300; color: #F2EDE3; line-height: 1.1; margin-bottom: 2mm; }
  .story-tagline-inner { font-family: 'DM Sans', sans-serif; font-size: 7pt; color: #c4953a; letter-spacing: 0.12em; font-style: italic; margin-bottom: 7mm; opacity: 0.65; padding-bottom: 5mm; border-bottom: 0.3pt solid rgba(196,149,58,0.15); }
  .paragraph { font-size: 11.5pt; line-height: 1.72; color: rgba(242,237,227,0.82); margin-bottom: 4.5mm; }
  .closing-page { width: 148mm; height: 210mm; background: #04040a; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14mm; text-align: center; page-break-before: always; break-before: page; }
  .closing-ornament { font-size: 12pt; color: #c4953a; opacity: 0.4; margin-bottom: 9mm; letter-spacing: 0.5em; }
  .closing-lesson { font-size: 13pt; font-style: italic; font-weight: 300; line-height: 1.65; max-width: 108mm; margin-bottom: 12mm; opacity: 0.88; }
  .closing-rule { width: 18mm; height: 0.3pt; background: rgba(196,149,58,0.35); margin-bottom: 9mm; }
  .closing-brand { font-family: 'DM Sans', sans-serif; font-size: 7pt; letter-spacing: 0.45em; text-transform: uppercase; color: #c4953a; opacity: 0.6; margin-bottom: 2mm; }
  .closing-song-ref { font-size: 9pt; font-style: italic; color: rgba(242,237,227,0.25); margin-bottom: 12mm; }
  .closing-url { font-family: 'DM Sans', sans-serif; font-size: 5.5pt; letter-spacing: 0.25em; color: rgba(242,237,227,0.15); text-transform: uppercase; }
`

function buildStoryHTML(track, manifest, story, artBase64) {
  const num    = String(track.number).padStart(2, '0')
  const paras  = story.paragraphs.map(p => `<p class="paragraph">${escapeHtml(p)}</p>`).join('\n')
  const artTag = artBase64
    ? `<img class="cover-art" src="${artBase64}" alt="" />`
    : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#0d1525,#04040a);"></div>`

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>${BOOK_CSS}</style></head><body>
  <div class="page">
    ${artTag}
    <div class="cover-gradient"></div>
    <div class="cover-brand">NoiraCiel</div>
    <div class="cover-content">
      <p class="cover-chapter-ref">Chapter ${num} &middot; ${escapeHtml(track.title)}</p>
      <h1 class="cover-title">${escapeHtml(story.title || track.title)}</h1>
      ${story.tagline ? `<p class="cover-tagline">${escapeHtml(story.tagline)}</p>` : ''}
    </div>
  </div>
  <div class="content-page">
    <div class="page-header">
      <span class="page-header-brand">NoiraCiel</span>
      <span class="page-header-chapter">${escapeHtml(story.title || track.title)}</span>
    </div>
    <h2 class="story-title-inner">${escapeHtml(story.title || track.title)}</h2>
    ${story.tagline ? `<p class="story-tagline-inner">${escapeHtml(story.tagline)}</p>` : ''}
    ${paras}
  </div>
  <div class="closing-page">
    <div class="closing-ornament">&mdash; &middot; &mdash;</div>
    ${story.lesson ? `<p class="closing-lesson">${escapeHtml(story.lesson)}</p>` : ''}
    <div class="closing-rule"></div>
    <p class="closing-brand">NoiraCiel</p>
    <p class="closing-song-ref">A companion to &ldquo;${escapeHtml(track.title)}&rdquo;</p>
    <p class="closing-url">noiraciel.com</p>
  </div>
</body></html>`
}

async function runBook(tracks) {
  const state    = loadState()
  const manifest = loadManifest()
  log(`\n═══ STAGE 3: BOOK (PDF) — ${tracks.length} track(s) ═══`)

  let puppeteer
  try { puppeteer = require('puppeteer') } catch { warn('puppeteer not installed — skipping book'); return }

  fs.mkdirSync(BOOKS_DIR, { recursive: true })
  const albumSlug = slugify(manifest.album)
  const bookDir   = path.join(BOOKS_DIR, albumSlug)
  fs.mkdirSync(bookDir, { recursive: true })

  const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox', '--disable-setuid-sandbox'] })

  for (const track of tracks) {
    const entry   = ensureEntry(state, track)
    const tSlug   = slugify(track.title)
    const stPath  = path.join(STORIES_SRC_DIR, `${tSlug}.md`)
    const pdfPath = path.join(bookDir, `${tSlug}.pdf`)

    if (entry.bookStatus === 'done' && fs.existsSync(pdfPath)) {
      log(`⏭  [${track.number}] "${track.title}" — book exists`); continue
    }
    if (!fs.existsSync(stPath)) {
      warn(`  [${track.number}] "${track.title}" — no story file (run --stories first)`); continue
    }

    const story    = parseStoryMd(fs.readFileSync(stPath, 'utf-8'))
    const artPath  = path.join(SONG_ART_DIR, `${tSlug}.jpg`)
    const artB64   = imageToBase64(artPath)
    const html     = buildStoryHTML(track, manifest, story, artB64)

    process.stdout.write(`  📄 [${track.number}] ${track.title}… `)
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30_000 })
    await page.pdf({ path: pdfPath, width: '148mm', height: '210mm', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
    await page.close()
    console.log('✓')

    entry.bookStatus = 'done'; entry.bookPath = pdfPath
    saveState(state)
  }

  await browser.close()
  log(`\n✅ Book PDFs saved to ${path.relative(ROOT, bookDir)}`)
}

// ─── ─────────────────────────────────────────────────────────────────────────
// STAGE 4: SCORES  (spawn generate_scores.py per audio file)
// ─────────────────────────────────────────────────────────────────────────────

async function runScores(tracks) {
  const state = loadState()
  log(`\n═══ STAGE 4: SCORES ═══`)

  for (const track of tracks) {
    const entry = ensureEntry(state, track)
    if (entry.scoresStatus === 'done') {
      log(`⏭  [${track.number}] "${track.title}" — scores exist`); continue
    }
    if (!entry.localAudioPaths?.length) {
      warn(`  [${track.number}] "${track.title}" — no audio (run music stages first)`); continue
    }

    const audioFile = entry.localAudioPaths[0]
    const tSlug     = slugify(track.title)
    log(`\n🎼  [${track.number}] "${track.title}" — ${path.basename(audioFile)}`)

    const result = spawnSync(
      'python3', ['scripts/generate_scores.py', audioFile, '--slug', tSlug],
      { cwd: ROOT, stdio: 'inherit', encoding: 'utf-8', timeout: 10 * 60_000 }
    )

    if (result.status === 0) {
      entry.scoresStatus = 'done'
      entry.scoresDir    = path.join(SCORES_DIR, tSlug)
      saveState(state)
      log(`  ✓ Scores complete`)
    } else {
      err(`  Scores failed for "${track.title}"`)
    }
  }
  log('\n✅ Scores stage done.')
}

// ─── ─────────────────────────────────────────────────────────────────────────
// STAGE 5: VISUALS  (KIE.AI Flux Kontext — song art + album cover)
// ─────────────────────────────────────────────────────────────────────────────

async function submitImageJob(prompt) {
  const res    = await kieRetry('POST', '/flux/kontext/generate', {
    prompt, model: 'flux-kontext-pro', aspectRatio: '1:1', outputFormat: 'jpeg',
  })
  const taskId = res.data?.taskId
  if (!taskId) throw new Error('No taskId in image response')
  return taskId
}

async function pollImageTask(taskId) {
  const res = await kieRetry('GET', `/flux/kontext/record-info?taskId=${taskId}`)
  const d   = res.data ?? {}
  if (d.successFlag === 1) return { done: true, failed: false, url: d.response?.resultImageUrl ?? d.resultImageUrl ?? null }
  if (d.successFlag === 2 || d.successFlag === 3) return { done: true, failed: true, url: null }
  return { done: false, failed: false, url: null }
}

async function generateAndDownloadImage(prompt, destPath, label) {
  log(`  Submitting: ${label}`)
  const taskId  = await submitImageJob(prompt)
  const deadline = Date.now() + 10 * 60_000
  while (Date.now() < deadline) {
    await sleep(15_000)
    const result = await pollImageTask(taskId)
    if (result.done && !result.failed && result.url) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      await downloadFile(result.url, destPath)
      log(`  ✓ ${label} → ${path.relative(ROOT, destPath)}`)
      return true
    }
    if (result.done && result.failed) { err(`  Image failed: ${label}`); return false }
    process.stdout.write('.')
  }
  warn(`  Image timed out: ${label}`); return false
}

async function runVisuals(tracks) {
  const state    = loadState()
  const manifest = loadManifest()
  log(`\n═══ STAGE 5: VISUALS — ${tracks.length} track(s) ═══`)

  for (const track of tracks) {
    const entry  = ensureEntry(state, track)
    const tSlug  = slugify(track.title)
    const artDest = path.join(SONG_ART_DIR, `${tSlug}.jpg`)

    if (entry.songArtStatus === 'done' && fs.existsSync(artDest)) {
      log(`⏭  [${track.number}] "${track.title}" — art exists`); continue
    }
    if (entry.songArtStatus === 'submitted' && entry.songArtTaskId) {
      log(`  [${track.number}] "${track.title}" — polling existing task`)
    }

    log(`\n🎨  [${track.number}] "${track.title}"`)
    const prompt = `${track.visualPrompt}. ${manifest.visualStyle}. Premium quality, no text, no watermarks.`

    try {
      const ok = await generateAndDownloadImage(prompt, artDest, `Song art — ${track.title}`)
      entry.songArtStatus = ok ? 'done' : 'failed'
      entry.songArtPath   = ok ? artDest : null
      saveState(state)
    } catch (e) { err(`  Visuals failed [${track.number}]: ${e.message}`) }

    await sleep(RATE_LIMIT_MS)
  }

  // Album cover (first track's visual with album branding)
  const albumSlug   = slugify(manifest.album)
  const coverDest   = path.join(ALBUM_COVER_DIR, `${albumSlug}.jpg`)
  if (!fs.existsSync(coverDest)) {
    const coverPrompt = `Album cover for "${manifest.album}" by NoiraCiel. ${manifest.coreConcept}. ${manifest.visualStyle}. A machine of velvet and shadow, with a single human heartbeat at its centre. No text, no lettering, no watermarks.`
    try {
      fs.mkdirSync(ALBUM_COVER_DIR, { recursive: true })
      await generateAndDownloadImage(coverPrompt, coverDest, 'Album cover')
    } catch (e) { err(`Album cover failed: ${e.message}`) }
  } else {
    log(`⏭  Album cover exists`)
  }

  log('\n✅ Visuals done.')
}

// ─── ─────────────────────────────────────────────────────────────────────────
// STAGE 6: TRANSCRIBE  (spawn transcribe-songs.py per audio file)
// ─────────────────────────────────────────────────────────────────────────────

async function runTranscribe(tracks) {
  const state = loadState()
  log(`\n═══ STAGE 6: TRANSCRIBE ═══`)

  for (const track of tracks) {
    const entry = ensureEntry(state, track)
    if (entry.transcribeStatus === 'done') {
      log(`⏭  [${track.number}] "${track.title}" — timestamps exist`); continue
    }
    if (!entry.localAudioPaths?.length) {
      warn(`  [${track.number}] "${track.title}" — no audio`); continue
    }

    const audioFile    = entry.localAudioPaths[0]
    const tSlug        = slugify(track.title)
    const tsOutPath    = path.join(TIMESTAMPS_DIR, `${tSlug}.json`)

    log(`\n🎤  [${track.number}] "${track.title}"`)
    const pyScript = `
import json, sys
import whisper
audio = sys.argv[1]; out = sys.argv[2]; title = sys.argv[3]
print("  Loading Whisper model…", flush=True)
model = whisper.load_model("base.en")
print("  Transcribing…", flush=True)
result = model.transcribe(audio, word_timestamps=True, language="en",
  initial_prompt="Lyrics:")
words = []
for seg in result.get("segments", []):
  for w in seg.get("words", []):
    t = w.get("word","").strip()
    if t: words.append({"word": t, "start": round(w["start"], 3), "end": round(w["end"], 3)})
out_data = {"title": title, "words": words, "duration": round(result.get("duration", 0), 2)}
with open(out, "w") as f: json.dump(out_data, f, indent=2)
print(f"  {len(words)} words written to {out}", flush=True)
`
    const result = spawnSync(
      'python3', ['-c', pyScript, audioFile, tsOutPath, track.title],
      { cwd: ROOT, stdio: 'inherit', encoding: 'utf-8', timeout: 15 * 60_000 }
    )

    if (result.status === 0 && fs.existsSync(tsOutPath)) {
      entry.transcribeStatus = 'done'
      entry.timestampsPath   = tsOutPath
      saveState(state)
      log(`  ✓ Timestamps → ${path.relative(ROOT, tsOutPath)}`)
    } else {
      warn(`  Transcription failed — you can also run: python scripts/transcribe-songs.py ${tSlug}`)
    }
  }
  log('\n✅ Transcription stage done.')
}

// ─── ─────────────────────────────────────────────────────────────────────────
// STAGE 7: KARAOKE  (Remotion lyric video render)
// ─────────────────────────────────────────────────────────────────────────────

async function runKaraoke(tracks) {
  const state    = loadState()
  const manifest = loadManifest()
  log(`\n═══ STAGE 7: KARAOKE VIDEOS ═══`)

  // Collect tracks that need rendering
  const toRender = []
  for (const track of tracks) {
    const entry = ensureEntry(state, track)
    const tSlug = slugify(track.title)
    const outPath = path.join(KARAOKE_DIR, `${tSlug}.mp4`)

    if (entry.karaokeStatus === 'done' || fs.existsSync(outPath)) {
      log(`⏭  [${track.number}] "${track.title}" — video exists`)
      if (fs.existsSync(outPath)) {
        entry.karaokeStatus    = 'done'
        entry.karaokeVideoPath = outPath
      }
      continue
    }
    if (!entry.timestampsPath || !fs.existsSync(entry.timestampsPath)) {
      warn(`  [${track.number}] "${track.title}" — no timestamps (run --transcribe first)`); continue
    }
    if (!entry.localAudioPaths?.length) {
      warn(`  [${track.number}] "${track.title}" — no audio`); continue
    }
    toRender.push({ track, entry })
  }
  saveState(state)

  if (!toRender.length) {
    log('All karaoke videos already rendered.'); return
  }

  // Write a manifest JSON so render-karaoke.js can process all tracks in one invocation
  // (one Remotion bundle for the whole album, not one per track)
  const audioDir = path.dirname(toRender[0].entry.localAudioPaths[0])
  const tracksManifest = {
    albumTitle: manifest.album,
    audioDir,
    tracks: toRender.map(({ track, entry }) => ({
      audioFile:   entry.localAudioPaths[0],
      title:       track.title,
      trackNumber: track.number,
    })),
  }
  const manifestPath = path.join(ALBUM_DIR, 'logs', 'karaoke-manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(tracksManifest, null, 2))

  log(`\n🎬  Rendering ${toRender.length} videos for "${manifest.album}"…`)
  const result = spawnSync(
    'node',
    ['scripts/render-karaoke.js', '--tracks-file', manifestPath],
    {
      cwd: ROOT,
      stdio: 'inherit',
      encoding: 'utf-8',
      timeout: 4 * 60 * 60_000,
      env: { ...process.env, TMPDIR: path.join(ROOT, '.remotion-tmp') },
    }
  )

  // Mark rendered tracks as done
  for (const { track, entry } of toRender) {
    const tSlug   = slugify(track.title)
    const outPath = path.join(KARAOKE_DIR, `${tSlug}.mp4`)
    if (fs.existsSync(outPath)) {
      entry.karaokeStatus    = 'done'
      entry.karaokeVideoPath = outPath
      log(`  ✓ ${track.title} → ${path.relative(ROOT, outPath)}`)
    } else {
      warn(`  ✗ ${track.title} — output not found`)
    }
  }
  saveState(state)

  if (result.status !== 0) warn('Karaoke render process exited with errors.')
  log('\n✅ Karaoke stage done.')
}

// ─── ─────────────────────────────────────────────────────────────────────────
// STAGE 8: PUBLISH  (update songs.json + album registry)
// ─────────────────────────────────────────────────────────────────────────────

async function runPublish(tracks) {
  const state    = loadState()
  const manifest = loadManifest()
  log(`\n═══ STAGE 8: PUBLISH ═══`)

  // Build track entries for songs.json
  const songsJsonPath = path.join(PUBLIC_DIR, 'songs.json')
  let existing = {}
  if (fs.existsSync(songsJsonPath)) {
    try { existing = JSON.parse(fs.readFileSync(songsJsonPath, 'utf-8')) } catch { existing = {} }
  }

  const albumSlug     = slugify(manifest.album)
  const existingTracks = existing.tracks ?? []

  // Remove any old tracks from this album
  const otherTracks = existingTracks.filter(t => t.albumSlug !== albumSlug)

  const newTracks = tracks.map(track => {
    const entry     = state[trackSlug(track)] ?? {}
    const tSlug     = slugify(track.title)
    const audioFile = entry.localAudioPaths?.[0] ?? null
    const relAudio  = audioFile ? '/' + path.relative(ROOT, audioFile).replace(/\\/g, '/') : null

    return {
      id:            tSlug,
      trackNumber:   track.number,
      title:         track.title,
      albumSlug,
      album:         manifest.album,
      artist:        manifest.artist,
      year:          manifest.year ?? new Date().getFullYear(),
      genre:         manifest.genre ?? '',
      vocalGender:   track.vocalGender,
      audioSrc:      relAudio ? relAudio.replace('/Music/', '/api/music/') : null,
      coverSrc:      `/images/song-art/${tSlug}.jpg`,
      lyricsPath:    `/Lyrics/timestamps/${tSlug}.json`,
      karaokeVideo:  entry.karaokeVideoPath ? `/Videos/lyrics/${tSlug}.mp4` : null,
      scoresPath:    entry.scoresDir ? `/Books/scores/${tSlug}/` : null,
      bookPath:      entry.bookPath ? `/Books/stories/${albumSlug}/${tSlug}.pdf` : null,
      musicTaskId:   entry.musicTaskId ?? null,
      generatedAt:   entry.completedAt ?? null,
    }
  }).sort((a, b) => a.trackNumber - b.trackNumber)

  const allTracks = [...otherTracks, ...newTracks]
    .sort((a, b) => (a.albumSlug ?? '').localeCompare(b.albumSlug ?? '') || a.trackNumber - b.trackNumber)

  // Album registry
  const albumsJsonPath = path.join(PUBLIC_DIR, 'albums.json')
  let albums = []
  if (fs.existsSync(albumsJsonPath)) {
    try { albums = JSON.parse(fs.readFileSync(albumsJsonPath, 'utf-8')) } catch { albums = [] }
  }
  const albumEntry = {
    slug:       albumSlug,
    title:      manifest.album,
    artist:     manifest.artist,
    year:       manifest.year ?? new Date().getFullYear(),
    genre:      manifest.genre ?? '',
    concept:    manifest.coreConcept ?? '',
    coverSrc:   `/images/album-covers/${albumSlug}.jpg`,
    trackCount: tracks.length,
    publishedAt: new Date().toISOString(),
  }
  const otherAlbums = albums.filter(a => a.slug !== albumSlug)
  const allAlbums   = [...otherAlbums, albumEntry].sort((a, b) => a.title.localeCompare(b.title))

  // Write files
  const output = {
    generatedAt: new Date().toISOString(),
    album: {
      title:   existing.album?.title ?? 'The Life Lessons I Hope You Learn',
      artist:  'NoiraCiel',
    },
    tracks: allTracks,
  }

  fs.writeFileSync(songsJsonPath, JSON.stringify(output, null, 2), 'utf-8')
  fs.writeFileSync(albumsJsonPath, JSON.stringify(allAlbums, null, 2), 'utf-8')

  // Update manifest with publish date
  manifest.publishedAt = new Date().toISOString()
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf-8')

  log(`\n✅ Published ${newTracks.length} track(s) from "${manifest.album}"`)
  log(`   songs.json   → ${path.relative(ROOT, songsJsonPath)} (${allTracks.length} total tracks)`)
  log(`   albums.json  → ${path.relative(ROOT, albumsJsonPath)} (${allAlbums.length} albums)`)
}

// ─── --list ───────────────────────────────────────────────────────────────────
function runList(tracks) {
  const state    = loadState()
  const manifest = loadManifest()
  const icons    = { none: '○', submitted: '📤', ready: '📄', selected: '✓', pending: '⏳', text_success: '📝', first_success: '🎵', complete: '✅', failed: '✗', done: '✅', error: '✗' }
  const pad = (s, n) => String(s).padEnd(n)

  console.log(`\n🎭  ${manifest.album} — Pipeline Status\n`)
  console.log(`  ${'#'.padStart(2)}  ${'Title'.padEnd(42)}  ${'Lyrics'.padEnd(10)}  ${'Music'.padEnd(14)}  ${'Art'.padEnd(5)}  ${'Story'.padEnd(6)}  ${'Scores'.padEnd(7)}  Audio`)
  console.log('  ' + '─'.repeat(110))

  for (const track of tracks) {
    const e    = state[trackSlug(track)] ?? {}
    const lSt  = e.lyricsStatus ?? 'none'
    const mSt  = e.musicStatus  ?? 'none'
    const aSt  = e.songArtStatus ?? 'none'
    const stSt = e.storyStatus  ?? 'none'
    const scSt = e.scoresStatus ?? 'none'
    const audio = e.localAudioPaths?.length ? `${e.localAudioPaths.length} file(s)` : '—'

    const row = [
      `  ${String(track.number).padStart(2)}.`,
      pad(track.title, 42),
      `${icons[lSt] ?? '?'} ${pad(lSt, 8)}`,
      `${icons[mSt] ?? '?'} ${pad(mSt, 12)}`,
      `${icons[aSt] ?? '?'} ${pad(aSt, 3)}`,
      `${icons[stSt] ?? '?'} ${pad(stSt, 4)}`,
      `${icons[scSt] ?? '?'} ${pad(scSt, 5)}`,
      audio,
    ].join('  ')
    console.log(row)
  }
  console.log()
}

// ─── --reset ──────────────────────────────────────────────────────────────────
function runReset() {
  if (fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2), 'utf-8')
    log('✓ Pipeline state cleared.')
  } else {
    log('Nothing to reset.')
  }
}

// ─── Dry run ──────────────────────────────────────────────────────────────────
function runDryRun(tracks) {
  const manifest = loadManifest()
  console.log(`\n🎭  DRY RUN — ${manifest.album}  (${tracks.length} track(s))\n`)
  console.log(`Album dir: ${ALBUM_DIR}`)
  console.log('─'.repeat(80))
  for (const track of tracks) {
    const prompt = buildLyricsApiPrompt(track)
    console.log(`\n▶  [${track.number}] "${track.title}"  (vocal: ${track.vocalGender === 'f' ? 'female' : 'male'})`)
    console.log(`   Lyrics prompt (${prompt.length} chars): "${prompt}"`)
    console.log(`   Music params: model=V5_5, styleWeight=0.75, weirdness=0.65`)
    console.log(`   Song art prompt: ${track.visualPrompt?.slice(0, 80)}…`)
  }
  console.log('\n─'.repeat(80))
  console.log(`\nStages:`)
  console.log('  --music        Submit lyrics jobs (stage 1a)')
  console.log('  --poll-lyrics  Poll lyrics, auto-select best (stage 1b)')
  console.log('  --poll-music   Submit music jobs (stage 1c) → poll & download (stage 1d)')
  console.log('  --stories      Generate prose stories via Claude API (stage 2)')
  console.log('  --book         Render PDF books via Puppeteer (stage 3)')
  console.log('  --scores       AI score pipeline per track (stage 4)')
  console.log('  --visuals      KIE.AI Flux song art + album cover (stage 5)')
  console.log('  --transcribe   Whisper timestamps for karaoke (stage 6)')
  console.log('  --karaoke      Render Remotion lyric videos (stage 7)')
  console.log('  --publish      Update songs.json + albums.json (stage 8)')
  console.log('  --all          Runs all stages 1–8 sequentially\n')
}

// ─── Full pipeline ────────────────────────────────────────────────────────────
async function runAll(tracks) {
  log('═══ FULL PIPELINE START ═══')
  await runLyrics(tracks)
  log('\nWaiting 10s before polling lyrics…'); await sleep(10_000)
  await runPollLyrics(tracks)
  await runMusic(tracks)
  log('\nWaiting 10s before polling music…'); await sleep(10_000)
  await runPollMusic(tracks)
  await runStories(tracks)
  await runBook(tracks)
  await runVisuals(tracks)
  await runScores(tracks)
  await runTranscribe(tracks)
  await runKaraoke(tracks)
  await runPublish(tracks)
  log('\n🎉 FULL PIPELINE COMPLETE.')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  for (const d of [ALBUM_DIR, LYRICS_DIR, GEN_DIR, AUDIO_DIR, LOGS_DIR,
    SONG_ART_DIR, ALBUM_COVER_DIR, TIMESTAMPS_DIR, STORIES_SRC_DIR, BOOKS_DIR, SCORES_DIR]) {
    fs.mkdirSync(d, { recursive: true })
  }

  if (STAGE_RESET) { runReset(); return }

  const manifest = loadManifest()
  const all      = manifest.tracks ?? []
  const tracks   = TRACK_ARG ? all.filter(t => t.number === TRACK_ARG) : all

  if (TRACK_ARG && !tracks.length) { err(`Track ${TRACK_ARG} not found.`); process.exit(1) }
  if (STAGE_LIST)       { runList(tracks); return }
  if (STAGE_MUSIC)      { await runLyrics(tracks); return }
  if (STAGE_POLL_LYR)   { await runPollLyrics(tracks); return }
  if (STAGE_POLL_MUS)   { await runMusic(tracks); await sleep(5000); await runPollMusic(tracks); return }
  if (STAGE_STORIES)    { await runStories(tracks); return }
  if (STAGE_BOOK)       { await runBook(tracks); return }
  if (STAGE_SCORES)     { await runScores(tracks); return }
  if (STAGE_VISUALS)    { await runVisuals(tracks); return }
  if (STAGE_TRANSCRIBE) { await runTranscribe(tracks); return }
  if (STAGE_KARAOKE)    { await runKaraoke(tracks); return }
  if (STAGE_PUBLISH)    { await runPublish(tracks); return }
  if (STAGE_ALL)        { await runAll(tracks); return }

  runDryRun(tracks)
}

main().catch(e => {
  err(e.message)
  if (process.env.DEBUG) console.error(e.stack)
  process.exit(1)
})
