'use client'

import { useState } from 'react'
import Link from 'next/link'
import QuantumField from './QuantumField'

interface AlbumLink { title: string; href: string }
interface ConceptView {
  id: string
  name: string
  scientificAnchor: string
  noiracielTranslation: string
  emotionalThemes: string[]
  relatedMoods: string[]
  relatedGlyphs: string[]
  relatedBookChapters: string[]
  albums: AlbumLink[]
  visualLanguage: string
}
interface FeaturedView {
  id: string
  name: string
  reading: string
  glyph: string
  waveName: string
  wavePosition: number
}

export default function FieldExperience({
  concepts,
  featured,
}: {
  concepts: ConceptView[]
  featured: FeaturedView
}) {
  const [open, setOpen] = useState<string | null>(featured.id)

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Quantum backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
        <QuantumField className="w-full h-full" />
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-28 pb-20">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="text-center mb-12 animate-fade-up">
          <p className="font-body text-[10px] tracking-[0.45em] uppercase text-noir-gold/55 mb-5">
            NoiraCiel Field Theory
          </p>
          <h1 className="font-heading italic text-4xl sm:text-5xl text-noir-ivory/90 leading-tight">
            The NoiraCiel Field
          </h1>
          <p className="font-body text-sm text-noir-silver/55 mt-4 max-w-xl mx-auto leading-relaxed">
            Physics as poetic architecture for music, memory and symbolic time.
          </p>
          <p className="font-body text-[11px] text-noir-silver/35 mt-3 max-w-lg mx-auto italic">
            Physics as metaphor, structure and language — not as false certainty.
          </p>
        </header>

        {/* ── Featured concept of the day ──────────────────────────────── */}
        <section className="mb-14 border border-noir-gold/20 bg-noir-void/70 backdrop-blur-sm animate-fade-up">
          <div className="px-6 sm:px-8 py-7">
            <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/50 mb-2">
              Field Concept of the Day · {featured.glyph} · {featured.waveName} (day {featured.wavePosition})
            </p>
            <h2 className="font-heading italic text-3xl text-noir-ivory/90 mb-3">{featured.name}</h2>
            <p className="font-heading italic text-[15px] text-noir-ivory/72 leading-[1.8]">
              {featured.reading}
            </p>
            <Link
              href="/speaker"
              className="inline-block mt-5 px-5 py-2.5 border border-noir-gold/35 text-noir-gold/80 font-body text-[10px] tracking-[0.25em] uppercase hover:border-noir-gold/70 hover:text-noir-gold transition-all"
            >
              Ask the Speaker about {featured.name}
            </Link>
          </div>
        </section>

        {/* ── Concept cards ────────────────────────────────────────────── */}
        <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 text-center mb-6">
          The Fifteen Concepts
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {concepts.map((c) => {
            const isOpen = open === c.id
            return (
              <div
                key={c.id}
                className={`border bg-noir-void/55 backdrop-blur-sm transition-all ${
                  isOpen ? 'border-noir-gold/35 sm:col-span-2' : 'border-noir-silver/10 hover:border-noir-silver/25'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  className="w-full text-left px-5 py-4"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-heading italic text-lg text-noir-ivory/85">{c.name}</h3>
                    <span className="font-body text-[9px] tracking-[0.2em] uppercase text-noir-gold/40">
                      {isOpen ? '–' : '+'}
                    </span>
                  </div>
                  <p className="font-body text-[10px] tracking-[0.15em] uppercase text-noir-silver/35 mt-1">
                    {c.emotionalThemes.slice(0, 3).join(' · ')}
                  </p>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 animate-fade-in">
                    <div>
                      <p className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-silver/35 mb-1">
                        Scientifically
                      </p>
                      <p className="font-body text-[12.5px] text-noir-silver/60 leading-relaxed">
                        {c.scientificAnchor}
                      </p>
                    </div>
                    <div>
                      <p className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-gold/45 mb-1">
                        NoiraCiel translation
                      </p>
                      <p className="font-heading italic text-[14px] text-noir-ivory/75 leading-[1.75]">
                        {c.noiracielTranslation}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                      {c.albums.length > 0 && (
                        <Detail label="Music">
                          {c.albums.map((a, i) => (
                            <span key={a.href}>
                              <Link href={a.href} className="text-noir-ivory/70 hover:text-noir-gold transition-colors">
                                {a.title}
                              </Link>
                              {i < c.albums.length - 1 && <span className="text-noir-silver/30"> · </span>}
                            </span>
                          ))}
                        </Detail>
                      )}
                      {c.relatedBookChapters.length > 0 && (
                        <Detail label="Book">{c.relatedBookChapters.join(' · ')}</Detail>
                      )}
                      {c.relatedGlyphs.length > 0 && (
                        <Detail label="Glyphs">{c.relatedGlyphs.join(' · ')}</Detail>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <p className="font-body text-[10px] leading-relaxed text-noir-silver/30 mt-12 max-w-2xl mx-auto text-center">
          NoiraCiel uses physics and quantum theory as artistic and symbolic
          inspiration. Scientific explanations are simplified, and emotional
          interpretations are metaphors — not scientific claims. Physics does not
          prove anything spiritual here; it lends structure, language and beauty.
        </p>

        <p className="text-center font-body text-[8px] tracking-[0.3em] text-noir-silver/15 uppercase mt-8">
          The Field connects them · Physics gives structure
        </p>
      </div>
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/30 mb-0.5">{label}</p>
      <p className="font-body text-[11px] text-noir-silver/55">{children}</p>
    </div>
  )
}
