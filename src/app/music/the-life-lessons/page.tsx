import type { Metadata } from 'next'
import { scanMusicFolder, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Life Lessons I Hope You Learn',
  description: 'Seventeen songs from the Atlantic shore to the last true thing. The debut album by NoiraCiel — Atlantic Noir and Sea-Soul.',
  alternates: { canonical: 'https://noiraciel.com/music/the-life-lessons' },
  openGraph: {
    title: 'The Life Lessons I Hope You Learn — NoiraCiel',
    description: 'Seventeen songs from the Atlantic shore to the last true thing. Atlantic Noir and Sea-Soul.',
    url: 'https://noiraciel.com/music/the-life-lessons',
    type: 'music.album',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'The Life Lessons I Hope You Learn — NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Life Lessons I Hope You Learn — NoiraCiel',
    description: 'Seventeen songs from the Atlantic shore to the last true thing.',
    images: ['/images/album-cover.png'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: 'The Life Lessons I Hope You Learn',
  byArtist: {
    '@type': 'MusicGroup',
    name: 'NoiraCiel',
    url: 'https://noiraciel.com',
  },
  url: 'https://noiraciel.com/music/the-life-lessons',
  image: 'https://noiraciel.com/images/album-cover.png',
  description: 'Seventeen songs from the Atlantic shore to the last true thing. Atlantic Noir and Sea-Soul.',
  numTracks: 17,
  genre: ['Atlantic Noir', 'Sea-Soul'],
}

export default async function TheLifeLessonsPage() {
  const catalogue = await scanMusicFolder()
  const mainTracks = catalogue.tracks.filter(t => t.albumSlug === 'main')
  const totalDuration = mainTracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)

  return (
    <>
      <JsonLd data={albumSchema} />
      <AlbumPage
        catalogue={{
          ...catalogue,
          tracks: mainTracks,
          total: mainTracks.length,
          albumMeta: {
            ...catalogue.albumMeta,
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug="main"
        crossLink={{ href: '/music', label: 'All Albums' }}
        bookLink={{ href: '/book/the-life-lessons', label: 'Read The Life Lessons — A Book' }}
      />
    </>
  )
}
