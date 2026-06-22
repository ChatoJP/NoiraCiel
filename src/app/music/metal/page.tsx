import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'metal'

export const metadata: Metadata = {
  title: 'Metal',
  description: 'TODO: write a real description for Metal.',
  alternates: { canonical: 'https://noiraciel.com/music/metal' },
  openGraph: {
    title: 'Metal',
    description: 'TODO: write a real description for Metal.',
    url: 'https://noiraciel.com/music/metal',
    type: 'music.album',
    images: [{ url: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/metal.jpg', width: 1200, height: 1200, alt: 'Metal album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metal',
    description: 'TODO: write a real description for Metal.',
    images: ['https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/metal.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Metal',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/metal',
  image: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/metal.jpg',
  description: 'TODO: write a real description for Metal.',
  genre: ["Metal Sessions"],
}

export default async function MetalPage() {
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
