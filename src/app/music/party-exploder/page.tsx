import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'party-exploder'

export const metadata: Metadata = {
  title: 'Party Exploder',
  description: 'TODO: write a real description for Party Exploder.',
  alternates: { canonical: 'https://noiraciel.com/music/party-exploder' },
  openGraph: {
    title: 'Party Exploder',
    description: 'TODO: write a real description for Party Exploder.',
    url: 'https://noiraciel.com/music/party-exploder',
    type: 'music.album',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'Party Exploder album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Party Exploder',
    description: 'TODO: write a real description for Party Exploder.',
    images: ['/images/album-cover.png'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Party Exploder',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/party-exploder',
  image: 'https://noiraciel.com/images/album-cover.png',
  description: 'TODO: write a real description for Party Exploder.',
  genre: ["Party Mix","Compilation"],
}

export default async function PartyExploderPage() {
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
