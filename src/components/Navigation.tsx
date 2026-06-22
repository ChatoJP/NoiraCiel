'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useAudio } from '@/context/AudioContext'

// G85: Mini frequency bar visualizer behind logo
function LogoVisualizer() {
  const { isPlaying, getAnalyser } = useAudio()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const analyser = getAnalyser()
    if (!analyser) return
    analyser.fftSize = 64
    const buf = new Uint8Array(analyser.frequencyBinCount)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      if (!ctx || !canvas || !analyser) return
      analyser.getByteFrequencyData(buf)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barW = canvas.width / buf.length
      for (let i = 0; i < buf.length; i++) {
        const h = (buf[i] / 255) * canvas.height
        ctx.fillStyle = `rgba(196,149,58,${0.3 + (buf[i] / 255) * 0.5})`
        ctx.fillRect(i * barW, canvas.height - h, barW - 1, h)
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isPlaying, getAnalyser])

  if (!isPlaying) return null
  return (
    <canvas
      ref={canvasRef}
      width={28}
      height={14}
      aria-hidden="true"
      style={{ position: 'absolute', bottom: -4, left: 0, opacity: 0.65, pointerEvents: 'none' }}
    />
  )
}

const PRIMARY_LINKS = [
  { label: 'Music',   href: '/music' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Book',    href: '/book' },
  { label: 'Stories', href: '/stories' },
  { label: 'Studio',  href: '/studio' },
]

const MORE_LINKS = [
  { label: 'Videos',      href: '#videos' },
  { label: 'Objects',     href: '/objects' },
  { label: 'Shows',       href: '/shows' },
  { label: 'Rooms',       href: '/rooms' },
  { label: 'Discover',    href: '/discover' },
  { label: 'Download',    href: '/download' },
  { label: 'Scholarship', href: '/scholarship' },
  { label: 'World',       href: '#world' },
  { label: 'Contact',     href: '#contact' },
]

const ALL_MOBILE_LINKS = [...PRIMARY_LINKS, ...MORE_LINKS, { label: 'Join', href: '/join' }]

const SECTION_IDS = ['music', 'gallery', 'videos', 'merch', 'world', 'contact']

export default function Navigation() {
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [moreOpen, setMoreOpen]     = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const pathname  = usePathname()
  const isHome    = pathname === '/'
  const moreRef   = useRef<HTMLLIElement>(null)
  const cart      = useCart()
  const { isPlaying } = useAudio()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false); setMoreOpen(false) }, [pathname])

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    if (!moreOpen) return
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  // Active section highlighting via IntersectionObserver (homepage only)
  useEffect(() => {
    if (!isHome) { setActiveHash(''); return }
    const observers: IntersectionObserver[] = []
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveHash('#' + id) },
        { threshold: 0.2, rootMargin: '-15% 0px -55% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((obs) => obs.disconnect())
  }, [isHome])

  function resolveHref(href: string): string {
    if (!href.startsWith('#')) return href
    return isHome ? href : `/${href}`
  }

  function isLinkActive(href: string): boolean {
    if (href.startsWith('#')) return href === activeHash
    if (href === '/music') return pathname === '/music' || pathname.startsWith('/music/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  function desktopCls(href: string) {
    const active = isLinkActive(href)
    return `font-body text-xs tracking-[0.18em] uppercase transition-colors duration-300 relative pb-1 ${
      active ? 'text-noir-gold nav-active-dot' : 'text-noir-silver/65 hover:text-noir-ivory'
    }`
  }

  function mobileCls(href: string) {
    const active = isLinkActive(href)
    return `font-body text-sm tracking-[0.15em] uppercase block py-3 pl-4 transition-all duration-300 border-l ${
      active
        ? 'text-noir-gold border-noir-gold/60'
        : 'text-noir-silver/65 border-transparent hover:text-noir-ivory hover:border-noir-silver/20'
    }`
  }

  function NavLink({ href, label, mobile = false }: { href: string; label: string; mobile?: boolean }) {
    const resolved = resolveHref(href)
    const cls = mobile ? mobileCls(href) : desktopCls(href)
    const onClick = () => { setMenuOpen(false); setMoreOpen(false) }

    if (href.startsWith('#')) {
      return <a href={resolved} className={cls} onClick={onClick}>{label}</a>
    }
    return <Link href={resolved} className={cls} onClick={onClick}>{label}</Link>
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-noir-black/80 backdrop-blur-xl border-b border-noir-silver/10'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div style={{ position: 'relative' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0 transition-all duration-300 group-hover:scale-110"
            style={isPlaying ? { animation: 'logo-heartbeat 1.2s ease-in-out infinite', filter: 'drop-shadow(0 0 6px rgba(196,149,58,0.7))' } : undefined}>
            <polygon points="14,2 26,14 14,26 2,14" stroke="#C4953A" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <polygon points="14,7 21,14 14,21 7,14" stroke="#C4953A" strokeWidth="0.6" fill="none" opacity="0.35"/>
            <circle cx="14" cy="14" r="1.8" fill="#C4953A" opacity="0.8"/>
          </svg>
          <LogoVisualizer />
          </div>
          <span className="font-heading text-lg tracking-[0.22em] text-noir-ivory group-hover:text-noir-gold transition-colors duration-300 uppercase">
            NoiraCiel
          </span>
        </Link>

        {/* Desktop — primary links */}
        <ul className="hidden md:flex items-center gap-7">
          {PRIMARY_LINKS.map((link) => (
            <li key={link.href}>
              <NavLink href={link.href} label={link.label} />
            </li>
          ))}

          {/* More dropdown */}
          <li ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex items-center gap-1 font-body text-xs tracking-[0.15em] uppercase transition-colors duration-300 ${
                moreOpen ? 'text-noir-ivory' : 'text-noir-silver/70 hover:text-noir-ivory'
              }`}
            >
              More
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {moreOpen && (
              <div className="absolute top-full right-0 mt-3 w-48 bg-noir-black/97 backdrop-blur-xl border border-noir-silver/12 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.7)]">
                {MORE_LINKS.map((link) => (
                  <div key={link.href} className="px-4 py-2 border-l-2 border-transparent hover:border-noir-gold/40 hover:bg-noir-gold/4 transition-all duration-200">
                    <NavLink href={link.href} label={link.label} />
                  </div>
                ))}
              </div>
            )}
          </li>
        </ul>

        {/* Desktop — right CTAs */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/join"
            className={`font-body text-xs tracking-[0.15em] uppercase transition-colors duration-300 ${
              pathname === '/join' ? 'text-noir-gold' : 'text-noir-silver/70 hover:text-noir-ivory'
            }`}
          >
            Join
          </Link>
          {/* Cart icon */}
          <button
            onClick={() => cart.setOpen(true)}
            aria-label={`Open cart${cart.count > 0 ? `, ${cart.count} items` : ''}`}
            className="relative text-noir-silver/70 hover:text-noir-ivory transition-colors duration-300 p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {cart.count > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-noir-gold text-noir-void text-[9px] font-bold leading-none">
                {cart.count > 9 ? '9+' : cart.count}
              </span>
            )}
          </button>
          <a
            href={resolveHref('#music')}
            className="btn-noir"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-noir-gold animate-pulse-gold" />
            Listen
          </a>
        </div>

        {/* Mobile hamburger + cart */}
        <div className="md:hidden flex items-center gap-3">
          {/* Mobile cart icon */}
          <button
            onClick={() => cart.setOpen(true)}
            aria-label={`Open cart${cart.count > 0 ? `, ${cart.count} items` : ''}`}
            className="relative text-noir-silver/70 hover:text-noir-ivory transition-colors duration-300 p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {cart.count > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-noir-gold text-noir-void text-[9px] font-bold leading-none">
                {cart.count > 9 ? '9+' : cart.count}
              </span>
            )}
          </button>
        <button
          className="flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-px bg-noir-ivory transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-px bg-noir-ivory transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-px bg-noir-ivory transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-500 overflow-y-auto ${
          menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="bg-noir-black/97 backdrop-blur-xl border-t border-noir-silver/10 px-6 py-6">
          <ul className="flex flex-col gap-1">
            {ALL_MOBILE_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} label={link.label} mobile />
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-6 border-t border-noir-silver/8">
            <a
              href={resolveHref('#music')}
              className="btn-noir"
              onClick={() => setMenuOpen(false)}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-noir-gold animate-pulse-gold" />
              Listen Now
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
