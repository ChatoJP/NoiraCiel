import type { Metadata } from 'next'
import { getDailyGlyph, getCurrentWave } from '@/data/mayanInterpretations'
import { getDailyReflection } from '@/lib/dailyReflection'
import { recommend, recommendForWave } from '@/lib/noiracielRecommendationEngine'
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

export default async function SpeakerPage() {
  // Compute the day's glyph + a gentle default recommendation on the server so the
  // panel paints instantly and the date is never hardcoded (NoiraCiel time).
  const glyph = getDailyGlyph()
  const seedRec = recommend('', glyph)
  // AI-authored reflection, cached once per day; falls back to the deterministic
  // guidance if the model is unavailable.
  const reflection = await getDailyReflection(glyph)

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
    lordGlyph: glyph.mayan.lordOfNight.glyph,
    lordTheme: glyph.lord.theme,
    trecena: glyph.mayan.trecena.display,
    guidance: reflection,
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

  // The current 13-day wave — always present so the panel is never empty.
  const wave = getCurrentWave()
  const waveRec = recommendForWave(wave)
  const waveView = {
    name: wave.wave.name,
    anchorSign: wave.wave.anchorSign,
    startDate: wave.wave.startDate,
    endDate: wave.wave.endDate,
    currentPosition: wave.wave.currentPosition,
    theme: wave.wave.theme,
    noiracielInterpretation: wave.wave.noiracielInterpretation,
    albumTitle: waveRec.waveAlbum?.title ?? null,
    albumHref: waveRec.waveAlbum?.href ?? null,
    bookTitle: waveRec.waveBook?.title ?? null,
    creativeAction: waveRec.creativeAction,
    days: wave.wave.days.map((d) => ({
      position: d.position,
      date: d.date,
      tone: d.tone,
      signName: d.signName,
      kinDisplay: d.kinDisplay,
      shortMeaning: d.shortMeaning,
    })),
  }

  return <SpeakerExperience glyph={glyphView} recommendation={recView} wave={waveView} />
}
