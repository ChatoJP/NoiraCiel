'use client'

import { useState, useRef, useEffect } from 'react'

const shortBio = `NoiraCiel emerged from a single question: what does it mean to inherit a way of feeling?

Born from the Atlantic edge of Europe, this project traces the emotional archaeology of people who loved enormously and quietly — who built and endured and asked for nothing in return.`

const longBio = `NoiraCiel emerged from a single question: what does it mean to inherit a way of feeling?

Born from the Atlantic edge of Europe, this project traces the emotional archaeology of people who loved enormously and quietly — who built and endured and asked for nothing in return. The music draws on the cinematic tradition of artists who understood that the real subject of a song is never what it appears to be.

The Atlantic Noir sound is sparse and deliberate. There are no wasted notes. Every silence is intentional. The arrangements breathe with the weight of the unspoken — textured strings, restrained percussion, and a voice that carries the specific gravity of memory.

The name itself — NoiraCiel — is a private geography. Dark sky. The space between what we can say and what we actually mean. Between the surface of the sea and whatever lies beneath it.

These songs emerge from the Portuguese emotional inheritance — an understanding that beauty and sorrow are not opposites, that dignity can be found in places where it has no obvious right to exist. But they are written for anyone who has ever stood at a shore and felt the full weight of everything they carry.

NoiraCiel is entirely original and entirely inevitable. Songs that had to be written. Songs that carry their weight honestly and ask the listener to do the same.

This is not background music. This is not ambient sound. This is a specific kind of company for a specific kind of night.`

export default function Biography() {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const displayBio = expanded ? longBio : shortBio

  return (
    <section id="biography" className="py-16 md:py-24 lg:py-32 px-6 relative">
      {/* Biography background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/backgrounds/biography.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        style={{ opacity: 0.1 }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 80% 50%, rgba(27,58,75,0.8) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start" ref={ref}>
          {/* Left column */}
          <div className="lg:col-span-4 reveal">
            <p className="font-body text-xs tracking-[0.35em] text-noir-gold/60 uppercase mb-4">The Artist</p>
            <h2 className="font-heading text-5xl text-noir-ivory font-light tracking-wide">
              Biography
            </h2>

            <div className="mt-10 space-y-6">
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] text-noir-silver/30 uppercase mb-2">Genre</p>
                <p className="font-body text-sm text-noir-silver/70">Atlantic Noir · Sea-Soul</p>
              </div>
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] text-noir-silver/30 uppercase mb-2">Origin</p>
                <p className="font-body text-sm text-noir-silver/70">Atlantic Coast, Europe</p>
              </div>
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] text-noir-silver/30 uppercase mb-2">Language</p>
                <p className="font-body text-sm text-noir-silver/70">Primarily English</p>
              </div>
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] text-noir-silver/30 uppercase mb-2">Themes</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Memory', 'Family', 'The Sea', 'Transformation', 'Dignity', 'Loss'].map((tag) => (
                    <span key={tag} title={`Theme: ${tag}`} className="font-body text-xs text-noir-silver/50 border border-noir-silver/15 px-2 py-1 cursor-default select-none">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Bio text */}
          <div className="lg:col-span-8">
            <div className="space-y-6 font-body text-sm text-noir-silver/70 leading-relaxed">
              {displayBio.split('\n\n').map((para, i) => (
                <p key={i} className={i === 0 ? 'text-base text-noir-ivory/80 font-body leading-loose bio-dropcap' : ''}>
                  {para}
                </p>
              ))}
            </div>

            {/* Listen link (#38) */}
            <a href="/music/the-life-lessons"
              className="mt-8 inline-flex items-center gap-2 font-body text-[10px] tracking-[0.25em] uppercase text-noir-gold/50 hover:text-noir-gold border-b border-noir-gold/15 hover:border-noir-gold/40 pb-0.5 transition-all duration-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Listen to the album that inspired this
            </a>

            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-5 flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-noir-gold/60 hover:text-noir-gold transition-colors border-b border-noir-gold/20 hover:border-noir-gold/40 pb-0.5"
            >
              {expanded ? 'Read less' : 'Read the full story'}
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
