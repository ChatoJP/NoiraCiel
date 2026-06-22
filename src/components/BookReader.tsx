'use client'

import { useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import Link from 'next/link'
import type { BookChapter } from '@/lib/parseBook'

// G65: page-turn sound via Web Audio
function playPageTurn() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.18)
  } catch { /* blocked */ }
}

const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX',
  'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII',
]

function renderInline(text: string) {
  const parts = text.split(/(\*[^*]+\*)/)
  return parts.map((part, i) =>
    part.startsWith('*') && part.endsWith('*')
      ? <em key={i}>{part.slice(1, -1)}</em>
      : part,
  )
}

const ChapterSection = forwardRef<HTMLElement, { chapter: BookChapter; isFirst: boolean; roman: string }>(
  function ChapterSection({ chapter, isFirst, roman }, ref) {
    // G67: word count + aloud time
    const wordCount = chapter.paragraphs.join(' ').split(/\s+/).filter(Boolean).length
    const readSecs = Math.ceil(wordCount / 2.5)
    const readMins = Math.floor(readSecs / 60)
    const readSecsRem = readSecs % 60

    // G66: print this chapter
    const printChapter = useCallback(() => {
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${chapter.songTitle}</title><style>
        body{font-family:'Georgia',serif;max-width:600px;margin:4rem auto;line-height:1.8;color:#111;font-size:1.05rem}
        h1{font-style:italic;font-weight:400;margin-bottom:0.5rem}
        .meta{font-family:sans-serif;font-size:0.7rem;letter-spacing:.15em;text-transform:uppercase;color:#999;margin-bottom:2rem}
        blockquote{border-left:2px solid #ccc;padding-left:1rem;color:#555;font-style:italic;margin-bottom:2rem}
        @media print{body{margin:1in}}
      </style></head><body>
        <h1>${chapter.songTitle}</h1>
        <div class="meta">Chapter ${roman} · ${wordCount} words</div>
        ${chapter.epigraph ? `<blockquote>${chapter.epigraph}</blockquote>` : ''}
        ${chapter.paragraphs.map(p => `<p>${p.replace(/\*([^*]+)\*/g, '<em>$1</em>')}</p>`).join('')}
      </body></html>`)
      win.document.close()
      win.print()
    }, [chapter, roman, wordCount])
    const innerRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
      const el = innerRef.current
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('bk-chapter-visible')
            observer.disconnect()
          }
        },
        { threshold: 0.08 },
      )
      observer.observe(el)
      return () => observer.disconnect()
    }, [])

    return (
      <section
        ref={(el) => {
          innerRef.current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        className="bk-chapter"
        style={{ paddingTop: isFirst ? '0' : '7rem' }}
      >
        {/* Chapter number watermark */}
        <div
          aria-hidden
          className="bk-roman"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(5rem, 14vw, 10rem)',
            lineHeight: 1,
            color: 'rgba(196,149,58,0.07)',
            letterSpacing: '-0.02em',
            userSelect: 'none',
            marginBottom: '-2rem',
          }}
        >
          {roman}
        </div>

        {/* Song title */}
        <h2
          className="bk-title"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
            color: '#F2EDE3',
            marginBottom: '0.5rem',
            letterSpacing: '0.01em',
          }}
        >
          {chapter.songTitle}
        </h2>

        {/* G67: word count + read-aloud time; G66: print button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.4)' }}>
            {wordCount} words · reads aloud in ~{readMins > 0 ? `${readMins}m ` : ''}{readSecsRem}s
          </span>
          <button
            onClick={printChapter}
            title="Print this chapter"
            aria-label="Print this chapter"
            style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', background: 'transparent', border: '1px solid rgba(196,149,58,0.2)', padding: '0.25rem 0.7rem', cursor: 'pointer' }}
          >
            ⎙ Print
          </button>
        </div>

        {/* Epigraph */}
        {chapter.epigraph && (
          <blockquote
            className="bk-epigraph"
            style={{
              borderLeft: '1px solid rgba(196,149,58,0.35)',
              paddingLeft: '1.25rem',
              marginBottom: '2.5rem',
              fontFamily: 'var(--font-heading)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'rgba(242,237,227,0.55)',
            }}
          >
            &ldquo;{chapter.epigraph}&rdquo;
          </blockquote>
        )}

        {/* Body paragraphs */}
        <div className="bk-body">
          {chapter.paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 300,
                fontSize: 'clamp(1.05rem, 1.8vw, 1.15rem)',
                lineHeight: 1.95,
                color: 'rgba(242,237,227,0.88)',
                marginBottom: '1.6em',
              }}
            >
              {renderInline(para)}
            </p>
          ))}
        </div>

        {/* Chapter end mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '3rem',
            opacity: 0.3,
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(196,149,58,0.4)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#C4953A' }} />
          <div style={{ flex: 1, height: '1px', background: 'rgba(196,149,58,0.4)' }} />
        </div>
      </section>
    )
  },
)

export interface BookMeta {
  title: string
  titleLine1?: string
  titleLine2?: string
  genre: string
  printHref?: string
}

const DEFAULT_META: BookMeta = {
  title: 'The Life Lessons I Hope You Learn',
  titleLine1: 'The Life Lessons',
  titleLine2: 'I Hope You Learn',
  genre: 'Atlantic Noir',
  printHref: '/book/print',
}

export default function BookReader({ chapters, bookMeta }: { chapters: BookChapter[]; bookMeta?: BookMeta }) {
  const meta = { ...DEFAULT_META, ...bookMeta }
  const [activeChapter, setActiveChapter] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [heroVisible, setHeroVisible] = useState(true)
  const chapterRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(total > 0 ? window.scrollY / total : 0)
      setHeroVisible(window.scrollY < window.innerHeight * 0.6)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    chapterRefs.current.forEach((el, idx) => {
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveChapter(idx) },
        { rootMargin: '-25% 0px -65% 0px' },
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [chapters])

  const scrollToChapter = (idx: number) => {
    playPageTurn()
    chapterRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen" style={{ background: '#080810', color: '#F2EDE3' }}>

      {/* Reading progress bar */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
          height: '2px',
          background: 'rgba(196,149,58,0.12)',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #C4953A, #D4A84B)',
            width: `${scrollProgress * 100}%`,
            transition: 'width 80ms linear',
            boxShadow: '0 0 8px rgba(196,149,58,0.5)',
          }}
        />
      </div>

      {/* Back nav */}
      <div
        style={{
          position: 'fixed', top: '1.25rem', left: '1.5rem', zIndex: 55,
          opacity: heroVisible ? 0 : 1,
          transition: 'opacity 0.5s ease',
          pointerEvents: heroVisible ? 'none' : 'auto',
        }}
      >
        <Link
          href="/book"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(196,149,58,0.7)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.8rem' }}>←</span> All Books
        </Link>
      </div>

      {/* Chapter navigation sidebar */}
      <nav
        aria-label="Chapters"
        style={{
          position: 'fixed',
          left: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          opacity: heroVisible ? 0 : 1,
          transition: 'opacity 0.5s ease',
          pointerEvents: heroVisible ? 'none' : 'auto',
        }}
        className="hidden xl:flex"
      >
        {chapters.map((ch, idx) => (
          <button
            key={idx}
            onClick={() => scrollToChapter(idx)}
            title={ch.songTitle}
            aria-label={`Chapter ${idx + 1}: ${ch.songTitle}`}
            style={{
              width: idx === activeChapter ? '20px' : '6px',
              height: '2px',
              borderRadius: '1px',
              background: idx === activeChapter
                ? '#C4953A'
                : 'rgba(196,149,58,0.25)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: idx === activeChapter ? '0 0 6px rgba(196,149,58,0.4)' : 'none',
            }}
          />
        ))}
      </nav>

      {/* Hero */}
      <header
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '4rem 1.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(196,149,58,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Vertical line above */}
        <div style={{ width: '1px', height: '4rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', marginBottom: '2.5rem' }} />

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.6rem',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: '#C4953A',
            opacity: 0.7,
            marginBottom: '2rem',
          }}
        >
          NoiraCiel
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(2.4rem, 6vw, 5.5rem)',
            lineHeight: 1.1,
            color: '#F2EDE3',
            letterSpacing: '-0.01em',
            marginBottom: '1.5rem',
            maxWidth: '800px',
          }}
        >
          {meta.titleLine1 ? <>{meta.titleLine1}<br />{meta.titleLine2}</> : meta.title}
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(242,237,227,0.3)',
            marginBottom: '4rem',
          }}
        >
          A Book · {chapters.length} Chapters
        </p>

        <button
          onClick={() => scrollToChapter(0)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#C4953A',
            background: 'transparent',
            border: '1px solid rgba(196,149,58,0.35)',
            padding: '0.75rem 2rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(196,149,58,0.08)'
            e.currentTarget.style.borderColor = 'rgba(196,149,58,0.7)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(196,149,58,0.35)'
          }}
        >
          Begin Reading
        </button>

        {/* Get the book */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {meta.printHref && (
            <Link
              href={meta.printHref}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.55rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'rgba(242,237,227,0.45)',
                textDecoration: 'none',
                border: '1px solid rgba(242,237,227,0.12)',
                padding: '0.5rem 1.25rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              ↓ Download PDF
            </Link>
          )}
          <a
            href="https://www.lulu.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.55rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(196,149,58,0.6)',
              textDecoration: 'none',
              border: '1px solid rgba(196,149,58,0.2)',
              padding: '0.5rem 1.25rem',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ↗ Buy Hardcover
          </a>
        </div>

        {/* Vertical line below */}
        <div style={{ width: '1px', height: '4rem', background: 'linear-gradient(to bottom, rgba(196,149,58,0.3), transparent)', marginTop: '2rem' }} />
      </header>

      {/* Reading column */}
      <main
        style={{
          maxWidth: '660px',
          margin: '0 auto',
          padding: '0 1.5rem 8rem',
        }}
      >
        {chapters.map((chapter, idx) => (
          <ChapterSection
            key={idx}
            chapter={chapter}
            isFirst={idx === 0}
            roman={ROMAN[chapter.number - 1] ?? String(chapter.number)}
            ref={(el) => { chapterRefs.current[idx] = el }}
          />
        ))}
      </main>

      {/* Colophon */}
      <footer
        style={{
          textAlign: 'center',
          padding: '0 1.5rem 6rem',
        }}
      >
        <div style={{ width: '1px', height: '5rem', background: 'linear-gradient(to bottom, rgba(196,149,58,0.3), transparent)', margin: '0 auto 3rem' }} />
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1.1rem',
            color: 'rgba(242,237,227,0.35)',
            marginBottom: '1.5rem',
          }}
        >
          {meta.title}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(196,149,58,0.4)',
            marginBottom: '0.5rem',
          }}
        >
          NoiraCiel
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.55rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(242,237,227,0.2)',
          }}
        >
          {meta.genre}
        </p>
        <div style={{ marginTop: '3rem' }}>
          <Link
            href="/book"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(196,149,58,0.5)',
              textDecoration: 'none',
            }}
          >
            ← All Books
          </Link>
        </div>
      </footer>

    </div>
  )
}
