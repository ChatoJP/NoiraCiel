import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The NoiraCiel Library — Scholarship Resources',
  description: 'A curated collection of books, music and resources connected to The Invisible Roots Scholarship and the NoiraCiel universe.',
}

const collections = [
  {
    label: 'Books that shaped the songs',
    items: [
      { title: 'Giovanni\'s Room', author: 'James Baldwin', note: 'On identity, belonging, and the cost of hiding who you are.' },
      { title: 'The God of Small Things', author: 'Arundhati Roy', note: 'On class, memory, and the things families carry in silence.' },
      { title: 'Beloved', author: 'Toni Morrison', note: 'On what we inherit. On what we refuse to pass forward.' },
      { title: 'A Little Life', author: 'Hanya Yanagihara', note: 'On survival, friendship, and the weight of what we never say.' },
      { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', note: 'On war, love, and the ordinary beauty inside catastrophe.' },
    ],
  },
  {
    label: 'Music for the journey',
    items: [
      { title: 'Kind of Blue', author: 'Miles Davis', note: 'The architecture of restraint. What silence does in music.' },
      { title: 'Blue', author: 'Joni Mitchell', note: 'Confessional art as a form of courage.' },
      { title: 'I Put a Spell on You', author: 'Nina Simone', note: 'Emotion as political act. Voice as instrument and weapon.' },
      { title: 'Homogenic', author: 'Björk', note: 'The refusal to sound like anything before. On reinvention.' },
      { title: 'Astral Weeks', author: 'Van Morrison', note: 'Memory and longing recorded as landscape.' },
    ],
  },
  {
    label: 'Films that ask hard questions',
    items: [
      { title: 'Moonlight', author: 'Barry Jenkins', note: 'On growing up without permission to be yourself.' },
      { title: 'Parasite', author: 'Bong Joon-ho', note: 'On class, aspiration, and what separates two worlds that touch.' },
      { title: 'The Florida Project', author: 'Sean Baker', note: 'Childhood in the margins. Beauty at the edge of survival.' },
      { title: 'Portrait of a Lady on Fire', author: 'Céline Sciamma', note: 'On seeing and being seen. On art as the language of love.' },
      { title: 'Capernaum', author: 'Nadine Labaki', note: 'A child\'s indictment of the world that made him.' },
    ],
  },
]

export default function LibraryPage() {
  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ padding: '8rem 1.5rem 5rem', textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ width: '1px', height: '5rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', margin: '0 auto 2.5rem' }} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', opacity: 0.75, marginBottom: '1.5rem' }}>
          The NoiraCiel Library
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3.8rem)', lineHeight: 1.1, marginBottom: '2rem' }}>
          What we read. What we listen to.<br />What we believe matters.
        </h1>
        <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', margin: '0 auto 2rem' }} />
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.5)' }}>
          A curated space of books, music and films that inform the world NoiraCiel is built from.
          Not required reading. Not a syllabus. Just the things that have stayed.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(242,237,227,0.2)', marginTop: '1.25rem' }}>
          Many of these were also donated to young people through the scholarship. Good books travel far.
        </p>
      </section>

      {/* Collections */}
      {collections.map((col, i) => (
        <section
          key={col.label}
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            padding: '3rem 1.5rem',
            borderTop: '1px solid rgba(196,149,58,0.08)',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.55rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'rgba(196,149,58,0.55)',
            marginBottom: '2rem',
          }}>
            {String(i + 1).padStart(2, '0')} — {col.label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {col.items.map((item, j) => (
              <div
                key={item.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '2rem',
                  padding: '1.25rem 0',
                  borderBottom: j < col.items.length - 1 ? '1px solid rgba(196,149,58,0.06)' : 'none',
                  alignItems: 'start',
                }}
              >
                <div>
                  <p style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    fontSize: '1.05rem',
                    color: '#F2EDE3',
                    marginBottom: '0.25rem',
                  }}>
                    {item.title}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.65rem',
                    color: 'rgba(242,237,227,0.35)',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.05em',
                  }}>
                    {item.author}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 300,
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    color: 'rgba(242,237,227,0.4)',
                  }}>
                    {item.note}
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(196,149,58,0.2)',
                  flexShrink: 0,
                  paddingTop: '4px',
                }}>
                  {String(j + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 1.5rem 8rem', textAlign: 'center', borderTop: '1px solid rgba(196,149,58,0.08)' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.1rem', color: 'rgba(242,237,227,0.4)', lineHeight: 1.7, marginBottom: '2rem' }}>
          You can help put books in the hands of young people who cannot always afford them.
        </p>
        <Link
          href="/scholarship/sponsor"
          style={{
            fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#080810', background: '#C4953A', padding: '0.85rem 2.25rem',
            textDecoration: 'none', display: 'inline-block',
          }}
        >
          Sponsor a Book
        </Link>
      </section>

    </div>
  )
}
