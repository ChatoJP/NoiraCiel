import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Podcast — NoiraCiel',
  description: 'Audio commentary, song stories and essays by NoiraCiel. Subscribe via RSS.',
  alternates: { canonical: 'https://noiraciel.com/podcast' },
}

interface Episode {
  id: string
  title: string
  slug: string
  description: string
  audioUrl: string | null
  duration: string
  publishedAt: string
  coverUrl: string
}

function getEpisodes(): Episode[] {
  const filePath = path.join(process.cwd(), 'public', 'podcast.json')
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Episode[]
  } catch {
    return []
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function PodcastPage() {
  const episodes = getEpisodes()

  return (
    <main style={{ minHeight: '100vh', background: '#080810', paddingTop: '8rem', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '4rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start' }}>
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '1rem' }}>
              Audio Commentary
            </p>
            <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 300, color: 'rgba(242,237,227,0.92)', lineHeight: 1.05, marginBottom: '1.25rem' }}>
              The Podcast
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'rgba(200,196,190,0.5)', lineHeight: 1.7, maxWidth: '48ch' }}>
              Song commentaries, essays, and conversations about the music, the books, and the world behind them.
            </p>
          </div>

          {/* RSS subscribe */}
          <div style={{ paddingTop: '0.5rem', textAlign: 'right' }}>
            <a href="/api/podcast.xml"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.7)', border: '1px solid rgba(196,149,58,0.25)', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.18 15.64a2.18 2.18 0 012.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 012.18-2.18M4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44m0 5.66a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z"/>
              </svg>
              RSS Feed
            </a>
          </div>
        </div>

        {/* Episode list */}
        {episodes.length === 0 ? (
          <div style={{ padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontStyle: 'italic', color: 'rgba(242,237,227,0.35)' }}>
              First episode coming soon.
            </p>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {episodes.map((ep, i) => (
              <div key={ep.id}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '2.5rem 0', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.75rem', alignItems: 'start' }}>

                {/* Cover */}
                <div style={{ aspectRatio: '1', background: 'rgba(196,149,58,0.08)', border: '1px solid rgba(196,149,58,0.12)', overflow: 'hidden' }}>
                  <img src={ep.coverUrl} alt={ep.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)' }}>
                      Ep. {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: 'rgba(200,196,190,0.3)' }}>
                      {formatDate(ep.publishedAt)} · {ep.duration}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.35rem', fontWeight: 400, color: 'rgba(242,237,227,0.88)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
                    {ep.title}
                  </h2>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(200,196,190,0.5)', lineHeight: 1.7, marginBottom: '1rem' }}>
                    {ep.description}
                  </p>
                  {/* G89: Static waveform visualizer (decorative) */}
                  {ep.audioUrl && (() => {
                    const bars = Array.from({ length: 40 }, (_, k) => {
                      const seed = ((i + 1) * 13 + k * 7) % 23
                      return 4 + (seed % 28)
                    })
                    return (
                      <svg width="100%" height="32" style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.5 }}>
                        {bars.map((h, k) => (
                          <rect
                            key={k}
                            x={`${(k / 40) * 100}%`}
                            y={16 - h / 2}
                            width="1.8%"
                            height={h}
                            fill="rgba(196,149,58,0.65)"
                            rx="1"
                          />
                        ))}
                      </svg>
                    )
                  })()}
                  {ep.audioUrl ? (
                    <audio controls src={ep.audioUrl}
                      style={{ width: '100%', height: '36px', opacity: 0.75 }} />
                  ) : (
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.25)', border: '1px solid rgba(200,196,190,0.1)', padding: '0.35rem 0.75rem', display: 'inline-block' }}>
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer subscribe note */}
        <div style={{ marginTop: '4rem', padding: '2rem', border: '1px solid rgba(196,149,58,0.1)', background: 'rgba(196,149,58,0.02)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'rgba(200,196,190,0.4)', lineHeight: 1.7 }}>
            Subscribe in your podcast app using the RSS feed, or <Link href="/join" style={{ color: 'rgba(196,149,58,0.7)', textDecoration: 'none' }}>join the circle</Link> for episode notifications.
          </p>
        </div>
      </div>
    </main>
  )
}
