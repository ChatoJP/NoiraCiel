'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const HERO_IMAGES = [
  '/images/chapter-banners/why.jpg',
  '/images/gallery/the-atlantic-at-night.jpg',
  '/images/chapter-banners/the-empty-chair.jpg',
  '/images/gallery/the-winter-sea.jpg',
  '/images/chapter-banners/borrowed-time.jpg',
  '/images/gallery/coastal-road-at-dawn.jpg',
  '/images/chapter-banners/free-men-tell-the-truth.jpg',
  '/images/chapter-banners/leave-a-light-on.jpg',
]

const TICKER_WORDS = [
  'Now Streaming','◆','17 Tracks','◆','Atlantic Noir','◆','Sea-Soul','◆',
  '10 Albums','◆','6 Books','◆','NoiraCiel','◆','Atlantic Coast','◆','Independent','◆',
  'Now Streaming','◆','17 Tracks','◆','Atlantic Noir','◆','Sea-Soul','◆',
  '10 Albums','◆','6 Books','◆','NoiraCiel','◆','Atlantic Coast','◆','Independent','◆',
]

const ALBUMS = [
  { title: 'The Life Lessons I Hope You Learn', href: '/music/the-life-lessons',  src: '/images/album-cover.png' },
  { title: 'NoiraCiel Jazz Sessions',            href: '/music/jazz-sessions',      src: '/images/album-covers/jazz-sessions.jpg' },
  { title: 'The Blind Angel',                    href: '/music/blind-angel',        src: '/images/album-covers/blind-angel.jpg' },
  { title: 'The Velvet Machine',                 href: '/music/the-velvet-machine', src: '/images/album-covers/the-velvet-machine.jpg' },
  { title: 'Still We Sail',                      href: '/music/still-we-sail',      src: '/images/album-covers/still-we-sail.jpg' },
  { title: "What You're Made Of",                href: '/music/whats-youre-made-of',src: '/images/song-art/whats-youre-made-of.jpg' },
  { title: 'The Sacred Drift',                   href: '/music/the-sacred-drift',   src: '/images/song-art/the-sacred-drift.jpg' },
  { title: 'Funk My Way In',                     href: '/music/funk-my-way-in',     src: '/images/song-art/the-work-nobody-sees.jpg' },
  { title: 'World Musics',                       href: '/music/world-musics',       src: '/images/song-art/so-hum.jpg' },
  { title: 'Reggae Sessions',                    href: '/music/reggae-sessions',    src: '/images/song-art/the-quiet-revolution.jpg' },
]

const AMBIENT_FREQS = [55, 110, 164.8, 220]

function PhotoSlideshow({ activeIdx, scrollY }: { activeIdx: number; scrollY: number }) {
  const offset = Math.min(scrollY * 0.18, 90)
  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      {HERO_IMAGES.map((src, i) => (
        <div key={src} className="absolute inset-0 overflow-hidden"
          style={{ opacity: i === activeIdx ? 1 : 0, transition: 'opacity 1800ms ease-in-out' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-center animate-ken-burns"
            style={{ opacity: 0.45, transform: `translateY(${offset}px) scale(1.12)` }} />
        </div>
      ))}
    </div>
  )
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let animFrame: number
    const particles: { x:number; y:number; size:number; speed:number; opacity:number; drift:number }[] = []
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    const init = () => {
      particles.length = 0
      for (let i = 0; i < 60; i++) particles.push({
        x: Math.random()*canvas.width, y: Math.random()*canvas.height,
        size: Math.random()*1.4+0.2, speed: Math.random()*0.28+0.04,
        opacity: Math.random()*0.45+0.05, drift: (Math.random()-0.5)*0.14,
      })
    }
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height)
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2)
        ctx.fillStyle = `rgba(196,149,58,${p.opacity*0.55})`; ctx.fill()
        p.y -= p.speed; p.x += p.drift
        p.opacity += Math.sin(Date.now()*0.001+p.x)*0.002
        if (p.y<-5) { p.y = canvas.height+5; p.x = Math.random()*canvas.width }
        if (p.x<-5) p.x = canvas.width+5
        if (p.x>canvas.width+5) p.x = -5
        p.opacity = Math.max(0.04, Math.min(0.65, p.opacity))
      })
      animFrame = requestAnimationFrame(draw)
    }
    resize(); init(); draw()
    const onResize = () => { resize(); init() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }} />
}

function StreamingTicker() {
  return (
    <div className="w-full overflow-hidden border-t border-noir-silver/8 bg-noir-void/50 backdrop-blur-sm">
      <div className="flex items-center gap-7 py-2.5 whitespace-nowrap"
        style={{ animation: 'tickerScroll 32s linear infinite', willChange: 'transform' }}>
        {TICKER_WORDS.map((word, i) => (
          <span key={i}
            className={`font-body text-[8px] tracking-[0.5em] uppercase flex-shrink-0 ${
              word === '◆' ? 'text-noir-gold/28' : 'text-noir-silver/25'}`}>
            {word}
          </span>
        ))}
      </div>
    </div>
  )
}

