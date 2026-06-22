import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'classic'

export const metadata: Metadata = {
  title: 'Classic',
  description: 'TODO: write a real description for Classic.',
  alternates: { canonical: 'https://noiraciel.com/music/classic' },
  openGraph: {
    title: 'Classic',
    description: 'TODO: write a real description for Classic.',
    url: 'https://noiraciel.com/music/classic',
    type: 'music.album',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'Classic album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Classic',
    description: 'TODO: write a real description for Classic.',
    images: ['/images/album-cover.png'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Classic',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/classic',
  image: 'https://noiraciel.com/images/album-cover.png',
  description: 'TODO: write a real description for Classic.',
  genre: ["Classic"],
}

export default async function ClassicPage() {
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
