#!/usr/bin/env node
/**
 * sync-video-thumbnails.js
 *
 * Audits lyric-videos.json and assigns the best unique thumbnail for every
 * video entry that is missing one or still using a shared fallback image.
 *
 * Priority order for thumbnail candidates:
 *   1. song-art manifest (exact slug match)
 *   2. chapter-banners manifest (exact slug match)
 *   3. song-art manifest (manual override map)
 *   4. Remaining pool images (round-robin, never reused across an album)
 *
 * USAGE
 *   node scripts/sync-video-thumbnails.js         # dry-run: show proposed changes
 *   node scripts/sync-video-thumbnails.js --apply # write changes to lyric-videos.json
 *   node scripts/sync-video-thumbnails.js --audit # show all entries + current status
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const PUBLIC_DIR     = path.join(__dirname, '..', 'public')
const LYRIC_VIDEOS   = path.join(PUBLIC_DIR, 'Videos', 'lyric-videos.json')
const SONG_ART_DIR   = path.join(PUBLIC_DIR, 'images', 'song-art')
const BANNERS_DIR    = path.join(PUBLIC_DIR, 'images', 'chapter-banners')

const APPLY = process.argv.includes('--apply')
const AUDIT = process.argv.includes('--audit')

// ─── Load manifests ───────────────────────────────────────────────────────────
function loadManifest(dir) {
  const p = path.join(dir, 'manifest.json')
  if (!fs.existsSync(p)) return {}
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return {} }
}

function loadAllImages(dir, publicPrefix) {
  if (!fs.existsSync(dir)) return {}
  const map = {}
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(f)) continue
    const slug = f.replace(/\.(jpg|jpeg|png|webp)$/i, '')
    map[slug] = `${publicPrefix}/${f}`
  }
  return map
}

// ─── Manual override map ──────────────────────────────────────────────────────
// Add entries here whenever you want a specific track to use a specific image
// regardless of slug matching. Key = trackId, value = public image path.
const MANUAL_OVERRIDES = {
  // reggae sessions
  'brighter-days-ahead':       '/images/chapter-banners/one-more-morning.jpg',
  'built-on-love':             '/images/chapter-banners/roots.jpg',
  'chase-your-dreams':         '/images/song-art/start-somewhere.jpg',
  'cris-de-guerre':            '/images/song-art/the-truth-has-teeth.jpg',
  'good-vibes-no-reason':      '/images/chapter-banners/open-eye.jpg',
  'guardians-of-freedom':      '/images/song-art/fear-was-never-the-point.jpg',
  'hope-through-the-storm':    '/images/song-art/after-the-storm.jpg',
  'journey-of-patience':       '/images/song-art/slow-becoming.jpg',
  'love-at-first-sight':       '/images/song-art/she-dances-like-a-memory.jpg',
  'motherlands-cry':           '/images/song-art/saudade-has-a-weight.jpg',
  'motherlands-cry-1':         '/images/song-art/grief-in-different-latitudes.jpg',
  'rise-from-ashes':           '/images/song-art/you-were-never-broken.jpg',
  'rise-up-and-shine':         '/images/chapter-banners/show-up.jpg',
  'stop-the-war':              '/images/song-art/the-version-that-survived.jpg',
  'sweet-melody-of-love':      '/images/chapter-banners/nothing-needs-fixing-tonight.jpg',
  'through-the-pain-and-the-strife': '/images/song-art/the-weight-that-taught-you.jpg',
  'walk-with-kindness':        '/images/chapter-banners/the-good-youve-done.jpg',
  'waves-of-resilience':       '/images/song-art/all-the-water-between.jpg',
  'you-are-enough':            '/images/chapter-banners/permission.jpg',
}

// Images that should never be used as a fallback (too generic, already over-used as cover)
const BLOCKLIST = new Set([
  '/images/song-art/the-quiet-revolution.jpg',
])

// ─── Resolve best thumbnail for a video entry ─────────────────────────────────
function resolveThumbnail(video, songArtMap, bannerMap, usedInAlbum) {
  const trackId = video.trackId ?? ''

  // 1. Manual override — always wins
  if (MANUAL_OVERRIDES[trackId]) {
    const p = MANUAL_OVERRIDES[trackId]
    if (fileExists(p)) return { url: p, source: 'override' }
  }

  // 2. Exact slug match in song-art manifest
  if (songArtMap[trackId] && fileExists(songArtMap[trackId])) {
    return { url: songArtMap[trackId], source: 'song-art manifest' }
  }

  // 3. Exact slug match in chapter-banners
  if (bannerMap[trackId] && fileExists(bannerMap[trackId])) {
    return { url: bannerMap[trackId], source: 'chapter-banner' }
  }

  // 4. Pool: pick the first image not already used in this album
  const pool = [
    ...Object.values(bannerMap),
    ...Object.values(songArtMap),
  ].filter(url => !BLOCKLIST.has(url) && !usedInAlbum.has(url))

  if (pool.length > 0) {
    return { url: pool[0], source: 'pool fallback' }
  }

  return null
}

function fileExists(publicUrl) {
  if (!publicUrl) return false
  const abs = path.join(PUBLIC_DIR, publicUrl.replace(/^\//, ''))
  return fs.existsSync(abs)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const songArtManifest = loadManifest(SONG_ART_DIR)
  const bannerManifest  = loadManifest(BANNERS_DIR)
  const songArtAll      = loadAllImages(SONG_ART_DIR, '/images/song-art')
  const bannerAll       = loadAllImages(BANNERS_DIR, '/images/chapter-banners')

  // Merge manifest + filesystem scan (manifest takes priority for public URL)
  const songArtMap = { ...songArtAll, ...songArtManifest }
  const bannerMap  = { ...bannerAll, ...bannerManifest }

  const data = JSON.parse(fs.readFileSync(LYRIC_VIDEOS, 'utf-8'))
  const videos = data.videos ?? []

  let changes = 0
  let ok = 0
  let skipped = 0

  // Group by albumSlug to track which images are used per album
  const usedPerAlbum = {}

  // First pass: collect already-assigned good thumbnails
  for (const v of videos) {
    const album = v.albumSlug ?? 'main'
    usedPerAlbum[album] = usedPerAlbum[album] ?? new Set()
    const current = v.thumbnail
    if (current && !BLOCKLIST.has(current) && fileExists(current)) {
      usedPerAlbum[album].add(current)
    }
  }

  // Second pass: fix missing/blocked thumbnails
  for (const v of videos) {
    const album = v.albumSlug ?? 'main'
    const used  = usedPerAlbum[album]
    const current = v.thumbnail

    const needsFix = !current || BLOCKLIST.has(current) || !fileExists(current)

    if (AUDIT) {
      const status = needsFix ? '⚠ NEEDS FIX' : '✓ OK'
      console.log(`  ${status.padEnd(14)} ${(v.albumSlug ?? 'main').padEnd(22)} ${v.title.padEnd(42)} ${current ?? 'NONE'}`)
      continue
    }

    if (!needsFix) {
      ok++
      continue
    }

    const resolved = resolveThumbnail(v, songArtMap, bannerMap, used)
    if (!resolved) {
      console.warn(`  ⚠  Could not resolve thumbnail for "${v.title}" (${v.id})`)
      skipped++
      continue
    }

    const old = current ?? 'NONE'
    if (APPLY) {
      v.thumbnail = resolved.url
      used.add(resolved.url)
    }
    console.log(`  ${APPLY ? '✓' : '→'} [${resolved.source}] "${v.title}"\n     ${old}\n     ${resolved.url}`)
    changes++
  }

  if (AUDIT) return

  console.log(`\n  Summary: ${ok} OK · ${changes} changed · ${skipped} unresolvable`)

  if (APPLY && changes > 0) {
    fs.writeFileSync(LYRIC_VIDEOS, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    console.log(`  ✓ Wrote ${LYRIC_VIDEOS}`)
  } else if (!APPLY && changes > 0) {
    console.log(`  Run with --apply to write changes.`)
  }
}

main()
