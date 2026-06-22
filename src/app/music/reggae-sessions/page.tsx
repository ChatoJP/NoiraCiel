import type { Metadata } from 'next'
import { scanMusicFolder, formatAlbumDuration, REGGAE_SESSIONS_SLUG } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reggae Sessions',
  description: 'Nineteen chapters of roots, dub, and soul — NoiraCiel Reggae Sessions.',
  alternates: { canonical: 'https://noiraciel.com/music/reggae-sessions' },
  openGraph: {
    title: 'Reggae Sessions — NoiraCiel',
    description: 'Nineteen chapters of roots, dub, and soul — NoiraCiel Reggae Sessions.',
    url: 'https://noiraciel.com/music/reggae-sessions',
    type: 'music.album',
    images: [{ url: '/images/song-art/the-quiet-revolution.jpg', width: 1200, height: 1200, alt: 'Reggae Sessions — NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reggae Sessions — NoiraCiel',
    description: 'Nineteen chapters of roots, dub, and soul — NoiraCiel Reggae Sessions.',
    images: ['/images/song-art/the-quiet-revolution.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Reggae Sessions',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/reggae-sessions',
  description: 'Nineteen chapters of roots, dub, and soul — NoiraCiel Reggae Sessions.',
  numTracks: 19,
  genre: ['Reggae', 'Roots', 'Dub'],
}

export default async function ReggaeSessionsPage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter(t => t.albumSlug === REGGAE_SESSIONS_SLUG)
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
            title: 'Reggae Sessions',
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={REGGAE_SESSIONS_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
