#!/usr/bin/env node
'use strict'
/**
 * sync-local-album-to-catalogue.js
 * Pushes a local-albums ingest manifest (data/local-albums/{slug}/manifest.json,
 * written by ingest-local-album.js) into public/music-catalogue.json — same
 * idempotent merge-by-slug pattern as sync-concept-album-to-catalogue.js.
 * These tracks have no lyrics/art/etc. generated — every optional field
 * stays null so the existing graceful-degradation UI hides those sections.
 *
 * Usage: node scripts/sync-local-album-to-catalogue.js --album metal
 */

const fs = require('fs')
const path = require('path')
const r2 = require('./lib/r2-client')

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? def : process.argv[i + 1]
}

const albumSlug = arg('album')
if (!albumSlug) {
  console.error('Usage: node scripts/sync-local-album-to-catalogue.js --album <slug>')
  process.exit(1)
}

const MANIFEST_PATH = path.join(__dirname, '..', 'data', 'local-albums', albumSlug, 'manifest.json')
const CATALOGUE_PATH = path.join(__dirname, '..', 'public', 'music-catalogue.json')

function buildTrack(manifest, t) {
  return {
    id: `${manifest.slug}-${String(t.num).padStart(2, '0')}-${t.slug}`,
    title: t.title,
    filename: t.filename,
    slug: t.slug,
    trackNumber: t.num,
    albumCode: null,
    albumSlug: manifest.slug,
    duration: t.duration ?? null,
    durationFormatted: t.durationFormatted ?? '',
    format: t.format ?? 'MP3',
    album: manifest.title,
    artist: 'NoiraCiel',
    year: new Date().getFullYear(),
    genre: manifest.title,
    audioUrl: t.audioUrl,
    coverArt: null,
    lyrics: null,
    hasLyrics: false,
    videoUrl: null,
    videoTaskId: null,
    videoStatus: 'none',
    songArtUrl: null,
    socialCardUrl: null,
    chapterBannerUrl: null,
    lyricVideoUrl: null,
    musicVideoUrl: null,
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'))
  const bySlug = new Map(catalogue.tracks.map((t, i) => [t.slug, i]))

  let added = 0, updated = 0
  for (const t of manifest.tracks) {
    const newTrack = buildTrack(manifest, t)
    if (bySlug.has(t.slug)) {
      const i = bySlug.get(t.slug)
      catalogue.tracks[i] = { ...catalogue.tracks[i], ...newTrack }
      updated++
    } else {
      catalogue.tracks.push(newTrack)
      bySlug.set(t.slug, catalogue.tracks.length - 1)
      added++
    }
  }

  catalogue.total = catalogue.tracks.length
  r2.atomicWriteJSON(CATALOGUE_PATH, catalogue)
  console.log(`${albumSlug}: ${added} added, ${updated} updated. Total catalogue tracks: ${catalogue.total}`)
}

main()
