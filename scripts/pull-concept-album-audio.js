#!/usr/bin/env node
'use strict'
/**
 * pull-concept-album-audio.js
 * Run this on the machine that will do the karaoke transcription + render
 * (e.g. a local dev box) — pulls one album's finished tracks from R2 into a
 * local Music/{dirName}/audio/ folder, matching the layout
 * scripts/transcribe-songs.py expects via --dir.
 *
 * Only pulls tracks whose audio generation is already complete (per
 * data/concept-albums/{slug}/status.json) — this is a working copy for
 * transcription, not a second permanent home for the audio; delete the
 * folder once transcription is done, the canonical copy stays on R2.
 *
 * Usage: node scripts/pull-concept-album-audio.js --album salt-cathedral
 */

const fs   = require('fs')
const path = require('path')
const r2   = require('./lib/r2-client')
const pipeline = require('./lib/concept-album-pipeline')

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? def : process.argv[i + 1]
}

const albumSlug = arg('album')
if (!albumSlug) {
  console.error('Usage: node scripts/pull-concept-album-audio.js --album <slug>')
  process.exit(1)
}

async function main() {
  const concept = pipeline.loadConcept(albumSlug)
  const tracks  = pipeline.loadTracks(albumSlug)
  const status  = pipeline.loadStatus(albumSlug)

  const outDir = path.join(__dirname, '..', 'Music', concept.dirName, 'audio')
  fs.mkdirSync(outDir, { recursive: true })

  let pulled = 0, skipped = 0
  for (const track of tracks) {
    const entry = status[track.slug]
    if (!entry || entry.music.state !== 'complete') { skipped++; continue }

    const numStr = String(track.num).padStart(2, '0')
    const dest = path.join(outDir, `${numStr}_${track.slug}.mp3`)
    if (fs.existsSync(dest)) { console.log(`⏭  ${track.title} — already pulled`); continue }

    console.log(`↓  ${track.title}`)
    await r2.downloadFile(entry.music.r2Key, dest)
    pulled++
  }

  console.log(`\nDone. ${pulled} pulled to ${outDir}, ${skipped} skipped (music not complete yet).`)
  console.log(`\nNext:`)
  console.log(`  python scripts/transcribe-songs.py --dir Music/${concept.dirName}/audio`)
  console.log(`  node scripts/render-karaoke-generic.js --slug <slug>   (repeat per track)`)
  console.log(`\nWhen done, this local audio copy can be deleted — the canonical copy is on R2.`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
