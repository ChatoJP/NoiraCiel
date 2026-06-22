import type { Metadata } from 'next'
import { scanMusicFolder, formatAlbumDuration, WHATS_YOURE_MADE_OF_SLUG } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "What You're Made Of",
  description: "Fifteen songs about resilience, becoming, and the quiet revolution inside you. Hip-Hop · DnB · Soul · Trap · Piano & Violin by NoiraCiel.",
  alternates: { canonical: 'https://noiraciel.com/music/whats-youre-made-of' },
  openGraph: {
    title: "What You're Made Of — NoiraCiel",
    description: 'Fifteen songs about resilience, becoming, and the quiet revolution inside you.',
    url: 'https://noiraciel.com/music/whats-youre-made-of',
    type: 'music.album',
    images: [{ url: '/images/song-art/whats-youre-made-of.jpg', width: 1200, height: 1200, alt: "What You're Made Of — NoiraCiel" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "What You're Made Of — NoiraCiel",
    description: 'Fifteen songs about resilience, becoming, and the quiet revolution inside you.',
    images: ['/images/song-art/whats-youre-made-of.jpg'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: "What You're Made Of",
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/whats-youre-made-of',
  image: 'https://noiraciel.com/images/song-art/whats-youre-made-of.jpg',
  description: 'Fifteen songs about resilience, becoming, and the quiet revolution inside you.',
  numTracks: 15,
  genre: ['Hip-Hop', 'DnB', 'Soul', 'Trap', 'Atlantic Noir'],
}

export default async function WhatsYoureMadeOfPage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter(t => t.albumSlug === WHATS_YOURE_MADE_OF_SLUG)
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
            title: "What You're Made Of",
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={WHATS_YOURE_MADE_OF_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
