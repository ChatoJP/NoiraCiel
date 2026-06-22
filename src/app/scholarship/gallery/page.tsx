import type { Metadata } from 'next'
import Link from 'next/link'
import { getFeaturedSubmissions } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Invisible Gallery — NoiraCiel',
  description: 'A gallery of creative work by young people supported by The Invisible Roots Scholarship.',
}

const CATEGORY_LABELS: Record<string, string> = {
  music: 'Music',
  visual_art: 'Visual Art',
  writing: 'Writing & Poetry',
  film: 'Film & Video',
  photography: 'Photography',
  dance: 'Dance & Movement',
  other: 'Creative Work',
}

export default function GalleryPage() {
  const featured = getFeaturedSubmissions()

  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ padding: '8rem 1.5rem 5rem', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ width: '1px', height: '5rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', margin: '0 auto 2.5rem' }} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', opacity: 0.75, marginBottom: '1.5rem' }}>
          The Invisible Gallery
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3.8rem)', lineHeight: 1.1, marginBottom: '2rem' }}>
          Young voices. Real work.
        </h1>
        <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', margin: '0 auto 2rem' }} />
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)' }}>
          Selected creative work from young people across the world — musicians, writers, visual artists,
          filmmakers and dancers who submitted through our Open Call.
          Talent is everywhere. This is proof.
        </p>
      </section>

      {/* Gallery */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        {featured.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '1px solid rgba(196,149,58,0.08)' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.1rem', color: 'rgba(242,237,227,0.25)', marginBottom: '2rem' }}>
              The gallery opens with its first Open Call selections. Submissions are being reviewed.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(242,237,227,0.2)', marginBottom: '2.5rem' }}>
              If you are between 5 and 30 years old and create — music, art, writing, film, dance — this is for you.
            </p>
            <Link
              href="/scholarship/open-call"
              style={{
                fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
                color: '#C4953A', border: '1px solid rgba(196,149,58,0.35)', padding: '0.75rem 2rem',
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              Submit Your Work
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2px', background: 'rgba(196,149,58,0.06)' }}>
            {featured.map(s => (
              <div
                key={s.id}
                style={{
                  background: '#080810',
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.5rem',
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: '#C4953A', opacity: 0.7, marginBottom: '1rem',
                }}>
                  {CATEGORY_LABELS[s.category] ?? s.category}
                </span>
                <h2 style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
                  fontSize: '1.3rem', color: '#F2EDE3', lineHeight: 1.3, marginBottom: '0.75rem',
                }}>
                  {s.title}
                </h2>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.12em',
                  color: 'rgba(242,237,227,0.35)', marginBottom: '1.25rem',
                }}>
                  {s.allowPublicDisplay ? s.submitterName : 'Anonymous'} · {s.country} · Age {s.age}
                </p>
                <p style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '0.88rem',
                  lineHeight: 1.75, color: 'rgba(242,237,227,0.5)', flex: 1, marginBottom: '1.5rem',
                }}>
                  {s.description.length > 180 ? s.description.slice(0, 180) + '…' : s.description}
                </p>
                {s.statement && (
                  <blockquote style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
                    fontSize: '0.85rem', color: 'rgba(242,237,227,0.35)', lineHeight: 1.7,
                    borderLeft: '2px solid rgba(196,149,58,0.2)', paddingLeft: '1rem',
                    marginBottom: '1.5rem',
                  }}>
                    &ldquo;{s.statement.length > 120 ? s.statement.slice(0, 120) + '…' : s.statement}&rdquo;
                  </blockquote>
                )}
                <a
                  href={s.workUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.55rem',
                    letterSpacing: '0.25em', textTransform: 'uppercase',
                    color: '#C4953A', textDecoration: 'none',
                    alignSelf: 'flex-start',
                  }}
                >
                  View Work →
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Open Call CTA */}
      {featured.length > 0 && (
        <section style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1.5rem 6rem', textAlign: 'center' }}>
          <div style={{ padding: '2.5rem', border: '1px solid rgba(196,149,58,0.1)' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.1rem', color: 'rgba(242,237,227,0.45)', lineHeight: 1.7, marginBottom: '1.75rem' }}>
              Are you between 5 and 30? Do you create?
            </p>
            <Link
              href="/scholarship/open-call"
              style={{
                fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
                color: '#C4953A', border: '1px solid rgba(196,149,58,0.35)', padding: '0.75rem 2rem',
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              Submit to the Open Call
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
