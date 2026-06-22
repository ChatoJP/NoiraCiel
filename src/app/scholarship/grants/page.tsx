import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kitchen Table Grants — The Invisible Roots Scholarship',
  description: 'Micro-grants for small but meaningful needs — the things that make a large difference when you cannot afford them.',
}

const examples = [
  {
    title: 'Internet access for a month',
    amount: '€15–€30',
    detail: 'A child who cannot attend online classes. A student whose only connection to the world is a borrowed signal.',
  },
  {
    title: 'Art supplies for a project',
    amount: '€20–€50',
    detail: 'Paints, canvases, clay, thread. The materials for a school or community art project that would otherwise never exist.',
  },
  {
    title: 'Transport to an opportunity',
    amount: '€10–€40',
    detail: 'A bus ticket to an audition. A train to a competition. The physical distance between a young person and their chance.',
  },
  {
    title: 'A musical instrument accessory',
    amount: '€15–€60',
    detail: 'Strings. Reeds. A bow. Instrument repair. The thing that lets a young musician keep playing.',
  },
  {
    title: 'Printing and binding a portfolio',
    amount: '€20–€50',
    detail: 'A printed portfolio for a job interview. A bound thesis. The physical object of years of work.',
  },
  {
    title: 'A language learning resource',
    amount: '€15–€40',
    detail: 'A dictionary. A textbook. A subscription that opens a language and with it, a new world of opportunity.',
  },
]

export default function GrantsPage() {
  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ padding: '8rem 1.5rem 5rem', textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ width: '1px', height: '5rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', margin: '0 auto 2.5rem' }} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', opacity: 0.75, marginBottom: '1.5rem' }}>
          Kitchen Table Grants
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3.8rem)', lineHeight: 1.1, marginBottom: '2rem' }}>
          Small amounts.<br />Real consequences.
        </h1>
        <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', margin: '0 auto 2rem' }} />
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)' }}>
          Not every need is large. Some of the most important things in a young person&apos;s life
          cost less than dinner out — but are completely out of reach for families already stretched thin.
          Kitchen Table Grants exist for these moments.
        </p>
      </section>

      {/* What it covers */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', marginBottom: '2.5rem', textAlign: 'center' }}>
          The kinds of things we fund
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '2px', background: 'rgba(196,149,58,0.06)' }}>
          {examples.map(ex => (
            <div key={ex.title} style={{ background: '#080810', padding: '2rem 1.75rem' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.05rem', color: '#F2EDE3', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                {ex.title}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.1em', color: '#C4953A', marginBottom: '0.75rem' }}>
                {ex.amount}
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '0.88rem', lineHeight: 1.75, color: 'rgba(242,237,227,0.4)' }}>
                {ex.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How to apply */}
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem 4rem', borderTop: '1px solid rgba(196,149,58,0.08)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', marginBottom: '2rem' }}>
          How to apply
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)', marginBottom: '1.5rem' }}>
          Kitchen Table Grants use the same application form as the main scholarship. When you describe
          your need, be as specific as possible — the more clearly you describe what you need and why,
          the easier it is for us to help.
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)', marginBottom: '2.5rem' }}>
          There is no minimum amount. Applications for as little as €10 are taken seriously.
          What matters is the need, not the number.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/scholarship/apply"
            style={{
              fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase',
              color: '#080810', background: '#C4953A', padding: '0.9rem 2.25rem',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Apply Now
          </Link>
          <Link
            href="/scholarship/transparency"
            style={{
              fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase',
              color: '#C4953A', border: '1px solid rgba(196,149,58,0.35)', padding: '0.9rem 2.25rem',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            How We Use Funds
          </Link>
        </div>
      </section>

      {/* Eligibility */}
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem 6rem', borderTop: '1px solid rgba(196,149,58,0.08)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', marginBottom: '2rem' }}>
          Who can apply
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            'Young people aged 5–30',
            'From families with limited financial means',
            'Living anywhere in the world',
            'With a specific, describable need',
            'No prior relationship with NoiraCiel required',
          ].map(point => (
            <div key={point} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'rgba(196,149,58,0.5)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', flexShrink: 0, paddingTop: '2px' }}>—</span>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', lineHeight: 1.6, color: 'rgba(242,237,227,0.5)' }}>{point}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
