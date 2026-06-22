#!/usr/bin/env node
/**
 * render-karaoke-jazz-sessions.js
 *
 * Renders karaoke-style lyric videos for NoiraCiel Jazz Sessions.
 * Requires word timestamps from: python scripts/transcribe-songs.py --dir "Music/NoiraCiel Jazz Sessions"
 *
 * USAGE
 *   node scripts/render-karaoke-jazz-sessions.js --track blood-on-the-hallelujah  # one track
 *   node scripts/render-karaoke-jazz-sessions.js                                  # all tracks
 *   node scripts/render-karaoke-jazz-sessions.js --list                           # status
 *   node scripts/render-karaoke-jazz-sessions.js --force                          # re-render
 *   node scripts/render-karaoke-jazz-sessions.js --concurrency 2                  # parallel renders
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const http = require('http')

const { bundle }                         = require('@remotion/bundler')
const { renderMedia, selectComposition } = require('@remotion/renderer')

const MUSIC_DIR      = path.join(__dirname, '..', 'Music', 'NoiraCiel Jazz Sessions')
const TIMESTAMPS_DIR = path.join(__dirname, '..', 'public', 'Lyrics', 'timestamps')
const OUTPUT_DIR     = path.join(__dirname, '..', 'public', 'Videos', 'jazz-sessions-lyrics')
const ENTRY_POINT    = path.join(__dirname, '..', 'src', 'remotion', 'index.ts')
const PUBLIC_DIR     = path.join(__dirname, '..', 'public')
const SONG_ART_DIR   = path.join(PUBLIC_DIR, 'Images', 'song-art')
const BANNER_DIR     = path.join(PUBLIC_DIR, 'Images', 'chapter-banners')
const BG_IMAGES_DIR  = path.join(PUBLIC_DIR, 'Images', 'video-backgrounds-jazz')

const FPS    = 30
const WIDTH  = 1920
const HEIGHT = 1080

const SUPPORTED = /\.(wav|mp3|flac|aiff?|m4a|ogg)$/i

// Emotional context for each Jazz Sessions track
const CHAPTER_EMOTIONS = {
  'blood-on-the-hallelujah':       'Forgiveness as rupture — not gentle, not clean, but necessary as breath.',
  'carry-you-home':                'The steadier country inside the storm. Carrying someone home is the oldest form of love.',
  'its-not-always-easy':           'Recognition without flinching. The courage it takes to stay when staying costs something.',
  'keep-a-chair-for-you':          'A table kept. A place held. The faithfulness that asks nothing and waits.',
  'mercy-wears-a-black-coat':      'Mercy that cuts open what needs cutting — dressed not in white, but in honest dark.',
  'the-heart-comes-home-at-night': 'The nocturnal reckoning. What the heart carries back when the city finally quiets.',
  'the-river-knows-your-name':     'The places that remember you when you have forgotten yourself.',
  'the-truth-has-teeth':           'Precision, not cruelty. The truth that bites is the one that frees.',
  'the-woman-beside-the-fire':     'The quiet architect of everything. Seen at last, after the fire has burned long enough.',
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
        const ext  = path.extname(filename).toLowerCase()
        const mime = ext === '.mp3' ? 'audio/mpeg' : ext === '.wav' ? 'audio/wav' : 'audio/mpeg'
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
            'Content-Type':   mime,
          })
          fs.createReadStream(filePath, { start, end }).pipe(res)
        } else {
          res.writeHead(200, {
            'Content-Type':   mime,
            'Content-Length': stat.size,
            'Accept-Ranges':  'bytes',
          })
          fs.createReadStream(filePath).pipe(res)
        }
      } catch { res.writeHead(500); res.end() }
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

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

function loadBgImagePool() {
  if (!fs.existsSync(BG_IMAGES_DIR)) return []
  return fs.readdirSync(BG_IMAGES_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => `Images/video-backgrounds-jazz/${f}`)
    .sort()
}

function pickBgImages(pool, slug, count = 80) {
  if (!pool.length) return []
  let h = 0
  for (const c of slug) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
  h = Math.abs(h)
  const result = []
  for (let i = 0; i < count; i++) result.push(pool[(h + i * 73) % pool.length])
  return result
}

// ─── Load tracks ──────────────────────────────────────────────────────────────
async function loadTracks(musicServerPort) {
  const audioFiles = fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED.test(f)).sort()
  const tracks = []

  for (const filename of audioFiles) {
    const noExt = filename.replace(SUPPORTED, '')
    // Plain title → slug: "Blood on the Hallelujah" → "blood-on-the-hallelujah"
    const slug  = slugify(noExt)
    const title = noExt.trim()

    const tsFile = path.join(TIMESTAMPS_DIR, `${slug}.json`)
    const tsData = fs.existsSync(tsFile) ? JSON.parse(fs.readFileSync(tsFile, 'utf-8')) : null
    const lines  = tsData ? groupIntoLines(tsData.words) : []

    const audioUrl = `http://127.0.0.1:${musicServerPort}/${encodeURIComponent(filename)}`

    const songArtPath    = fs.existsSync(path.join(SONG_ART_DIR, `${slug}.jpg`))
      ? `Images/song-art/${slug}.jpg` : null
    const chapterBannerPath = fs.existsSync(path.join(BANNER_DIR, `${slug}.jpg`))
      ? `Images/chapter-banners/${slug}.jpg` : null

    const bgPool   = loadBgImagePool()
    const bgImages = bgPool.length > 0
      ? pickBgImages(bgPool, slug, 80)
      : [chapterBannerPath, songArtPath].filter(Boolean)

    let duration = tsData?.duration ?? null
    if (!duration) {
      try {
        const mm = require('music-metadata')
        const meta = await mm.parseFile(path.join(MUSIC_DIR, filename), { duration: true })
        duration = meta.format.duration ?? null
      } catch {}
    }

    tracks.push({
      slug, title, filename,
      lines, audioUrl, duration,
      songArtPath, chapterBannerPath, bgImages,
      hasTimestamps:  !!tsData,
      chapterEmotion: CHAPTER_EMOTIONS[slug] ?? null,
      outputPath:     path.join(OUTPUT_DIR, `${slug}.mp4`),
    })
  }

  return tracks.sort((a, b) => a.title.localeCompare(b.title))
}

// ─── List ─────────────────────────────────────────────────────────────────────
function runList(tracks) {
  console.log('\n🎷  Jazz Sessions karaoke video status:\n')
  for (const t of tracks) {
    const rendered = fs.existsSync(t.outputPath)
    const sym  = rendered ? '✅' : t.hasTimestamps ? '○' : '⚠ '
    const info = [
      t.hasTimestamps ? `${t.lines.length} lines` : 'NO TIMESTAMPS',
      t.songArtPath ? 'art ✓' : 'art ✗',
      `${t.bgImages?.length ?? 0} bg`,
    ].join(' · ')
    console.log(`  ${sym}  ${t.title.padEnd(44)} [${info}]`)
  }
  console.log('\n  ⚠  = missing timestamps — run:')
  console.log('       python scripts/transcribe-songs.py --dir "Music/NoiraCiel Jazz Sessions"\n')
}

// ─── Render one track ─────────────────────────────────────────────────────────
async function renderTrack(track, bundleLocation) {
  const duration         = track.duration ?? 240
  const durationInFrames = Math.round(duration * FPS)

  log(`🎷  "${track.title}" — ${Math.round(duration)}s · ${track.lines.length} lines`)

  const inputProps = {
    trackTitle:        track.title,
    trackNumber:       null,
    albumTitle:        'NoiraCiel Jazz Sessions',
    audioUrl:          track.audioUrl,
    songArtPath:       track.songArtPath,
    chapterBannerPath: track.chapterBannerPath,
    chapterEmotion:    track.chapterEmotion,
    lines:             track.lines,
    bgImages:          track.bgImages ?? [],
  }

  const composition = await selectComposition({
    serveUrl:   bundleLocation,
    id:         'KaraokeVideo',
    inputProps,
  })
  composition.durationInFrames = durationInFrames

  fs.mkdirSync(path.dirname(track.outputPath), { recursive: true })

  await renderMedia({
    composition,
    serveUrl:        bundleLocation,
    codec:           'h264',
    outputLocation:  track.outputPath,
    inputProps,
    fps:             FPS,
    imageFormat:     'jpeg',
    jpegQuality:     88,
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
  let rendered = 0, failed = 0
  const queue = [...tracks]
  async function worker(id) {
    while (true) {
      const track = queue.shift()
      if (!track) break
      try { await renderTrack(track, bundleLocation); rendered++ }
      catch (e) { err(`[worker ${id}] "${track.title}" failed: ${e.message}`); failed++ }
    }
  }
  log(`Rendering ${tracks.length} video(s) with concurrency ${concurrency}…`)
  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)))
  return { rendered, failed }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args       = process.argv.slice(2)
  const trackArg   = (() => { const i = args.indexOf('--track'); return i !== -1 ? args[i + 1] : null })()
  const listMode   = args.includes('--list')
  const forceMode  = args.includes('--force')
  const concurrencyArg = (() => { const i = args.indexOf('--concurrency'); return i !== -1 ? parseInt(args[i + 1], 10) : null })()
  const concurrency = concurrencyArg && concurrencyArg > 0 ? concurrencyArg : 3

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const { server: musicServer, port: musicPort } = await startMusicServer(MUSIC_DIR)
  log(`Music server listening on http://127.0.0.1:${musicPort}/`)

  log('Loading tracks…')
  const allTracks = await loadTracks(musicPort)
  const tracks = trackArg
    ? allTracks.filter((t) => t.slug.includes(trackArg) || t.title.toLowerCase().includes(trackArg.toLowerCase()))
    : allTracks

  if (trackArg && !tracks.length) {
    err(`No tracks matched "${trackArg}". Slugs: ${allTracks.map((t) => t.slug).join(', ')}`)
    musicServer.close()
    process.exit(1)
  }

  if (listMode) { runList(tracks); musicServer.close(); return }

  const renderable = tracks.filter((t) => {
    if (!t.hasTimestamps) {
      log(`⚠  "${t.title}" — no timestamps. Run: python scripts/transcribe-songs.py --dir "Music/NoiraCiel Jazz Sessions"`)
      return false
    }
    if (!forceMode && fs.existsSync(t.outputPath)) {
      log(`⏭  "${t.title}" — already rendered`)
      return false
    }
    return true
  })

  if (!renderable.length) {
    log('Nothing to render. Transcribe first with: python scripts/transcribe-songs.py --dir "Music/NoiraCiel Jazz Sessions"')
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
  log(`\n✅  Done — ${rendered} rendered, ${failed} failed → public/Videos/jazz-sessions-lyrics/`)
  musicServer.close()
}

main().catch((e) => { err(e.message); console.error(e); process.exit(1) })
