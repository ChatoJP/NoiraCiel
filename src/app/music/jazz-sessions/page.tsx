import type { Metadata } from 'next'
import { scanMusicFolder, JAZZ_SESSIONS_META, JAZZ_SESSIONS_SLUG, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'NoiraCiel Jazz Sessions',
  description: 'Nine chapters at the edge of night. Jazz, forgiveness, and the hidden rivers running under everything — by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/music/jazz-sessions' },
  openGraph: {
    title: 'NoiraCiel Jazz Sessions',
    description: 'Nine chapters at the edge of night. Jazz, forgiveness, and the hidden rivers running under everything.',
    url: 'https://noiraciel.com/music/jazz-sessions',
    type: 'music.album',
    images: [{ url: '/images/album-covers/jazz-sessions.jpg', width: 1200, height: 1200, alt: 'NoiraCiel Jazz Sessions album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoiraCiel Jazz Sessions',
    description: 'Nine chapters at the edge of night. Jazz, forgiveness, and the hidden rivers running under everything.',
    images: ['/images/album-covers/jazz-sessions.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'NoiraCiel Jazz Sessions',
  byArtist: {
    '@type': 'MusicGroup',
    name: 'NoiraCiel',
    url: 'https://noiraciel.com',
  },
  url: 'https://noiraciel.com/music/jazz-sessions',
  image: 'https://noiraciel.com/images/album-covers/jazz-sessions.jpg',
  description: 'Nine chapters at the edge of night. Jazz, forgiveness, and the hidden rivers running under everything.',
  genre: ['Jazz', 'Atlantic Noir'],
}

export default async function JazzSessionsPage() {
  const catalogue = await scanMusicFolder()
  const jazzTracks = catalogue.tracks.filter(t => t.albumSlug === JAZZ_SESSIONS_SLUG)
  const totalDuration = jazzTracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)

  return (
    <>
      <JsonLd data={albumSchema} />
      <AlbumPage
        catalogue={{
          ...catalogue,
          tracks: jazzTracks,
          total: jazzTracks.length,
          albumMeta: {
            ...JAZZ_SESSIONS_META,
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={JAZZ_SESSIONS_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
        bookLink={{ href: '/book/jazz-sessions', label: 'Read NoiraCiel Jazz Sessions — A Book' }}
      />
    </>
  )
}
