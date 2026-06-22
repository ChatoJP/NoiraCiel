import type { Metadata } from 'next'
import { scanMusicFolder, formatAlbumDuration, WORLD_MUSICS_SLUG } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'World Musics',
  description: 'Fifteen instrumental journeys across continents — African rhythms, Latin pulse, and global soul by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/music/world-musics' },
  openGraph: {
    title: 'World Musics — NoiraCiel',
    description: 'Fifteen instrumental journeys across continents — African rhythms, Latin pulse, and global soul.',
    url: 'https://noiraciel.com/music/world-musics',
    type: 'music.album',
    images: [{ url: '/images/song-art/so-hum.jpg', width: 1200, height: 1200, alt: 'World Musics — NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Musics — NoiraCiel',
    description: 'Fifteen instrumental journeys across continents — African rhythms, Latin pulse, and global soul.',
    images: ['/images/song-art/so-hum.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'World Musics',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/world-musics',
  description: 'Fifteen instrumental journeys across continents — African rhythms, Latin pulse, and global soul by NoiraCiel.',
  numTracks: 15,
  genre: ['World Music', 'African', 'Latin', 'Global'],
}

export default async function WorldMusicsPage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter(t => t.albumSlug === WORLD_MUSICS_SLUG)
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
            title: 'World Musics',
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={WORLD_MUSICS_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
