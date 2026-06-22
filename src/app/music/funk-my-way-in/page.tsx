import type { Metadata } from 'next'
import { scanMusicFolder, formatAlbumDuration, FUNK_MY_WAY_IN_SLUG } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Funk My Way In',
  description: 'Five deep-groove funk instrumentals by NoiraCiel — soul, rhythm, and raw feeling.',
  alternates: { canonical: 'https://noiraciel.com/music/funk-my-way-in' },
  openGraph: {
    title: 'Funk My Way In — NoiraCiel',
    description: 'Five deep-groove funk instrumentals by NoiraCiel — soul, rhythm, and raw feeling.',
    url: 'https://noiraciel.com/music/funk-my-way-in',
    type: 'music.album',
    images: [{ url: '/images/song-art/the-work-nobody-sees.jpg', width: 1200, height: 1200, alt: 'Funk My Way In — NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Funk My Way In — NoiraCiel',
    description: 'Five deep-groove funk instrumentals by NoiraCiel — soul, rhythm, and raw feeling.',
    images: ['/images/song-art/the-work-nobody-sees.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Funk My Way In',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/funk-my-way-in',
  description: 'Five deep-groove funk instrumentals by NoiraCiel — soul, rhythm, and raw feeling.',
  numTracks: 5,
  genre: ['Funk', 'Soul', 'Groove'],
}

export default async function FunkMyWayInPage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter(t => t.albumSlug === FUNK_MY_WAY_IN_SLUG)
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
            title: 'Funk My Way In',
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={FUNK_MY_WAY_IN_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
