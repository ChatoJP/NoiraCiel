import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'ak96-party-session-1'

export const metadata: Metadata = {
  title: 'Ak96 Mixes — Party Session N1',
  description: 'TODO: write a real description for Ak96 Mixes — Party Session N1.',
  alternates: { canonical: 'https://noiraciel.com/music/ak96-party-session-1' },
  openGraph: {
    title: 'Ak96 Mixes — Party Session N1',
    description: 'TODO: write a real description for Ak96 Mixes — Party Session N1.',
    url: 'https://noiraciel.com/music/ak96-party-session-1',
    type: 'music.album',
    images: [{ url: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/ak96-party-session-1.jpg', width: 1200, height: 1200, alt: 'Ak96 Mixes — Party Session N1 album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ak96 Mixes — Party Session N1',
    description: 'TODO: write a real description for Ak96 Mixes — Party Session N1.',
    images: ['https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/ak96-party-session-1.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Ak96 Mixes — Party Session N1',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/ak96-party-session-1',
  image: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-covers/ak96-party-session-1.jpg',
  description: 'TODO: write a real description for Ak96 Mixes — Party Session N1.',
  genre: ["DJ Mix","Party Session"],
}

export default async function Ak96PartySession1Page() {
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
