#!/usr/bin/env node
'use strict'
/**
 * unblock-karaoke-timestamps.js
 * The karaoke renderer needs word-level lyric timestamps
 * (public/Lyrics/timestamps/{slug}.json) before it can run. Those are
 * produced by scripts/transcribe-songs.py, which expects local audio files —
 * but the Music/ directory no longer exists locally (audio now lives only in
 * R2 since the migration). This script bridges the gap: download just the
 * audio for tracks missing timestamps, transcribe them in one batch (so the
 * Whisper model only loads once), then delete the temporary audio.
 *
 * This only unblocks the queue entries — it does not render karaoke videos.
 * Re-run render-missing-videos-local.js --dry-run afterward; the blocked
 * count should drop to 0 for every track this script succeeds on.
 *
 * Usage:
 *   node scripts/media/unblock-karaoke-timestamps.js
 *   node scripts/media/unblock-karaoke-timestamps.js --limit 5
 */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const r2 = require('../lib/r2-client')
const kie = require('../lib/kie-client')

const ROOT = path.join(__dirname, '..', '..')
const CATALOGUE_PATH = path.join(ROOT, 'public', 'music-catalogue.json')
const TIMESTAMPS_DIR = path.join(ROOT, 'public', 'Lyrics', 'timestamps')
const AUDIO_TMP_DIR = path.join(ROOT, '.tmp', 'transcribe-audio')

const argv = process.argv.slice(2)
const arg = (name) => { const i = argv.indexOf(`--${name}`); return i === -1 ? null : argv[i + 1] }
const LIMIT = arg('limit') ? parseInt(arg('limit'), 10) : Infinity

function resolvePython() {
  for (const cmd of ['python3', 'python']) {
    try { execFileSync(cmd, ['--version'], { stdio: 'ignore' }); return cmd } catch { /* try next */ }
  }
  throw new Error('No working Python interpreter found on PATH (tried python3, python)')
}

function findBlockedKaraokeTracks() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'))
  // Mirrors buildQueue()'s "blocked" condition in render-missing-videos-local.js
  // exactly — tracks that already have a working lyricVideoUrl are done, even
  // if their local timestamps file is missing (e.g. from a past disk-full
  // truncation); re-transcribing those would be wasted CPU for no benefit.
  return catalogue.tracks.filter((t) => {
    if (!t.hasLyrics || !t.audioUrl || t.lyricVideoUrl) return false
    const hasTimestamps = fs.existsSync(path.join(TIMESTAMPS_DIR, `${t.slug}.json`))
    return !hasTimestamps
  })
}

async function main() {
  const python = resolvePython()
  const tracks = findBlockedKaraokeTracks().slice(0, LIMIT)
  if (tracks.length === 0) {
    r2.log('Nothing to unblock — every lyrics track already has timestamps.')
    return
  }

  const space = r2.checkDiskSpace(500)
  if (!space.ok) throw new Error(`Disk space too low (${space.freeMb}MB free) — aborting before download`)

  r2.log(`Downloading audio for ${tracks.length} track(s) missing lyric timestamps...`)
  fs.mkdirSync(AUDIO_TMP_DIR, { recursive: true })

  let counter = 0
  for (const track of tracks) {
    counter++
    const ext = path.extname(new URL(track.audioUrl).pathname) || '.mp3'
    const trackNum = track.trackNumber ?? counter
    const dest = path.join(AUDIO_TMP_DIR, `${trackNum}_${track.slug}${ext}`)
    r2.log(`  [${counter}/${tracks.length}] ${track.slug}`)
    await kie.downloadFile(track.audioUrl, dest)
  }

  r2.log('Transcribing (loads the Whisper model once for the whole batch)...')
  execFileSync(python, ['scripts/transcribe-songs.py', '--dir', path.relative(ROOT, AUDIO_TMP_DIR)], {
    cwd: ROOT,
    stdio: 'inherit',
  })

  fs.rmSync(AUDIO_TMP_DIR, { recursive: true, force: true })

  const failed = tracks.filter((t) => !fs.existsSync(path.join(TIMESTAMPS_DIR, `${t.slug}.json`)))
  r2.log(`Done. ${tracks.length - failed.length}/${tracks.length} unblocked this run.`)
  if (failed.length > 0) {
    r2.warn(`Still missing timestamps: ${failed.map((t) => t.slug).join(', ')}`)
  }
}

main().catch((e) => { r2.err(e.message); process.exit(1) })
