#!/usr/bin/env node
'use strict'
/**
 * backup-manifests.js
 * Nightly backup of the critical, public-safe JSON manifests that drive the
 * live site — to a SECOND location (R2, under backups/) so a repeat of the
 * disk-full lyric-videos.json truncation has a recovery path beyond "hope
 * git has a recent enough commit."
 *
 * Deliberately a whitelist, not a directory scan: data/*.json (scholarship
 * donations/applications) contains applicant PII and must never go through
 * this — the R2 bucket is public, so anything uploaded here is effectively
 * public. PII backups belong somewhere access-controlled, not here.
 *
 * Usage: node scripts/backup-manifests.js
 */

const fs = require('fs')
const path = require('path')
const r2 = require('./lib/r2-client')

const ROOT = path.join(__dirname, '..')

const FILES = [
  'public/music-catalogue.json',
  'public/lyric-videos.json',
  'public/music-videos.json',
  'public/albums.json',
  'public/ghost-performance/config.json',
  'public/directors-cut-commentary.json',
  'public/Audio/audiobook-manifest.json',
  'public/Books/stories-manifest.json',
  'public/generated/kie/cinemagraphs-manifest.json',
  'public/images/social/manifest.json',
  'public/images/objects/manifest.json',
  'public/images/chapter-banners/manifest.json',
  'public/images/song-art/manifest.json',
  'public/images/artist/manifest.json',
  'public/images/lyric-backgrounds/manifest.json',
  'public/images/gallery/manifest.json',
  'public/images/video-backgrounds-metal/manifest.json',
  'public/images/video-backgrounds-jazz/manifest.json',
  'public/images/backgrounds/manifest.json',
  'public/images/merch/manifest.json',
]

async function main() {
  const dateStamp = new Date().toISOString().slice(0, 10)
  r2.log(`Backing up ${FILES.length} manifest(s) to backups/latest/ and backups/${dateStamp}/`)

  let ok = 0, skipped = 0, failed = 0
  for (const rel of FILES) {
    const localPath = path.join(ROOT, rel)
    if (!fs.existsSync(localPath)) {
      r2.warn(`skip (not found): ${rel}`)
      skipped++
      continue
    }
    try {
      // Verify it's actually valid JSON before backing it up — no point
      // preserving a copy of something already corrupted.
      JSON.parse(fs.readFileSync(localPath, 'utf-8'))
    } catch (e) {
      r2.err(`skip (invalid JSON, not backing up a corrupt file): ${rel} — ${e.message}`)
      failed++
      continue
    }
    try {
      await r2.uploadFile(localPath, `backups/latest/${rel}`)
      await r2.uploadFile(localPath, `backups/${dateStamp}/${rel}`)
      ok++
    } catch (e) {
      r2.err(`failed: ${rel} — ${e.message}`)
      failed++
    }
  }

  r2.log(`\nDone. ${ok} backed up, ${skipped} skipped (not found), ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main().catch((e) => { r2.err(e.message); process.exit(1) })
