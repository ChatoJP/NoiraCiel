import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = 'black-sun-gospel'

export const metadata: Metadata = {
  title: 'Black Sun Gospel',
  description: "A gospel record for people who left the church but kept the fire — redemption with no theology attached, just scars, dignity and the chord changes that used to mean something. Dark soul, blues-rock, cinematic gospel, slow-burn DnB/half-time.",
  alternates: { canonical: 'https://noiraciel.com/music/black-sun-gospel' },
  openGraph: {
    title: 'Black Sun Gospel',
    description: "A gospel record for people who left the church but kept the fire — redemption with no theology attached, just scars, dignity and the chord changes that used to mean something. Dark soul, blues-rock, cinematic gospel, slow-burn DnB/half-time.",
    url: 'https://noiraciel.com/music/black-sun-gospel',
    type: 'music.album',
    images: [{ url: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/black-sun-rising.jpg', width: 1200, height: 1200, alt: 'Black Sun Gospel album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Black Sun Gospel',
    description: "A gospel record for people who left the church but kept the fire — redemption with no theology attached, just scars, dignity and the chord changes that used to mean something. Dark soul, blues-rock, cinematic gospel, slow-burn DnB/half-time.",
    images: ['https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/black-sun-rising.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'Black Sun Gospel',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/black-sun-gospel',
  image: 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/song-art/black-sun-rising.jpg',
  description: "A gospel record for people who left the church but kept the fire — redemption with no theology attached, just scars, dignity and the chord changes that used to mean something. Dark soul, blues-rock, cinematic gospel, slow-burn DnB/half-time.",
  genre: ["Dark Soul","Blues-Rock","Cinematic Gospel","Slow-Burn DnB/Half-Time"],
}

export default async function BlackSunGospelPage() {
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
