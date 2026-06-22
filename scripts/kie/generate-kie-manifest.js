#!/usr/bin/env node
'use strict'
/**
 * generate-kie-manifest.js
 * Phase 1 — Scans all NoiraCiel songs and creates per-song KIE.AI manifests.
 *
 * Reads:  public/songs.json, public/albums.json, public/images/song-art/manifest.json
 * Writes: public/generated/kie/songs/{slug}.json (one per track)
 *         public/generated/kie/index.json         (master catalogue)
 *
 * Usage:
 *   node scripts/kie/generate-kie-manifest.js [--force]
 *
 * --force  Overwrites existing manifests (default: skip completed ones)
 */

const fs   = require('fs')
const path = require('path')

const ROOT    = path.join(__dirname, '..', '..')
const OUT_DIR = path.join(ROOT, 'public', 'generated', 'kie', 'songs')
const IDX     = path.join(ROOT, 'public', 'generated', 'kie', 'index.json')
const FORCE   = process.argv.includes('--force')

const R2_BASE = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

// ─── Load existing prompts context ───────────────────────────────────────────
const {
  SONG_CHAPTERS,
  BLIND_ANGEL_CONTEXT,
  JAZZ_SESSIONS_CONTEXT,
  WORLD_MUSICS_CONTEXT,
  FUNK_MY_WAY_IN_CONTEXT,
  REGGAE_SESSIONS_CONTEXT,
  NOIR_STYLE_SHORT,
} = (() => {
  try { return require('../lib/prompts') }
  catch { return { SONG_CHAPTERS: {}, BLIND_ANGEL_CONTEXT: {}, JAZZ_SESSIONS_CONTEXT: {}, WORLD_MUSICS_CONTEXT: {}, FUNK_MY_WAY_IN_CONTEXT: {}, REGGAE_SESSIONS_CONTEXT: {}, NOIR_STYLE_SHORT: '' } }
})()

// ─── Helpers ─────────────────────────────────────────────────────────────────
function read(fp) {
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) } catch { return null }
}
function exists(fp) { return fs.existsSync(fp) }

