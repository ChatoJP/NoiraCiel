import type { Metadata } from 'next'
import Link from 'next/link'
import { getImpactStats, getApprovedMessages } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Invisible Roots Scholarship',
  description: 'The Invisible Roots Scholarship supports young people from low-income families with education, books, instruments, digital tools and creative opportunities — through the art of NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/scholarship' },
  openGraph: {
    title: 'The Invisible Roots Scholarship — NoiraCiel',
    description: 'Supporting young people from low-income families with education, books, instruments, digital tools and creative opportunities.',
    url: 'https://noiraciel.com/scholarship',
    type: 'website',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'The Invisible Roots Scholarship — NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Invisible Roots Scholarship — NoiraCiel',
    description: 'Supporting young people from low-income families with education, books, instruments, digital tools and creative opportunities.',
    images: ['/images/album-cover.png'],
  },
}

function StatCard({ value, label, tooltip }: { value: string; label: string; tooltip?: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '2rem 1.5rem',
      border: '1px solid rgba(196,149,58,0.15)',
      background: 'rgba(196,149,58,0.03)',
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(2rem, 5vw, 3.2rem)',
        color: '#C4953A',
        lineHeight: 1,
        marginBottom: '0.5rem',
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.6rem',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(242,237,227,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
      }}>
        {label}
        {tooltip && (
          <span title={tooltip} style={{ cursor: 'help', opacity: 0.5, fontSize: '0.65rem' }} aria-label={tooltip}>ⓘ</span>
        )}
      </div>
    </div>
  )
}

const pillars = [
  {
    label: 'Scholarship',
    title: 'Apply or Nominate',
    description: 'Books, instruments, laptops, school materials, training — for young people whose families gave everything they could.',
    href: '/scholarship/apply',
    cta: 'Apply now',
    primary: true,
  },
  {
    label: 'Contribute',
    title: 'Support the Scholarship',
    description: 'Your contribution goes directly toward a young person\'s next step. Every euro is documented.',
    href: '/scholarship/donate',
    cta: 'Donate',
    primary: true,
  },
  {
    label: 'Sponsor a Dream',
    title: 'Name what you give',
    description: 'Choose something concrete — a book, a lesson, a laptop, a month of art supplies — and know exactly what you funded.',
    href: '/scholarship/sponsor',
    cta: 'See tiers',
    primary: false,
  },
  {
    label: 'Mentorship Circle',
    title: 'Volunteer or Mentor',
    description: 'Offer your time, craft or guidance. Walk alongside a young person as they find their path.',
    href: '/scholarship/volunteer',
    cta: 'Express interest',
    primary: false,
  },
  {
    label: 'Open Call',
    title: 'Share your creative work',
    description: 'Young creators aged 5–30 can submit music, art, writing, film and dance to the Invisible Gallery.',
    href: '/scholarship/open-call',
    cta: 'Submit work',
    primary: false,
  },
  {
    label: 'Community Wall',
    title: 'Leave a word',
    description: 'A message of encouragement for the young people this project reaches. Seen by those who need it most.',
    href: '/scholarship/community',
    cta: 'Write something',
    primary: false,
  },
  {
    label: 'Letters to the Future',
    title: 'Write to someone not yet born',
    description: 'A living archive of letters from people who believe the world can be different. Add yours.',
    href: '/scholarship/letters',
    cta: 'Write a letter',
    primary: false,
  },
  {
    label: 'Kitchen Table Grants',
    title: 'Small needs, real consequences',
    description: 'Internet access, transport, a set of strings, a printed portfolio. The things that change a life for under €50.',
    href: '/scholarship/grants',
    cta: 'Learn more',
    primary: false,
  },
]

