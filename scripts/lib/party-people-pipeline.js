'use strict'
/**
 * party-people-pipeline.js
 * Manifest-driven generation pipeline for NoiraCiel Party People — the
 * instrumental dance/club sub-brand. Deliberately a separate module from
 * concept-album-pipeline.js (not a shared abstraction) because the music
 * submission is instrumental-only (no lyrics, negativeTags against vocals)
 * and assets live under a separate R2 namespace (party-people/ instead of
 * music/) so this section stays cleanly distinct from the main catalogue.
 *
 * Same hard rule as the main pipeline: one asset at a time, generate ->
 * download to temp -> upload to R2 -> verify -> update status -> delete
 * temp -> only then move to the next asset. Any upload/verification
 * failure stops the batch rather than continuing past it.
 */

const fs   = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const r2   = require('./r2-client')
const kie  = require('./kie-client')

const ROOT       = path.join(__dirname, '..', '..')
const ALBUMS_DIR = path.join(ROOT, 'data', 'party-people')
const TMP_DIR    = path.join(ROOT, '.tmp', 'party-people')

kie.loadEnv()
r2.loadEnv()

function albumDir(slug) {
  return path.join(ALBUMS_DIR, slug)
}

function loadConcept(slug) {
  return JSON.parse(fs.readFileSync(path.join(albumDir(slug), 'concept.json'), 'utf-8'))
}

function loadTracks(slug) {
  return JSON.parse(fs.readFileSync(path.join(albumDir(slug), 'tracks.json'), 'utf-8'))
}

function statusPath(slug) {
  return path.join(albumDir(slug), 'status.json')
}

function loadStatus(slug) {
  const fp = statusPath(slug)
  if (!fs.existsSync(fp)) return {}
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) } catch { return {} }
}

function saveStatus(slug, status) {
  r2.atomicWriteJSON(statusPath(slug), status)
}

function ensureStatus(slug) {
  const tracks = loadTracks(slug)
  const status = loadStatus(slug)
  let changed = false
  for (const t of tracks) {
    if (!status[t.slug]) {
      status[t.slug] = {
        num: t.num,
        stage: 'metadata_generated',
        music: { taskId: null, state: 'none', audioUrl: null, r2Key: null, duration: null, durationFormatted: '' },
        trackArt: { taskId: null, state: 'none', r2Key: null, url: null },
        banner: { taskId: null, state: 'none', r2Key: null, url: null },
        error: null,
        updatedAt: new Date().toISOString(),
      }
      changed = true
    }
  }
  if (changed) saveStatus(slug, status)
  return status
}

function touch(entry) {
  entry.updatedAt = new Date().toISOString()
  return entry
}

function probeDurationSeconds(filePath) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
  ], { encoding: 'utf-8' })
  return parseFloat(out.trim())
}

function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function truncateStyle(style, max = 200) {
  if (style.length <= max) return style
  const cut = style.slice(0, max)
  const lastComma = cut.lastIndexOf(',')
  return (lastComma > max * 0.5 ? cut.slice(0, lastComma) : cut).trim()
}

// ─── Music (Suno V4, instrumental) ────────────────────────────────────────────
const MUSIC_POLL_INTERVAL_MS = 15_000
const MUSIC_POLL_TIMEOUT_MS  = 10 * 60 * 1000

async function runMusicForTrack(albumSlug, track, status) {
  const concept = loadConcept(albumSlug)
  const entry = status[track.slug]
  if (entry.music.state === 'complete') return { ok: true, skipped: true }

  if (entry.music.state === 'failed') {
    entry.music.taskId = null
    entry.music.state = 'none'
  }

  fs.mkdirSync(TMP_DIR, { recursive: true })

  if (!entry.music.taskId) {
    r2.log(`[music] ${track.title} — submitting instrumental Suno job`)
    const structuralPrompt = `Instrumental ${concept.genre} track. ${track.arrangementPrompt}`.slice(0, 2000)
    const taskId = await kie.submitMusicJob({
      lyrics: structuralPrompt,
      style: truncateStyle(track.stylePrompt),
      title: track.title,
      instrumental: true,
      negativeTags: (concept.negativeTags || []).join(', '),
    })
    entry.music.taskId = taskId
    entry.music.state = 'pending'
    status[track.slug] = touch(entry)
    saveStatus(albumSlug, status)
  }

  const deadline = Date.now() + MUSIC_POLL_TIMEOUT_MS
  let result = null
  while (Date.now() < deadline) {
    await kie.sleep(MUSIC_POLL_INTERVAL_MS)
    result = await kie.pollMusicJob(entry.music.taskId)
    if (result.done) break
    r2.log(`[music] ${track.title} — still rendering…`)
  }

  if (!result || !result.done) {
    entry.error = 'music generation timed out'
    status[track.slug] = touch(entry)
    saveStatus(albumSlug, status)
    return { ok: false, error: entry.error }
  }
  if (result.failed) {
    entry.music.state = 'failed'
    entry.error = 'Suno job failed'
    status[track.slug] = touch(entry)
    saveStatus(albumSlug, status)
    return { ok: false, error: entry.error }
  }

  const numStr   = String(track.num).padStart(2, '0')
  const tempPath = path.join(TMP_DIR, `${numStr}_${track.slug}.mp3`)
  r2.log(`[music] ${track.title} — downloading rendered audio`)
  await kie.downloadFile(result.audioUrl, tempPath)

  let durationSeconds = null
  try { durationSeconds = probeDurationSeconds(tempPath) } catch (e) { r2.warn(`[music] ffprobe failed: ${e.message}`) }

  const r2Key = `party-people/${concept.dirName}/audio/${numStr}_${track.slug}.mp3`
  r2.log(`[music] ${track.title} — uploading to R2 (${r2Key})`)
  const migration = await r2.migrateFile(tempPath, r2Key, { deleteLocal: true })
  if (!migration.deletedLocal) {
    r2.warn(`[music] ${track.title} — uploaded+verified but local temp file could not be deleted (non-fatal)`)
  }

  entry.music.state = 'complete'
  entry.music.audioUrl = migration.r2Url
  entry.music.r2Key = r2Key
  entry.music.duration = durationSeconds
  entry.music.durationFormatted = formatDuration(durationSeconds)
  entry.stage = 'music_complete'
  entry.error = null
  status[track.slug] = touch(entry)
  saveStatus(albumSlug, status)
  r2.log(`[music] ${track.title} — done ✓ ${migration.r2Url}`)
  return { ok: true, url: migration.r2Url }
}

