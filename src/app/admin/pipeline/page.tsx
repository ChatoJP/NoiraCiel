'use client'

import { useState, useEffect, useCallback } from 'react'

interface TrackCoverage {
  slug: string
  title: string
  trackNumber: number | null
  songArt: boolean
  chapterBanner: boolean
  lyricVideo: boolean
  musicVideo: boolean
  cinemagraph: boolean
  ghostPerformance: boolean
  story: boolean
  storyPdf: boolean
  audiobook: boolean
  score: boolean
  commentary: boolean
}

interface AlbumCoverage {
  albumSlug: string
  trackCount: number
  tracks: TrackCoverage[]
}

interface ApiResponse {
  coverage: AlbumCoverage[]
  totalTracks: number
  updatedAt: string
  error?: string
}

const ASSET_COLUMNS: { key: keyof TrackCoverage; label: string }[] = [
  { key: 'songArt',          label: 'Art' },
  { key: 'chapterBanner',    label: 'Banner' },
  { key: 'lyricVideo',       label: 'Karaoke' },
  { key: 'musicVideo',       label: 'Film' },
  { key: 'cinemagraph',      label: 'Living Art' },
  { key: 'ghostPerformance', label: 'Ghost' },
  { key: 'story',            label: 'Story' },
  { key: 'storyPdf',         label: 'PDF' },
  { key: 'audiobook',        label: 'Audio' },
  { key: 'score',            label: 'Score' },
  { key: 'commentary',       label: 'Commentary' },
]

export default function PipelineAdminPage() {
  const [token, setToken] = useState('')
  const [savedToken, setSavedToken] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'missing-only'>('all')

  useEffect(() => {
    const t = sessionStorage.getItem('pipeline_admin_token')
    if (t) { setSavedToken(t); setToken(t) }
  }, [])

  const load = useCallback((tok: string) => {
    fetch('/api/pipeline-status', { headers: { Authorization: `Bearer ${tok}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((j) => { setData(j); setError('') })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (savedToken) load(savedToken)
  }, [savedToken, load])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    sessionStorage.setItem('pipeline_admin_token', token)
    setSavedToken(token)
  }

  const base: React.CSSProperties = { background: '#080810', color: '#F2EDE3', minHeight: '100vh', fontFamily: 'var(--font-body)' }

  if (!savedToken) {
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <form onSubmit={handleLogin} style={{ maxWidth: '360px', width: '100%' }}>
          <p style={{ fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', marginBottom: '1.5rem' }}>Pipeline Admin</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.8rem', marginBottom: '2rem' }}>Admin access</h1>
          <input
            type="password" placeholder="Admin token" value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(196,149,58,0.3)', color: '#F2EDE3', marginBottom: '1rem' }}
          />
          <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#C4953A', color: '#080810', border: 'none', cursor: 'pointer' }}>
            Enter
          </button>
        </form>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...base, padding: '3rem' }}>
        <p style={{ color: 'rgba(220,80,80,0.9)' }}>Error: {error}</p>
        <button onClick={() => { sessionStorage.removeItem('pipeline_admin_token'); setSavedToken(null) }} style={{ marginTop: '1rem', color: '#C4953A', background: 'none', border: '1px solid #C4953A', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Re-enter token
        </button>
      </div>
    )
  }

  if (!data) return <div style={base}><p style={{ padding: '3rem' }}>Loading…</p></div>

  return (
    <div style={{ ...base, padding: '2rem' }}>
      <p style={{ fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', marginBottom: '0.5rem' }}>Pipeline Admin</p>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.6rem', marginBottom: '1rem' }}>
        {data.totalTracks} tracks · updated {new Date(data.updatedAt).toLocaleTimeString()}
      </h1>

      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setFilter(filter === 'all' ? 'missing-only' : 'all')}
          style={{ fontSize: '0.7rem', color: '#C4953A', background: 'none', border: '1px solid rgba(196,149,58,0.4)', padding: '0.4rem 0.9rem', cursor: 'pointer' }}
        >
          {filter === 'all' ? 'Show only rows with gaps' : 'Show all tracks'}
        </button>
      </div>

      {data.coverage.map((album) => {
        const rows = filter === 'missing-only'
          ? album.tracks.filter((t) => ASSET_COLUMNS.some((c) => !t[c.key]))
          : album.tracks
        if (rows.length === 0) return null

        return (
          <div key={album.albumSlug} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', color: 'rgba(242,237,227,0.7)', marginBottom: '0.75rem' }}>
              {album.albumSlug} <span style={{ color: 'rgba(242,237,227,0.3)' }}>({album.trackCount} tracks)</span>
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(196,149,58,0.2)' }}>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0.6rem', color: 'rgba(242,237,227,0.4)' }}>Track</th>
                    {ASSET_COLUMNS.map((c) => (
                      <th key={c.key} style={{ padding: '0.4rem 0.5rem', color: 'rgba(242,237,227,0.4)', fontSize: '0.65rem' }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.slug} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.4rem 0.6rem', whiteSpace: 'nowrap' }}>{t.title}</td>
                      {ASSET_COLUMNS.map((c) => (
                        <td key={c.key} style={{ textAlign: 'center', padding: '0.4rem 0.3rem' }}>
                          <span style={{ color: t[c.key] ? 'rgba(80,200,120,0.9)' : 'rgba(220,80,80,0.6)' }}>
                            {t[c.key] ? '●' : '○'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
