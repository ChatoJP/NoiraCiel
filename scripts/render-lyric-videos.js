#!/usr/bin/env node
/**
 * render-lyric-videos.js
 *
 * Renders a cinematic lyric video for each NoiraCiel song using Remotion.
 * Reads lyrics from Music/*.txt, durations from audio metadata.
 * Output: public/Videos/lyrics/{slug}.mp4
 *
 * USAGE
 *   node scripts/render-lyric-videos.js              # render all songs
 *   node scripts/render-lyric-videos.js --track why  # single track by slug
 *   node scripts/render-lyric-videos.js --list       # list tracks + status
 *   node scripts/render-lyric-videos.js --concurrency 2  # parallel renders
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { bundle }        = require('@remotion/bundler')
const { renderMedia, selectComposition, getCompositions } = require('@remotion/renderer')

const MUSIC_DIR   = path.join(__dirname, '..', 'Music')
const OUTPUT_DIR  = path.join(__dirname, '..', 'public', 'Videos', 'lyrics')
const ENTRY_POINT = path.join(__dirname, '..', 'src', 'remotion', 'index.ts')
const PUBLIC_DIR  = path.join(__dirname, '..', 'public')

const FPS = 30
const WIDTH = 1920
const HEIGHT = 1080

const SUPPORTED = /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i

// Chapter emotional context (mirrors SongChapterPage.tsx CHAPTER_CONTEXT)
const CHAPTER_EMOTIONS = {
  1:  'The lifelong question — searching for meaning that was always already there.',
  2:  'The hollowness of achievement when it costs us the people we love.',
  3:  'The invisible inheritance — what our ancestors planted in us without us knowing.',
  4:  'The weight of words never spoken — how silence can be its own kind of violence.',
  5:  'Dignity in honest work — the beauty of a life lived through labour and love.',
  6:  'The grace of companionship — walking the same road without needing to speak.',
  7:  "A parent's silent vigil — the love that asks for nothing, only safety.",
  8:  'Recognition — looking back and seeing the love that was always present, just unnamed.',
  9:  'The phone call that changes the quality of darkness — someone always present.',
  10: "The family home as a living thing — how spaces hold the memory of those who loved them.",
  11: 'The tenderness of simplicity — a life lived without alternatives, full of its own grace.',
  12: "The lit window as love's most silent language — a mother's vigil made visible.",
  13: 'Grief that has found its proper place — the presence of the absent, held with dignity.',
  14: 'Patience as a radical act — the dignity of slow, deliberate growth over time.',
  15: 'The courage of revision — the grace of returning to say what you should have said.',
  16: 'Gratitude for the unearned gift of extra time — afternoons that feel like grace.',
  17: 'Freedom as clarity — the liberation that comes from speaking truthfully, whatever the cost.',
}

const log  = (m) => console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`)
const err  = (m) => console.error(`[${new Date().toISOString().slice(11,19)}] ✗  ${m}`)

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ─── Load tracks ──────────────────────────────────────────────────────────────
async function loadTracks() {
  const files = fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED.test(f)).sort()
  const tracks = []

  for (const filename of files) {
    const noExt = filename.replace(SUPPORTED, '')
    const m = noExt.match(/^([a-z]+)_(\d+)\s*[-\s]+(.+)$/i)
    const trackNumber = m ? parseInt(m[2], 10) : null
    const title = m ? m[3].trim() : noExt.trim()
    const slug = slugify(title)

    // Read lyrics
    const txtPath = path.join(MUSIC_DIR, filename.replace(SUPPORTED, '.txt'))
    const lyrics = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf-8').trim() : null

    // Get duration from audio metadata
    let duration = null
    try {
      const mm = require('music-metadata')
      const meta = await mm.parseFile(path.join(MUSIC_DIR, filename), { duration: true })
      duration = meta.format.duration ?? null
    } catch {}

    // Song art path (relative to public/)
    const artFilename = `Images/song-art/${slug}.jpg`
    const artPath = path.join(PUBLIC_DIR, artFilename)
    const songArtPath = fs.existsSync(artPath) ? artFilename : null

    // Audio URL — file:// URI for Remotion's Chrome renderer
    const audioAbsPath = path.join(MUSIC_DIR, filename).replace(/\\/g, '/')
    const audioUrl = `file:///${audioAbsPath}`

    tracks.push({
      slug,
      title,
      trackNumber,
      filename,
      lyrics,
      duration,
      songArtPath,
      audioUrl,
      chapterEmotion: trackNumber ? CHAPTER_EMOTIONS[trackNumber] ?? null : null,
      outputPath: path.join(OUTPUT_DIR, `${slug}.mp4`),
    })
  }

  return tracks.sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999))
}

// ─── List ─────────────────────────────────────────────────────────────────────
function runList(tracks) {
  console.log('\n🎬  Lyric video status:\n')
  for (const t of tracks) {
    const exists = fs.existsSync(t.outputPath)
    const sym = exists ? '✅' : t.lyrics ? '○' : '⚠ '
    const dur = t.duration ? `${Math.round(t.duration)}s` : 'unknown'
    const stanzas = t.lyrics ? t.lyrics.split(/\n\s*\n/).filter(Boolean).length : 0
    console.log(`  ${sym}  ${String(t.trackNumber ?? '?').padStart(2)}. ${t.title.padEnd(40)} [${dur} · ${stanzas} stanzas · art: ${t.songArtPath ? '✓' : '✗'}]`)
  }
  console.log()
}

// ─── Render one track ─────────────────────────────────────────────────────────
async function renderTrack(track, bundleLocation) {
  const duration = track.duration ?? 180  // fallback to 3 minutes
  const durationInFrames = Math.round(duration * FPS)

  log(`🎬  "${track.title}" — ${Math.round(duration)}s · ${durationInFrames} frames`)

  const inputProps = {
    trackTitle: track.title,
    trackNumber: track.trackNumber,
    albumTitle: 'The Life Lessons I Hope You Learn',
    lyrics: track.lyrics ?? '',
    songArtPath: track.songArtPath,
    chapterEmotion: track.chapterEmotion,
    audioUrl: track.audioUrl,
  }

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'LyricVideo',
    inputProps,
  })

  // Override duration to match song
  composition.durationInFrames = durationInFrames

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: track.outputPath,
    inputProps,
    fps: FPS,
    imageFormat: 'jpeg',
    jpegQuality: 85,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r  Progress: ${Math.round(progress * 100)}%   `)
    },
    chromiumOptions: {
      disableWebSecurity: true,  // allow loading local staticFiles
    },
    timeoutInMilliseconds: 60 * 60 * 1000,  // 1 hour timeout
  })

  console.log(`\r  ✓ Rendered to ${path.relative(process.cwd(), track.outputPath)}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)
  const trackArg = (() => { const i = args.indexOf('--track'); return i !== -1 ? args[i + 1] : null })()
  const listMode = args.includes('--list')
  const forceMode = args.includes('--force')

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  log('Loading track list…')
  const allTracks = await loadTracks()
  const tracks = trackArg ? allTracks.filter((t) => t.slug === trackArg) : allTracks

  if (trackArg && !tracks.length) {
    err(`Track "${trackArg}" not found. Valid slugs: ${allTracks.map(t => t.slug).join(', ')}`)
    process.exit(1)
  }

  if (listMode) { runList(tracks); return }

  // Filter: skip tracks without lyrics
  const renderable = tracks.filter((t) => {
    if (!t.lyrics) { log(`⚠  "${t.title}" — no lyrics, skipping`); return false }
    if (!forceMode && fs.existsSync(t.outputPath)) { log(`⏭  "${t.title}" — already rendered`); return false }
    return true
  })

  if (renderable.length === 0) {
    log('Nothing to render. Use --force to re-render existing videos.')
    return
  }

  log(`Bundling Remotion composition…`)
  const bundleLocation = await bundle({
    entryPoint: ENTRY_POINT,
    // Allow importing files from public/ via staticFile()
    webpackOverride: (config) => {
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.join(__dirname, '..', 'src'),
      }
      return config
    },
    publicDir: PUBLIC_DIR,
  })
  log(`Bundle ready.`)

  let rendered = 0
  for (const track of renderable) {
    try {
      await renderTrack(track, bundleLocation)
      rendered++
    } catch (e) {
      err(`"${track.title}" failed: ${e.message}`)
    }
  }

  log(`\n✅  Rendered ${rendered}/${renderable.length} lyric video(s).`)
  log(`Output: public/Videos/lyrics/`)
}

main().catch((e) => { err(e.message); console.error(e); process.exit(1) })
