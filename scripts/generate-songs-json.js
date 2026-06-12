#!/usr/bin/env node
/**
 * generate-songs-json.js
 *
 * Scans the /Music folder and writes public/songs.json.
 * Use this when deploying to environments where runtime fs access is restricted.
 *
 *   node scripts/generate-songs-json.js
 */

const fs = require('fs')
const path = require('path')

const MUSIC_DIR = path.join(__dirname, '..', 'Music')
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'songs.json')
const SUPPORTED = /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i

const ALBUM = {
  title: 'The Life Lessons I Hope You Learn',
  artist: 'NoiraCiel',
  spotifyUrl: 'https://open.spotify.com/album/49QDSwM3584OawGtC0O7eR?si=yTeObxPpRBivSExi1ehuXg',
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function parseFilename(filename) {
  const noExt = filename.replace(SUPPORTED, '')
  const m = noExt.match(/^([a-z]+)_(\d+)\s*-\s*(.+)$/i)
  if (m) return { albumCode: m[1].toUpperCase(), trackNumber: parseInt(m[2], 10), title: m[3].trim() }
  const m2 = noExt.match(/^(\d+)[\s._-]+(.+)$/)
  if (m2) return { albumCode: null, trackNumber: parseInt(m2[1], 10), title: m2[2].trim() }
  return { albumCode: null, trackNumber: null, title: noExt.trim() }
}

function formatDuration(seconds) {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTotal(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

async function getAudioDuration(filePath) {
  try {
    const mm = require('music-metadata')
    const meta = await mm.parseFile(filePath, { duration: true })
    return meta.format.duration ?? null
  } catch {
    return null
  }
}

function readLyrics(audioFilename) {
  const txtName = audioFilename.replace(SUPPORTED, '.txt')
  const txtPath = path.join(MUSIC_DIR, txtName)
  if (!fs.existsSync(txtPath)) return null
  try {
    return fs.readFileSync(txtPath, 'utf-8').trim()
  } catch {
    return null
  }
}

async function main() {
  if (!fs.existsSync(MUSIC_DIR)) {
    console.error(`Music directory not found: ${MUSIC_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED.test(f)).sort()
  console.log(`Found ${files.length} audio files in /Music`)

  const tracks = []

  for (const filename of files) {
    const filePath = path.join(MUSIC_DIR, filename)
    process.stdout.write(`  Processing: ${filename} ... `)

    const parsed = parseFilename(filename)
    const duration = await getAudioDuration(filePath)
    const lyrics = readLyrics(filename)

    tracks.push({
      id: slugify(filename),
      title: parsed.title,
      filename,
      slug: slugify(parsed.title),
      trackNumber: parsed.trackNumber,
      albumCode: parsed.albumCode,
      duration,
      durationFormatted: formatDuration(duration),
      format: filename.split('.').pop().toUpperCase(),
      album: ALBUM.title,
      artist: ALBUM.artist,
      audioUrl: `/api/audio/${encodeURIComponent(filename)}`,
      coverArt: null,
      lyrics,
      hasLyrics: lyrics !== null,
      videoUrl: null,
      videoTaskId: null,
      videoStatus: 'none',
    })

    console.log(`✓ ${parsed.title} (${formatDuration(duration)})`)
  }

  // Sort by track number
  tracks.sort((a, b) => {
    if (a.trackNumber !== null && b.trackNumber !== null) return a.trackNumber - b.trackNumber
    return a.title.localeCompare(b.title)
  })

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)

  const output = {
    generatedAt: new Date().toISOString(),
    album: {
      ...ALBUM,
      totalDuration,
      totalDurationFormatted: formatTotal(totalDuration),
    },
    tracks,
    total: tracks.length,
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\n✅ Written to ${OUTPUT_FILE}`)
  console.log(`   ${tracks.length} tracks · ${formatTotal(totalDuration)} total`)
  console.log(`   ${tracks.filter((t) => t.hasLyrics).length} tracks have lyrics`)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
