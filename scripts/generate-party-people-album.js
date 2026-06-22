#!/usr/bin/env node
'use strict'
/**
 * generate-party-people-album.js
 * Manifest-driven generation CLI for NoiraCiel Party People (instrumental
 * club albums). Mirrors generate-concept-album.js's CLI shape but drives
 * party-people-pipeline.js instead.
 *
 * Usage:
 *   node scripts/generate-party-people-album.js --album ritual-voltage --task music --run
 *   node scripts/generate-party-people-album.js --album ritual-voltage --task track-art --run
 *   node scripts/generate-party-people-album.js --album ritual-voltage --task banner --run
 *   node scripts/generate-party-people-album.js --album ritual-voltage --task all --status
 */

const r2  = require('./lib/r2-client')
const pipeline = require('./lib/party-people-pipeline')

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? def : process.argv[i + 1]
}
const has = (name) => process.argv.includes(`--${name}`)

const albumSlug = arg('album')
const task      = arg('task', 'all')
const RUN       = has('run')
const STATUS    = has('status')
const LIMIT     = arg('limit') ? parseInt(arg('limit'), 10) : Infinity
const MIN_FREE_MB = 600

if (!albumSlug) {
  console.error('Usage: node scripts/generate-party-people-album.js --album <slug> --task music|track-art|banner|all --run|--status [--limit N]')
  process.exit(1)
}

function printStatus(slug) {
  const tracks = pipeline.loadTracks(slug)
  const status = pipeline.ensureStatus(slug)
  console.log(`\n── ${slug} ──────────────────────────────────────────────`)
  let musicDone = 0, artDone = 0, bannerDone = 0
  for (const t of tracks) {
    const e = status[t.slug]
    if (e.music.state === 'complete') musicDone++
    if (e.trackArt.state === 'complete') artDone++
    if (e.banner.state === 'complete') bannerDone++
    const icon = (s) => s === 'complete' ? '✓' : s === 'failed' ? '✗' : s === 'pending' ? '⏳' : '·'
    console.log(`  ${String(t.num).padStart(2,'0')} ${t.title.padEnd(40)} music:${icon(e.music.state)} trackArt:${icon(e.trackArt.state)} banner:${icon(e.banner.state)}${e.error ? '  ERROR: ' + e.error : ''}`)
  }
  console.log(`\n  music ${musicDone}/${tracks.length} · trackArt ${artDone}/${tracks.length} · banner ${bannerDone}/${tracks.length}\n`)
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
      : kind === 'trackArt' ? entry.trackArt.state === 'complete'
      : entry.banner.state === 'complete'
    if (alreadyDone) continue

    let result
    try {
      result = kind === 'music' ? await pipeline.runMusicForTrack(slug, track, status)
        : await pipeline.runImageForTrack(slug, track, status, kind)
    } catch (e) {
      console.error(`\n✗ STOPPING batch — ${kind} failed for "${track.title}": ${e.message}`)
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

  const kinds = task === 'all' ? ['music', 'trackArt', 'banner']
    : task === 'music' ? ['music']
    : task === 'track-art' ? ['trackArt']
    : task === 'banner' ? ['banner']
    : null
  if (!kinds) {
    console.error(`Unknown task: ${task}`)
    process.exit(1)
  }

  for (const kind of kinds) {
    await runTask(albumSlug, kind)
  }
})()
