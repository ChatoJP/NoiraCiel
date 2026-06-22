#!/usr/bin/env node
'use strict'
/**
 * generate-slideshow-video.js
 * Free, local Ken-Burns-style slideshow video — built with ffmpeg from
 * existing still images (song art, chapter banner, album backgrounds).
 * Used as an honest, clearly-labeled substitute for the AI-generated
 * cinemagraphs/films this project can no longer afford to keep generating
 * via paid APIs. No Chrome, no Remotion — just ffmpeg, so it's fast and
 * light enough to run many of these safely on this box.
 *
 * Usage:
 *   node scripts/generate-slideshow-video.js --slug why --type cinemagraph
 *   node scripts/generate-slideshow-video.js --slug why --type film
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const r2 = require('./lib/r2-client')

const ROOT = path.join(__dirname, '..')
const CATALOGUE_PATH = path.join(ROOT, 'public/music-catalogue.json')
const TMP_DIR = path.join(ROOT, '.tmp', 'slideshow-cache')

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
const type = args.includes('--type') ? args[args.indexOf('--type') + 1] : 'cinemagraph'
if (!slug || !['cinemagraph', 'film'].includes(type)) {
  console.error('Usage: node scripts/generate-slideshow-video.js --slug <slug> --type <cinemagraph|film>')
  process.exit(1)
}

function pickImages(track, count) {
  const pool = []
  if (track.chapterBannerUrl) pool.push(track.chapterBannerUrl)
  if (track.songArtUrl) pool.push(track.songArtUrl)
  const subdir = ALBUM_BG_SUBDIR[track.albumSlug] || 'video-backgrounds'
  try {
    const files = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/images', subdir, '_files.json'), 'utf-8'))
    const shuffled = [...files].sort(() => Math.random() - 0.5).slice(0, count)
    pool.push(...shuffled.map((f) => `${r2.PUBLIC_URL}/images/${subdir}/${f}`))
  } catch { /* no backgrounds for this album */ }
  return pool.slice(0, count)
}

async function downloadImage(url, dest) {
  execSync(`curl -sL -o "${dest}" "${url}"`, { stdio: 'pipe' })
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'))
  const track = catalogue.tracks.find((t) => t.slug === slug)
  if (!track) throw new Error(`No track "${slug}"`)

  const r2Key = type === 'cinemagraph'
    ? `generated/kie/cinemagraphs/${slug}/loop.mp4`
    : `generated/kie/music-videos/${slug}.mp4`

  const imageCount = type === 'cinemagraph' ? 3 : 6
  const perImageSec = type === 'cinemagraph' ? 4 : 6
  const images = pickImages(track, imageCount)
  if (images.length === 0) throw new Error(`No images available for ${slug}`)

  r2.log(`Building ${type} slideshow for "${track.title}" from ${images.length} image(s)`)

  const space = r2.checkDiskSpace(300)
  if (!space.ok) throw new Error(`Disk space too low (${space.freeMb}MB)`)

  fs.mkdirSync(TMP_DIR, { recursive: true })
  const localImages = []
  for (let i = 0; i < images.length; i++) {
    const dest = path.join(TMP_DIR, `${slug}-${type}-src-${i}.jpg`)
    await downloadImage(images[i], dest)
    localImages.push(dest)
  }

  const outputPath = path.join(TMP_DIR, `${slug}-${type}.mp4`)
  const W = 1280, H = 720
  const fps = 30
  const framesPerImage = perImageSec * fps
  const totalDuration = perImageSec * localImages.length

  // Per-image Ken Burns zoom+pan. -r locks the input read rate explicitly —
  // without it, zoompan fed a looped still image can drift far past the
  // intended duration (observed: a 3-image/12s request produced a 407s file).
  // -t on the final output is a hard cap regardless of any filter-graph math.
  const inputs = localImages.map((f) => `-loop 1 -r ${fps} -t ${perImageSec} -i "${f}"`).join(' ')
  const filters = localImages.map((_, i) =>
    `[${i}:v]scale=${W * 1.15}:${H * 1.15},zoompan=z='min(zoom+0.0015,1.15)':d=${framesPerImage}:s=${W}x${H}:fps=${fps},setsar=1,trim=duration=${perImageSec}[v${i}]`
  ).join(';')

  let chain = '[v0]'
  let filterTail = ''
  for (let i = 1; i < localImages.length; i++) {
    const out = i === localImages.length - 1 ? 'vout' : `x${i}`
    filterTail += `${chain}[v${i}]xfade=transition=fade:duration=1:offset=${i * perImageSec - 1}[${out}];`
    chain = `[${out}]`
  }
  const finalLabel = localImages.length === 1 ? 'v0' : 'vout'

  const cmd = `ffmpeg -y ${inputs} -filter_complex "${filters};${filterTail}" -map "[${finalLabel}]" -t ${totalDuration} -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outputPath}"`
  execSync(cmd, { stdio: 'pipe' })

  const sizeMb = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)
  r2.log(`Built ${outputPath} (${sizeMb} MB)`)

  const { r2Url, deletedLocal } = await r2.migrateFile(outputPath, r2Key, { deleteLocal: true })
  for (const f of localImages) fs.unlinkSync(f)
  if (!deletedLocal) r2.warn('Output uploaded+verified but local temp could not be deleted')

  if (type === 'film') {
    track.musicVideoUrl = r2Url
    fs.writeFileSync(CATALOGUE_PATH, JSON.stringify(catalogue, null, 2))
  }

  r2.log(`Done. ${slug} ${type} -> ${r2Url}`)
}

main().then(() => process.exit(0)).catch((e) => { r2.err(e.message); process.exit(1) })
