'use client'

import { useRef } from 'react'
import Link from 'next/link'

const COVER_W = 1400
const COVER_H = 2100

export default function BookCover() {
  const coverRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ background: '#040408', minHeight: '100vh' }}>

      {/* Print controls — hidden when printing */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid rgba(196,149,58,0.12)',
        }}
      >
        <Link
          href="/book"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(196,149,58,0.6)',
            textDecoration: 'none',
          }}
        >
          ← Back to Book
        </Link>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handlePrint}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#C4953A',
              background: 'transparent',
              border: '1px solid rgba(196,149,58,0.4)',
              padding: '0.6rem 1.5rem',
              cursor: 'pointer',
            }}
          >
            Save as Image / PDF
          </button>
        </div>
      </div>

      {/* Cover preview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '3rem 2rem 4rem',
        }}
      >
        <p
          className="no-print"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(242,237,227,0.25)',
            marginBottom: '2rem',
          }}
        >
          Book Cover — 1400 × 2100 px
        </p>

        {/* The actual cover */}
        <div
          ref={coverRef}
          id="book-cover"
          style={{
            width: `${COVER_W / 3}px`,
            height: `${COVER_H / 3}px`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,149,58,0.12)',
          }}
        >
          {/* Background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/chapter-banners/borrowed-time.jpg"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
            }}
          />

          {/* Heavy atmospheric overlays */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(4,4,14,0.72) 0%, rgba(4,4,14,0.38) 35%, rgba(4,4,14,0.55) 65%, rgba(4,4,14,0.88) 100%)',
          }} />

          {/* Top texture fade */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(4,4,14,0.5) 0%, transparent 60%)',
          }} />

          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 110% 100% at 50% 50%, transparent 40%, rgba(4,4,14,0.6) 100%)',
          }} />

          {/* Cover content */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${COVER_W / 3 * 0.1}px ${COVER_W / 3 * 0.08}px`,
          }}>

            {/* Top: author name */}
            <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: `${COVER_W / 3 * 0.038}px`,
                letterSpacing: '0.45em',
                textTransform: 'uppercase',
                color: '#C4953A',
                fontWeight: 400,
              }}>
                NoiraCiel
              </div>
            </div>

            {/* Center: title */}
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${COVER_W / 3 * 0.03}px` }}>
              {/* Decorative line above */}
              <div style={{ width: `${COVER_W / 3 * 0.12}px`, height: '1px', background: 'rgba(196,149,58,0.5)' }} />

              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: `${COVER_W / 3 * 0.095}px`,
                lineHeight: 1.1,
                color: '#F5F0E8',
                letterSpacing: '-0.01em',
                textShadow: '0 2px 40px rgba(0,0,0,0.9)',
                maxWidth: `${COVER_W / 3 * 0.84}px`,
              }}>
                The Life Lessons I Hope You Learn
              </div>

              {/* Decorative line below */}
              <div style={{ width: `${COVER_W / 3 * 0.08}px`, height: '1px', background: 'rgba(196,149,58,0.4)' }} />

              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: `${COVER_W / 3 * 0.028}px`,
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'rgba(245,240,232,0.35)',
              }}>
                A Novel
              </div>
            </div>

            {/* Bottom: Atlantic Noir label */}
            <div style={{ textAlign: 'center', paddingBottom: '0.5rem' }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: `${COVER_W / 3 * 0.022}px`,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(196,149,58,0.45)',
              }}>
                Atlantic Noir
              </div>
            </div>
          </div>
        </div>

        {/* Spine preview (small) */}
        <div
          className="no-print"
          style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '3rem' }}
        >
          {/* Spine */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.5rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.25)', marginBottom: '1rem' }}>Spine</p>
            <div style={{
              width: '48px',
              height: '280px',
              background: '#06060e',
              border: '1px solid rgba(196,149,58,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 0',
              boxShadow: '4px 0 20px rgba(0,0,0,0.6)',
            }}>
              <div style={{
                writingMode: 'vertical-rl',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '10px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#C4953A',
              }}>
                NoiraCiel
              </div>
              <div style={{
                writingMode: 'vertical-lr',
                transform: 'rotate(180deg)',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '9px',
                letterSpacing: '0.1em',
                color: 'rgba(245,240,232,0.5)',
                maxHeight: '160px',
                overflow: 'hidden',
              }}>
                The Life Lessons I Hope You Learn
              </div>
              <div style={{
                writingMode: 'vertical-rl',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '8px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(196,149,58,0.35)',
              }}>
                Atlantic Noir
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ maxWidth: '300px' }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.6rem',
              letterSpacing: '0.05em',
              color: 'rgba(242,237,227,0.4)',
              lineHeight: 1.8,
            }}>
              Cover dimensions: 1400 × 2100 px (6&quot; × 9&quot; at 233 dpi)<br />
              For print-on-demand, use the PDF export from <strong style={{ color: 'rgba(196,149,58,0.6)' }}>/book/print</strong><br />
              Upload interior + this cover to Lulu or Amazon KDP.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #040408 !important; margin: 0 !important; padding: 0 !important; }
          #book-cover {
            width: ${COVER_W}px !important;
            height: ${COVER_H}px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
          }
          @page { margin: 0; size: ${COVER_W}px ${COVER_H}px; }
        }
      `}</style>
    </div>
  )
}
