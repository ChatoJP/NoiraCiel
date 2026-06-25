import type { Metadata } from 'next'
import { PHYSICS_CONCEPTS, getFeaturedConcept } from '@/data/noiracielPhysicsConcepts'
import { getDailyGlyph, getCurrentWave } from '@/data/mayanInterpretations'
import { getAlbumById } from '@/data/noiracielKnowledge'
import FieldExperience from './FieldExperience'

export const dynamic = 'force-dynamic' // featured concept follows the daily glyph

export const metadata: Metadata = {
  title: 'The NoiraCiel Field — Physics as Poetic Architecture',
  description:
    'The NoiraCiel Field uses real physics and quantum concepts as artistic, symbolic and emotional architecture for music, memory and symbolic time — metaphor, not pseudo-science.',
  openGraph: {
    title: 'The NoiraCiel Field — Physics as Poetic Architecture',
    description:
      'Physics and quantum theory as poetic architecture for the NoiraCiel universe — metaphor, not false certainty.',
  },
}

function resolveAlbums(ids: string[]) {
  return ids
    .map((id) => {
      const a = getAlbumById(id)
      return a ? { title: a.title, href: a.href } : null
    })
    .filter((x): x is { title: string; href: string } => x !== null)
}

export default function FieldPage() {
  const glyph = getDailyGlyph()
  const wave = getCurrentWave()
  const featured = getFeaturedConcept(glyph)

  const conceptViews = PHYSICS_CONCEPTS.map((c) => ({
    id: c.id,
    name: c.name,
    scientificAnchor: c.scientificAnchor,
    noiracielTranslation: c.noiracielTranslation,
    emotionalThemes: c.emotionalThemes,
    relatedMoods: c.relatedMoods,
    relatedGlyphs: c.relatedGlyphs,
    relatedBookChapters: c.relatedBookChapters,
    albums: resolveAlbums(c.relatedAlbums),
    visualLanguage: c.visualLanguage,
  }))

  const featuredView = {
    id: featured.concept.id,
    name: featured.concept.name,
    reading: featured.reading,
    glyph: glyph.mayan.tzolkin.display,
    waveName: wave.wave.name,
    wavePosition: wave.wave.currentPosition,
  }

  return <FieldExperience concepts={conceptViews} featured={featuredView} />
}
