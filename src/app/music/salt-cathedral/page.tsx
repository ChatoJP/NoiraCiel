import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'salt-cathedral'

const DESCRIPTION = "An ocean liner's worth of guilt, exile and wonder, sung from inside a chapel built of salt and weather — a place where confession dissolves the moment it's spoken and the sea keeps every secret anyway. Atlantic noir, sea-soul, trip-hop jazz, oceanic DnB."
const COVER = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/the-coat-i-left-on-the-rail.jpg'

export const metadata: Metadata = {
  title: 'The Salt Cathedral',
  description: DESCRIPTION,
  alternates: { canonical: 'https://noiraciel.com/music/salt-cathedral' },
  openGraph: {
    title: 'The Salt Cathedral',
    description: DESCRIPTION,
    url: 'https://noiraciel.com/music/salt-cathedral',
    type: 'music.album',
    images: [{ url: COVER, width: 1200, height: 1200, alt: 'The Salt Cathedral album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Salt Cathedral',
    description: DESCRIPTION,
    images: [COVER],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'The Salt Cathedral',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/salt-cathedral',
  image: COVER,
  description: DESCRIPTION,
  genre: ["Atlantic Noir","Sea-Soul","Trip-Hop Jazz","Oceanic DnB"],
}

export default async function SaltCathedralPage() {
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
