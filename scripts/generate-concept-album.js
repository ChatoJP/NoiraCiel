#!/usr/bin/env node
'use strict'
/**
 * generate-concept-album.js
 * Manifest-driven generation CLI for new concept albums (data/concept-albums/{slug}).
 * Generalizes the old one-script-per-album pattern (generate-new-albums.js,
 * generate-sacred-drift.js, ...) into a single reusable driver.
 *
 * Usage:
 *   node scripts/generate-concept-album.js --album salt-cathedral --task music --run
 *   node scripts/generate-concept-album.js --album salt-cathedral --task song-art --run
 *   node scripts/generate-concept-album.js --album salt-cathedral --task chapter-banner --run
 *   node scripts/generate-concept-album.js --album salt-cathedral --task all --status
 *
 * Safety (explicit production mandate): one asset at a time. Disk is checked
 * before every track. On any upload/verification failure the batch stops
 * immediately rather than continuing past the error.
 */

const r2  = require('./lib/r2-client')
const pipeline = require('./lib/concept-album-pipeline')

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? def : process.argv[i + 1]
}
const has = (name) => process.argv.includes(`--${name}`)

const albumSlug = arg('album')
const task      = arg('task', 'all') // music | song-art | chapter-banner | all
const RUN       = has('run')
const STATUS    = has('status')
const LIMIT     = arg('limit') ? parseInt(arg('limit'), 10) : Infinity
const MIN_FREE_MB = 600

if (!albumSlug) {
  console.error('Usage: node scripts/generate-concept-album.js --album <slug> --task music|song-art|chapter-banner|all --run|--status [--limit N]')
  process.exit(1)
}

function printStatus(slug) {
  const tracks = pipeline.loadTracks(slug)
  const status = pipeline.ensureStatus(slug)
  console.log(`\n── ${slug} ──────────────────────────────────────────────`)
  let musicDone = 0, songArtDone = 0, bannerDone = 0
  for (const t of tracks) {
    const e = status[t.slug]
    if (e.music.state === 'complete') musicDone++
    if (e.songArt.state === 'complete') songArtDone++
    if (e.chapterBanner.state === 'complete') bannerDone++
    const icon = (s) => s === 'complete' ? '✓' : s === 'failed' ? '✗' : s === 'pending' ? '⏳' : '·'
    console.log(`  ${String(t.num).padStart(2,'0')} ${t.title.padEnd(40)} music:${icon(e.music.state)} songArt:${icon(e.songArt.state)} banner:${icon(e.chapterBanner.state)}${e.error ? '  ERROR: ' + e.error : ''}`)
  }
  console.log(`\n  music ${musicDone}/${tracks.length} · songArt ${songArtDone}/${tracks.length} · chapterBanner ${bannerDone}/${tracks.length}\n`)
}

async function runTask(slug, kind) {
  const tracks = pipeline.loadTracks(slug)
  const status = pipeline.ensureStatus(slug)
  let processed = 0

  for (const track of tracks) {
    if (processed >= LIMIT) break

    const disk = r2.checkDiskSpace(MIN_FREE_MB)
    if (!disk.ok) {
      console.error(`✗ STOPPING — disk free (${disk.freeMb}MB) below safety threshold (${MIN_FREE_MB}MB)`)
      process.exit(1)
    }

    const entry = status[track.slug]
    const alreadyDone = kind === 'music' ? entry.music.state === 'complete'
      : kind === 'songArt' ? entry.songArt.state === 'complete'
      : entry.chapterBanner.state === 'complete'
    if (alreadyDone) continue

    let result
    try {
      result = kind === 'music' ? await pipeline.runMusicForTrack(slug, track, status)
        : await pipeline.runImageForTrack(slug, track, status, kind)
    } catch (e) {
      console.error(`\n✗ STOPPING batch — ${kind} failed for "${track.title}": ${e.message}`)
      console.error(`  Local files (if any) were left untouched for inspection. Fix the issue and re-run.`)
      process.exit(1)
    }

    if (!result.ok) {
      console.error(`\n✗ STOPPING batch — ${kind} failed for "${track.title}": ${result.error}`)
      process.exit(1)
    }
    if (!result.skipped) processed++
  }
  console.log(`\n${kind} run complete. ${processed} new asset(s) generated for ${slug}.`)
}

;(async () => {
  if (STATUS) {
    printStatus(albumSlug)
    return
  }
  if (!RUN) {
    console.error('Specify --run or --status')
    process.exit(1)
  }

  const kinds = task === 'all' ? ['music', 'songArt', 'chapterBanner']
    : task === 'music' ? ['music']
    : task === 'song-art' ? ['songArt']
    : task === 'chapter-banner' ? ['chapterBanner']
    : null
  if (!kinds) {
    console.error(`Unknown task: ${task}`)
    process.exit(1)
  }

  for (const kind of kinds) {
    await runTask(albumSlug, kind)
  }
})()
