import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'neon-saints'

const DESCRIPTION = "Hymns sung by people who work night shifts inside systems built to replace them — a sacred technology where the machine is the cathedral and the congregation is whoever is still clocked in at 3am. Dark cyber-soul, industrial DnB, gospel shadows, jazz harmony."
const COVER = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/clock-in-hymn.jpg'

export const metadata: Metadata = {
  title: 'Neon Saints of the Machine',
  description: DESCRIPTION,
  alternates: { canonical: 'https://noiraciel.com/music/neon-saints' },
  openGraph: {
    title: 'Neon Saints of the Machine',
    description: DESCRIPTION,
    url: 'https://noiraciel.com/music/neon-saints',
    type: 'music.album',
    images: [{ url: COVER, width: 1200, height: 1200, alt: 'Neon Saints of the Machine album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neon Saints of the Machine',
    description: DESCRIPTION,
    images: [COVER],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Neon Saints of the Machine',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/neon-saints',
  image: COVER,
  description: DESCRIPTION,
  genre: ["Dark Cyber-Soul","Industrial DnB","Gospel Shadows","Jazz Harmony"],
}

export default async function NeonSaintsPage() {
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
