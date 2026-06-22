import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import { scanMusicFolder, DISCOGRAPHY } from '@/lib/musicScanner'
import SongChapterPage from '@/components/SongChapterPage'
import { JsonLd } from '@/components/JsonLd'

const BG_DIR_MAP: Record<string, string> = {
  'main':                      'video-backgrounds',
  'blind-angel':               'video-backgrounds-metal',
  'jazz-sessions':             'video-backgrounds-jazz',
  'the-velvet-machine':        'video-backgrounds',
  'still-we-sail':             'video-backgrounds',
  'whats-youre-made-of':       'video-backgrounds',
  'the-sacred-drift':          'video-backgrounds',
}

const slugManifestCache = new Map<string, Set<string>>()
function loadSlugManifest(relPath: string): Set<string> {
  const cached = slugManifestCache.get(relPath)
  if (cached) return cached
  let set = new Set<string>()
  try {
    const slugs = JSON.parse(fs.readFileSync(path.join(process.cwd(), relPath), 'utf-8')) as string[]
    set = new Set(slugs)
  } catch {
    set = new Set()
  }
  slugManifestCache.set(relPath, set)
  return set
}

function sampleBgImages(albumSlug: string, count = 15): string[] {
  const subdir = BG_DIR_MAP[albumSlug] ?? 'video-backgrounds'
  const manifestPath = path.join(process.cwd(), 'public', 'images', subdir, '_files.json')
  try {
    const files = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as string[]
    const shuffled = [...files].sort(() => Math.random() - 0.5).slice(0, count)
    return shuffled.map((f) => `/images/${subdir}/${f}`)
  } catch {
    return []
  }
}

function getLyricExcerpt(lyrics: string | null, maxLen = 120): string | null {
  if (!lyrics) return null
  const lines = lyrics
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && l.toLowerCase() !== 'inspiration')
  const line = lines[0] ?? ''
  return line.length > maxLen ? line.slice(0, maxLen).replace(/\s\S*$/, '') + '…' : line || null
}

