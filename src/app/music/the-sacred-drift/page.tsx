import type { Metadata } from 'next'
import { scanMusicFolder, formatAlbumDuration, SACRED_DRIFT_SLUG } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Sacred Drift',
  description: 'Fifteen songs woven with ancient mantras — Indie Pop, R&B, DnB, Trip-Pop, and Psychedelic frequencies by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/music/the-sacred-drift' },
  openGraph: {
    title: 'The Sacred Drift — NoiraCiel',
    description: 'Fifteen songs woven with ancient mantras — Indie Pop, R&B, DnB, Trip-Pop, and Psychedelic frequencies.',
    url: 'https://noiraciel.com/music/the-sacred-drift',
    type: 'music.album',
    images: [{ url: '/images/song-art/the-sacred-drift.jpg', width: 1200, height: 1200, alt: 'The Sacred Drift — NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Sacred Drift — NoiraCiel',
    description: 'Fifteen songs woven with ancient mantras — Indie Pop, R&B, DnB, Trip-Pop, and Psychedelic frequencies.',
    images: ['/images/song-art/the-sacred-drift.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'The Sacred Drift',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/the-sacred-drift',
  image: 'https://noiraciel.com/images/song-art/the-sacred-drift.jpg',
  description: 'Fifteen songs woven with ancient mantras — Indie Pop, R&B, DnB, Trip-Pop, and Psychedelic frequencies.',
  numTracks: 15,
  genre: ['Indie Pop', 'R&B', 'DnB', 'Trip-Pop', 'Psychedelic'],
}

export default async function TheSacredDriftPage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter(t => t.albumSlug === SACRED_DRIFT_SLUG)
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
            title: 'The Sacred Drift',
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={SACRED_DRIFT_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
