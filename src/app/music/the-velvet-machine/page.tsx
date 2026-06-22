import type { Metadata } from 'next'
import { scanMusicFolder, formatAlbumDuration, VELVET_MACHINE_SLUG } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Velvet Machine',
  description: 'Fifteen songs where fado meets the dancefloor and the machine learns to feel. The second album by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/music/the-velvet-machine' },
  openGraph: {
    title: 'The Velvet Machine — NoiraCiel',
    description: 'Fifteen songs where fado meets the dancefloor and the machine learns to feel.',
    url: 'https://noiraciel.com/music/the-velvet-machine',
    type: 'music.album',
    images: [{ url: '/images/song-art/the-velvet-machine.jpg', width: 1200, height: 1200, alt: 'The Velvet Machine — NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Velvet Machine — NoiraCiel',
    description: 'Fifteen songs where fado meets the dancefloor and the machine learns to feel.',
    images: ['/images/song-art/the-velvet-machine.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'The Velvet Machine',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/the-velvet-machine',
  image: 'https://noiraciel.com/images/song-art/the-velvet-machine.jpg',
  description: 'Fifteen songs where fado meets the dancefloor and the machine learns to feel.',
  numTracks: 15,
  genre: ['Electronic', 'Fado', 'Atlantic Noir'],
}

export default async function TheVelvetMachinePage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter(t => t.albumSlug === VELVET_MACHINE_SLUG)
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
            title: 'The Velvet Machine',
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={VELVET_MACHINE_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
