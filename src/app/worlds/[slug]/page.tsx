import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { WORLDS, getWorldBySlug } from '@/data/noiracielWorlds'
import { getAlbumById } from '@/data/noiracielKnowledge'
import { getConceptById } from '@/data/noiracielPhysicsConcepts'
import StoryThumb from '@/components/stories/StoryThumb'
import EntangledLinks, { type EntangledLink } from '@/components/EntangledLinks'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return WORLDS.map((w) => ({ slug: w.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const world = getWorldBySlug(slug)
  if (!world) return { title: 'World — NoiraCiel' }
  return {
    title: `${world.title} — A NoiraCiel World`,
    description: world.description,
    openGraph: { title: `${world.title} — A NoiraCiel World`, description: world.description },
  }
}

export default async function WorldPage({ params }: Props) {
  const { slug } = await params
  const world = getWorldBySlug(slug)
  if (!world) notFound()

  const albums = world.connectedAlbums
    .map((id) => getAlbumById(id))
    .filter((a): a is NonNullable<typeof a> => !!a)
  const concepts = world.physicsConcepts
    .map((id) => getConceptById(id))
    .filter((c): c is NonNullable<typeof c> => !!c)

  const primaryAlbum = albums[0]

  // Entangled next doors — every world opens into the rest of the universe.
  const doors: EntangledLink[] = []
  if (primaryAlbum) doors.push({ href: primaryAlbum.href, label: `Listen — ${primaryAlbum.title}`, sublabel: primaryAlbum.world, kind: 'Music' })
  doors.push({ href: '/stories', label: 'Read the stories beneath the songs', kind: 'Stories' })
  if (world.connectedBooks[0]) doors.push({ href: '/book', label: `Open the book — ${world.connectedBooks[0]}`, kind: 'Books' })
  doors.push({ href: '/speaker', label: 'Ask the Speaker about this world', sublabel: `In the register of a ${world.speakerMode}`, kind: 'Speaker' })
  if (concepts[0]) doors.push({ href: '/field', label: `Its Field concept — ${concepts[0].name}`, sublabel: 'Physics as poetic architecture', kind: 'The Field' })
  doors.push({ href: '/speaker', label: 'Today’s glyph through this world', kind: 'Symbolic time' })

  const accent = world.colors[2] ?? '#C4953A'

  return (
    <div className="min-h-screen bg-noir-black">
      {/* Hero */}
      <div className="relative h-[68vh] min-h-[440px] flex items-end overflow-hidden">
        <StoryThumb src={world.thumbnail} priority opacity={0.55} />
        <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/55 to-noir-black/20" />
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(100% 70% at 50% 100%, ${accent}1f, transparent 70%)` }}
        />
        <div className="relative z-10 max-w-3xl mx-auto w-full px-6 pb-14 text-center">
          <p className="font-body text-[10px] tracking-[0.5em] uppercase text-noir-gold/70 mb-5">
            NoiraCiel · World
          </p>
          <h1 className="font-heading italic font-light text-noir-ivory leading-[1.05] mb-4" style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)' }}>
            {world.title}
          </h1>
          <p className="font-heading italic text-base text-noir-silver/70 max-w-xl mx-auto">{world.subtitle}</p>
          <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 mt-5">
            {world.mood.join(' · ')}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12 flex items-center justify-between">
          <Link href="/worlds" className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/50 hover:text-noir-ivory transition-colors">
            ← All Worlds
          </Link>
        </div>

        <p className="font-heading text-lg text-noir-ivory/85 leading-relaxed mb-12">{world.description}</p>

        {/* Connected music */}
        {albums.length > 0 && (
          <div className="mb-10">
            <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 mb-4">Music in this world</p>
            <div className="space-y-2">
              {albums.map((a) => (
                <Link key={a.id} href={a.href} className="group flex items-baseline justify-between gap-4 border-b border-noir-silver/8 py-3">
                  <span className="font-heading italic text-lg text-noir-ivory/85 group-hover:text-noir-gold/90 transition-colors">{a.title}</span>
                  <span className="font-body text-[10px] text-noir-silver/45 text-right">{a.world}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Books + symbolic affinities */}
        <div className="grid sm:grid-cols-2 gap-8 mb-14">
          {world.connectedBooks.length > 0 && (
            <div>
              <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 mb-3">Books</p>
              {world.connectedBooks.map((b) => (
                <p key={b} className="font-heading italic text-[15px] text-noir-ivory/75 leading-relaxed">{b}</p>
              ))}
            </div>
          )}
          <div>
            <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 mb-3">Symbolic affinities</p>
            <p className="font-body text-[12px] text-noir-silver/55 leading-relaxed">
              Glyphs: {world.glyphAffinities.join(' · ')}
            </p>
            <p className="font-body text-[12px] text-noir-silver/55 leading-relaxed mt-1">
              Field: {concepts.map((c) => c.name).join(' · ')}
            </p>
          </div>
        </div>

        {/* Entangled next doors */}
        <EntangledLinks title="Enter deeper — the next doors" links={doors} className="mt-4" />
      </div>
    </div>
  )
}
