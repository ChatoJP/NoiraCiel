import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import DiscographyView from '@/components/DiscographyView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Music',
  description: 'Eight albums. One universe. Atlantic Noir, Jazz, Metal, Electronic, Hip-Hop, Acoustic, and Psychedelic — the full NoiraCiel discography.',
  alternates: { canonical: 'https://noiraciel.com/music' },
  openGraph: {
    title: 'Music — NoiraCiel',
    description: 'Eight albums. One universe. Atlantic Noir, Jazz, Metal, Electronic, Hip-Hop, Acoustic, and Psychedelic — the full NoiraCiel discography.',
    url: 'https://noiraciel.com/music',
    type: 'website',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'NoiraCiel discography' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Music — NoiraCiel',
    description: 'Eight albums. One universe. Atlantic Noir, Jazz, Metal, Electronic, Hip-Hop, Acoustic, and Psychedelic.',
    images: ['/images/album-cover.png'],
  },
}

export default async function MusicPage() {
  const catalogue = await scanMusicFolder()

  const sections = DISCOGRAPHY.map(entry => {
    const tracks = catalogue.tracks.filter(t => t.albumSlug === entry.slug)
    const totalDuration = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)
    return {
      entry,
      tracks,
      totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
    }
  })

  return <DiscographyView sections={sections} />
}
