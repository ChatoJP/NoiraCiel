import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'the-memory-atlas'

const DESCRIPTION = "A cartographer's record of a childhood that can only be reached by half-remembered roads — every song a different room in a house that doesn't exist anymore, mapped from memory instead of geography. Cinematic puzzle-pop, art-rock, orchestral trip-hop, emotional electronic folk."
const COVER = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/the-drawer-that-still-sticks.jpg'

export const metadata: Metadata = {
  title: 'The Memory Atlas',
  description: DESCRIPTION,
  alternates: { canonical: 'https://noiraciel.com/music/the-memory-atlas' },
  openGraph: {
    title: 'The Memory Atlas',
    description: DESCRIPTION,
    url: 'https://noiraciel.com/music/the-memory-atlas',
    type: 'music.album',
    images: [{ url: COVER, width: 1200, height: 1200, alt: 'The Memory Atlas album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Memory Atlas',
    description: DESCRIPTION,
    images: [COVER],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'The Memory Atlas',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/the-memory-atlas',
  image: COVER,
  description: DESCRIPTION,
  genre: ["Cinematic Puzzle-Pop","Art-Rock","Orchestral Trip-Hop","Emotional Electronic Folk"],
}

export default async function TheMemoryAtlasPage() {
  const entry = DISCOGRAPHY.find((e) => e.slug === ALBUM_SLUG)!
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter((t) => t.albumSlug === ALBUM_SLUG)
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)

  return (
    <>
      <JsonLd data={albumSchema} />
      <AlbumPage
        catalogue={{
          ...catalogue,
          tracks,
          total: tracks.length,
          albumMeta: {
            ...entry.meta,
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={ALBUM_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
