#!/usr/bin/env node
'use strict'
/**
 * render-missing-videos-local.js
 * Run this on your local machine, never on the production VPS — rendering
 * (Remotion/Chrome, ffmpeg) is CPU-heavy and the VPS is intentionally kept
 * lean. R2 is the only permanent media store; this script downloads only
 * what a given render needs, renders it locally, uploads the result, and
 * cleans up its own temp files.
 *
 * Discovers every song missing a video asset, builds a resumable queue,
 * and renders one asset at a time by calling the existing, already-working
 * renderers as subprocesses — it does not reimplement rendering itself:
 *   - karaoke (lyrics tracks only)      -> scripts/render-karaoke-generic.js
 *   - film, hasLyrics=true              -> scripts/generate-slideshow-video.js --type film
 *   - film, hasLyrics=false             -> scripts/render-motion-film.js   (abstract motion visuals)
 *   - living_artwork (any track)        -> scripts/generate-slideshow-video.js --type cinemagraph
 *
 * Tracks without lyrics NEVER get a karaoke video — per the project's
 * explicit rule, instrumental tracks (Party People, locally-ingested
 * instrumentals) get abstract motion visuals instead, never fake lyrics
 * or an empty karaoke template.
 *
 * Usage:
 *   node scripts/media/render-missing-videos-local.js --dry-run
 *   node scripts/media/render-missing-videos-local.js
 *   node scripts/media/render-missing-videos-local.js --album salt-cathedral
 *   node scripts/media/render-missing-videos-local.js --song it-was-already-there
 *   node scripts/media/render-missing-videos-local.js --type karaoke
 *   node scripts/media/render-missing-videos-local.js --type film
 *   node scripts/media/render-missing-videos-local.js --type living_artwork
 *   node scripts/media/render-missing-videos-local.js --limit 5
 *   node scripts/media/render-missing-videos-local.js --resume
 *   node scripts/media/render-missing-videos-local.js --force
 */

const fs   = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const r2 = require('../lib/r2-client')

const ROOT = path.join(__dirname, '..', '..')
const CATALOGUE_PATH = path.join(ROOT, 'public', 'music-catalogue.json')
const CINEMAGRAPHS_MANIFEST = path.join(ROOT, 'public', 'generated', 'kie', 'cinemagraphs-manifest.json')
const TIMESTAMPS_DIR = path.join(ROOT, 'public', 'Lyrics', 'timestamps')

const QUEUE_DIR    = path.join(ROOT, 'render-queue')
const QUEUE_FILE   = path.join(QUEUE_DIR, 'missing-videos-queue.json')
const STATUS_FILE  = path.join(QUEUE_DIR, 'missing-videos-status.json')

const KARAOKE_SCRIPT     = path.join(ROOT, 'scripts', 'render-karaoke-generic.js')
const SLIDESHOW_SCRIPT   = path.join(ROOT, 'scripts', 'generate-slideshow-video.js')
const MOTION_FILM_SCRIPT = path.join(ROOT, 'scripts', 'render-motion-film.js')

// ─── CLI args ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const has = (name) => argv.includes(`--${name}`)
const arg = (name, def = null) => { const i = argv.indexOf(`--${name}`); return i === -1 ? def : argv[i + 1] }

const DRY_RUN     = has('dry-run')
const RESUME      = has('resume')
const FORCE       = has('force')
const ALBUM_FILTER = arg('album')
const SONG_FILTER  = arg('song')
const TYPE_FILTER  = arg('type') // karaoke | film | living_artwork
const LIMIT        = arg('limit') ? parseInt(arg('limit'), 10) : Infinity
const CONCURRENCY  = arg('concurrency') ? parseInt(arg('concurrency'), 10) : 1

const ts = () => new Date().toISOString().slice(11, 19)
const log  = (m) => console.log(`[${ts()}] ${m}`)
const warn = (m) => console.warn(`[${ts()}] ⚠  ${m}`)
const err  = (m) => console.error(`[${ts()}] ✗  ${m}`)