export default function ScholarshipPage() {
  const stats = getImpactStats()
  const messages = getApprovedMessages().slice(0, 3)

  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '8rem 1.5rem 6rem',
        overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(196,149,58,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '1px', height: '5rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', marginBottom: '3rem' }} />

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.55rem',
          letterSpacing: '0.45em',
          textTransform: 'uppercase',
          color: '#C4953A',
          opacity: 0.75,
          marginBottom: '2rem',
        }}>
          NoiraCiel · Social Impact
        </p>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: 'clamp(2.2rem, 6vw, 5rem)',
          lineHeight: 1.1,
          color: '#F2EDE3',
          letterSpacing: '-0.01em',
          marginBottom: '2.5rem',
          maxWidth: '820px',
        }}>
          The Invisible Roots<br />Scholarship
        </h1>

        <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', marginBottom: '2.5rem' }} />

        <p style={{
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(1.1rem, 2.2vw, 1.4rem)',
          lineHeight: 1.75,
          color: 'rgba(242,237,227,0.65)',
          maxWidth: '700px',
          marginBottom: '4rem',
        }}>
          For the children of quiet sacrifice — young people with talent, hunger, kindness or courage,
          whose families gave everything they could, and sometimes more.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/scholarship/donate"
            style={{
              fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: '#080810', background: '#C4953A',
              padding: '0.9rem 2.5rem', textDecoration: 'none', display: 'inline-block',
            }}
          >
            Support the Scholarship
          </Link>
          <Link
            href="/scholarship/apply"
            style={{
              fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '0.28em',
              textTransform: 'uppercase', color: '#C4953A', background: 'transparent',
              border: '1px solid rgba(196,149,58,0.4)', padding: '0.9rem 2.5rem',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Apply or Nominate
          </Link>
        </div>

        <div style={{ width: '1px', height: '5rem', background: 'linear-gradient(to bottom, rgba(196,149,58,0.3), transparent)', marginTop: '4rem' }} />
      </section>

      {/* Impact counters */}
      <section style={{ padding: '0 1.5rem 6rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1px',
          background: 'rgba(196,149,58,0.1)',
        }}>
          <StatCard value={stats.totalRaisedFormatted} label="Total contributed" tooltip="Includes all direct donations and a percentage of NoiraCiel merchandise sales." />
          <StatCard value={String(stats.supporters)} label="Supporters" tooltip="Unique donors and contributors since the scholarship launched." />
          <StatCard value={String(stats.scholarshipsFunded)} label="Scholarships funded" tooltip="Young people who have received documented scholarship awards." />
          <StatCard value={String(stats.totalApplications)} label="Applications" tooltip="Total applications received since launch, across all categories." />
          <StatCard value={String(stats.volunteerCount)} label="Mentors & volunteers" tooltip="Approved volunteers and mentors in the Mentorship Circle." />
          <StatCard value={String(stats.galleryCount)} label="Gallery submissions" tooltip="Creative works submitted by young people aged 5–30." />
        </div>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em',
          color: 'rgba(242,237,227,0.25)', textAlign: 'center', marginTop: '1.25rem',
        }}>
          Updated in real time · All figures include platform fees before deduction
        </p>

        {/* G69: Fund progress bar toward current milestone */}
        {(() => {
          const goalCents = 500000 // €5,000
          const pct = Math.min(100, Math.round((stats.totalRaisedCents / goalCents) * 100))
          return (
            <div style={{ marginTop: '2.5rem', padding: '0 0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.35)' }}>
                <span>Current milestone: €5,000</span>
                <span style={{ color: 'rgba(196,149,58,0.7)' }}>{pct}% reached</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(196,149,58,0.1)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#C4953A,#D4A84B)', borderRadius: '2px', transition: 'width 1.2s ease', boxShadow: '0 0 8px rgba(196,149,58,0.4)' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.5rem', letterSpacing: '0.1em', color: 'rgba(242,237,227,0.2)', marginTop: '0.5rem', textAlign: 'right' }}>
                {stats.totalRaisedFormatted} raised
              </p>
            </div>
          )
        })()}
      </section>

      {/* Mission */}
      <section style={{
        maxWidth: '720px', margin: '0 auto',
        padding: '4rem 1.5rem 6rem',
        borderTop: '1px solid rgba(196,149,58,0.1)',
      }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', marginBottom: '2.5rem', opacity: 0.7 }}>
          Why this exists
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', lineHeight: 1.85, color: 'rgba(242,237,227,0.78)', marginBottom: '2rem' }}>
          NoiraCiel is built on a belief that talent and dignity are distributed equally
          across the world, but opportunity is not.
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.5)', marginBottom: '2rem' }}>
          The songs, the book, the art — all of it is about legacy, family, memory and what we pass forward.
          The scholarship is that same mission made concrete. It exists to help young people carry forward
          dreams their families protected but could not always afford.
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.5)' }}>
          Support covers books, instruments, school materials, digital tools, laptops,
          creative training and any educational opportunity a family cannot easily afford.
        </p>
      </section>

      {/* 8 Pillars */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '0.75rem' }}>
            Ways to be part of this
          </p>
          <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.3)' }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2px',
          background: 'rgba(196,149,58,0.07)',
        }}>
          {pillars.map(p => (
            <div
              key={p.href}
              style={{
                background: p.primary ? 'rgba(196,149,58,0.04)' : '#080810',
                padding: p.primary ? '3rem 2rem' : '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                borderTop: p.primary ? '2px solid #C4953A' : '2px solid rgba(196,149,58,0.15)',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.5rem',
                letterSpacing: '0.35em', textTransform: 'uppercase',
                color: p.primary ? '#C4953A' : 'rgba(196,149,58,0.5)',
                marginBottom: '1rem',
              }}>
                {p.label}
              </p>
              <h2 style={{
                fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
                fontSize: p.primary ? '1.5rem' : '1.25rem',
                color: p.primary ? '#F2EDE3' : 'rgba(242,237,227,0.85)',
                marginBottom: '1rem', lineHeight: 1.3, flex: 0,
              }}>
                {p.title}
              </h2>
              <p style={{
                fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '0.9rem',
                lineHeight: 1.75, color: p.primary ? 'rgba(242,237,227,0.6)' : 'rgba(242,237,227,0.45)',
                flex: 1, marginBottom: '1.75rem',
              }}>
                {p.description}
              </p>
              <Link
                href={p.href}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.6rem',
                  letterSpacing: '0.25em', textTransform: 'uppercase',
                  color: p.primary ? '#080810' : '#C4953A',
                  background: p.primary ? '#C4953A' : 'transparent',
                  border: p.primary ? 'none' : '1px solid rgba(196,149,58,0.3)',
                  padding: p.primary ? '0.8rem 2rem' : '0.65rem 1.5rem',
                  textDecoration: 'none', display: 'inline-block', alignSelf: 'flex-start',
                  fontWeight: p.primary ? 400 : 300,
                }}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Community preview */}
      {messages.length > 0 && (
        <section style={{ maxWidth: '820px', margin: '0 auto', padding: '4rem 1.5rem 6rem', borderTop: '1px solid rgba(196,149,58,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)' }}>
              From the community
            </p>
            <Link href="/scholarship/community" style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.4)', textDecoration: 'none' }}>
              See all messages →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {messages.map(m => (
              <div key={m.id} style={{ padding: '1.5rem 2rem', border: '1px solid rgba(196,149,58,0.07)', background: 'rgba(196,149,58,0.015)' }}>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.75, color: 'rgba(242,237,227,0.6)', marginBottom: '0.75rem' }}>
                  &ldquo;{m.message}&rdquo;
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', color: 'rgba(242,237,227,0.3)', letterSpacing: '0.08em' }}>
                  {m.isAnonymous ? 'Anonymous' : m.authorName}
                  {m.country ? ` · ${m.country}` : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Secondary links */}
      <section style={{ maxWidth: '820px', margin: '0 auto', padding: '0 1.5rem 5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'rgba(196,149,58,0.07)', borderTop: '1px solid rgba(196,149,58,0.07)' }}>
        {[
          { label: 'The Invisible Gallery', href: '/scholarship/gallery', desc: 'Young creators, featured work' },
          { label: 'NoiraCiel Library', href: '/scholarship/library', desc: 'Books, music, films' },
          { label: 'Transparency Report', href: '/scholarship/transparency', desc: 'Where the money goes' },
        ].map(link => (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none', display: 'block', background: '#080810', padding: '2rem 1.75rem' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.05rem', color: '#F2EDE3', marginBottom: '0.5rem' }}>
              {link.label}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(196,149,58,0.5)' }}>
              {link.desc} →
            </p>
          </Link>
        ))}
      </section>

      {/* Legal footer */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 1.5rem 6rem', textAlign: 'center', borderTop: '1px solid rgba(196,149,58,0.08)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(242,237,227,0.25)', lineHeight: 1.9, marginBottom: '1.5rem' }}>
          Contributions help fund The Invisible Roots Scholarship. A portion of NoiraCiel sales and
          direct contributions will support documented scholarship awards. Tax treatment depends on
          your country and our legal structure. We are not a registered charity.
        </p>
        <Link
          href="/scholarship/transparency"
          style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', textDecoration: 'none' }}
        >
          Transparency Report →
        </Link>
      </section>

    </div>
  )
}
