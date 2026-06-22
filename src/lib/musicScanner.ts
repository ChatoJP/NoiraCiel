import path from 'path'
import fs from 'fs'
import { parseFilename, formatDuration, slugify, getAudioFormat } from './formatters'
import type { Track, MusicCatalogue, Album, AlbumMeta, GhostPerformanceMeta } from './types'

const SUPPORTED_FORMATS = /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i
const MUSIC_DIR = path.join(process.cwd(), 'Music')
const R2_BASE = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'
const MUSIC_R2_PREFIX = `${R2_BASE}/music/`

// Canonical display titles — corrects casing from ID3 tags or filenames.
const CANONICAL_TITLES: Record<string, string> = {
  'who-wins-if-i-win':      'Who Wins If I Win',
  'as-long-as-youre-okay':  "As Long as You're Okay",
  'still-worth-it':         'Still Worth It',
  'i-never-knew-any-other-way': 'I Never Knew Any Other Way',
  'free-men-tell-the-truth': 'Free Men Tell the Truth',
  'maybe-i-was-wrong':      'Maybe I Was Wrong',
  'side-by-side':           'Side by Side',
  // Funk my Way in — UUID filenames, sorted alphabetically → numbered 1-5
  '763c2d365d924ed5a3a726ae9e400fe5': 'NoiraCiel Funk Session Experience 1',
  '89294436cdb0435981ad11c9a3c04a68': 'NoiraCiel Funk Session Experience 2',
  '8f14132be3f044adab4bd3bb4c3aa1d3': 'NoiraCiel Funk Session Experience 3',
  'cd4a6f05a91c4d12a3c2bd34fe44bca4': 'NoiraCiel Funk Session Experience 4',
  'f480ce1a219145c8b7b23128791316f4': 'NoiraCiel Funk Session Experience 5',
}

