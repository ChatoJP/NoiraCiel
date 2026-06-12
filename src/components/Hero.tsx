'use client'

import { useEffect, useRef, useState } from 'react'

const HERO_IMAGES = [
  '/Images/chapter-banners/why.jpg',
  '/Images/gallery/the-atlantic-at-night.jpg',
  '/Images/chapter-banners/the-empty-chair.jpg',
  '/Images/gallery/the-winter-sea.jpg',
  '/Images/chapter-banners/borrowed-time.jpg',
  '/Images/gallery/coastal-road-at-dawn.jpg',
  '/Images/chapter-banners/free-men-tell-the-truth.jpg',
  '/Images/chapter-banners/leave-a-light-on.jpg',
]

function PhotoSlideshow({ activeIdx }: { activeIdx: number }) {
  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 overflow-hidden"
          style={{
            opacity: i === activeIdx ? 1 : 0,
            transition: 'opacity 1800ms ease-in-out',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-center animate-ken-burns"
            style={{ opacity: 0.45 }}
          />
        </div>
      ))}
    </div>
  )
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number
    const particles: { x: number; y: number; size: number; speed: number; opacity: number; drift: number }[] = []

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }

    const init = () => {
      particles.length = 0
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2 + 0.2,
          speed: Math.random() * 0.25 + 0.04,
          opacity: Math.random() * 0.4 + 0.05,
          drift: (Math.random() - 0.5) * 0.12,
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(196, 149, 58, ${p.opacity * 0.5})`
        ctx.fill()
        p.y -= p.speed
        p.x += p.drift
        p.opacity += Math.sin(Date.now() * 0.001 + p.x) * 0.002
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width }
        if (p.x < -5) p.x = canvas.width + 5
        if (p.x > canvas.width + 5) p.x = -5
        p.opacity = Math.max(0.04, Math.min(0.6, p.opacity))
      })
      animFrame = requestAnimationFrame(draw)
    }

    resize(); init(); draw()
    window.addEventListener('resize', () => { resize(); init() })
    return () => { cancelAnimationFrame(animFrame) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }} />
}

export default function Hero() {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % HERO_IMAGES.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden noise-overlay"
    >
      {/* Rotating photo background */}
      <PhotoSlideshow activeIdx={activeIdx} />

      {/* Deep gradient overlay — keeps text readable over any image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'linear-gradient(to bottom, rgba(4,4,10,0.72) 0%, rgba(8,8,16,0.55) 50%, rgba(8,8,16,0.88) 100%)',
        }}
      />

      {/* Animated fog layers */}
      <div
        className="absolute inset-0 animate-fog-drift pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(27,58,75,0.4) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(13,27,42,0.5) 0%, transparent 60%)',
          zIndex: 1,
        }}
      />

      {/* Particle field */}
      <ParticleField />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          background:
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(4,4,10,0.6) 100%)',
        }}
      />

      {/* ─── Content ─────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center text-center px-6 max-w-6xl" style={{ zIndex: 10 }}>

        {/* Pre-title line */}
        <div
          className="flex items-center gap-4 mb-8 animate-fade-up"
          style={{ animationDelay: '0.2s', opacity: 0 }}
        >
          <div className="w-10 h-px bg-gradient-to-r from-transparent to-noir-gold/50" />
          <span className="font-body text-[9px] tracking-[0.55em] text-noir-gold/65 uppercase">
            Atlantic Noir · Sea-Soul
          </span>
          <div className="w-10 h-px bg-gradient-to-l from-transparent to-noir-gold/50" />
        </div>

        {/* Diamond logomark */}
        <div
          className="mb-6 animate-fade-up"
          style={{ animationDelay: '0.35s', opacity: 0 }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="24,3 45,24 24,45 3,24" stroke="#C4953A" strokeWidth="1" fill="none" opacity="0.55"/>
            <polygon points="24,10 38,24 24,38 10,24" stroke="#C4953A" strokeWidth="0.6" fill="none" opacity="0.3"/>
            <circle cx="24" cy="24" r="2.5" fill="#C4953A" opacity="0.8"/>
          </svg>
        </div>

        {/* Main title — split for dramatic effect */}
        <h1
          className="font-heading font-light leading-[0.88] tracking-[0.18em] text-noir-ivory mb-3 animate-fade-up"
          style={{
            animationDelay: '0.55s',
            opacity: 0,
            fontSize: 'clamp(4.5rem, 16vw, 12rem)',
          }}
        >
          NOIRA<span className="text-gradient-gold">CIEL</span>
        </h1>

        {/* Album subtitle */}
        <p
          className="font-heading italic text-[clamp(0.75rem, 2vw, 1.1rem)] text-noir-silver/50 tracking-[0.25em] mb-8 animate-fade-up"
          style={{ animationDelay: '0.75s', opacity: 0 }}
        >
          The Life Lessons I Hope You Learn
        </p>

        {/* Divider */}
        <div
          className="flex items-center gap-5 mb-8 animate-fade-up"
          style={{ animationDelay: '0.9s', opacity: 0 }}
        >
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-noir-gold/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-noir-gold/50 animate-pulse-gold" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-noir-gold/40" />
        </div>

        {/* Tagline */}
        <p
          className="font-heading italic text-[clamp(1rem, 2.8vw, 1.5rem)] text-noir-ivory/75 tracking-wide max-w-2xl leading-relaxed mb-14 animate-fade-up"
          style={{ animationDelay: '1.05s', opacity: 0 }}
        >
          Songs from the dark edge of memory.
        </p>

        {/* Album cover + CTA */}
        <div
          className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14 animate-fade-up"
          style={{ animationDelay: '1.2s', opacity: 0 }}
        >
          {/* Album cover */}
          <div className="relative flex-shrink-0">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 overflow-hidden border border-noir-gold/20"
              style={{ boxShadow: '0 0 40px rgba(196,149,58,0.12), 0 20px 60px rgba(0,0,0,0.6)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Images/album-cover.png"
                alt="The Life Lessons I Hope You Learn"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-noir-void/20" />
            </div>
            {/* Vinyl effect rings */}
            <div className="absolute -inset-2 border border-noir-gold/8 pointer-events-none" />
            <div className="absolute -inset-4 border border-noir-gold/4 pointer-events-none" />
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href="#music"
                className="group flex items-center gap-3 px-8 py-3.5 bg-noir-gold/10 border border-noir-gold/50 text-noir-gold font-body text-xs tracking-[0.25em] uppercase hover:bg-noir-gold hover:text-noir-void transition-all duration-400"
              >
                <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Listen
              </a>
              <a
                href="#gallery"
                className="flex items-center gap-3 px-8 py-3.5 border border-noir-silver/20 text-noir-silver/70 font-body text-xs tracking-[0.25em] uppercase hover:border-noir-silver/50 hover:text-noir-ivory transition-all duration-400"
              >
                Gallery
              </a>
              <a
                href="#merch"
                className="flex items-center gap-3 px-8 py-3.5 border border-noir-silver/20 text-noir-silver/70 font-body text-xs tracking-[0.25em] uppercase hover:border-noir-silver/50 hover:text-noir-ivory transition-all duration-400"
              >
                Shop
              </a>
            </div>
            <p className="font-body text-[9px] tracking-[0.3em] text-noir-silver/30 uppercase">
              Now Streaming · 17 Tracks · Atlantic Noir
            </p>
          </div>
        </div>
      </div>

      {/* Photo indicator dots */}
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 animate-fade-up"
        style={{ animationDelay: '2s', opacity: 0, zIndex: 10 }}
      >
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            aria-label={`Photo ${i + 1}`}
            className={`slide-dot ${i === activeIdx ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-up"
        style={{ animationDelay: '2.2s', opacity: 0, zIndex: 10 }}
      >
        <span className="font-body text-[9px] tracking-[0.35em] text-noir-silver/35 uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-noir-silver/35 to-transparent animate-wave-slow" />
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0" style={{ zIndex: 10 }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,60 L0,60 Z" fill="#080810" />
        </svg>
      </div>
    </section>
  )
}
