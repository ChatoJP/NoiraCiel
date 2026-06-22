import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'What\'s new in the NoiraCiel universe — updates, features, and improvements.',
  alternates: { canonical: 'https://noiraciel.com/changelog' },
}

function parseChangelog(raw: string) {
  const sections: { date: string; items: string[] }[] = []
  let current: { date: string; items: string[] } | null = null

  for (const line of raw.split('\n')) {
    const h2 = line.match(/^## (.+)/)
    const li = line.match(/^- (.+)/)
    if (h2) {
      if (current) sections.push(current)
      current = { date: h2[1].trim(), items: [] }
    } else if (li && current) {
      current.items.push(li[1].trim())
    }
  }
  if (current) sections.push(current)
  return sections
}

export default function ChangelogPage() {
  const raw = fs.readFileSync(path.join(process.cwd(), 'CHANGELOG.md'), 'utf-8')
  const sections = parseChangelog(raw)

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#F2EDE3', padding: '8rem 1.5rem 6rem', maxWidth: '760px', margin: '0 auto' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '1rem' }}>
        NoiraCiel
      </p>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#F2EDE3', lineHeight: 1.1, marginBottom: '4rem' }}>
        What&apos;s New
      </h1>

      {sections.map((s, i) => (
        <section key={i} style={{ marginBottom: '3.5rem', paddingBottom: '3.5rem', borderBottom: i < sections.length - 1 ? '1px solid rgba(196,149,58,0.08)' : 'none' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)', marginBottom: '1.5rem' }}>
            {s.date}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {s.items.map((item, j) => (
              <li key={j} style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.75, color: 'rgba(242,237,227,0.7)', paddingLeft: '1.25rem', position: 'relative', marginBottom: '0.5rem' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(196,149,58,0.5)' }}>◇</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