export const ALBUM_META: AlbumMeta = {
  title: 'The Life Lessons I Hope You Learn',
  artist: 'NoiraCiel',
  spotifyUrl:    'https://open.spotify.com/album/49QDSwM3584OawGtC0O7eR?si=yTeObxPpRBivSExi1ehuXg',
  appleMusicUrl: 'https://music.apple.com/us/artist/noiraciel/6776477025',
  youtubeUrl:    'https://www.youtube.com/channel/UCFjqshj-v26mmHlkFNZFNMQ',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const JAZZ_SESSIONS_META: AlbumMeta = {
  title: 'NoiraCiel Jazz Sessions',
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const BLIND_ANGEL_META: AlbumMeta = {
  title: 'The Blind Angel — Intimate Metal Sessions',
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const VELVET_MACHINE_META: AlbumMeta = {
  title: 'The Velvet Machine',
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const STILL_WE_SAIL_META: AlbumMeta = {
  title: 'Still We Sail',
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const SACRED_DRIFT_META: AlbumMeta = {
  title: 'The Sacred Drift',
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const WHATS_YOURE_MADE_OF_META: AlbumMeta = {
  title: "What You're Made Of",
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const FUNK_MY_WAY_IN_META: AlbumMeta = {
  title: 'Funk My Way In',
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const WORLD_MUSICS_META: AlbumMeta = {
  title: 'World Musics',
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const REGGAE_SESSIONS_META: AlbumMeta = {
  title: 'Reggae Sessions',
  artist: 'NoiraCiel',
  spotifyUrl:    '',
  appleMusicUrl: '',
  youtubeUrl:    '',
  totalDuration: 0,
  totalDurationFormatted: '',
}

export const JAZZ_SESSIONS_SLUG          = 'jazz-sessions'
export const BLIND_ANGEL_SLUG            = 'blind-angel'
export const VELVET_MACHINE_SLUG         = 'the-velvet-machine'
export const STILL_WE_SAIL_SLUG          = 'still-we-sail'
export const WHATS_YOURE_MADE_OF_SLUG      = 'whats-youre-made-of'
export const SACRED_DRIFT_SLUG             = 'the-sacred-drift'
export const FUNK_MY_WAY_IN_SLUG           = 'funk-my-way-in'
export const WORLD_MUSICS_SLUG             = 'world-musics'
export const REGGAE_SESSIONS_SLUG          = 'reggae-sessions'

// ─── Discography registry ─────────────────────────────────────────────────────
// Single source of truth for all albums. Add new entries here to register them
// in the scanner, discography page, and API in one step.
export interface DiscographyEntry {
  slug:        string           // URL slug used in /music/[slug]
  href:        string           // full page path
  meta:        AlbumMeta
  coverSrc:    string | null    // null = use placeholder
  genre:       string
  subdirName:  string | null    // null = root Music/ directory (main album)
}

export const DISCOGRAPHY: DiscographyEntry[] = [
  {
    slug:       'main',
    href:       '/music/the-life-lessons',
    meta:       ALBUM_META,
    coverSrc:   '/images/album-cover.png',
    genre:      'Atlantic Noir · Sea-Soul',
    subdirName: null,
  },
  {
    slug:       JAZZ_SESSIONS_SLUG,
    href:       '/music/jazz-sessions',
    meta:       JAZZ_SESSIONS_META,
    coverSrc:   '/images/album-covers/jazz-sessions.jpg',
    genre:      'Jazz · Atlantic Noir',
    subdirName: 'NoiraCiel Jazz Sessions',
  },
  {
    slug:       BLIND_ANGEL_SLUG,
    href:       '/music/blind-angel',
    meta:       BLIND_ANGEL_META,
    coverSrc:   '/images/album-covers/blind-angel.jpg',
    genre:      'Intimate Metal',
    subdirName: 'The  Blind Angel - Intimate Metal Sessions',
  },
  {
    slug:       VELVET_MACHINE_SLUG,
    href:       '/music/the-velvet-machine',
    meta:       VELVET_MACHINE_META,
    coverSrc:   '/images/song-art/the-velvet-machine.jpg',
    genre:      'Electronic · Fado · Atlantic Noir',
    subdirName: 'The_Velvet_Machine',
  },
  {
    slug:       STILL_WE_SAIL_SLUG,
    href:       '/music/still-we-sail',
    meta:       STILL_WE_SAIL_META,
    coverSrc:   '/images/song-art/still-we-sail.jpg',
    genre:      'Atlantic Noir · Fado · Sea-Soul',
    subdirName: 'Still_We_Sail',
  },
  {
    slug:       WHATS_YOURE_MADE_OF_SLUG,
    href:       '/music/whats-youre-made-of',
    meta:       WHATS_YOURE_MADE_OF_META,
    coverSrc:   '/images/song-art/whats-youre-made-of.jpg',
    genre:      'Hip-Hop · DnB · Soul · Trap · Piano & Violin',
    subdirName: 'What_Youre_Made_Of',
  },
  {
    slug:       SACRED_DRIFT_SLUG,
    href:       '/music/the-sacred-drift',
    meta:       SACRED_DRIFT_META,
    coverSrc:   '/images/song-art/the-sacred-drift.jpg',
    genre:      'Indie Pop · R&B · DnB · Trip-Pop · Psych · Mantras',
    subdirName: 'The_Sacred_Drift',
  },
  {
    slug:       FUNK_MY_WAY_IN_SLUG,
    href:       '/music/funk-my-way-in',
    meta:       FUNK_MY_WAY_IN_META,
    coverSrc:   '/images/song-art/the-work-nobody-sees.jpg',
    genre:      'Funk · Soul · Groove',
    subdirName: 'Funk my Way in',
  },
  {
    slug:       WORLD_MUSICS_SLUG,
    href:       '/music/world-musics',
    meta:       WORLD_MUSICS_META,
    coverSrc:   '/images/song-art/so-hum.jpg',
    genre:      'World Music · African · Latin · Global',
    subdirName: 'World Musics',
  },
  {
    slug:       REGGAE_SESSIONS_SLUG,
    href:       '/music/reggae-sessions',
    meta:       REGGAE_SESSIONS_META,
    coverSrc:   '/images/song-art/the-quiet-revolution.jpg',
    genre:      'Reggae · Roots · Dub',
    subdirName: 'reggae Sessions',
  },
  {
    slug:       'salt-cathedral',
    href:       '/music/salt-cathedral',
    meta:       { title: 'The Salt Cathedral', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/the-coat-i-left-on-the-rail.jpg',
    genre:      'Atlantic Noir · Sea-Soul · Trip-Hop Jazz · Oceanic DnB',
    subdirName: 'The_Salt_Cathedral',
  },
  {
    slug:       'neon-saints',
    href:       '/music/neon-saints',
    meta:       { title: 'Neon Saints of the Machine', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/clock-in-hymn.jpg',
    genre:      'Dark Cyber-Soul · Industrial DnB · Gospel Shadows · Jazz Harmony',
    subdirName: 'Neon_Saints_of_the_Machine',
  },
  {
    slug:       'glass-animal',
    href:       '/music/glass-animal',
    meta:       { title: 'The Glass Animal', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/the-entrance-hall.jpg',
    genre:      'Experimental Art-Pop · Trip-Pop · Chamber Soul · Fragile Electronic Jazz',
    subdirName: 'The_Glass_Animal',
  },
  {
    slug:       'party-exploder',
    href:       '/music/party-exploder',
    meta:       { title: 'Party Exploder', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   '/images/album-cover.png',
    genre:      'Party Mix · Compilation',
    subdirName: 'Party_Exploder',
  },
  {
    slug:       'metal',
    href:       '/music/metal',
    meta:       { title: 'Metal', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   '/images/album-cover.png',
    genre:      'Metal Sessions',
    subdirName: 'Metal',
  },
  {
    slug:       'hardstyle',
    href:       '/music/hardstyle',
    meta:       { title: 'Hardstyle', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   '/images/album-cover.png',
    genre:      'Hardstyle · Electronic',
    subdirName: 'Hardstyle',
  },
  {
    slug:       'classic',
    href:       '/music/classic',
    meta:       { title: 'Classic', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   '/images/album-cover.png',
    genre:      'Classic',
    subdirName: 'Classic',
  },
  {
    slug:       'ak96-party-session-1',
    href:       '/music/ak96-party-session-1',
    meta:       { title: 'Ak96 Mixes — Party Session N1', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   '/images/album-cover.png',
    genre:      'DJ Mix · Party Session',
    subdirName: 'Ak96_Mixes_Party_Session_N1',
  },
  {
    slug:       'black-sun-gospel',
    href:       '/music/black-sun-gospel',
    meta:       { title: 'Black Sun Gospel', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/black-sun-rising.jpg',
    genre:      'Dark Soul · Blues-Rock · Cinematic Gospel · Slow-Burn DnB/Half-Time',
    subdirName: 'Black_Sun_Gospel',
  },
  {
    slug:       'the-memory-atlas',
    href:       '/music/the-memory-atlas',
    meta:       { title: 'The Memory Atlas', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/the-drawer-that-still-sticks.jpg',
    genre:      'Cinematic Puzzle-Pop · Art-Rock · Orchestral Trip-Hop · Emotional Electronic Folk',
    subdirName: 'The_Memory_Atlas',
  },
]

// Maps subdirectory name → { metadata, clean URL slug }  (derived from DISCOGRAPHY)
const SUBDIR_REGISTRY: Record<string, { meta: AlbumMeta; slug: string }> = Object.fromEntries(
  DISCOGRAPHY
    .filter(e => e.subdirName !== null)
    .map(e => [e.subdirName!, { meta: e.meta, slug: e.slug }])
)

export function formatAlbumDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

// internal alias kept for use below
const formatTotalDuration = formatAlbumDuration

async function parseAudioFile(filePath: string): Promise<{
  duration: number | null
  title: string | null
  artist: string | null
  album: string | null
  year: number | null
  genre: string | null
  trackNumber: number | null
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const mm = require('music-metadata') as any
    const metadata = await mm.parseFile(filePath, { duration: true })
    return {
      duration: metadata.format.duration ?? null,
      title: metadata.common.title ?? null,
      artist: metadata.common.artist ?? null,
      album: metadata.common.album ?? null,
      year: metadata.common.year ?? null,
      genre: metadata.common.genre?.[0] ?? null,
      trackNumber: metadata.common.track?.no ?? null,
    }
  } catch {
    return { duration: null, title: null, artist: null, album: null, year: null, genre: null, trackNumber: null }
  }
}

function stripLyricFrontmatter(raw: string): string {
  const sepIdx = raw.indexOf('\n---\n')
  if (sepIdx !== -1) return raw.slice(sepIdx + 5).trim()
  const sepIdxCr = raw.indexOf('\r\n---\r\n')
  if (sepIdxCr !== -1) return raw.slice(sepIdxCr + 7).trim()
  return raw.trim()
}

function readLyrics(dir: string, filename: string): string | null {
  // 1. Same dir, .txt (original albums)
  const txtFilename = filename.replace(SUPPORTED_FORMATS, '.txt')
  const txtPath = path.join(dir, txtFilename)
  if (fs.existsSync(txtPath)) {
    try { return fs.readFileSync(txtPath, 'utf-8').trim() } catch { return null }
  }

  // 2. ../lyrics/ subfolder (new albums: audio in audio/, lyrics in lyrics/)
  const lyricsDir = path.join(dir, '..', 'lyrics')
  if (fs.existsSync(lyricsDir)) {
    const stem = filename.replace(SUPPORTED_FORMATS, '')
    const baseStem = stem.replace(/_v\d+$/i, '')
    for (const candidate of [`${stem}.txt`, `${stem}.md`, `${baseStem}.txt`, `${baseStem}.md`]) {
      const p = path.join(lyricsDir, candidate)
      if (fs.existsSync(p)) {
        try { return stripLyricFrontmatter(fs.readFileSync(p, 'utf-8')) } catch { return null }
      }
    }
  }

  return null
}

function readVideosJson(): Record<string, { url: string; taskId: string; status: string }> {
  try {
    const videosPath = path.join(process.cwd(), 'public', 'Videos', 'index.json')
    if (!fs.existsSync(videosPath)) return {}
    const data = JSON.parse(fs.readFileSync(videosPath, 'utf-8'))
    return data
  } catch {
    return {}
  }
}

function readGhostPerformanceConfig(): Record<string, GhostPerformanceMeta> {
  try {
    const p = path.join(process.cwd(), 'public', 'ghost-performance', 'config.json')
    if (!fs.existsSync(p)) return {}
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

function readImageManifest(subdir: string): Record<string, string> {
  try {
    const p = path.join(process.cwd(), 'public', 'images', subdir, 'manifest.json')
    if (!fs.existsSync(p)) return {}
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

const LYRIC_VIDEO_DIRS: Record<string, string[]> = {
  'main':                      ['lyrics'],
  'blind-angel':               ['blind-angel-lyrics'],
  'jazz-sessions':             ['jazz-sessions-lyrics'],
  'reggae-sessions':           ['reggae-sessions-lyrics'],
  'the-velvet-machine':        ['velvet-machine-lyrics', 'lyrics'],
  'still-we-sail':             ['still-we-sail-lyrics', 'lyrics'],
  'whats-youre-made-of':       ['what-youre-made-of-lyrics', 'lyrics'],
  'the-sacred-drift':          ['the-sacred-drift-lyrics', 'lyrics'],
}

function readLyricVideosJson(): Record<string, string> {
  // Returns slug → video URL map from lyric-videos.json (R2 URLs post-migration)
  try {
    const p = path.join(process.cwd(), 'public', 'lyric-videos.json')
    if (!fs.existsSync(p)) return {}
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
    const map: Record<string, string> = {}
    for (const v of (data.videos ?? [])) {
      if (v.trackId && v.url) map[v.trackId] = v.url
    }
    return map
  } catch {
    return {}
  }
}

function readMusicVideosJson(): Record<string, string> {
  // Returns slug → video URL map from music-videos.json (R2 URLs)
  try {
    const p = path.join(process.cwd(), 'public', 'music-videos.json')
    if (!fs.existsSync(p)) return {}
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
    const map: Record<string, string> = {}
    for (const v of (data.videos ?? [])) {
      if (v.trackId && v.url) map[v.trackId] = v.url
    }
    return map
  } catch {
    return {}
  }
}

function getLyricVideoUrl(albumSlug: string, titleSlug: string, lyricVideoMap: Record<string, string>): string | null {
  // Primary: use the pre-built map from lyric-videos.json (R2 URLs)
  if (lyricVideoMap[titleSlug]) return lyricVideoMap[titleSlug]
  // Fallback: check local filesystem (dev environments)
  const subdirs = LYRIC_VIDEO_DIRS[albumSlug] ?? ['lyrics']
  for (const subdir of subdirs) {
    const file = path.join(process.cwd(), 'public', 'Videos', subdir, `${titleSlug}.mp4`)
    if (fs.existsSync(file)) return `/Videos/${subdir}/${titleSlug}.mp4`
  }
  return null
}

async function scanDirectory(
  dirPath: string,
  albumSlug: string,
  albumMeta: AlbumMeta,
  audioUrlPrefix: string,
  videoData: Record<string, { url: string; taskId: string; status: string }>,
  songArtMap: Record<string, string>,
  socialCardMap: Record<string, string>,
  chapterBannerMap: Record<string, string>,
  lyricVideoMap: Record<string, string>,
  musicVideoMap: Record<string, string>,
  ghostPerfConfig: Record<string, GhostPerformanceMeta> = {},
): Promise<Track[]> {
  const files = fs.readdirSync(dirPath).filter(f => SUPPORTED_FORMATS.test(f))
  files.sort()
  const tracks: Track[] = []

  for (const filename of files) {
    const filePath = path.join(dirPath, filename)
    const parsed = parseFilename(filename)
    const meta = await parseAudioFile(filePath)
    const lyrics = readLyrics(dirPath, filename)

    // Strip _v\d+ version suffix left by Suno filenames (e.g. "still-here_v1" → "still-here")
    const cleanedTitle = (meta.title || parsed.title).replace(/_v\d+$/i, '')
    const rawTitle = cleanedTitle.includes('-') && !cleanedTitle.includes(' ')
      ? cleanedTitle.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : cleanedTitle
    const titleSlug = slugify(rawTitle)
    const title = CANONICAL_TITLES[titleSlug] ?? rawTitle
    const slug = slugify(title)
    const videoEntry = videoData[slugify(filename)]

    const track: Track = {
      id: albumSlug === 'main' ? slugify(filename) : `${albumSlug}-${slugify(filename)}`,
      title,
      filename,
      slug,
      trackNumber: meta.trackNumber ?? parsed.trackNumber,
      albumCode: parsed.albumCode,
      albumSlug,
      duration: meta.duration,
      durationFormatted: formatDuration(meta.duration),
      format: getAudioFormat(filename),
      album: meta.album ?? albumMeta.title,
      artist: meta.artist ?? albumMeta.artist,
      year: meta.year ?? null,
      genre: meta.genre ?? 'Atlantic Noir',
      audioUrl: `${audioUrlPrefix}${encodeURIComponent(filename)}`,
      coverArt: null,
      lyrics,
      hasLyrics: lyrics !== null,
      videoUrl: videoEntry?.url ?? null,
      videoTaskId: videoEntry?.taskId ?? null,
      videoStatus: (videoEntry?.status as Track['videoStatus']) ?? 'none',
      songArtUrl: songArtMap[slug] ?? songArtMap[titleSlug] ?? null,
      socialCardUrl: socialCardMap[slug] ?? socialCardMap[titleSlug] ?? null,
      chapterBannerUrl: chapterBannerMap[slug] ?? chapterBannerMap[titleSlug] ?? null,
      lyricVideoUrl: getLyricVideoUrl(albumSlug, slug, lyricVideoMap),
      musicVideoUrl: musicVideoMap[slug] ?? null,
      ghostPerformance: ghostPerfConfig[slug] ?? undefined,
    }

    tracks.push(track)
  }

  return tracks
}

function loadCatalogueSnapshot(): MusicCatalogue | null {
  // Production: Music/ lives in R2, not on this server. The snapshot is a
  // one-time scan (titles, durations, lyrics, R2 audio URLs) regenerated via
  // scripts/snapshot-music-catalogue.js whenever the catalogue changes.
  const p = path.join(process.cwd(), 'public', 'music-catalogue.json')
  try {
    if (!fs.existsSync(p)) return null
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as MusicCatalogue
  } catch {
    return null
  }
}

export async function scanMusicFolder(): Promise<MusicCatalogue> {
  const snapshot = loadCatalogueSnapshot()
  if (snapshot) return snapshot

  // Dev fallback: no snapshot yet — scan a local Music/ folder directly.
  if (!fs.existsSync(MUSIC_DIR)) {
    return { tracks: [], albums: [], albumMeta: ALBUM_META, total: 0 }
  }

  const videoData        = readVideosJson()
  const songArtMap       = readImageManifest('song-art')
  const socialCardMap    = readImageManifest('social')
  const chapterBannerMap = readImageManifest('chapter-banners')
  const lyricVideoMap    = readLyricVideosJson()
  const musicVideoMap    = readMusicVideosJson()
  const ghostPerfConfig  = readGhostPerformanceConfig()

  // Scan root directory (main album — hd_ prefixed WAV files)
  const mainTracks = await scanDirectory(
    MUSIC_DIR, 'main', ALBUM_META, MUSIC_R2_PREFIX,
    videoData, songArtMap, socialCardMap, chapterBannerMap, lyricVideoMap, musicVideoMap, ghostPerfConfig,
  )
  mainTracks.sort((a, b) => {
    if (a.trackNumber !== null && b.trackNumber !== null) return a.trackNumber - b.trackNumber
    return a.title.localeCompare(b.title)
  })

  let allTracks: Track[] = [...mainTracks]

  // Scan each registered subdirectory as a separate album
  const entries = fs.readdirSync(MUSIC_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const registration = SUBDIR_REGISTRY[entry.name]
    if (!registration) continue

    const subdirPath = path.join(MUSIC_DIR, entry.name)

    // New albums store audio in a nested audio/ folder — detect and use it
    const audioSubdir = path.join(subdirPath, 'audio')
    const hasDirectAudio = fs.readdirSync(subdirPath).some(f => SUPPORTED_FORMATS.test(f))
    const scanPath      = (!hasDirectAudio && fs.existsSync(audioSubdir)) ? audioSubdir : subdirPath
    const audioUrlPrefix = scanPath === audioSubdir
      ? `${MUSIC_R2_PREFIX}${encodeURIComponent(entry.name)}/audio/`
      : `${MUSIC_R2_PREFIX}${encodeURIComponent(entry.name)}/`

    const subdirTracks = await scanDirectory(
      scanPath, registration.slug, registration.meta, audioUrlPrefix,
      videoData, songArtMap, socialCardMap, chapterBannerMap, lyricVideoMap, musicVideoMap, ghostPerfConfig,
    )
    subdirTracks.sort((a, b) => {
      if (a.trackNumber !== null && b.trackNumber !== null) return a.trackNumber - b.trackNumber
      return a.title.localeCompare(b.title)
    })

    allTracks = [...allTracks, ...subdirTracks]
  }

  const totalDuration = mainTracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
  const albumMeta: AlbumMeta = {
    ...ALBUM_META,
    totalDuration,
    totalDurationFormatted: formatTotalDuration(totalDuration),
  }

  // Group into albums by albumCode
  const albumMap = new Map<string, Album>()
  for (const track of allTracks) {
    const code = track.albumCode || 'SINGLES'
    if (!albumMap.has(code)) {
      albumMap.set(code, {
        code,
        title: code === 'HD' ? ALBUM_META.title : code === 'SINGLES' ? 'Singles' : `Album ${code}`,
        tracks: [],
        coverArt: null,
        year: null,
      })
    }
    albumMap.get(code)!.tracks.push(track)
  }

  return {
    tracks: allTracks,
    albums: Array.from(albumMap.values()),
    albumMeta,
    total: allTracks.length,
  }
}