function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return fallback }
}
function writeJSONAtomic(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const tmp = `${p}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  JSON.parse(fs.readFileSync(tmp, 'utf-8')) // catch a truncated write before it overwrites anything
  fs.renameSync(tmp, p)
}

// ─── Discovery ─────────────────────────────────────────────────────────────────
function buildQueue() {
  const catalogue = readJSON(CATALOGUE_PATH, { tracks: [] })
  const cinemagraphSlugs = new Set(readJSON(CINEMAGRAPHS_MANIFEST, []))

  const queue = []

  for (const track of catalogue.tracks) {
    if (ALBUM_FILTER && track.albumSlug !== ALBUM_FILTER) continue
    if (SONG_FILTER && track.slug !== SONG_FILTER) continue
    if (!track.audioUrl) continue // nothing to render from

    const albumTitle = track.album ?? track.albumSlug
    const base = {
      albumTitle, albumSlug: track.albumSlug,
      songTitle: track.title, songSlug: track.slug,
      trackNumber: track.trackNumber,
      sourceAudioUrl: track.audioUrl,
      sourceImageUrl: track.chapterBannerUrl ?? track.songArtUrl ?? null,
    }

    // ── karaoke — lyrics tracks only ──
    if ((!TYPE_FILTER || TYPE_FILTER === 'karaoke') && track.hasLyrics) {
      if (FORCE || !track.lyricVideoUrl) {
        const timestampsPath = path.join(TIMESTAMPS_DIR, `${track.slug}.json`)
        const hasTimestamps = fs.existsSync(timestampsPath)
        queue.push({
          ...base,
          assetType: 'karaoke',
          lyricsTimestampsPath: hasTimestamps ? timestampsPath : null,
          outputFilename: `${track.slug}.mp4`,
          r2TargetKey: `Videos/lyrics/${track.slug}.mp4`,
          r2TargetUrl: null,
          status: hasTimestamps ? 'pending' : 'blocked',
          error: hasTimestamps ? null : 'missing timestamps — run: python3 scripts/transcribe-songs.py ' + track.slug + ' --dir <local audio folder>',
        })
      }
    }

    // ── film — every track, generator depends on hasLyrics ──
    if (!TYPE_FILTER || TYPE_FILTER === 'film') {
      if (FORCE || !track.musicVideoUrl) {
        queue.push({
          ...base,
          assetType: 'film',
          renderer: track.hasLyrics ? 'photo-ken-burns' : 'motion-film',
          outputFilename: `${track.slug}.mp4`,
          r2TargetKey: `generated/kie/music-videos/${track.slug}.mp4`,
          r2TargetUrl: null,
          status: 'pending',
          error: null,
        })
      }
    }

    // ── living artwork (cinemagraph) — every track ──
    if (!TYPE_FILTER || TYPE_FILTER === 'living_artwork') {
      const hasCinemagraph = cinemagraphSlugs.has(track.slug)
      if (FORCE || !hasCinemagraph) {
        queue.push({
          ...base,
          assetType: 'living_artwork',
          outputFilename: 'loop.mp4',
          r2TargetKey: `generated/kie/cinemagraphs/${track.slug}/loop.mp4`,
          r2TargetUrl: null,
          status: 'pending',
          error: null,
        })
      }
    }
  }

  return queue
}

// ─── Render dispatch ───────────────────────────────────────────────────────────
function runScript(scriptPath, args) {
  // process.execPath (this same node binary) rather than relying on "node"
  // being resolvable on PATH — works identically on Windows/macOS/Linux.
  execFileSync(process.execPath, [scriptPath, ...args], { stdio: 'inherit' })
}

function renderItem(item) {
  if (item.assetType === 'karaoke') {
    runScript(KARAOKE_SCRIPT, ['--slug', item.songSlug])
  } else if (item.assetType === 'film') {
    if (item.renderer === 'motion-film') {
      runScript(MOTION_FILM_SCRIPT, ['--slug', item.songSlug])
    } else {
      runScript(SLIDESHOW_SCRIPT, ['--slug', item.songSlug, '--type', 'film'])
    }
  } else if (item.assetType === 'living_artwork') {
    runScript(SLIDESHOW_SCRIPT, ['--slug', item.songSlug, '--type', 'cinemagraph'])
  } else {
    throw new Error(`Unknown asset type: ${item.assetType}`)
  }
}

function resultUrlFor(item) {
  const catalogue = readJSON(CATALOGUE_PATH, { tracks: [] })
  const track = catalogue.tracks.find((t) => t.slug === item.songSlug)
  if (!track) return null
  if (item.assetType === 'karaoke') return track.lyricVideoUrl ?? null
  if (item.assetType === 'film') return track.musicVideoUrl ?? null
  if (item.assetType === 'living_artwork') return `${r2.PUBLIC_URL}/generated/kie/cinemagraphs/${item.songSlug}/loop.mp4`
  return null
}

// ─── Main ──────────────────────────────────────────────────────────────────────
function itemKey(item) { return `${item.songSlug}::${item.assetType}` }

async function main() {
  let queue
  if (RESUME && fs.existsSync(QUEUE_FILE)) {
    log('Resuming — reusing existing queue file (not re-scanning the catalogue).')
    queue = readJSON(QUEUE_FILE, [])
  } else {
    queue = buildQueue()
    writeJSONAtomic(QUEUE_FILE, queue)
  }

  const status = readJSON(STATUS_FILE, {})

  const byType = {}
  const byAlbum = {}
  for (const item of queue) {
    byType[item.assetType] = (byType[item.assetType] ?? 0) + 1
    byAlbum[item.albumSlug] = (byAlbum[item.albumSlug] ?? 0) + 1
  }

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log(' Missing video/film discovery')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  Total queue items: ${queue.length}`)
  for (const [type, count] of Object.entries(byType)) console.log(`    ${type}: ${count}`)
  console.log(`  Albums affected: ${Object.keys(byAlbum).length}`)
  for (const [album, count] of Object.entries(byAlbum)) console.log(`    ${album}: ${count}`)
  const blocked = queue.filter((i) => i.status === 'blocked')
  if (blocked.length) {
    console.log(`\n  Blocked (${blocked.length}):`)
    for (const b of blocked.slice(0, 10)) console.log(`    ${b.songSlug} (${b.assetType}) — ${b.error}`)
    if (blocked.length > 10) console.log(`    ... and ${blocked.length - 10} more`)
  }

  console.log('\n  First 10 queue items:')
  for (const item of queue.slice(0, 10)) {
    console.log(`    [${item.assetType}] ${item.albumTitle} — ${item.songTitle} -> ${item.r2TargetKey} (${item.status})`)
  }

  if (DRY_RUN) {
    console.log('\nDry run — no files were downloaded, rendered, or uploaded. Queue written to:')
    console.log(`  ${QUEUE_FILE}`)
    return
  }

  console.log('\n══════════════════════════════════════════════════════════════')
  console.log(` Rendering (concurrency=${CONCURRENCY === 1 ? 1 : CONCURRENCY}, one at a time unless --concurrency passed)`)
  console.log('══════════════════════════════════════════════════════════════\n')

  let processed = 0
  let remaining = queue.filter((i) => i.status !== 'blocked').length
  for (const item of queue) {
    if (processed >= LIMIT) break
    if (item.status === 'blocked') {
      warn(`SKIP (blocked): ${item.songSlug} (${item.assetType}) — ${item.error}`)
      continue
    }

    const key = itemKey(item)
    const prior = status[key]
    if (prior?.status === 'complete' || prior?.status === 'verified') {
      log(`SKIP (already complete): ${item.songSlug} (${item.assetType})`)
      remaining--
      continue
    }
    if (prior?.status === 'failed' && !RESUME && !FORCE) {
      warn(`SKIP (previously failed — pass --resume to retry): ${item.songSlug} (${item.assetType})`)
      continue
    }

    log(`[${processed + 1}] (${remaining} remaining) RENDERING ${item.assetType}: ${item.albumTitle} — ${item.songTitle}`)
    status[key] = { ...item, status: 'rendering', renderStartedAt: new Date().toISOString() }
    writeJSONAtomic(STATUS_FILE, status)

    try {
      renderItem(item)
      const url = resultUrlFor(item)
      status[key] = { ...item, status: 'complete', r2TargetUrl: url, generatedAt: new Date().toISOString(), source: 'local-render-pipeline', error: null }
      writeJSONAtomic(STATUS_FILE, status)
      log(`✓ complete: ${item.songSlug} (${item.assetType}) -> ${url}`)
    } catch (e) {
      status[key] = { ...item, status: 'failed', error: e.message, failedAt: new Date().toISOString() }
      writeJSONAtomic(STATUS_FILE, status)
      err(`STOPPING — render failed for ${item.songSlug} (${item.assetType}): ${e.message}`)
      err(`Status saved. Fix the issue and re-run with --resume to continue from here.`)
      process.exit(1)
    }

    processed++
    remaining--
  }

  console.log(`\nDone. ${processed} asset(s) rendered this run.`)
  console.log(`Status file: ${STATUS_FILE}`)
}

main().catch((e) => { err(e.message); process.exit(1) })
