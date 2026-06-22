import type { Metadata } from 'next'
import { scanMusicFolder, BLIND_ANGEL_META, BLIND_ANGEL_SLUG, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Blind Angel — Intimate Metal Sessions',
  description: 'Seventeen descents. One return. Written in ash and cold pale stone — the Intimate Metal album by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/music/blind-angel' },
  openGraph: {
    title: 'The Blind Angel — Intimate Metal Sessions · NoiraCiel',
    description: 'Seventeen descents. One return. Written in ash and cold pale stone.',
    url: 'https://noiraciel.com/music/blind-angel',
    type: 'music.album',
    images: [{ url: '/images/album-covers/blind-angel.jpg', width: 1200, height: 1200, alt: 'The Blind Angel — Intimate Metal Sessions album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Blind Angel — Intimate Metal Sessions · NoiraCiel',
    description: 'Seventeen descents. One return. Written in ash and cold pale stone.',
    images: ['/images/album-covers/blind-angel.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'The Blind Angel — Intimate Metal Sessions',
  byArtist: {
    '@type': 'MusicGroup',
    name: 'NoiraCiel',
    url: 'https://noiraciel.com',
  },
  url: 'https://noiraciel.com/music/blind-angel',
  image: 'https://noiraciel.com/images/album-covers/blind-angel.jpg',
  description: 'Seventeen descents. One return. Written in ash and cold pale stone.',
  genre: ['Intimate Metal'],
}

export default async function BlindAngelPage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter(t => t.albumSlug === BLIND_ANGEL_SLUG)
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
            ...BLIND_ANGEL_META,
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={BLIND_ANGEL_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
        bookLink={{ href: '/book/blind-angel', label: 'Read The Blind Angel — A Book' }}
      />
    </>
  )
}
