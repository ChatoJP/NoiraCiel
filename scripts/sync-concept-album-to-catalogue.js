#!/usr/bin/env node
'use strict'
/**
 * sync-concept-album-to-catalogue.js
 * Pushes concept-album tracks whose music is complete into
 * public/music-catalogue.json (the static snapshot production reads —
 * Music/ lives in R2, scanMusicFolder() can't live-scan it).
 *
 * Idempotent: re-running updates an existing entry in place (e.g. when
 * songArt/chapterBanner finish after music) rather than duplicating it.
 * Only tracks with music.state === 'complete' are published — a song with
 * no audio yet has nothing to play, so it stays out of the live catalogue
 * until the gating asset (audio) exists. Images/lyric-video/etc. stay
 * gracefully absent (null) on the Track until later steps generate them.
 *
 * Usage: node scripts/sync-concept-album-to-catalogue.js --album salt-cathedral
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
  console.error('Usage: node scripts/sync-concept-album-to-catalogue.js --album <slug>')
  process.exit(1)
}

const CATALOGUE_PATH = path.join(__dirname, '..', 'public', 'music-catalogue.json')

function buildTrack(concept, track, entry) {
  const numStr = String(track.num).padStart(2, '0')
  return {
    id: `${concept.slug}-${numStr}-${track.slug}`,
    title: track.title,
    filename: `${numStr}_${track.slug}.mp3`,
    slug: track.slug,
    trackNumber: track.num,
    albumCode: null,
    albumSlug: concept.slug,
    duration: entry.music.duration ?? null,
    durationFormatted: entry.music.durationFormatted ?? '',
    format: 'MP3',
    album: concept.title,
    artist: 'NoiraCiel',
    year: new Date().getFullYear(),
    genre: concept.genre,
    audioUrl: entry.music.audioUrl,
    coverArt: entry.songArt.url ?? null,
    lyrics: track.lyrics,
    hasLyrics: true,
    videoUrl: null,
    videoTaskId: null,
    videoStatus: 'none',
    songArtUrl: entry.songArt.url ?? null,
    socialCardUrl: null,
    chapterBannerUrl: entry.chapterBanner.url ?? null,
    lyricVideoUrl: null,
    musicVideoUrl: null,
  }
}

function main() {
  const concept = pipeline.loadConcept(albumSlug)
  const tracks  = pipeline.loadTracks(albumSlug)
  const status  = pipeline.loadStatus(albumSlug)

  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'))
  const bySlug = new Map(catalogue.tracks.map((t, i) => [t.slug, i]))

  let added = 0, updated = 0, skipped = 0
  for (const track of tracks) {
    const entry = status[track.slug]
    if (!entry || entry.music.state !== 'complete') { skipped++; continue }

    const newTrack = buildTrack(concept, track, entry)
    if (bySlug.has(track.slug)) {
      const i = bySlug.get(track.slug)
      // Preserve any fields a later step (karaoke video, music video, ghost
      // performance) may have already written, merging rather than clobbering.
      catalogue.tracks[i] = { ...catalogue.tracks[i], ...newTrack,
        lyricVideoUrl: catalogue.tracks[i].lyricVideoUrl ?? newTrack.lyricVideoUrl,
        musicVideoUrl: catalogue.tracks[i].musicVideoUrl ?? newTrack.musicVideoUrl,
        ghostPerformance: catalogue.tracks[i].ghostPerformance,
      }
      updated++
    } else {
      catalogue.tracks.push(newTrack)
      bySlug.set(track.slug, catalogue.tracks.length - 1)
      added++
    }
  }

  catalogue.total = catalogue.tracks.length
  r2.atomicWriteJSON(CATALOGUE_PATH, catalogue)
  console.log(`${albumSlug}: ${added} added, ${updated} updated, ${skipped} skipped (music not complete yet). Total catalogue tracks: ${catalogue.total}`)
}

main()
