import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { scanMusicFolder } from '@/lib/musicScanner'
import SongChapterPage from '@/components/SongChapterPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const catalogue = await scanMusicFolder()
  const track = catalogue.tracks.find((t) => t.slug === slug)
  if (!track) return { title: 'Song not found' }

  return {
    title: `${track.title} — NoiraCiel`,
    description: `"${track.title}" from The Life Lessons I Hope You Learn by NoiraCiel. Atlantic Noir.`,
    openGraph: {
      title: `${track.title} — NoiraCiel`,
      description: `A chapter from The Life Lessons I Hope You Learn.`,
      type: 'music.song',
      ...(track.songArtUrl ? { images: [{ url: track.songArtUrl, width: 1200, height: 1200 }] } : {}),
    },
  }
}

export default async function SongPage({ params }: Props) {
  const { slug } = await params
  const catalogue = await scanMusicFolder()
  const trackIndex = catalogue.tracks.findIndex((t) => t.slug === slug)
  if (trackIndex === -1) notFound()

  const track = catalogue.tracks[trackIndex]
  const prev = catalogue.tracks[trackIndex - 1] ?? null
  const next = catalogue.tracks[trackIndex + 1] ?? null

  return <SongChapterPage track={track} prev={prev} next={next} allTracks={catalogue.tracks} />
}