function SlideshowDots({ activeIdx, count, onClick }: { activeIdx:number; count:number; onClick:(i:number)=>void }) {
  return (
    <div className="flex items-center gap-3" role="tablist">
      {Array.from({ length: count }).map((_, i) => (
        <button key={i} role="tab" aria-selected={i === activeIdx} onClick={() => onClick(i)}
          className={`transition-all duration-500 leading-none ${i === activeIdx ? 'text-noir-gold scale-125' : 'text-noir-silver/18 hover:text-noir-silver/45'}`}
          style={{ fontSize: '7px', cursor: 'pointer' }}
          aria-label={`Image ${i+1}`}>◆</button>
      ))}
    </div>
  )
}

function AmbientToggle() {
  const [playing, setPlaying] = useState(false)
  const ctxRef = useRef<AudioContext|null>(null)
  const gainRef = useRef<GainNode|null>(null)
  const oscRefs = useRef<OscillatorNode[]>([])
  const stop = useCallback(() => {
    if (!ctxRef.current||!gainRef.current) return
    gainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.5)
    setTimeout(() => { oscRefs.current.forEach(o => { try { o.stop() } catch { /**/ } }); oscRefs.current = [] }, 1500)
  }, [])
  const toggle = useCallback(() => {
    if (playing) { stop(); setPlaying(false); return }
    const ctx = new AudioContext(); ctxRef.current = ctx
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); gainRef.current = master
    AMBIENT_FREQS.forEach((freq, idx) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      g.gain.value = idx===0?0.07:idx===1?0.035:0.015
      osc.connect(g); g.connect(master); osc.start(); oscRefs.current.push(osc)
    })
    master.gain.setTargetAtTime(1, ctx.currentTime, 2); setPlaying(true)
  }, [playing, stop])
  return (
    <button onClick={toggle}
      className={`absolute bottom-[76px] right-5 flex items-center gap-1.5 font-body text-[8px] tracking-[0.3em] uppercase transition-all duration-500 ${playing ? 'text-noir-gold/65' : 'text-noir-silver/20 hover:text-noir-silver/45'}`}
      style={{ zIndex: 20, cursor: 'pointer' }} title={playing ? 'Mute ambient' : 'Play ambient'}>
      {playing ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
      )}
      <span>{playing ? 'On' : 'Ambient'}</span>
    </button>
  )
}