function secondsToISO8601(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `PT${m}M${s}S`
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const catalogue = await scanMusicFolder()
  const track = catalogue.tracks.find((t) => t.slug === slug)
  if (!track) return { title: 'Song Not Found' }

  const albumName = track.albumSlug === 'blind-angel'
    ? 'The Blind Angel — Intimate Metal Sessions'
    : track.albumSlug === 'jazz-sessions'
    ? 'NoiraCiel Jazz Sessions'
    : track.albumSlug === 'the-velvet-machine'
    ? 'The Velvet Machine'
    : track.albumSlug === 'still-we-sail'
    ? 'Still We Sail'
    : track.albumSlug === 'whats-youre-made-of'
    ? "What You're Made Of"
    : track.albumSlug === 'the-sacred-drift'
    ? 'The Sacred Drift'
    : 'The Life Lessons I Hope You Learn'

  const lyricExcerpt = getLyricExcerpt(track.lyrics)
  const description = lyricExcerpt
    ? `"${lyricExcerpt}" — a chapter from ${albumName}.`
    : `${track.title} — a chapter from ${albumName} by NoiraCiel.`

  const socialImage = track.socialCardUrl ?? track.songArtUrl ?? null
  const ogImageUrl = socialImage ?? '/images/album-cover.png'

  // G73: og:audio — point to the track audio file if available
  const audioUrl = track.audioUrl ? `https://noiraciel.com${track.audioUrl}` : undefined

  return {
    title: track.title,
    description,
    alternates: { canonical: `https://noiraciel.com/songs/${slug}` },
    openGraph: {
      title: track.title,
      description: lyricExcerpt ? `"${lyricExcerpt}"` : `A chapter from ${albumName}.`,
      type: 'music.song',
      url: `https://noiraciel.com/songs/${slug}`,
      images: [{ url: ogImageUrl, width: 1200, height: 1200, alt: `${track.title} — NoiraCiel` }],
      ...(audioUrl ? { audio: [{ url: audioUrl, type: 'audio/mpeg' }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: track.title,
      description: lyricExcerpt ? `"${lyricExcerpt}"` : `A chapter from ${albumName}.`,
      images: [ogImageUrl],
    },
  }
}

export default async function SongPage({ params }: Props) {
  const { slug } = await params
  const catalogue = await scanMusicFolder()
  const track = catalogue.tracks.find((t) => t.slug === slug)
  if (!track) notFound()

  const albumTracks = catalogue.tracks.filter((t) => t.albumSlug === track.albumSlug)
  const albumIndex = albumTracks.findIndex((t) => t.slug === slug)
  const prev = albumTracks[albumIndex - 1] ?? null
  const next = albumTracks[albumIndex + 1] ?? null

  const bgImages: string[] = []
  if (track.chapterBannerUrl) bgImages.push(track.chapterBannerUrl)
  if (track.songArtUrl) bgImages.push(track.songArtUrl)
  bgImages.push(...sampleBgImages(track.albumSlug ?? 'main', 15))

  const storyPath = path.join(process.cwd(), 'content', 'stories', `${slug}.md`)
  const story: string | null = fs.existsSync(storyPath) ? fs.readFileSync(storyPath, 'utf-8') : null

  // Audio/Books media now lives in R2 — availability is tracked by small local
  // manifests (slug lists) rather than checking local files that no longer exist.
  const audiobookUrl = loadSlugManifest('public/Audio/audiobook-manifest.json').has(slug)
    ? `/Audio/audiobook/${slug}.mp3`
    : null

  const storyPdfUrl = loadSlugManifest('public/Books/stories-manifest.json').has(slug)
    ? `/Books/stories/${slug}.pdf`
    : null

  const scoreManifestUrl = (() => {
    const f = path.join(process.cwd(), 'public', 'Books', 'scores', slug, 'manifest.json')
    return fs.existsSync(f) ? `/Books/scores/${slug}/manifest.json` : null
  })()

  const commentary = (() => {
    const p = path.join(process.cwd(), 'public', 'directors-cut-commentary.json')
    try {
      const map = JSON.parse(fs.readFileSync(p, 'utf-8')) as Record<string, string>
      return map[slug] ?? null
    } catch {
      return null
    }
  })()

  // DISCOGRAPHY is the single source of truth for every album's title/href —
  // scaffold-album.js appends new albums there, so this lookup covers every
  // album automatically instead of needing a new branch added by hand each time.
  const discographyEntry = DISCOGRAPHY.find((e) => e.slug === track.albumSlug)
  const albumName = discographyEntry?.meta.title ?? 'The Life Lessons I Hope You Learn'
  const albumHref = discographyEntry?.href ?? '/music/the-life-lessons'

  const socialImage = track.socialCardUrl ?? track.songArtUrl ?? null

  const trackSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title,
    byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
    inAlbum: {
      '@type': 'MusicAlbum',
      name: albumName,
      url: `https://noiraciel.com${albumHref}`,
    },
    url: `https://noiraciel.com/songs/${track.slug}`,
    ...(track.duration ? { duration: secondsToISO8601(track.duration) } : {}),
    ...(socialImage ? { image: `https://noiraciel.com${socialImage}` } : {}),
    ...(track.trackNumber ? { position: track.trackNumber } : {}),
  }

  return (
    <>
      <JsonLd data={trackSchema} />
      <SongChapterPage
        track={track}
        prev={prev}
        next={next}
        allTracks={albumTracks}
        albumIndex={albumIndex}
        bgImages={bgImages}
        story={story}
        audiobookUrl={audiobookUrl}
        storyPdfUrl={storyPdfUrl}
        scoreManifestUrl={scoreManifestUrl}
        commentary={commentary}
      />
    </>
  )
}
