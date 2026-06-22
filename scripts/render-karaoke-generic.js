#!/usr/bin/env node
'use strict'
/**
 * render-karaoke-generic.js
 * Album-agnostic karaoke/lyric video renderer. Reads everything from
 * public/music-catalogue.json + public/Lyrics/timestamps/{slug}.json,
 * sources all images/audio directly from R2 (no local Music/ dependency),
 * renders locally via Remotion, uploads the result to R2, verifies, and
 * deletes the local temp render — one track per invocation.
 *
 * Usage:
 *   node scripts/render-karaoke-generic.js --slug saudade-has-a-weight
 */

const fs   = require('fs')
const path = require('path')

// /tmp on this server is a 1.9G RAM-backed tmpfs — Remotion's frame buffer
// writes there blew through it (ENOSPC) and compete with Chrome for the same
// RAM (contributing to the earlier OOM). Redirect all temp I/O to real disk
// before requiring remotion packages, since they read TMPDIR via os.tmpdir()
// at call time.
const TMP_DIR = path.join(__dirname, '..', '.tmp', 'render-cache')
require('fs').mkdirSync(TMP_DIR, { recursive: true })
process.env.TMPDIR = TMP_DIR

const { bundle } = require('@remotion/bundler')
const { renderMedia, selectComposition } = require('@remotion/renderer')
const r2 = require('./lib/r2-client')

const ROOT            = path.join(__dirname, '..')
const ENTRY_POINT      = path.join(ROOT, 'src/remotion/index.ts')
const TIMESTAMPS_DIR   = path.join(ROOT, 'public/Lyrics/timestamps')
const CATALOGUE_PATH   = path.join(ROOT, 'public/music-catalogue.json')
const LYRIC_VIDEOS_PATH= path.join(ROOT, 'public/lyric-videos.json')

const FPS = 30

const ALBUM_BG_SUBDIR = {
  'main':                'video-backgrounds',
  'blind-angel':         'video-backgrounds-metal',
  'jazz-sessions':       'video-backgrounds-jazz',
  'the-velvet-machine':  'video-backgrounds',
  'still-we-sail':       'video-backgrounds',
  'whats-youre-made-of': 'video-backgrounds',
  'the-sacred-drift':    'video-backgrounds',
}

const args = process.argv.slice(2)
const slug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null
if (!slug) { console.error('Usage: node scripts/render-karaoke-generic.js --slug <slug>'); process.exit(1) }

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

function r2BgPool(albumSlug, count = 40) {
  const subdir = ALBUM_BG_SUBDIR[albumSlug] || 'video-backgrounds'
  const manifestPath = path.join(ROOT, 'public/images', subdir, '_files.json')
  try {
    const files = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    const shuffled = [...files].sort(() => Math.random() - 0.5).slice(0, count)
    return shuffled.map((f) => `${r2.PUBLIC_URL}/images/${subdir}/${f}`)
  } catch {
    return []
  }
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'))
  const track = catalogue.tracks.find((t) => t.slug === slug)
  if (!track) throw new Error(`No track with slug "${slug}" in catalogue`)
  if (track.lyricVideoUrl) throw new Error(`${slug} already has a lyric video: ${track.lyricVideoUrl}`)

  const tsPath = path.join(TIMESTAMPS_DIR, `${slug}.json`)
  if (!fs.existsSync(tsPath)) throw new Error(`No timestamp data at ${tsPath} — cannot build karaoke sync`)
  const tsData = JSON.parse(fs.readFileSync(tsPath, 'utf-8'))
  const lines = groupIntoLines(tsData.words)
  const duration = tsData.duration || track.duration || 180

  const bgImages = r2BgPool(track.albumSlug, 40)
  if (track.chapterBannerUrl) bgImages.unshift(track.chapterBannerUrl)
  if (track.songArtUrl) bgImages.unshift(track.songArtUrl)

  const inputProps = {
    trackTitle:        track.title,
    trackNumber:       track.trackNumber,
    albumTitle:        track.album,
    audioUrl:          track.audioUrl,
    songArtPath:       track.songArtUrl,
    chapterBannerPath: track.chapterBannerUrl,
    chapterEmotion:    null,
    lines,
    bgImages,
  }

  r2.log(`Rendering "${track.title}" (${slug}) — ${Math.round(duration)}s, ${lines.length} lines, ${bgImages.length} bg images`)

  const space = r2.checkDiskSpace(500)
  if (!space.ok) throw new Error(`Disk space too low (${space.freeMb}MB free) — aborting before render`)

  fs.mkdirSync(TMP_DIR, { recursive: true })
  const outputPath = path.join(TMP_DIR, `${slug}.mp4`)

  r2.log('Bundling Remotion composition...')
  const bundleLocation = await bundle({ entryPoint: ENTRY_POINT })

  const composition = await selectComposition({ serveUrl: bundleLocation, id: 'KaraokeVideo', inputProps })
  composition.durationInFrames = Math.round(duration * FPS)
  // Reduced from the 1920x1080 default — this 4GB box OOM'd Chrome at full res.
  composition.width = 1280
  composition.height = 720

  r2.log('Rendering video (this can take a few minutes)...')
  const t0 = Date.now()
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    fps: FPS,
    imageFormat: 'jpeg',
    jpegQuality: 80,
    concurrency: 1,
    onProgress: ({ progress }) => process.stdout.write(`\r  Progress: ${Math.round(progress * 100)}%   `),
    chromiumOptions: { disableWebSecurity: true, gl: 'swiftshader' },
    timeoutInMilliseconds: 90 * 60 * 1000,
  })
  const elapsedSec = Math.round((Date.now() - t0) / 1000)
  const sizeMb = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)
  r2.log(`\nRendered in ${elapsedSec}s → ${outputPath} (${sizeMb} MB)`)

  const r2Key = `Videos/lyrics/${slug}.mp4`
  const { r2Url, deletedLocal } = await r2.migrateFile(outputPath, r2Key, { deleteLocal: true })
  if (!deletedLocal) r2.warn('Render uploaded+verified but local temp file could not be deleted')

  // Update lyric-videos.json + catalogue snapshot
  const lv = JSON.parse(fs.readFileSync(LYRIC_VIDEOS_PATH, 'utf-8'))
  lv.videos.push({
    id: `${slug}-lyric`,
    title: track.title,
    albumSlug: track.albumSlug,
    platform: 'self-hosted',
    url: r2Url,
    thumbnail: track.chapterBannerUrl ?? track.songArtUrl ?? null,
    description: null,
    publishedAt: new Date().toISOString().slice(0, 10),
    trackId: slug,
    trackNumber: track.trackNumber,
  })
  r2.atomicWriteJSON(LYRIC_VIDEOS_PATH, lv)

  track.lyricVideoUrl = r2Url
  r2.atomicWriteJSON(CATALOGUE_PATH, catalogue)

  r2.log(`Done. ${slug} lyricVideoUrl -> ${r2Url}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { r2.err(e.message); process.exit(1) })
