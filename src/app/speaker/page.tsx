import type { Metadata } from 'next'
import { getDailyGlyph } from '@/data/mayanInterpretations'
import { recommend } from '@/lib/noiracielRecommendationEngine'
import SpeakerExperience from './SpeakerExperience'

export const dynamic = 'force-dynamic' // the glyph changes by day

export const metadata: Metadata = {
  title: 'NoiraCiel Speaker — Music, Books & Daily Glyph',
  description:
    'Speak with NoiraCiel: an artistic AI guide for music, books, emotional worlds, and Mayan Calendar-inspired daily reflections.',
  openGraph: {
    title: 'NoiraCiel Speaker — Music, Books & Daily Glyph',
    description:
      'Speak with NoiraCiel: an artistic AI guide for music, books, emotional worlds, and Mayan Calendar-inspired daily reflections.',
  },
}

export default function SpeakerPage() {
  // Compute the day's glyph + a gentle default recommendation on the server so the
  // panel paints instantly and the date is never hardcoded.
  const glyph = getDailyGlyph()
  const seedRec = recommend('', glyph)

  // Pass only what the client needs — plain serialisable objects.
  const glyphView = {
    gregorianDate: glyph.mayan.gregorianDate,
    longCount: glyph.mayan.longCount.display,
    haab: glyph.mayan.haab.display,
    tzolkin: glyph.mayan.tzolkin.display,
    signName: glyph.sign.name,
    signMeaning: glyph.mayan.tzolkin.signMeaning,
    signKeywords: glyph.sign.keywords,
    toneNumber: glyph.tone.number,
    toneName: glyph.tone.name,
    guidance: glyph.guidance,
    reflectionQuestion: glyph.reflectionQuestion,
  }

  const recView = seedRec.recommendedAlbum
    ? {
        albumTitle: seedRec.recommendedAlbum.title,
        albumHref: seedRec.recommendedAlbum.href,
        albumWorld: seedRec.recommendedAlbum.world,
        trackTitle: seedRec.recommendedTrack?.title ?? null,
        trackHref: seedRec.recommendedTrack?.href ?? null,
        bookTitle: seedRec.recommendedBook?.title ?? null,
      }
    : null

  return <SpeakerExperience glyph={glyphView} recommendation={recView} />
}
