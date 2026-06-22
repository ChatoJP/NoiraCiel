#!/usr/bin/env node
'use strict'
/**
 * batch-process.js
 * One generic, resumable, sequential batch runner for the per-track
 * generation scripts (karaoke videos, cinemagraphs, films) — replaces
 * writing a new one-off wrapper (like batch-render-karaoke.js) every time
 * a template improves and the whole catalogue needs reprocessing.
 *
 * Sequential only, by design: this box OOM'd Chrome under concurrent
 * karaoke renders earlier — see render-karaoke-generic.js for that history.
 *
 * Usage:
 *   node scripts/batch-process.js --task karaoke     --filter missing-only [--dry-run]
 *   node scripts/batch-process.js --task cinemagraph --filter all          [--dry-run]
 *   node scripts/batch-process.js --task film        --filter missing-only [--dry-run]
 *   node scripts/batch-process.js --task X --album jazz-sessions           # restrict to one album
 */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const r2 = require('./lib/r2-client')

const ROOT = path.join(__dirname, '..')

const TASKS = {
  karaoke: {
    script: 'render-karaoke-generic.js',
    isMissing: (t) => !t.lyricVideoUrl && t.hasLyrics && fs.existsSync(path.join(ROOT, 'public/Lyrics/timestamps', `${t.slug}.json`)),
  },
  cinemagraph: {
    script: 'generate-slideshow-video.js',
    args: (slug) => ['--slug', slug, '--type', 'cinemagraph'],
    isMissing: (t, cinemagraphSlugs) => !cinemagraphSlugs.has(t.slug),
  },
  film: {
    script: 'generate-slideshow-video.js',
    args: (slug) => ['--slug', slug, '--type', 'film'],
    isMissing: (t) => !t.musicVideoUrl,
  },
}

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? def : process.argv[i + 1]
}

const taskName = arg('task')
const filter   = arg('filter', 'missing-only')
const album    = arg('album')
const dryRun   = process.argv.includes('--dry-run')

const task = TASKS[taskName]
if (!task) {
  console.error(`Usage: node scripts/batch-process.js --task <${Object.keys(TASKS).join('|')}> [--filter all|missing-only] [--album <slug>] [--dry-run]`)
  process.exit(1)
}

function loadCinemagraphSlugs() {
  try {
    return new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'public/generated/kie/cinemagraphs-manifest.json'), 'utf-8')))
  } catch {
    return new Set()
  }
}

function getCandidates() {
  const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/music-catalogue.json'), 'utf-8'))
  const cinemagraphSlugs = taskName === 'cinemagraph' ? loadCinemagraphSlugs() : null
  let tracks = catalogue.tracks
  if (album) tracks = tracks.filter((t) => t.albumSlug === album)
  if (filter === 'missing-only') tracks = tracks.filter((t) => task.isMissing(t, cinemagraphSlugs))
  return tracks.map((t) => t.slug)
}

async function main() {
  let remaining = getCandidates()
  r2.log(`Task: ${taskName} | filter: ${filter}${album ? ` | album: ${album}` : ''}`)
  r2.log(`${remaining.length} track(s) queued`)

  if (dryRun) {
    for (const slug of remaining) r2.log(`  [dry-run] would process: ${slug}`)
    r2.log(`\n[dry-run] ${remaining.length} track(s) would be processed, nothing was changed.`)
    return
  }

  let ok = 0, failed = 0
  while (remaining.length > 0) {
    const slug = remaining[0]
    const space = r2.checkDiskSpace(800)
    if (!space.ok) {
      r2.err(`Disk space too low (${space.freeMb}MB) — stopping batch. ${ok} done, ${remaining.length} left.`)
      break
    }

    r2.log(`\n── [${ok + failed + 1}/${ok + failed + remaining.length}] ${slug} ──`)
    try {
      const scriptArgs = task.args ? task.args(slug) : ['--slug', slug]
      execFileSync('node', [path.join(__dirname, task.script), ...scriptArgs], { stdio: 'inherit', cwd: ROOT })
      ok++
    } catch (e) {
      r2.err(`Failed on ${slug}: ${e.message}`)
      failed++
    }

    remaining = getCandidates() // re-read: catalogue/manifests were just updated by the task above
    await r2.sleep(2000)
  }

  r2.log(`\nBatch done. ${ok} processed, ${failed} failed, ${remaining.length} remaining.`)
}

main().catch((e) => { r2.err(e.message); process.exit(1) })
