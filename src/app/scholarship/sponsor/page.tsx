import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sponsor a Dream — The Invisible Roots Scholarship',
  description: 'Concrete ways to sponsor a young person\'s education, instrument, laptop, or creative opportunity through The Invisible Roots Scholarship.',
}

const tiers = [
  {
    label: 'A Book',
    amount: '€10',
    description: 'A textbook, novel, or workbook for a student who cannot otherwise afford it. Knowledge that can outlast a school year.',
    highlight: false,
  },
  {
    label: 'A Month of Lessons',
    amount: '€25',
    description: 'Four weeks of music, art, language or creative tuition for a young person who has the talent but not the resources.',
    highlight: false,
  },
  {
    label: 'School Materials',
    amount: '€50',
    description: 'A full kit of pencils, paper, notebooks, brushes or digital tools — the materials that make learning possible.',
    highlight: false,
  },
  {
    label: 'A Starter Instrument',
    amount: '€100',
    description: 'A ukulele, recorder, keyboard, or second-hand violin. The first instrument is the one they will remember forever.',
    highlight: false,
  },
  {
    label: 'A Course or Workshop',
    amount: '€250',
    description: 'A semester of classes, an online certification, a summer workshop — structured learning that opens a new world.',
    highlight: false,
  },
  {
    label: 'A Laptop',
    amount: '€500',
    description: 'A refurbished laptop transforms what a young person can access, create, and become. The most transformative single gift.',
    highlight: true,
  },
]

export default function SponsorPage() {
  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ padding: '8rem 1.5rem 5rem', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ width: '1px', height: '5rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', margin: '0 auto 2.5rem' }} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', opacity: 0.75, marginBottom: '1.5rem' }}>
          Sponsor a Dream
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3.8rem)', lineHeight: 1.1, marginBottom: '2rem' }}>
          Name what you give.
        </h1>
        <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', margin: '0 auto 2rem' }} />
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', lineHeight: 1.85, color: 'rgba(242,237,227,0.6)' }}>
          Every amount below represents something concrete — a real object, opportunity,
          or experience that goes directly to a young person who has earned it.
          You choose what you want to fund. We make sure it reaches them.
        </p>
      </section>

      {/* Custom amount — shown prominently before tiers */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem 3rem', textAlign: 'center' }}>
        <div style={{ padding: '2rem 2.5rem', border: '1px solid rgba(196,149,58,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)' }}>
            Choose your own amount
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1rem', color: 'rgba(242,237,227,0.5)', lineHeight: 1.7 }}>
            Any amount — even €5 — helps fund a young person&apos;s creative path.
          </p>
          <Link
            href="/scholarship/donate"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#080810',
              background: '#C4953A',
              padding: '0.75rem 2rem',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Donate Any Amount
          </Link>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.3)', marginTop: '2rem' }}>
          Or pick something specific ↓
        </p>
      </section>

      {/* Tiers */}
      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2px',
          background: 'rgba(196,149,58,0.08)',
        }}>
          {tiers.map((tier) => (
            <div
              key={tier.label}
              style={{
                background: tier.highlight ? 'rgba(196,149,58,0.05)' : '#080810',
                padding: '2.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                borderTop: tier.highlight ? '2px solid #C4953A' : '2px solid transparent',
                position: 'relative',
              }}
            >
              {tier.highlight && (
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.5rem', letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: '#C4953A', marginBottom: '0.5rem',
                }}>
                  Most impactful
                </p>
              )}
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: tier.highlight ? 'clamp(2.2rem, 4vw, 3.2rem)' : 'clamp(2rem, 4vw, 2.8rem)',
                color: '#C4953A',
                lineHeight: 1,
                marginBottom: '0.75rem',
              }}>
                {tier.amount}
              </div>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.55rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: tier.highlight ? 'rgba(242,237,227,0.65)' : 'rgba(242,237,227,0.5)',
                marginBottom: '1.25rem',
              }}>
                {tier.label}
              </p>
              <p style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 300,
                fontSize: '0.9rem',
                lineHeight: 1.8,
                color: tier.highlight ? 'rgba(242,237,227,0.6)' : 'rgba(242,237,227,0.45)',
                flex: 1,
                marginBottom: '2rem',
              }}>
                {tier.description}
              </p>
              <Link
                href={`/scholarship/donate?amount=${parseInt(tier.amount.replace('€', '')) * 100}&label=${encodeURIComponent(tier.label)}`}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: tier.highlight ? '#080810' : '#C4953A',
                  background: tier.highlight ? '#C4953A' : 'transparent',
                  border: tier.highlight ? 'none' : '1px solid rgba(196,149,58,0.3)',
                  padding: '0.65rem 1.5rem',
                  textDecoration: 'none',
                  display: 'inline-block',
                  alignSelf: 'flex-start',
                  transition: 'all 0.2s',
                }}
              >
                Give {tier.amount}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Legal */}
      <section style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1.5rem 6rem', textAlign: 'center', borderTop: '1px solid rgba(196,149,58,0.07)' }}>
        <p style={{ paddingTop: '3rem', fontFamily: 'var(--font-body)', fontSize: '0.6rem', lineHeight: 1.9, color: 'rgba(242,237,227,0.25)', letterSpacing: '0.05em' }}>
          Contributions help fund The Invisible Roots Scholarship. A percentage of NoiraCiel sales and direct
          contributions support documented scholarship awards. We are not a registered charity. Tax treatment
          depends on your country and legal structure. All donations are non-refundable. Platform fees of
          approximately 1.4–2.9% + 30c per transaction apply.
        </p>
        <Link href="/scholarship/transparency" style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.4)', textDecoration: 'none', display: 'inline-block', marginTop: '1.5rem' }}>
          View Transparency Report →
        </Link>
      </section>

    </div>
  )
}