export default function Hero() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setActiveIdx(i => (i+1) % HERO_IMAGES.length), 7000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section id="hero" className="relative min-h-screen flex flex-col overflow-hidden noise-overlay" style={{ cursor: 'crosshair' }}>

      {/* ── Backgrounds ── */}
      <PhotoSlideshow activeIdx={activeIdx} scrollY={scrollY} />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex:1, background:'linear-gradient(to bottom, rgba(4,4,10,0.72) 0%, rgba(8,8,16,0.5) 50%, rgba(8,8,16,0.92) 100%)' }} />
      <div className="absolute inset-0 animate-fog-drift pointer-events-none" style={{ background:'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(27,58,75,0.4) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(13,27,42,0.5) 0%, transparent 60%)', zIndex:1 }} />
      <ParticleField />
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex:3, background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(4,4,10,0.65) 100%)' }} />

      {/* ── Main content ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6 max-w-6xl mx-auto w-full pt-24 pb-36 sm:pt-0 sm:pb-28"
        style={{ zIndex:10, cursor:'default' }}>

        {/* Pre-title badge — gold border pill (#13, #14) */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay:'0.2s', opacity:0 }}>
          <div className="inline-flex items-center gap-3 border border-noir-gold/22 px-5 py-1.5">
            <span className="font-body text-[8px] tracking-[0.6em] text-noir-gold/60 uppercase">Atlantic Noir · Sea-Soul</span>
          </div>
        </div>

        {/* Diamond logomark */}
        <div className="mb-4 animate-fade-up" style={{ animationDelay:'0.35s', opacity:0 }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <polygon points="24,3 45,24 24,45 3,24" stroke="#C4953A" strokeWidth="1" fill="none" opacity="0.55"/>
            <polygon points="24,10 38,24 24,38 10,24" stroke="#C4953A" strokeWidth="0.6" fill="none" opacity="0.3"/>
            <circle cx="24" cy="24" r="2.5" fill="#C4953A" opacity="0.8"/>
          </svg>
        </div>

        {/* Decorative rule between logo and title (#15) */}
        <div className="w-14 h-px mb-5 animate-fade-up"
          style={{ animationDelay:'0.45s', opacity:0, background:'linear-gradient(90deg, transparent, rgba(196,149,58,0.45), transparent)' }} />

        {/* Main title — two-line on mobile (#10), shimmer on CIEL (#11) */}
        <h1 className="font-heading font-light leading-[0.88] tracking-[0.04em] sm:tracking-[0.12em] lg:tracking-[0.2em] text-noir-ivory mb-4 animate-fade-up"
          style={{ animationDelay:'0.55s', opacity:0, fontSize:'clamp(2.4rem, 10vw, 12rem)' }}>
          <span className="sm:hidden block leading-[1.05]">NOIRA<br /><span className="shimmer-ciel">CIEL</span></span>
          <span className="hidden sm:inline">NOIRA<span className="shimmer-ciel">CIEL</span></span>
        </h1>

        {/* Subtitle — wider tracking (#16) */}
        <p className="font-heading italic text-[clamp(0.68rem,2.8vw,0.95rem)] text-noir-silver/52 tracking-[0.48em] mb-6 animate-fade-up"
          style={{ animationDelay:'0.72s', opacity:0 }}>
          Music · Literature · A Way of Living
        </p>

        {/* Tagline — larger (#9) */}
        <p className="font-heading italic text-[clamp(1.25rem,4vw,2.1rem)] text-noir-ivory/82 tracking-wide max-w-2xl leading-relaxed mb-10 sm:mb-12 animate-fade-up"
          style={{ animationDelay:'1s', opacity:0 }}>
          Songs from the dark edge of memory.
        </p>

        {/* CTA block (#1–6, #12, #13, #46, #47, #48, #49) */}
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 lg:gap-16 animate-fade-up"
          style={{ animationDelay:'1.15s', opacity:0 }}>

          {/* Album collection grid */}
          <div className="flex-shrink-0">
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(5, 1fr)', width: 'min(230px, 46vw)' }}>
              {ALBUMS.map((album) => (
                <a key={album.href} href={album.href} title={album.title}
                  className="relative overflow-hidden border border-noir-silver/10 hover:border-noir-gold/45 transition-all duration-300 hover:scale-[1.07] hover:z-10 group/sq aspect-square block"
                  style={{ cursor: 'pointer' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={album.src} alt={album.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover/sq:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-noir-void/40 group-hover/sq:opacity-0 transition-opacity duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover/sq:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(196,149,58,0.4)' }} />
                </a>
              ))}
            </div>
            <a href="/music"
              className="mt-2 flex items-center justify-end gap-1.5 font-body text-[7px] tracking-[0.3em] uppercase text-noir-silver/22 hover:text-noir-gold/50 transition-colors duration-300"
              style={{ cursor: 'pointer' }}>
              Full catalogue →
            </a>
          </div>

          {/* Text column */}
          <div className="flex flex-col items-center sm:items-start gap-5">

            {/* Primary CTA — full width on mobile (#46), min-h for tap target (#49) */}
            <a href="#music" style={{ cursor:'pointer' }}
              className="group flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 bg-noir-gold/10 border border-noir-gold/55 text-noir-gold font-body text-xs tracking-[0.28em] uppercase hover:bg-noir-gold hover:text-noir-void hover:shadow-[0_0_35px_rgba(196,149,58,0.3)] transition-all duration-400 min-h-[48px]">
              <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Listen Now
            </a>

            {/* Secondary links — Music · Stories · Studio (#1, #2, #3, #6) */}
            <div className="flex items-center" style={{ cursor:'pointer' }}>
              {([{icon:'♪',label:'Music',href:'/music'},{icon:'✦',label:'Stories',href:'/stories'},{icon:'◈',label:'Studio',href:'/studio'}] as const).map(({icon,label,href},i) => (
                <span key={label} className="flex items-center">
                  {i>0 && <span className="text-noir-silver/15 px-3 select-none">·</span>}
                  <a href={href} style={{ cursor:'pointer' }}
                    className="flex items-center gap-1.5 font-body text-[9px] tracking-[0.4em] uppercase text-noir-silver/38 hover:text-noir-gold transition-colors duration-300 min-h-[44px] py-2">
                    <span className="text-[11px]">{icon}</span>{label}
                  </a>
                </span>
              ))}
            </div>

            {/* Stat pill tags */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {([{label:'17 tracks',href:'#music'},{label:'10 albums',href:'/music'},{label:'6 books',href:'/book'}] as const).map(({label,href}) => (
                <a key={label} href={href} style={{ cursor:'pointer' }}
                  className="inline-flex items-center font-body text-[8px] tracking-[0.25em] uppercase text-noir-silver/28 border border-noir-silver/12 px-3 py-1.5 hover:border-noir-gold/30 hover:text-noir-gold/55 transition-all duration-300">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Slideshow dots (#8) */}
        <div className="mt-10 animate-fade-up" style={{ animationDelay:'1.35s', opacity:0 }}>
          <SlideshowDots activeIdx={activeIdx} count={HERO_IMAGES.length} onClick={setActiveIdx} />
        </div>
      </div>

      {/* Streaming ticker (#17) */}
      <div className="absolute bottom-[60px] left-0 right-0" style={{ zIndex:12 }}>
        <StreamingTicker />
      </div>

      {/* Ambient toggle (#50) */}
      <AmbientToggle />

      {/* Scroll chevron (#7) */}
      <div className="absolute left-1/2 -translate-x-1/2 animate-fade-up"
        style={{ bottom:'70px', zIndex:15, animationDelay:'1.8s', opacity:0, animationFillMode:'forwards' }}>
        <svg className="w-4 h-4 text-noir-silver/20 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0" style={{ zIndex:10 }}>
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,60 L0,60 Z" fill="#080810"/>
        </svg>
      </div>
    </section>
  )
}
