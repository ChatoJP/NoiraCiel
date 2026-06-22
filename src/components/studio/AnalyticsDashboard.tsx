'use client'

import { useState, useEffect } from 'react'

interface PageView {
  path: string
  count: number
  label: string
}

interface AnalyticsData {
  totalPageViews: number
  uniqueVisitors: number
  topPages: PageView[]
  songPlays: { title: string; slug: string; plays: number }[]
  referrers: { source: string; visits: number }[]
  lastUpdated: string
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.35)', marginBottom: '0.5rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2.2rem', fontWeight: 300, color: 'rgba(196,149,58,0.9)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: 'rgba(200,196,190,0.3)', marginTop: '0.35rem' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function BarRow({ label, value, max, href }: { label: string; value: number; max: number; href?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        {href ? (
          <a href={href} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'rgba(242,237,227,0.65)', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(196,149,58,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(242,237,227,0.65)')}>
            {label}
          </a>
        ) : (
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'rgba(242,237,227,0.65)' }}>{label}</span>
        )}
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(200,196,190,0.4)' }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', height: '2px', borderRadius: '1px' }}>
        <div style={{ background: 'rgba(196,149,58,0.55)', height: '100%', width: `${pct}%`, borderRadius: '1px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

function mockData(): AnalyticsData {
  const songs = [
    { title: 'Why', slug: 'why', plays: 847 },
    { title: 'The Empty Chair', slug: 'the-empty-chair', plays: 712 },
    { title: 'Free Men Tell the Truth', slug: 'free-men-tell-the-truth', plays: 634 },
    { title: 'Borrowed Time', slug: 'borrowed-time', plays: 589 },
    { title: 'The Roots We Cannot See', slug: 'the-roots-we-cannot-see', plays: 521 },
    { title: 'Leave a Light On', slug: 'leave-a-light-on', plays: 498 },
    { title: 'Side by Side', slug: 'side-by-side', plays: 447 },
  ]

  return {
    totalPageViews: 24831,
    uniqueVisitors: 8920,
    topPages: [
      { path: '/', label: 'Home', count: 9234 },
      { path: '/music/the-life-lessons', label: 'The Life Lessons', count: 4102 },
      { path: '/songs/why', label: 'Song: Why', count: 1891 },
      { path: '/book', label: 'Book', count: 1544 },
      { path: '/songs/the-empty-chair', label: 'Song: The Empty Chair', count: 1122 },
    ],
    songPlays: songs,
    referrers: [
      { source: 'Direct', visits: 10234 },
      { source: 'Instagram', visits: 5820 },
      { source: 'Google', visits: 4291 },
      { source: 'Spotify', visits: 2108 },
      { source: 'YouTube', visits: 1740 },
      { source: 'Facebook', visits: 638 },
    ],
    lastUpdated: new Date().toISOString(),
  }
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated load — replace with real API call to analytics endpoint
    const timeout = setTimeout(() => {
      setData(mockData())
      setLoading(false)
    }, 600)
    return () => clearTimeout(timeout)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem', color: 'rgba(196,149,58,0.4)' }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', animation: 'pulse 1.5s ease-in-out infinite' }}>
          Loading…
        </span>
      </div>
    )
  }

  if (!data) return null

  const maxPage = Math.max(...data.topPages.map(p => p.count))
  const maxSong = Math.max(...data.songPlays.map(s => s.plays))
  const maxRef = Math.max(...data.referrers.map(r => r.visits))

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', marginBottom: '0.5rem' }}>
            Analytics Overview
          </p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontWeight: 300, color: 'rgba(242,237,227,0.88)' }}>
            Site Performance
          </h2>
        </div>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: 'rgba(200,196,190,0.25)', fontStyle: 'italic' }}>
          Simulated data — connect real analytics below
        </span>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '2.5rem' }}>
        <StatCard label="Page Views" value={data.totalPageViews.toLocaleString()} sub="All time" />
        <StatCard label="Unique Visitors" value={data.uniqueVisitors.toLocaleString()} sub="Estimated" />
        <StatCard label="Top Song Plays" value={data.songPlays[0]?.plays ?? 0} sub={data.songPlays[0]?.title} />
        <StatCard label="Referrers" value={data.referrers.length} sub="Tracked sources" />
      </div>

      {/* Three column breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>

        {/* Top pages */}
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.35)', marginBottom: '1rem' }}>
            Top Pages
          </p>
          {data.topPages.map(page => (
            <BarRow key={page.path} label={page.label} value={page.count} max={maxPage} href={page.path} />
          ))}
        </div>

        {/* Top songs */}
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.35)', marginBottom: '1rem' }}>
            Song Plays
          </p>
          {data.songPlays.map(song => (
            <BarRow key={song.slug} label={song.title} value={song.plays} max={maxSong} href={`/songs/${song.slug}`} />
          ))}
        </div>

        {/* Referrers */}
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.35)', marginBottom: '1rem' }}>
            Traffic Sources
          </p>
          {data.referrers.map(ref => (
            <BarRow key={ref.source} label={ref.source} value={ref.visits} max={maxRef} />
          ))}
        </div>
      </div>

      {/* Integration note */}
      <div style={{ marginTop: '3rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(200,196,190,0.3)', lineHeight: 1.7 }}>
          <strong style={{ color: 'rgba(196,149,58,0.55)' }}>Connect real analytics:</strong>{' '}
          Add Plausible Analytics or Fathom by including their tracking script in{' '}
          <code style={{ fontFamily: 'monospace', fontSize: '0.8em', color: 'rgba(196,149,58,0.5)' }}>src/app/layout.tsx</code>{' '}
          and replacing the mock data above with a server-side fetch to their API. Both are privacy-first and GDPR-compliant.
        </p>
      </div>
    </div>
  )
}
