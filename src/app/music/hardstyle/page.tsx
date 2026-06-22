import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'hardstyle'

export const metadata: Metadata = {
  title: 'Hardstyle',
  description: 'TODO: write a real description for Hardstyle.',
  alternates: { canonical: 'https://noiraciel.com/music/hardstyle' },
  openGraph: {
    title: 'Hardstyle',
    description: 'TODO: write a real description for Hardstyle.',
    url: 'https://noiraciel.com/music/hardstyle',
    type: 'music.album',
    images: [{ url: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/hardstyle.jpg', width: 1200, height: 1200, alt: 'Hardstyle album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hardstyle',
    description: 'TODO: write a real description for Hardstyle.',
    images: ['https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/hardstyle.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Hardstyle',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/hardstyle',
  image: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/hardstyle.jpg',
  description: 'TODO: write a real description for Hardstyle.',
  genre: ["Hardstyle","Electronic"],
}

export default async function HardstylePage() {
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
