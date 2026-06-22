#!/usr/bin/env node
'use strict'
/**
 * pull-track-audio.js
 * Generic single-track audio puller, for any track in public/music-catalogue.json
 * (not just the concept-albums — covers the original catalogue too). Used to
 * get a local copy for transcribe-songs.py, which needs audio on local disk.
 * Delete the file yourself once transcription succeeds — R2 stays canonical.
 *
 * Usage:
 *   node scripts/media/pull-track-audio.js --slug the-sacred-drift --dir .tmp/transcribe-audio
 */

const fs   = require('fs')
const path = require('path')
const r2 = require('../lib/r2-client')

r2.loadEnv()

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? def : process.argv[i + 1]
}

const slug = arg('slug')
const outDir = arg('dir', path.join(__dirname, '..', '..', '.tmp', 'transcribe-audio'))
if (!slug) {
  console.error('Usage: node scripts/media/pull-track-audio.js --slug <slug> [--dir <output-dir>]')
  process.exit(1)
}

async function main() {
  const catalogue = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'music-catalogue.json'), 'utf-8'))
  const track = catalogue.tracks.find((t) => t.slug === slug)
  if (!track) throw new Error(`No track "${slug}" in catalogue`)
  if (!track.audioUrl) throw new Error(`${slug} has no audioUrl`)

  fs.mkdirSync(outDir, { recursive: true })
  const ext = path.extname(new URL(track.audioUrl).pathname) || '.mp3'
  // transcribe-songs.py's filename parser expects "<num>_<slug>" (or
  // "<num>_<slug>_v1") — match that exactly so it derives the same slug.
  const numStr = String(track.trackNumber ?? 1).padStart(2, '0')
  const dest = path.join(outDir, `${numStr}_${slug}${ext}`)

  console.log(`Downloading ${track.title} -> ${dest}`)
  await r2.downloadFile(track.audioUrl.replace(r2.PUBLIC_URL + '/', ''), dest)
  console.log('Done.')
  console.log(`\nNext: python3 scripts/transcribe-songs.py ${slug} --dir "${outDir}"`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
