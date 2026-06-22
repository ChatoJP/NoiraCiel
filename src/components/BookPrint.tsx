'use client'

import Link from 'next/link'
import type { BookChapter } from '@/lib/parseBook'

const ROMAN = [
  'I','II','III','IV','V','VI','VII','VIII','IX',
  'X','XI','XII','XIII','XIV','XV','XVI','XVII',
]

function renderInline(text: string) {
  const parts = text.split(/(\*[^*]+\*)/)
  return parts.map((part, i) =>
    part.startsWith('*') && part.endsWith('*')
      ? <em key={i}>{part.slice(1, -1)}</em>
      : part,
  )
}

export default function BookPrint({ chapters }: { chapters: BookChapter[] }) {
  return (
    <div className="bp-root">

      {/* Screen-only toolbar */}
      <div className="bp-toolbar no-print">
        <Link href="/book" className="bp-back">← Book</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.3)' }}>
            {chapters.length} chapters · ~6,500 words
          </span>
          <button className="bp-print-btn" onClick={() => window.print()}>
            Download PDF
          </button>
        </div>
      </div>

      {/* Title page */}
      <div className="bp-title-page">
        <div className="bp-title-content">
          <p className="bp-label">NoiraCiel</p>
          <h1 className="bp-main-title">
            The Life Lessons<br />I Hope You Learn
          </h1>
          <div className="bp-rule" />
          <p className="bp-subtitle">A Novel</p>
        </div>
        <p className="bp-colophon-line">Atlantic Noir</p>
      </div>

      {/* Half-title page */}
      <div className="bp-half-title">
        <p className="bp-ht-text">The Life Lessons I Hope You Learn</p>
      </div>

      {/* Chapters */}
      {chapters.map((ch, idx) => (
        <div key={idx} className="bp-chapter">
          <div className="bp-chapter-header">
            <p className="bp-roman">{ROMAN[idx]}</p>
            <h2 className="bp-chapter-title">{ch.songTitle}</h2>
            {ch.epigraph && (
              <blockquote className="bp-epigraph">
                &ldquo;{ch.epigraph}&rdquo;
              </blockquote>
            )}
            <div className="bp-chapter-rule" />
          </div>

          <div className="bp-chapter-body">
            {ch.paragraphs.map((para, i) => (
              <p key={i} className="bp-para">
                {renderInline(para)}
              </p>
            ))}
          </div>
        </div>
      ))}

      {/* Colophon */}
      <div className="bp-final">
        <div className="bp-final-rule" />
        <p className="bp-final-title">The Life Lessons I Hope You Learn</p>
        <p className="bp-final-author">NoiraCiel</p>
        <p className="bp-final-label">Atlantic Noir</p>
      </div>

      <style>{`
        /* ── Base ── */
        .bp-root {
          background: #faf8f4;
          color: #1a1a1a;
          font-family: 'Cormorant Garamond', Georgia, serif;
        }

        /* ── Toolbar (screen only) ── */
        .bp-toolbar {
          background: #080810;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(196,149,58,0.15);
        }
        .bp-back {
          font-family: var(--font-body);
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(196,149,58,0.65);
          text-decoration: none;
        }
        .bp-print-btn {
          font-family: var(--font-body);
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #C4953A;
          background: transparent;
          border: 1px solid rgba(196,149,58,0.45);
          padding: 0.55rem 1.4rem;
          cursor: pointer;
        }

        /* ── Title page ── */
        .bp-title-page {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 15% 10% 10%;
          text-align: center;
        }
        .bp-title-content { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        .bp-label {
          font-size: 0.75rem;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: #8a7040;
          font-weight: 400;
        }
        .bp-main-title {
          font-weight: 300;
          font-style: italic;
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          line-height: 1.15;
          color: #1a1a1a;
          letter-spacing: -0.01em;
        }
        .bp-rule {
          width: 2.5rem;
          height: 1px;
          background: #b8963a;
          opacity: 0.6;
        }
        .bp-subtitle {
          font-size: 0.8rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #888;
        }
        .bp-colophon-line {
          font-size: 0.65rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #aaa;
        }

        /* ── Half title ── */
        .bp-half-title {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10%;
        }
        .bp-ht-text {
          font-style: italic;
          font-weight: 300;
          font-size: 1.5rem;
          color: #444;
          text-align: center;
        }

        /* ── Chapters ── */
        .bp-chapter {
          max-width: 680px;
          margin: 0 auto;
          padding: 10% 2rem 8%;
        }
        .bp-chapter-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .bp-roman {
          font-size: 0.75rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #b8963a;
          margin-bottom: 0.75rem;
          font-style: normal;
          font-weight: 400;
        }
        .bp-chapter-title {
          font-weight: 300;
          font-style: italic;
          font-size: clamp(1.5rem, 3vw, 2rem);
          color: #1a1a1a;
          line-height: 1.25;
          margin-bottom: 1.5rem;
          letter-spacing: 0.01em;
        }
        .bp-epigraph {
          font-style: italic;
          font-size: 0.9rem;
          color: #666;
          line-height: 1.7;
          border-left: 1px solid rgba(184,150,58,0.45);
          padding-left: 1rem;
          margin: 0 2rem 1.5rem;
          text-align: left;
          font-weight: 300;
        }
        .bp-chapter-rule {
          width: 1.5rem;
          height: 1px;
          background: rgba(184,150,58,0.5);
          margin: 1.5rem auto 0;
        }

        /* ── Body ── */
        .bp-chapter-body {}
        .bp-para {
          font-size: 1.05rem;
          line-height: 1.85;
          color: #222;
          margin-bottom: 1.4em;
          font-weight: 300;
          text-indent: 0;
          hyphens: auto;
        }
        .bp-para + .bp-para {
          text-indent: 1.5em;
          margin-bottom: 0;
          margin-top: 0;
        }

        /* ── Final page ── */
        .bp-final {
          min-height: 50vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 10%;
          gap: 1rem;
        }
        .bp-final-rule {
          width: 1.5rem;
          height: 1px;
          background: rgba(184,150,58,0.45);
          margin-bottom: 1rem;
        }
        .bp-final-title {
          font-style: italic;
          font-weight: 300;
          font-size: 1rem;
          color: #666;
        }
        .bp-final-author {
          font-size: 0.7rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #b8963a;
        }
        .bp-final-label {
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #bbb;
        }

        /* ── Print styles ── */
        @media print {
          .no-print { display: none !important; }

          @page {
            size: 6in 9in;
            margin: 0.875in 0.75in 0.875in 0.875in;
          }

          .bp-root {
            background: #fff !important;
          }

          .bp-title-page {
            page-break-after: always;
            min-height: auto;
            height: 100vh;
          }

          .bp-half-title {
            page-break-after: always;
          }

          .bp-chapter {
            page-break-before: always;
            padding: 0;
            max-width: 100%;
          }

          .bp-chapter-header {
            padding-top: 1.5rem;
          }

          .bp-para {
            font-size: 10.5pt;
            line-height: 1.75;
            orphans: 3;
            widows: 3;
          }

          .bp-main-title {
            font-size: 32pt;
          }

          .bp-chapter-title {
            font-size: 20pt;
          }

          .bp-epigraph {
            font-size: 9.5pt;
          }
        }
      `}</style>
    </div>
  )
}