// ─── Images (Flux Kontext via KIE.AI) ────────────────────────────────────────
const IMAGE_POLL_INTERVAL_MS = 8_000
const IMAGE_POLL_TIMEOUT_MS  = 5 * 60 * 1000

const IMAGE_KIND_CONFIG = {
  trackArt: { aspectRatio: '1:1',  r2Prefix: 'party-people/images/track-art' },
  banner:   { aspectRatio: '16:9', r2Prefix: 'party-people/images/banners' },
}

async function runImageForTrack(albumSlug, track, status, kind) {
  const cfg = IMAGE_KIND_CONFIG[kind]
  if (!cfg) throw new Error(`Unknown image kind: ${kind}`)
  const entry = status[track.slug]
  if (entry[kind].state === 'complete') return { ok: true, skipped: true }

  if (entry[kind].state === 'failed') {
    entry[kind].taskId = null
    entry[kind].state = 'none'
  }

  fs.mkdirSync(TMP_DIR, { recursive: true })

  if (!entry[kind].taskId) {
    r2.log(`[${kind}] ${track.title} — submitting Flux Kontext job`)
    const taskId = await kie.submitImageJob(track.imagePrompt, {
      aspectRatio: cfg.aspectRatio,
      outputFormat: 'jpeg',
      model: 'flux-kontext-pro',
    })
    entry[kind].taskId = taskId
    entry[kind].state = 'pending'
    status[track.slug] = touch(entry)
    saveStatus(albumSlug, status)
  }

  const deadline = Date.now() + IMAGE_POLL_TIMEOUT_MS
  let result = null
  while (Date.now() < deadline) {
    await kie.sleep(IMAGE_POLL_INTERVAL_MS)
    result = await kie.pollImageJob(entry[kind].taskId)
    if (result.done) break
  }

  if (!result || !result.done) {
    entry.error = `${kind} generation timed out`
    status[track.slug] = touch(entry)
    saveStatus(albumSlug, status)
    return { ok: false, error: entry.error }
  }
  if (result.failed) {
    entry[kind].state = 'failed'
    entry.error = `${kind} job failed`
    status[track.slug] = touch(entry)
    saveStatus(albumSlug, status)
    return { ok: false, error: entry.error }
  }

  const tempPath = path.join(TMP_DIR, `${track.slug}-${kind}.jpg`)
  r2.log(`[${kind}] ${track.title} — downloading image`)
  await kie.downloadFile(result.url, tempPath)

  const r2Key = `${cfg.r2Prefix}/${track.slug}.jpg`
  r2.log(`[${kind}] ${track.title} — uploading to R2 (${r2Key})`)
  const migration = await r2.migrateFile(tempPath, r2Key, { deleteLocal: true })

  entry[kind].state = 'complete'
  entry[kind].url = migration.r2Url
  entry[kind].r2Key = r2Key
  entry.error = null
  if (entry.trackArt.state === 'complete' && entry.banner.state === 'complete') {
    entry.stage = 'images_generated'
  }
  status[track.slug] = touch(entry)
  saveStatus(albumSlug, status)
  r2.log(`[${kind}] ${track.title} — done ✓ ${migration.r2Url}`)
  return { ok: true, url: migration.r2Url }
}

module.exports = {
  ALBUMS_DIR, TMP_DIR,
  albumDir, loadConcept, loadTracks, loadStatus, saveStatus, ensureStatus,
  runMusicForTrack, runImageForTrack,
}
