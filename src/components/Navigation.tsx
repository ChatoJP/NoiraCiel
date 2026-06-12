'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Music',     href: '#music' },
  { label: 'Songs',     href: '/music' },
  { label: 'Gallery',   href: '#gallery' },
  { label: 'Videos',    href: '#videos' },
  { label: 'Merch',     href: '#merch' },
  { label: 'World',     href: '#world' },
  { label: 'Contact',   href: '#contact' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Resolve href:
  //   /path  → Next.js Link (client-side navigation)
  //   #hash  → plain <a href="#hash">  (same-page smooth scroll)
  //   #hash on non-home page → plain <a href="/#hash"> (full reload, browser handles scroll)
  function resolveHref(href: string): string {
    if (!href.startsWith('#')) return href
    return isHome ? href : `/${href}`
  }

  const linkClass = "font-body text-xs tracking-[0.15em] text-noir-silver/70 hover:text-noir-ivory transition-colors duration-300 uppercase"
  const mobileLinkClass = "font-body text-sm tracking-[0.15em] text-noir-silver hover:text-noir-ivory transition-colors duration-300 uppercase block py-1"

  function NavItem({ href, label, mobile = false }: { href: string; label: string; mobile?: boolean }) {
    const resolved = resolveHref(href)
    const cls = mobile ? mobileLinkClass : linkClass

    // Always use plain <a> for hash navigation — <Link> is unreliable for hash scrolling
    if (href.startsWith('#')) {
      return (
        <a href={resolved} className={cls} onClick={() => setMenuOpen(false)}>
          {label}
        </a>
      )
    }

    return (
      <Link href={resolved} className={cls} onClick={() => setMenuOpen(false)}>
        {label}
      </Link>
    )
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

        {/* Logo — always goes home */}
        <Link href="/" className="flex items-center gap-3 group">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 transition-all duration-300 group-hover:scale-110">
            <polygon points="14,2 26,14 14,26 2,14" stroke="#C4953A" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <polygon points="14,7 21,14 14,21 7,14" stroke="#C4953A" strokeWidth="0.6" fill="none" opacity="0.35"/>
            <circle cx="14" cy="14" r="1.8" fill="#C4953A" opacity="0.8"/>
          </svg>
          <span className="font-heading text-lg tracking-[0.22em] text-noir-ivory group-hover:text-noir-gold transition-colors duration-300 uppercase">
            NoiraCiel
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <NavItem href={link.href} label={link.label} />
            </li>
          ))}
        </ul>

        {/* Listen CTA */}
        <a
          href={resolveHref('#music')}
          className="hidden md:inline-flex items-center gap-2 px-5 py-2 border border-noir-gold/40 text-noir-gold text-xs tracking-[0.15em] uppercase font-body hover:bg-noir-gold/10 transition-all duration-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-noir-gold animate-pulse-gold" />
          Listen
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-px bg-noir-ivory transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-px bg-noir-ivory transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-px bg-noir-ivory transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-500 overflow-hidden ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-noir-black/95 backdrop-blur-xl border-t border-noir-silver/10 px-6 py-6">
          <ul className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <NavItem href={link.href} label={link.label} mobile />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  )
}
