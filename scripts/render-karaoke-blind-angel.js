#!/usr/bin/env node
/**
 * render-karaoke-blind-angel.js
 *
 * Renders karaoke-style lyric videos for The Blind Angel — Intimate Metal Sessions.
 * Requires word timestamps from: python scripts/transcribe-songs.py --album blind-angel
 *
 * USAGE
 *   node scripts/render-karaoke-blind-angel.js --track angel-of-darkness   # one track
 *   node scripts/render-karaoke-blind-angel.js                              # all tracks
 *   node scripts/render-karaoke-blind-angel.js --list                       # status
 *   node scripts/render-karaoke-blind-angel.js --force                      # re-render
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const http = require('http')

const { bundle }                    = require('@remotion/bundler')
const { renderMedia, selectComposition } = require('@remotion/renderer')

const MUSIC_DIR       = path.join(__dirname, '..', 'Music', 'The  Blind Angel - Intimate Metal Sessions')
const TIMESTAMPS_DIR  = path.join(__dirname, '..', 'public', 'Lyrics', 'timestamps')
const OUTPUT_DIR      = path.join(__dirname, '..', 'public', 'Videos', 'blind-angel-lyrics')
const ENTRY_POINT     = path.join(__dirname, '..', 'src', 'remotion', 'index.ts')
const PUBLIC_DIR      = path.join(__dirname, '..', 'public')
const SONG_ART_DIR    = path.join(PUBLIC_DIR, 'Images', 'song-art')
const BANNER_DIR      = path.join(PUBLIC_DIR, 'Images', 'chapter-banners')
const BG_IMAGES_DIR   = path.join(PUBLIC_DIR, 'Images', 'video-backgrounds-metal')

const FPS    = 30
const WIDTH  = 1920
const HEIGHT = 1080

const SUPPORTED = /\.(wav|mp3|flac|aiff?|m4a|ogg)$/i

// Emotional context for each Blind Angel track, keyed by slug
const CHAPTER_EMOTIONS = {
  'noiraciel-angel-of-darkness':          'The other divinity — the kind that rises from ruin, untouched by borrowed certainty.',
  'noiraciel-ashes-of-heaven':            'Every empire of belief comes down to ash. What survives is the willingness to remain.',
  'noiraciel-black-wings-rising':         'The geography of survival — written on the body, entirely and irreversibly one\'s own.',
  'noiraciel-blind-halo':                 'Not every sacred thing is meant to shine outward. Some holiness is interior — invisible, unmistakable.',
  'noiraciel-blood-on-the-halo':          'The moment the holy and the broken meet — choosing, deliberately, not to be ashamed.',
  'noiraciel-broken-wings-burning-soul':  'The wings break. The fire does not go out. Half made of ruin, half made of gold — still rising.',
  'noiraciel-crown-of-fire':              'What is forged from your own suffering cannot be taken. Gold in the ashes.',
  'noiraciel-darkness-made-divine':       'The night stops being the absence of light and becomes its own radiance.',
  'noiraciel-fallen-without-fear':        'Every fall is an arrival. The void clarifies. No mourning — only what fire cannot take.',
  'noiraciel-heaven-burns-tonight':       'When heaven burns it is the loudest thing that has ever happened — and if you are built for it, it is music.',
  'noiraciel-mercy-in-flames':            'Mercy is the most expensive thing — given when it cost nearly everything, and still correct.',
  'noiraciel-no-light-left':              'No light left outside. Something impossibly persistent still burning within.',
  'noiraciel-saint-of-the-damned':        'To be present with the unforgiven not as saviour but as witness — the only holiness worth the name.',
  'noiraciel-sin-of-an-angel':            'The sins that came from somewhere genuinely real — owned like a crown, not carried as shame.',
  'noiraciel-the-devil-knows-my-name':    'Willing at last to be fully known — including the territory no official story has a map for.',
  'noiraciel-when-angels-go-to-war':      'The war is interior. The gravity enormous. I did not fall — I appeared.',
  'noiraciel-the-last-prayer':            'The prayer runs out. What remains on the other side is quieter, less named — and undeniable.',
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
    .map((f) => `Images/video-backgrounds-metal/${f}`)
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
    // "Noiraciel - Angel of Darkness" → slug "noiraciel-angel-of-darkness"
    const slug = slugify(noExt)
    // Title: "Angel of Darkness"
    const m = noExt.match(/^Noiraciel\s*-\s*(.+)$/i)
    const title = m ? m[1].trim() : noExt.trim()

    // Load timestamp file (keyed by full slug)
    const tsFile = path.join(TIMESTAMPS_DIR, `${slug}.json`)
    const tsData = fs.existsSync(tsFile) ? JSON.parse(fs.readFileSync(tsFile, 'utf-8')) : null
    const lines = tsData ? groupIntoLines(tsData.words) : []

    const audioUrl = `http://127.0.0.1:${musicServerPort}/${encodeURIComponent(filename)}`

    // Song art (generated by generate-subalbum-art.js, named with full slug)
    const songArtPath = fs.existsSync(path.join(SONG_ART_DIR, `${slug}.jpg`))
      ? `Images/song-art/${slug}.jpg` : null
    const chapterBannerPath = fs.existsSync(path.join(BANNER_DIR, `${slug}.jpg`))
      ? `Images/chapter-banners/${slug}.jpg` : null

    const bgPool = loadBgImagePool()
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
      slug, title, trackNumber: null, filename,
      lines, audioUrl, duration,
      songArtPath, chapterBannerPath, bgImages,
      hasTimestamps: !!tsData,
      chapterEmotion: CHAPTER_EMOTIONS[slug] ?? null,
      outputPath: path.join(OUTPUT_DIR, `${slug}.mp4`),
    })
  }

  return tracks.sort((a, b) => a.title.localeCompare(b.title))
}

// ─── List ─────────────────────────────────────────────────────────────────────
function runList(tracks) {
  console.log('\n🎬  Blind Angel karaoke video status:\n')
  for (const t of tracks) {
    const rendered = fs.existsSync(t.outputPath)
    const sym = rendered ? '✅' : t.hasTimestamps ? '○' : '⚠ '
    const info = [
      t.hasTimestamps ? `${t.lines.length} lines` : 'NO TIMESTAMPS',
      t.songArtPath ? 'art ✓' : 'art ✗',
      `${t.bgImages?.length ?? 0} bg`,
    ].join(' · ')
    console.log(`  ${sym}  ${t.title.padEnd(44)} [${info}]`)
  }
  console.log('\n  ⚠  = missing timestamps — run:')
  console.log('       python scripts/transcribe-songs.py --dir "Music/The  Blind Angel - Intimate Metal Sessions"\n')
}

// ─── Render one track ─────────────────────────────────────────────────────────
async function renderTrack(track, bundleLocation) {
  const duration = track.duration ?? 240
  const durationInFrames = Math.round(duration * FPS)

  log(`🎬  "${track.title}" — ${Math.round(duration)}s · ${track.lines.length} lines`)

  const inputProps = {
    trackTitle:        track.title,
    trackNumber:       null,
    albumTitle:        'The Blind Angel — Intimate Metal Sessions',
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
  const args        = process.argv.slice(2)
  const trackArg    = (() => { const i = args.indexOf('--track'); return i !== -1 ? args[i + 1] : null })()
  const listMode    = args.includes('--list')
  const forceMode   = args.includes('--force')
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
      log(`⚠  "${t.title}" — no timestamps. Run: python scripts/transcribe-songs.py --dir "Music/The  Blind Angel - Intimate Metal Sessions"`)
      return false
    }
    if (!forceMode && fs.existsSync(t.outputPath)) {
      log(`⏭  "${t.title}" — already rendered`)
      return false
    }
    return true
  })

  if (!renderable.length) {
    log('Nothing to render. Transcribe first with: python scripts/transcribe-songs.py --dir "Music/The  Blind Angel - Intimate Metal Sessions"')
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
  log(`\n✅  Done — ${rendered} rendered, ${failed} failed → public/Videos/blind-angel-lyrics/`)
  musicServer.close()
}

main().catch((e) => { err(e.message); console.error(e); process.exit(1) })
