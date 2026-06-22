#!/usr/bin/env node
'use strict'
/**
 * render-motion-film.js
 * Renders the abstract "Motion Film" for a no-lyrics (instrumental) track —
 * genre-aware moving shapes/particles/gradients (src/remotion/MotionFilm.tsx),
 * NOT a karaoke video and NOT a photo Ken-Burns slideshow. Use this instead
 * of render-karaoke-generic.js whenever track.hasLyrics is false.
 *
 * Reuses the existing musicVideoUrl field/R2 path (generated/kie/music-videos/
 * {slug}.mp4) — same slot the photo-based film uses for lyrics tracks, just
 * populated by a different generator depending on hasLyrics.
 *
 * Usage:
 *   node scripts/render-motion-film.js --slug first-coal
 */

const fs   = require('fs')
const path = require('path')

// os.tmpdir() reads TMPDIR on POSIX, TEMP/TMP on Windows — set all three so
// this works cross-platform, and so Remotion's frame buffer never lands on
// a small RAM-backed /tmp.
const TMP_DIR = path.join(__dirname, '..', '.tmp', 'render-cache')
fs.mkdirSync(TMP_DIR, { recursive: true })
process.env.TMPDIR = TMP_DIR
process.env.TEMP = TMP_DIR
process.env.TMP = TMP_DIR

const { bundle } = require('@remotion/bundler')
const { renderMedia, selectComposition } = require('@remotion/renderer')
const r2 = require('./lib/r2-client')

const ROOT          = path.join(__dirname, '..')
const ENTRY_POINT    = path.join(ROOT, 'src/remotion/index.ts')
const CATALOGUE_PATH = path.join(ROOT, 'public/music-catalogue.json')
const FPS = 30
const DEFAULT_DURATION_SEC = 30

// Party People albums already carry a deliberate genre-matched style.
const PARTY_PEOPLE_STYLE = {
  'ritual-voltage':  'spirals',
  'concrete-saints': 'brutalist',
  'velvet-circuit':  'sleek',
  'drum-oracle':     'tribal',
}
// Locally-ingested instrumental albums (no design brief) get a reasonable
// genre-flavored guess instead of a generic default.
const LOCAL_ALBUM_STYLE = {
  metal: 'brutalist',
  hardstyle: 'brutalist',
  classic: 'sleek',
  'party-exploder': 'sleek',
  'ak96-party-session-1': 'default',
}
const FALLBACK_PALETTE = ['#08080F', '#1B1320', '#C4953A', '#F2EDE3']

const args = process.argv.slice(2)
const slug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null
if (!slug) { console.error('Usage: node scripts/render-motion-film.js --slug <slug>'); process.exit(1) }

function loadPartyTrackMeta(albumSlug, trackSlug) {
  try {
    const tracks = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/party-people', albumSlug, 'tracks.json'), 'utf-8'))
    return tracks.find((t) => t.slug === trackSlug) ?? null
  } catch { return null }
}

function resolveVisualParams(track) {
  const partyMeta = loadPartyTrackMeta(track.albumSlug, track.slug)
  const visualStyle = PARTY_PEOPLE_STYLE[track.albumSlug] ?? LOCAL_ALBUM_STYLE[track.albumSlug] ?? 'default'
  const bpm = partyMeta?.bpm ?? 120
  const energyLevel = partyMeta?.energyLevel ?? 5

  let palette = FALLBACK_PALETTE
  try {
    const concept = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/party-people', track.albumSlug, 'concept.json'), 'utf-8'))
    if (concept.theme) {
      const [r1, g1, b1] = concept.theme.bgTintRgb.split(',').map((s) => parseInt(s.trim(), 10))
      const [r2v, g2, b2] = concept.theme.accentRgb.split(',').map((s) => parseInt(s.trim(), 10))
      const toHex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
      palette = [toHex(r1, g1, b1), toHex(Math.min(r1 + 30, 255), Math.min(g1 + 20, 255), Math.min(b1 + 30, 255)), toHex(r2v, g2, b2), '#F2EDE3']
    }
  } catch { /* not a party-people album — use fallback palette */ }

  return { visualStyle, bpm, energyLevel, palette }
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'))
  const track = catalogue.tracks.find((t) => t.slug === slug)
  if (!track) throw new Error(`No track with slug "${slug}" in catalogue`)
  if (track.hasLyrics) throw new Error(`${slug} has lyrics — use render-karaoke-generic.js / the photo-based film, not MotionFilm`)
  if (track.musicVideoUrl) throw new Error(`${slug} already has a film: ${track.musicVideoUrl}`)

  const { visualStyle, bpm, energyLevel, palette } = resolveVisualParams(track)
  const durationInSeconds = DEFAULT_DURATION_SEC

  const inputProps = { trackTitle: track.title, visualStyle, palette, bpm, energyLevel, durationInSeconds }

  r2.log(`Rendering Motion Film for "${track.title}" (${slug}) — style=${visualStyle}, bpm=${bpm}, energy=${energyLevel}`)

  const space = r2.checkDiskSpace(500)
  if (!space.ok) throw new Error(`Disk space too low (${space.freeMb}MB free) — aborting before render`)

  fs.mkdirSync(TMP_DIR, { recursive: true })
  const outputPath = path.join(TMP_DIR, `${slug}-motion-film.mp4`)

  r2.log('Bundling Remotion composition...')
  const bundleLocation = await bundle({ entryPoint: ENTRY_POINT })

  const composition = await selectComposition({ serveUrl: bundleLocation, id: 'MotionFilm', inputProps })
  composition.durationInFrames = Math.round(durationInSeconds * FPS)
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
    concurrency: 1,
    onProgress: ({ progress }) => process.stdout.write(`\r  Progress: ${Math.round(progress * 100)}%   `),
    chromiumOptions: { disableWebSecurity: true, gl: 'swiftshader' },
    timeoutInMilliseconds: 90 * 60 * 1000,
  })
  const elapsedSec = Math.round((Date.now() - t0) / 1000)
  const sizeMb = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)
  r2.log(`\nRendered in ${elapsedSec}s → ${outputPath} (${sizeMb} MB)`)

  const r2Key = `generated/kie/music-videos/${slug}.mp4`
  const { r2Url, deletedLocal } = await r2.migrateFile(outputPath, r2Key, { deleteLocal: true })
  if (!deletedLocal) r2.warn('Render uploaded+verified but local temp file could not be deleted')

  track.musicVideoUrl = r2Url
  r2.atomicWriteJSON(CATALOGUE_PATH, catalogue)

  r2.log(`Done. ${slug} musicVideoUrl -> ${r2Url}`)
}

main().then(() => process.exit(0)).catch((e) => { r2.err(e.message); process.exit(1) })
