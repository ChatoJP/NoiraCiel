import path from 'path'
import fs from 'fs'
import { parseFilename, formatDuration, slugify, getAudioFormat } from './formatters'
import type { Track, MusicCatalogue, Album, AlbumMeta } from './types'

const SUPPORTED_FORMATS = /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i
const MUSIC_DIR = path.join(process.cwd(), 'Music')

export const ALBUM_META: AlbumMeta = {
  title: 'The Life Lessons I Hope You Learn',
  artist: 'NoiraCiel',
  spotifyUrl:    'https://open.spotify.com/album/49QDSwM3584OawGtC0O7eR?si=yTeObxPpRBivSExi1ehuXg',
  appleMusicUrl: 'https://music.apple.com/us/artist/noiraciel/6776477025',
  youtubeUrl:    'https://www.youtube.com/channel/UCFjqshj-v26mmHlkFNZFNMQ',
  totalDuration: 0,
  totalDurationFormatted: '',
}

function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

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

function readLyrics(filename: string): string | null {
  const txtFilename = filename.replace(SUPPORTED_FORMATS, '.txt')
  const txtPath = path.join(MUSIC_DIR, txtFilename)
  if (!fs.existsSync(txtPath)) return null
  try {
    return fs.readFileSync(txtPath, 'utf-8').trim()
  } catch {
    return null
  }
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

function readImageManifest(subdir: string): Record<string, string> {
  try {
    const p = path.join(process.cwd(), 'public', 'Images', subdir, 'manifest.json')
    if (!fs.existsSync(p)) return {}
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

export async function scanMusicFolder(): Promise<MusicCatalogue> {
  if (!fs.existsSync(MUSIC_DIR)) {
    return { tracks: [], albums: [], albumMeta: ALBUM_META, total: 0 }
  }

  const files = fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED_FORMATS.test(f))
  files.sort()

  const videoData       = readVideosJson()
  const songArtMap      = readImageManifest('song-art')
  const socialCardMap   = readImageManifest('social')
  const chapterBannerMap = readImageManifest('chapter-banners')
  const lyricVideosDir  = path.join(process.cwd(), 'public', 'Videos', 'lyrics')
  const tracks: Track[] = []

  for (const filename of files) {
    const filePath = path.join(MUSIC_DIR, filename)
    const parsed = parseFilename(filename)
    const meta = await parseAudioFile(filePath)
    const lyrics = readLyrics(filename)

    const title = meta.title || parsed.title
    const titleSlug = slugify(title)
    const videoEntry = videoData[slugify(filename)]

    const track: Track = {
      id: slugify(filename),
      title,
      filename,
      slug: titleSlug,
      trackNumber: meta.trackNumber ?? parsed.trackNumber,
      albumCode: parsed.albumCode,
      duration: meta.duration,
      durationFormatted: formatDuration(meta.duration),
      format: getAudioFormat(filename),
      album: meta.album ?? ALBUM_META.title,
      artist: meta.artist ?? ALBUM_META.artist,
      year: meta.year ?? null,
      genre: meta.genre ?? 'Atlantic Noir',
      audioUrl: `/api/audio/${encodeURIComponent(filename)}`,
      coverArt: null,
      lyrics,
      hasLyrics: lyrics !== null,
      videoUrl: videoEntry?.url ?? null,
      videoTaskId: videoEntry?.taskId ?? null,
      videoStatus: (videoEntry?.status as Track['videoStatus']) ?? 'none',
      songArtUrl: songArtMap[titleSlug] ?? null,
      socialCardUrl: socialCardMap[titleSlug] ?? null,
      chapterBannerUrl: chapterBannerMap[titleSlug] ?? null,
      lyricVideoUrl: fs.existsSync(path.join(lyricVideosDir, `${titleSlug}.mp4`))
        ? `/Videos/lyrics/${titleSlug}.mp4`
        : null,
    }

    tracks.push(track)
  }

  // Sort by track number
  tracks.sort((a, b) => {
    if (a.trackNumber !== null && b.trackNumber !== null) return a.trackNumber - b.trackNumber
    return a.title.localeCompare(b.title)
  })

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
  const albumMeta: AlbumMeta = {
    ...ALBUM_META,
    totalDuration,
    totalDurationFormatted: formatTotalDuration(totalDuration),
  }

  // Group into albums
  const albumMap = new Map<string, Album>()
  for (const track of tracks) {
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
    tracks,
    albums: Array.from(albumMap.values()),
    albumMeta,
    total: tracks.length,
  }
}
