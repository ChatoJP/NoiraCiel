#!/usr/bin/env node
'use strict'
/**
 * batch-render-karaoke.js
 * Runs render-karaoke-generic.js one track at a time for every track that
 * has lyrics + timestamp data but no lyricVideoUrl yet. Sequential only —
 * this box OOMs Chrome under concurrent renders. Stops on the first failure
 * rather than ploughing ahead.
 */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const r2 = require('./lib/r2-client')

function getCandidates() {
  const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/music-catalogue.json'), 'utf-8'))
  return c.tracks
    .filter((t) => !t.lyricVideoUrl && t.hasLyrics && fs.existsSync(path.join(ROOT, 'public/Lyrics/timestamps', `${t.slug}.json`)))
    .map((t) => t.slug)
}

async function main() {
  let remaining = getCandidates()
  r2.log(`${remaining.length} karaoke video candidates queued`)

  let ok = 0, failed = 0
  while (remaining.length > 0) {
    const slug = remaining[0]
    const space = r2.checkDiskSpace(800)
    if (!space.ok) {
      r2.err(`Disk space too low (${space.freeMb}MB) — stopping batch. ${ok} done, ${remaining.length} left.`)
      break
    }

    r2.log(`\n── [${ok + failed + 1}] ${slug} ──────────────────────────`)
    try {
      execFileSync('node', [path.join(__dirname, 'render-karaoke-generic.js'), '--slug', slug], {
        stdio: 'inherit',
        cwd: ROOT,
      })
      ok++
    } catch (e) {
      r2.err(`Failed on ${slug}: ${e.message}`)
      failed++
    }

    // Re-read candidates (catalogue was just updated) and let Chrome processes
    // fully release memory before starting the next render.
    remaining = getCandidates()
    await r2.sleep(5000)
  }

  r2.log(`\nBatch done. ${ok} rendered, ${failed} failed, ${remaining.length} remaining.`)
}

main().catch((e) => { r2.err(e.message); process.exit(1) })
