import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPathById, buildPathResult } from '@/lib/noiracielPathEngine'
import { getDailyGlyph, getCurrentWave } from '@/data/mayanInterpretations'
import PathResultView from './PathResultView'

export const dynamic = 'force-dynamic' // depends on today's glyph / wave

interface Props {
  params: Promise<{ pathId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pathId } = await params
  const path = getPathById(pathId)
  if (!path) return { title: 'Your NoiraCiel Path' }
  return {
    title: `${path.name} — Your NoiraCiel Path`,
    description: path.description,
    openGraph: { title: `${path.name} — Your NoiraCiel Path`, description: path.description },
  }
}

export default async function PathPage({ params }: Props) {
  const { pathId } = await params
  const path = getPathById(pathId)
  if (!path) notFound()

  const glyph = getDailyGlyph()
  const wave = getCurrentWave()
  const result = buildPathResult(path, { glyph, wave })

  const view = {
    pathId: path.id,
    pathName: path.name,
    description: path.description,
    emotionalWorld: result.emotionalWorld,
    albumTitle: result.albumTitle,
    albumHref: result.albumHref,
    albumWorld: result.albumWorld,
    songTitle: result.songTitle,
    songHref: result.songHref,
    bookTitle: result.bookTitle,
    bookHref: result.bookHref,
    roomId: result.roomId,
    roomName: result.roomName,
    speakerMode: result.speakerMode,
    glyphAffinity: result.glyphAffinity,
    dailyGlyphConnection: result.dailyGlyphConnection,
    waveConnection: result.waveConnection,
    reflectionQuestion: result.reflectionQuestion,
    firstAction: result.firstAction,
  }

  return <PathResultView view={view} />
}
