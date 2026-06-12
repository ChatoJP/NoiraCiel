'use client'

import { useEffect, useRef } from 'react'

const themes = [
  {
    symbol: '~',
    title: 'The Sea',
    text: 'Every song begins at the shore. The Atlantic is not a backdrop — it is a character. Ancient, indifferent, and somehow intimate. It has received centuries of longing and returned it as salt and wave and grey light.',
  },
  {
    symbol: '◆',
    title: 'Memory',
    text: 'These are songs about what stays. Not the person, but the impression they leave on everything you touch afterward. Memory is not passive here — it is a force that reshapes the present without permission.',
  },
  {
    symbol: '∞',
    title: 'The Invisible Roots',
    text: 'The people who gave us our capacity to love are often those we never fully understood. These songs are a reckoning — an attempt to see clearly, to name honestly, to love without the filter of sentimentality.',
  },
  {
    symbol: '◯',
    title: 'Transformation',
    text: 'NoiraCiel is not interested in resolution. Only in the integrity of the unresolved. These songs do not promise peace. They promise witness. They hold the weight of what cannot be put down.',
  },
]

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return ref
}

export default function WorldSection() {
  const headerRef   = useReveal(0.1)
  const quoteRef    = useReveal(0.1)
  const themesRef   = useReveal(0.05)

  return (
    <section id="world" className="relative overflow-hidden">

      {/* ── Full-bleed pull quote ── */}
      <div
        ref={quoteRef}
        className="reveal py-32 px-6 flex items-center justify-center text-center relative"
        style={{
          background: 'linear-gradient(135deg, rgba(27,58,75,0.12) 0%, transparent 60%)',
        }}
      >
        {/* Background image faint */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Images/gallery/the-atlantic-at-night.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.08 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-noir-black via-transparent to-noir-black" />

        <div className="relative max-w-4xl">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-12 h-px bg-noir-gold/30" />
            <span className="font-body text-[9px] tracking-[0.55em] text-noir-gold/50 uppercase">The Universe</span>
            <div className="w-12 h-px bg-noir-gold/30" />
          </div>
          <blockquote className="font-heading italic font-light text-[clamp(1.8rem,5vw,4rem)] text-noir-ivory/85 leading-[1.2] tracking-wide">
            "Not fado. Not jazz. Not trip-hop.<br />
            Something older. Something new."
          </blockquote>
          <p className="font-body text-xs tracking-[0.35em] text-noir-silver/30 uppercase mt-8">NoiraCiel</p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="py-24 px-6 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Images/backgrounds/world.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.07 }}
        />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">

            {/* Left */}
            <div className="lg:col-span-5" ref={headerRef}>
              <div className="reveal">
                <p className="font-body text-[9px] tracking-[0.55em] text-noir-gold/50 uppercase mb-4">The World</p>
                <h2 className="font-heading font-light text-6xl md:text-7xl text-noir-ivory tracking-wide leading-none mb-10">
                  The World of<br />
                  <em className="text-gradient-gold not-italic">NoiraCiel</em>
                </h2>

                <div className="space-y-5 font-body text-sm text-noir-silver/60 leading-loose">
                  <p className="text-base text-noir-ivory/70 font-body leading-loose">
                    NoiraCiel lives between two impossible things — the silence of the deep Atlantic and the unbearable weight of what is remembered.
                  </p>
                  <p>
                    This is not a music project. It is an archive of the feeling you cannot name. The moment the ocean becomes a mirror. The weight of a chair that will never be occupied again.
                  </p>
                  <p className="font-heading italic text-base text-noir-ivory/60">
                    These songs were not written. They were excavated.
                  </p>
                  <p>
                    From the sediment of Portuguese emotional memory. From the inheritance of those who loved without asking permission. From the dignity of people who built invisible foundations so their children could walk on solid ground.
                  </p>
                </div>

                <div className="mt-10 border-l border-noir-gold/40 pl-5 py-1">
                  <p className="font-body text-[9px] tracking-[0.4em] text-noir-gold/40 uppercase mb-3">The Album</p>
                  <p className="font-heading italic text-xl text-noir-ivory/70 leading-snug">
                    The Life Lessons<br />I Hope You Learn
                  </p>
                  <p className="font-body text-xs text-noir-silver/30 mt-2">17 songs · Atlantic Noir · Sea-Soul</p>
                </div>
              </div>
            </div>

            {/* Right: themes */}
            <div className="lg:col-span-7">
              <div ref={themesRef} className="reveal-stagger grid grid-cols-1 sm:grid-cols-2 gap-8">
                {themes.map((theme) => (
                  <div key={theme.title} className="relative pl-6 py-1">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-noir-gold/50 via-noir-gold/20 to-transparent" />
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-heading text-xl text-noir-gold/40 w-5 leading-none">{theme.symbol}</span>
                      <h3 className="font-heading text-xl text-noir-ivory/90 tracking-wide">{theme.title}</h3>
                    </div>
                    <p className="font-body text-sm text-noir-silver/55 leading-relaxed">{theme.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
