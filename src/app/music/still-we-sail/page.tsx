import type { Metadata } from 'next'
import { scanMusicFolder, formatAlbumDuration, STILL_WE_SAIL_SLUG } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Still We Sail',
  description: 'Fifteen songs about distance, belonging, and what crosses water. The third album by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/music/still-we-sail' },
  openGraph: {
    title: 'Still We Sail — NoiraCiel',
    description: 'Fifteen songs about distance, belonging, and what crosses water.',
    url: 'https://noiraciel.com/music/still-we-sail',
    type: 'music.album',
    images: [{ url: '/images/song-art/still-we-sail.jpg', width: 1200, height: 1200, alt: 'Still We Sail — NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Still We Sail — NoiraCiel',
    description: 'Fifteen songs about distance, belonging, and what crosses water.',
    images: ['/images/song-art/still-we-sail.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Still We Sail',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/still-we-sail',
  image: 'https://noiraciel.com/images/song-art/still-we-sail.jpg',
  description: 'Fifteen songs about distance, belonging, and what crosses water.',
  numTracks: 15,
  genre: ['Atlantic Noir', 'Fado', 'Sea-Soul'],
}

export default async function StillWeSailPage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter(t => t.albumSlug === STILL_WE_SAIL_SLUG)
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
            ...catalogue.albumMeta,
            title: 'Still We Sail',
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={STILL_WE_SAIL_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