function r2Url(localPath) {
  // Convert public/images/... to R2 URL
  const rel = localPath.replace(/^public\//, '')
  return `${R2_BASE}/${rel}`
}

function getAlbumSlug(track) {
  if (track.albumSlug) return track.albumSlug
  const code = (track.albumCode ?? '').toUpperCase()
  if (code === 'HD') return 'the-life-lessons'
  const album = (track.album ?? '').toLowerCase()
  if (album.includes('blind angel'))      return 'blind-angel'
  if (album.includes('jazz'))             return 'jazz-sessions'
  if (album.includes('world'))            return 'world-musics'
  if (album.includes('funk'))             return 'funk-my-way-in'
  if (album.includes('reggae'))           return 'reggae-sessions'
  if (album.includes('velvet machine'))   return 'the-velvet-machine'
  if (album.includes('sacred drift'))     return 'the-sacred-drift'
  if (album.includes('still we sail'))    return 'still-we-sail'
  if (album.includes("what's you're made") || album.includes('whats youre')) return 'whats-youre-made-of'
  if (album.includes('bare'))             return 'bare-and-still-breathing'
  return 'unknown'
}

function getContext(track) {
  const albumSlug = getAlbumSlug(track)
  if (albumSlug === 'blind-angel')    return BLIND_ANGEL_CONTEXT?.[track.slug]   ?? null
  if (albumSlug === 'jazz-sessions')  return JAZZ_SESSIONS_CONTEXT?.[track.slug] ?? null
  if (albumSlug === 'world-musics')   return WORLD_MUSICS_CONTEXT?.[track.slug]  ?? null
  if (albumSlug === 'funk-my-way-in') return FUNK_MY_WAY_IN_CONTEXT?.[track.slug]?? null
  if (albumSlug === 'reggae-sessions')return REGGAE_SESSIONS_CONTEXT?.[track.slug]?? null
  return SONG_CHAPTERS?.[track.trackNumber ?? 0] ?? null
}

function getMood(albumSlug, context) {
  const moodMap = {
    'the-life-lessons':      'intimate · emotional · Atlantic soul · human dignity · searching',
    'blind-angel':           'dark spiritual · noir · powerful · sacred fire · sovereign',
    'jazz-sessions':         'soulful jazz · blues · emotional range · raw truth · warmth',
    'world-musics':          'global rhythms · ancestral · migration · sacred ritual · wide horizon',
    'funk-my-way-in':        'funk · groove · liberation · joy with depth · body wisdom',
    'reggae-sessions':       'reggae · resistance · warmth · community · roots',
    'the-velvet-machine':    'electronic · dark industrial · tension · complexity',
    'the-sacred-drift':      'ambient · sacred · drift · wide open · contemplative',
    'still-we-sail':         'Atlantic noir · trip-pop · drum & bass · saudade · exile',
    'whats-youre-made-of':   'introspection · identity · material truth · honest questioning',
    'bare-and-still-breathing': 'raw vulnerability · stripped back · survival · quiet fire',
  }
  return moodMap[albumSlug] ?? 'dark cinematic · emotional · NoiraCiel identity'
}

function getStyleForAlbum(albumSlug) {
  const styleMap = {
    'the-life-lessons':  'piano-led · fingerpicked guitar · intimate soul · cinematic sweep',
    'blind-angel':       'dark epic · orchestral · raw power vocals · cinematic noir metal',
    'jazz-sessions':     'live jazz ensemble · acoustic soul · improvisation · warm grain',
    'world-musics':      'global percussion · kora · oud · polyrhythm · ancestral instruments',
    'funk-my-way-in':    'deep funk · bass-led · groove-forward · brass accents',
    'reggae-sessions':   'roots reggae · organ · bass · rhythm guitar · one-drop',
    'the-velvet-machine':'electronic · dark synth · industrial texture · machine pulse',
  }
  return styleMap[albumSlug] ?? 'cinematic · dark Atlantic · premium production'
}

function lyricsExcerpt(lyrics) {
  if (!lyrics) return ''
  const lines = lyrics.split('\n').filter(l => l.trim().length > 10)
  return lines.slice(0, 4).join(' / ').slice(0, 300)
}

// Normalise tracks from either schema (HD schema vs Still-We-Sail schema)
function normaliseTrack(t) {
  // HD schema: has `slug`, `audioUrl`, inline `lyrics`, `albumCode`
  // New schema: `id` is the slug, `audioSrc`, `lyricsPath`, `coverSrc`, `albumSlug`
  const slug       = t.slug ?? t.id ?? null
  const audioUrl   = t.audioUrl ?? t.audioSrc ?? null
  const coverArt   = t.coverArt ?? t.coverSrc ?? null
  const albumSlug  = t.albumSlug ?? getAlbumSlug(t)
  const lyrics     = t.lyrics ?? null
  const hasLyrics  = t.hasLyrics ?? (!!t.lyricsPath || !!lyrics)
  const lyricsPath = t.lyricsPath ?? null  // path to lyric file for new-schema tracks
  const bookPath   = t.bookPath   ?? null
  const scoresPath = t.scoresPath ?? null

  return {
    ...t,
    slug,
    audioUrl,
    coverArt,
    albumSlug,
    lyrics,
    hasLyrics,
    lyricsPath,
    bookPath,
    scoresPath,
  }
}

function blankAssetEntry(type) {
  const bases = {
    cinemagraph: {
      status: 'not_started',
      prompt: '',
      animationType: '',
      sourceImagePath: '',
      sourceImageUrl: '',
      videoLoopPath: '',
      publicUrl: '',
      taskId: null,
      model: 'kling-2.6',
      submittedAt: null,
      completedAt: null,
      error: null,
    },
    songFilm: {
      status: 'not_started',
      shots: [],
      assemblyPrompt: '',
      finalVideoPath: '',
      publicUrl: '',
      model: 'veo3',
      assembledAt: null,
      error: null,
    },
    commentary: {
      status: 'not_started',
      script: '',
      scriptPath: '',
      voicePath: '',
      avatarVideoPath: '',
      publicUrl: '',
      voiceModel: 'elevenlabs-text-to-dialogue-v3',
      voiceId: 'hpp4J3VqNfWAUOO0d1Us',
      taskId: null,
      submittedAt: null,
      completedAt: null,
      error: null,
    },
    audiobook: {
      status: 'not_started',
      narrationText: '',
      narrationPath: '',
      scorePath: '',
      finalMixPath: '',
      publicUrl: '',
      voiceModel: 'elevenlabs-text-to-dialogue-v3',
      scoreModel: 'suno-v5.5',
      taskId: null,
      submittedAt: null,
      completedAt: null,
      error: null,
    },
  }
  return bases[type] ?? {}
}

// ─── Build manifest for one track ────────────────────────────────────────────
function buildManifest(rawTrack, songArtManifest) {
  const track      = normaliseTrack(rawTrack)
  const slug       = track.slug
  const albumSlug  = track.albumSlug ?? getAlbumSlug(track)
  const context    = getContext(track)
  const mood       = getMood(albumSlug, context)
  const style      = getStyleForAlbum(albumSlug)

  // Resolve artwork path
  const artLocal  = path.join(ROOT, 'public', 'images', 'song-art', `${slug}.jpg`)
  const artExists = exists(artLocal)
  const artPath   = artExists ? `public/images/song-art/${slug}.jpg` : null
  const artUrl    = artPath ? r2Url(artPath) : null

  // Also check manifest for R2 URL
  const artManEntry = songArtManifest.find(e => e.slug === slug || e.id === slug)
  const resolvedArtUrl = artManEntry?.publicUrl ?? artManEntry?.url ?? artUrl

  // Resolve story PDF — check bookPath (new schema) or classic location
  let storyPath = null
  if (track.bookPath) {
    const absBook = path.join(ROOT, 'public', track.bookPath.replace(/^\//, ''))
    if (exists(absBook)) storyPath = track.bookPath.replace(/^\//, 'public/')
  }
  if (!storyPath) {
    const storyLocal = path.join(ROOT, 'public', 'Books', 'stories', `${slug}.pdf`)
    if (exists(storyLocal)) storyPath = `public/Books/stories/${slug}.pdf`
  }
  const storyExists = !!storyPath

  // Resolve lyrics timestamps
  const tsLocal  = path.join(ROOT, 'public', 'Lyrics', 'timestamps', `${slug}.json`)
  const tsExists = exists(tsLocal)
  const lyricsTimestampsPath = tsExists ? `public/Lyrics/timestamps/${slug}.json` : null

  const now = new Date().toISOString()

  return {
    songId:      track.id ?? `${albumSlug}-${slug}`,
    slug,
    title:       track.title,
    album:       track.album ?? '',
    albumSlug,
    albumCode:   track.albumCode ?? null,
    trackNumber: track.trackNumber ?? null,
    artist:      track.artist ?? 'NoiraCiel',
    duration:    track.duration ?? null,
    durationFormatted: track.durationFormatted ?? '',
    mood,
    style,
    hasLyrics:   track.hasLyrics ?? false,
    lyricsExcerpt: lyricsExcerpt(track.lyrics ?? ''),
    lyricsTimestampsPath,
    storyPath,
    artworkPath: artPath,
    artworkUrl:  resolvedArtUrl ?? null,
    audioUrl:    track.audioUrl ?? null,
    emotion:     context?.emotion ?? null,
    scene:       context?.scene   ?? null,
    symbols:     context?.symbols ?? null,
    arc:         context?.arc     ?? null,

    generatedAssets: {
      cinemagraph: blankAssetEntry('cinemagraph'),
      songFilm:    blankAssetEntry('songFilm'),
      commentary:  blankAssetEntry('commentary'),
      audiobook:   blankAssetEntry('audiobook'),
    },

    approvals: {
      cinemagraph: false,
      songFilm:    false,
      commentary:  false,
      audiobook:   false,
    },

    readiness: {
      cinemagraph: artExists    ? 'ready'        : 'missing_artwork',
      songFilm:    context      ? 'ready'        : 'missing_context',
      commentary:  track.hasLyrics ? 'ready'     : 'missing_lyrics',
      audiobook:   (storyExists || track.hasLyrics) ? 'ready' : 'missing_content',
    },

    createdAt:  now,
    updatedAt:  now,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // Load source data
  const songsData      = read(path.join(ROOT, 'public', 'songs.json'))
  const songArtManRaw  = read(path.join(ROOT, 'public', 'images', 'song-art', 'manifest.json'))
  const songArtManifest = Array.isArray(songArtManRaw) ? songArtManRaw : []

  if (!songsData) { console.error('✗ Cannot read public/songs.json'); process.exit(1) }

  const tracks = songsData.tracks ?? []
  if (!tracks.length) { console.error('✗ No tracks found in songs.json'); process.exit(1) }

  console.log(`\n── KIE.AI Manifest Generator ──────────────────────────────`)
  console.log(`   Tracks found: ${tracks.length}`)
  console.log(`   Output dir:   ${path.relative(ROOT, OUT_DIR)}`)
  console.log(`   Force mode:   ${FORCE ? 'yes — overwriting existing' : 'no — skipping completed'}\n`)

  const index = []
  let created = 0, skipped = 0

  for (const rawTrack of tracks) {
    const track = normaliseTrack(rawTrack)
    if (!track.slug) { console.log(`  SKIP (no slug or id): ${track.title ?? '?'}`); skipped++; continue }

    const outFile = path.join(OUT_DIR, `${track.slug}.json`)

    if (!FORCE && exists(outFile)) {
      const existing = read(outFile)
      // Only skip if no prompts have been generated (all still blank)
      const hasWork = existing?.generatedAssets?.cinemagraph?.prompt
      if (hasWork) { console.log(`  skip (prompt exists): ${track.slug}`); skipped++; index.push({ slug: track.slug, title: track.title, albumSlug: existing.albumSlug }); continue }
    }

    const manifest = buildManifest(rawTrack, songArtManifest)
    fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), 'utf-8')
    console.log(`  ✓ ${track.slug}`)
    created++

    index.push({
      slug:       manifest.slug,
      title:      manifest.title,
      album:      manifest.album,
      albumSlug:  manifest.albumSlug,
      trackNumber:manifest.trackNumber,
      hasLyrics:  manifest.hasLyrics,
      hasArtwork: !!manifest.artworkPath,
      hasStory:   !!manifest.storyPath,
      readiness:  manifest.readiness,
      manifestPath: `public/generated/kie/songs/${track.slug}.json`,
    })
  }

  // Write master index
  const indexPayload = {
    generatedAt: new Date().toISOString(),
    totalSongs:  index.length,
    songs:       index.sort((a, b) => (a.albumSlug ?? '').localeCompare(b.albumSlug ?? '') || (a.trackNumber ?? 0) - (b.trackNumber ?? 0)),
  }
  fs.writeFileSync(IDX, JSON.stringify(indexPayload, null, 2), 'utf-8')

  console.log(`\n── Summary ───────────────────────────────────────────────`)
  console.log(`   Created:  ${created} manifests`)
  console.log(`   Skipped:  ${skipped} (already exist)`)
  console.log(`   Index:    public/generated/kie/index.json`)
  console.log(`\nNext: node scripts/kie/generate-cinemagraph-prompts.js\n`)
}

main()
