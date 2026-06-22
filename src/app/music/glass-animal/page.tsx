import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'glass-animal'

const DESCRIPTION = "A private museum of one person's masks — fourteen rooms and a hallway, where every object on display is something the narrator used to survive being looked at. Experimental art-pop, trip-pop, chamber soul, fragile electronic jazz."

export const metadata: Metadata = {
  title: 'The Glass Animal',
  description: DESCRIPTION,
  alternates: { canonical: 'https://noiraciel.com/music/glass-animal' },
  openGraph: {
    title: 'The Glass Animal',
    description: DESCRIPTION,
    url: 'https://noiraciel.com/music/glass-animal',
    type: 'music.album',
    images: [{ url: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/the-entrance-hall.jpg', width: 1200, height: 1200, alt: 'The Glass Animal album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Glass Animal',
    description: DESCRIPTION,
    images: ['https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/the-entrance-hall.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'The Glass Animal',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/glass-animal',
  image: 'https://noiraciel.com/images/album-cover.png',
  description: DESCRIPTION,
  genre: ["Experimental Art-Pop","Trip-Pop","Chamber Soul","Fragile Electronic Jazz"],
}

export default async function GlassAnimalPage() {
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
