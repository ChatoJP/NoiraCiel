#!/usr/bin/env node
/**
 * render-karaoke.js
 *
 * Renders karaoke-style lyric videos with word-level timing.
 * Requires timestamps from: python scripts/transcribe-songs.py
 *
 * USAGE
 *   node scripts/render-karaoke.js --track why   # render one track
 *   node scripts/render-karaoke.js               # render all tracks
 *   node scripts/render-karaoke.js --list        # show status
 *   node scripts/render-karaoke.js --force       # re-render existing
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const http = require('http')

const { bundle }       = require('@remotion/bundler')
const { renderMedia, selectComposition } = require('@remotion/renderer')

const MUSIC_DIR       = path.join(__dirname, '..', 'Music')
const TIMESTAMPS_DIR  = path.join(__dirname, '..', 'public', 'Lyrics', 'timestamps')
const OUTPUT_DIR      = path.join(__dirname, '..', 'public', 'Videos', 'lyrics')
const ENTRY_POINT     = path.join(__dirname, '..', 'src', 'remotion', 'index.ts')
const PUBLIC_DIR      = path.join(__dirname, '..', 'public')
const SONG_ART_DIR    = path.join(PUBLIC_DIR, 'images', 'song-art')
const BANNER_DIR      = path.join(PUBLIC_DIR, 'images', 'chapter-banners')
const BG_IMAGES_DIR   = path.join(PUBLIC_DIR, 'images', 'video-backgrounds')

const FPS    = 30
const WIDTH  = 1920
const HEIGHT = 1080

const SUPPORTED = /\.(wav|mp3|flac|aiff?|m4a|ogg)$/i

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

const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`)
const err = (m) => console.error(`[${new Date().toISOString().slice(11, 19)}] ✗  ${m}`)

// ─── Local HTTP server for Music/ directory ───────────────────────────────────
function startMusicServer(musicDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const filename = decodeURIComponent(req.url.slice(1))
        const filePath = path.join(musicDir, filename)
        if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return }
        const stat = fs.statSync(filePath)

        // Support range requests (needed for Chrome audio loading)
        const range = req.headers.range
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-')
          const start = parseInt(parts[0], 10)
          const end   = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
          const chunkSize = end - start + 1
          res.writeHead(206, {
            'Content-Range':  `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges':  'bytes',
            'Content-Length': chunkSize,
            'Content-Type':   'audio/wav',
          })
          fs.createReadStream(filePath, { start, end }).pipe(res)
        } else {
          res.writeHead(200, {
            'Content-Type':   'audio/wav',
            'Content-Length': stat.size,
            'Accept-Ranges':  'bytes',
          })
          fs.createReadStream(filePath).pipe(res)
        }
      } catch (e) {
        res.writeHead(500); res.end()
      }
    })
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port })
    })
  })
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

// ─── Group flat word list into display lines ──────────────────────────────────
function groupIntoLines(words, maxGapSec = 1.4, maxWords = 8) {
  const lines = []
  let current = []

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const prev = words[i - 1]

    if (current.length > 0) {
      const gap = prev ? word.start - prev.end : 0
      if (gap > maxGapSec || current.length >= maxWords) {
        lines.push({ words: [...current] })
        current = []
      }
    }

    current.push(word)
  }

  if (current.length > 0) lines.push({ words: current })
  return lines
}

// ─── Load background image pool ───────────────────────────────────────────────
function loadBgImagePool() {
  if (!fs.existsSync(BG_IMAGES_DIR)) return []
  return fs.readdirSync(BG_IMAGES_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => `images/video-backgrounds/${f}`)
    .sort()
}

// Deterministically pick N images from pool for a given track slug
function pickBgImages(pool, slug, count = 5) {
  if (!pool.length) return []
  let h = 0
  for (const c of slug) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
  h = Math.abs(h)
  const result = []
  for (let i = 0; i < count; i++) result.push(pool[(h + i * 73) % pool.length])
  return result
}

// ─── Load all tracks (musicServerPort set after server starts) ────────────────
async function loadTracks(musicServerPort) {
  const audioFiles = fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED.test(f)).sort()
  const tracks = []

  for (const filename of audioFiles) {
    const noExt = filename.replace(SUPPORTED, '')
    const m = noExt.match(/^([a-z]+)_(\d+)\s*[-\s]+(.+)$/i)
    const trackNumber = m ? parseInt(m[2], 10) : null
    const title = m ? m[3].trim() : noExt.trim()
    const slug = slugify(title)

    // Load timestamp file
    const tsFile = path.join(TIMESTAMPS_DIR, `${slug}.json`)
    const tsData = fs.existsSync(tsFile) ? JSON.parse(fs.readFileSync(tsFile, 'utf-8')) : null

    const lines = tsData ? groupIntoLines(tsData.words) : []

    // Audio URL — served via local HTTP server
    const audioUrl = `http://127.0.0.1:${musicServerPort}/${encodeURIComponent(filename)}`

    // Art paths (relative to public/)
    const songArtPath  = fs.existsSync(path.join(SONG_ART_DIR, `${slug}.jpg`))
      ? `images/song-art/${slug}.jpg` : null
    const chapterBannerPath = fs.existsSync(path.join(BANNER_DIR, `${slug}.jpg`))
      ? `images/chapter-banners/${slug}.jpg` : null

    // Background image pool — pick 6 from video-backgrounds pool, fall back to art
    const bgPool = loadBgImagePool()
    const bgImages = bgPool.length > 0
      ? pickBgImages(bgPool, slug, 6)
      : [chapterBannerPath, songArtPath].filter(Boolean)

    // Duration: prefer timestamp data, else read from audio
    let duration = tsData?.duration ?? null
    if (!duration) {
      try {
        const mm = require('music-metadata')
        const meta = await mm.parseFile(path.join(MUSIC_DIR, filename), { duration: true })
        duration = meta.format.duration ?? null
      } catch {}
    }

    tracks.push({
      slug, title, trackNumber, filename,
      lines, audioUrl, duration,
      songArtPath, chapterBannerPath, bgImages,
      hasTimestamps: !!tsData,
      chapterEmotion: trackNumber ? CHAPTER_EMOTIONS[trackNumber] ?? null : null,
      outputPath: path.join(OUTPUT_DIR, `${slug}.mp4`),
    })
  }

  return tracks.sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999))
}

// ─── List ─────────────────────────────────────────────────────────────────────
function runList(tracks) {
  console.log('\n🎬  Karaoke video status:\n')
  for (const t of tracks) {
    const rendered = fs.existsSync(t.outputPath)
    const sym = rendered ? '✅' : t.hasTimestamps ? '○' : '⚠ '
    const info = [
      t.hasTimestamps ? `${t.lines.length} lines` : 'NO TIMESTAMPS',
      t.songArtPath ? 'art ✓' : 'art ✗',
      t.chapterBannerPath ? 'banner ✓' : 'banner ✗',
      `${t.bgImages?.length ?? 0} bg`,
    ].join(' · ')
    console.log(`  ${sym}  ${String(t.trackNumber ?? '?').padStart(2)}. ${t.title.padEnd(42)} [${info}]`)
  }
  console.log('\n  ⚠  = missing timestamps — run: python scripts/transcribe-songs.py\n')
}

// ─── Render one track ─────────────────────────────────────────────────────────
async function renderTrack(track, bundleLocation) {
  const duration = track.duration ?? 180
  const durationInFrames = Math.round(duration * FPS)

  log(`🎬  "${track.title}" — ${Math.round(duration)}s · ${track.lines.length} lines · ${track.lines.reduce((n, l) => n + l.words.length, 0)} words`)

  const inputProps = {
    trackTitle:        track.title,
    trackNumber:       track.trackNumber,
    albumTitle:        'The Life Lessons I Hope You Learn',
    audioUrl:          track.audioUrl,
    songArtPath:       track.songArtPath,
    chapterBannerPath: track.chapterBannerPath,
    chapterEmotion:    track.chapterEmotion,
    lines:             track.lines,
    bgImages:          track.bgImages ?? [],
  }

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'KaraokeVideo',
    inputProps,
  })
  composition.durationInFrames = durationInFrames

  fs.mkdirSync(path.dirname(track.outputPath), { recursive: true })

  await renderMedia({
    composition,
    serveUrl:       bundleLocation,
    codec:          'h264',
    outputLocation: track.outputPath,
    inputProps,
    fps: FPS,
    imageFormat:  'jpeg',
    jpegQuality:  88,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r  Progress: ${Math.round(progress * 100)}%   `)
    },
    chromiumOptions: { disableWebSecurity: true },
    timeoutInMilliseconds: 90 * 60 * 1000,
  })

  const sizeMb = (fs.statSync(track.outputPath).size / 1024 / 1024).toFixed(1)
  console.log(`\r  ✓ Rendered → ${path.relative(process.cwd(), track.outputPath)} (${sizeMb} MB)`)
}

// ─── Concurrent render pool ───────────────────────────────────────────────────
async function renderPool(tracks, bundleLocation, concurrency) {
  let rendered = 0
  let failed   = 0
  const queue  = [...tracks]

  async function worker(id) {
    while (true) {
      const track = queue.shift()
      if (!track) break
      try {
        await renderTrack(track, bundleLocation)
        rendered++
      } catch (e) {
        err(`[worker ${id}] "${track.title}" failed: ${e.message}`)
        failed++
      }
    }
  }

  log(`Rendering ${tracks.length} video(s) with concurrency ${concurrency}…`)
  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)))
  return { rendered, failed }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args        = process.argv.slice(2)
  const trackArg    = (() => { const i = args.indexOf('--track'); return i !== -1 ? args[i + 1] : null })()
  const listMode    = args.includes('--list')
  const forceMode   = args.includes('--force')
  const concurrencyArg = (() => { const i = args.indexOf('--concurrency'); return i !== -1 ? parseInt(args[i + 1], 10) : null })()
  const concurrency = concurrencyArg && concurrencyArg > 0 ? concurrencyArg : 3

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Start local HTTP server to serve Music/ directory (Remotion can't use file://)
  const { server: musicServer, port: musicPort } = await startMusicServer(MUSIC_DIR)
  log(`Music server listening on http://127.0.0.1:${musicPort}/`)

  log('Loading tracks…')
  const allTracks = await loadTracks(musicPort)
  const tracks    = trackArg ? allTracks.filter((t) => t.slug === trackArg) : allTracks

  if (trackArg && !tracks.length) {
    err(`Track "${trackArg}" not found. Valid: ${allTracks.map((t) => t.slug).join(', ')}`)
    process.exit(1)
  }

  if (listMode) { runList(tracks); musicServer.close(); return }

  const renderable = tracks.filter((t) => {
    if (!t.hasTimestamps) {
      log(`⚠  "${t.title}" — no timestamps. Run: python scripts/transcribe-songs.py ${t.slug}`)
      return false
    }
    if (!forceMode && fs.existsSync(t.outputPath)) {
      log(`⏭  "${t.title}" — already rendered`)
      return false
    }
    return true
  })

  if (!renderable.length) {
    log('Nothing to render. Run python scripts/transcribe-songs.py first, or use --force.')
    musicServer.close()
    return
  }

  log('Bundling Remotion composition…')
  const bundleLocation = await bundle({
    entryPoint: ENTRY_POINT,
    webpackOverride: (config) => {
      config.resolve = config.resolve || {}
      config.resolve.alias = { ...config.resolve.alias, '@': path.join(__dirname, '..', 'src') }
      return config
    },
    publicDir: PUBLIC_DIR,
  })
  log('Bundle ready.')

  const { rendered, failed } = await renderPool(renderable, bundleLocation, concurrency)

  log(`\n✅  Done — ${rendered} rendered, ${failed} failed → public/Videos/lyrics/`)
  musicServer.close()
}

main().catch((e) => { err(e.message); console.error(e); process.exit(1) })
