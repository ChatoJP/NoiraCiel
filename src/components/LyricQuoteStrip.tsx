'use client'

import { useEffect, useRef } from 'react'

interface LyricQuoteStripProps {
  quote: string
  song: string
  align?: 'left' | 'center' | 'right'
  variant?: 'vignette' | 'monumental' | 'side'
}

export default function LyricQuoteStrip({
  quote,
  song,
  align = 'center',
  variant = 'vignette',
}: LyricQuoteStripProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('lqs-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.18 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (variant === 'monumental') {
    return (
      <section ref={ref} className="lqs relative py-28 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(196,149,58,0.04) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-px"
          style={{ height: '3rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.35))' }}
        />

        <div className="relative mx-auto max-w-6xl text-center">
          <blockquote
            className="lqs-quote"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: 'clamp(3rem, 7vw, 7.5rem)',
              lineHeight: 1.15,
              color: 'rgba(242,237,227,0.95)',
              letterSpacing: '-0.01em',
            }}
          >
            {quote}
          </blockquote>
          <p
            className="lqs-attr mt-8"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#C4953A',
            }}
          >
            — {song}
          </p>
        </div>

        <div
          className="absolute left-1/2 bottom-0 -translate-x-1/2 w-px"
          style={{ height: '3rem', background: 'linear-gradient(to bottom, rgba(196,149,58,0.35), transparent)' }}
        />
      </section>
    )
  }

  if (variant === 'side') {
    const isRight = align === 'right'
    return (
      <section ref={ref} className="lqs relative py-24 px-6 overflow-hidden">
        <div className="relative mx-auto max-w-5xl">
          <div
            className={`flex flex-col ${isRight ? 'items-end text-right' : 'items-start text-left'}`}
          >
            <div
              className="lqs-bar mb-7"
              style={{
                width: '3.5rem',
                height: '1px',
                background: isRight
                  ? 'linear-gradient(270deg, #C4953A, rgba(196,149,58,0.3))'
                  : 'linear-gradient(90deg, #C4953A, rgba(196,149,58,0.3))',
                transformOrigin: isRight ? 'right' : 'left',
              }}
            />
            <blockquote
              className="lqs-quote"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: 'clamp(2rem, 4.5vw, 4.2rem)',
                lineHeight: 1.3,
                color: 'rgba(242,237,227,0.95)',
                maxWidth: '720px',
              }}
            >
              {quote}
            </blockquote>
            <p
              className="lqs-attr mt-6"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.63rem',
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: '#C4953A',
              }}
            >
              — {song}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Default: 'vignette'
  return (
    <section ref={ref} className="lqs relative py-24 px-6 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(8,8,16,0.6) 30%, rgba(8,8,16,0.6) 70%, transparent 100%)',
        }}
      />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '1px',
          height: '2.5rem',
          background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.45))',
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <blockquote
          className="lqs-quote"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(2rem, 4vw, 3.8rem)',
            lineHeight: 1.4,
            color: 'rgba(242,237,227,0.95)',
          }}
        >
          {quote}
        </blockquote>
        <p
          className="lqs-attr mt-7"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.63rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: '#C4953A',
          }}
        >
          — {song}
        </p>
      </div>

      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2"
        style={{
          width: '1px',
          height: '2.5rem',
          background: 'linear-gradient(to bottom, rgba(196,149,58,0.45), transparent)',
        }}
      />
    </section>
  )
}
