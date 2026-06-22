'use client'

import { useEffect, useState, useCallback } from 'react'

type Stage = { key: string; label: string }
type TrackRow = {
  slug: string
  number: number
  title: string
  audio: number
  stages: Record<string, string>
}
type Album = { id: string; label: string; tracks: TrackRow[] }
type Data = { albums: Album[]; stages: Stage[]; updatedAt: string }

const STATUS_COLOR: Record<string, string> = {
  complete:    '#22c55e',
  selected:    '#22c55e',
  submitted:   '#f59e0b',
  done:        '#22c55e',
  failed:      '#ef4444',
  none:        '#374151',
  pending:     '#f59e0b',
}

const STATUS_LABEL: Record<string, string> = {
  complete:  '✓',
  selected:  '✓',
  submitted: '…',
  done:      '✓',
  failed:    '✗',
  none:      '—',
  pending:   '…',
}

function Cell({ status }: { status: string }) {
  const norm = status?.toLowerCase() ?? 'none'
  const color = STATUS_COLOR[norm] ?? '#6b7280'
  const label = STATUS_LABEL[norm] ?? norm.slice(0, 3)
  return (
    <td style={{ textAlign: 'center', padding: '4px 6px' }}>
      <span style={{
        display: 'inline-block',
        width: 28, height: 28,
        lineHeight: '28px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 700,
        background: color + '22',
        color,
        border: `1px solid ${color}44`,
      }}>
        {label}
      </span>
    </td>
  )
}

function AlbumTable({ album, stages }: { album: Album; stages: Stage[] }) {
  const total = album.tracks.length
  const done = (key: string) => album.tracks.filter(t =>
    ['complete','selected','done'].includes((t.stages[key] ?? '').toLowerCase())
  ).length

  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#e5e7eb', marginBottom: 16, letterSpacing: '-0.02em' }}>
        {album.label}
        <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 12 }}>
          {total} tracks
        </span>
      </h2>

      {/* Stage summary bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {stages.map(s => {
          const n = done(s.key)
          const pct = Math.round((n / total) * 100)
          return (
            <div key={s.key} style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: 8,
              padding: '6px 12px',
              minWidth: 90,
            }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: n === total ? '#22c55e' : n > 0 ? '#f59e0b' : '#4b5563' }}>
                {n}/{total}
                <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280', marginLeft: 4 }}>{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Track table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 500, width: 36 }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6b7280', fontWeight: 500 }}>Track</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', color: '#6b7280', fontWeight: 500, fontSize: 11 }}>MP3</th>
              {stages.map(s => (
                <th key={s.key} style={{ textAlign: 'center', padding: '6px 8px', color: '#6b7280', fontWeight: 500, fontSize: 11, minWidth: 60 }}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {album.tracks.map((track, i) => (
              <tr key={track.slug} style={{ borderBottom: '1px solid #111827', background: i % 2 === 0 ? 'transparent' : '#0a0f1a' }}>
                <td style={{ padding: '5px 8px', color: '#4b5563', fontSize: 12 }}>{track.number}</td>
                <td style={{ padding: '5px 8px', color: '#d1d5db', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {track.title}
                </td>
                <td style={{ textAlign: 'center', padding: '5px 8px', color: track.audio > 0 ? '#22c55e' : '#374151', fontSize: 12 }}>
                  {track.audio > 0 ? '✓' : '—'}
                </td>
                {stages.map(s => (
                  <Cell key={s.key} status={track.stages[s.key] ?? 'none'} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [data, setData] = useState<Data | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/pipeline-status', { cache: 'no-store' })
      const json = await res.json() as Data
      setData(json)
      setLastRefresh(new Date())
    } catch {}
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      color: '#e5e7eb',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px 24px',
      maxWidth: 1100,
      margin: '0 auto',
    }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Pipeline Monitor
        </h1>
        <span style={{ fontSize: 13, color: '#4b5563' }}>
          {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
        </span>
        <button
          onClick={refresh}
          style={{
            marginLeft: 'auto', background: '#1f2937', border: '1px solid #374151',
            color: '#9ca3af', borderRadius: 6, padding: '4px 12px', fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, fontSize: 12, color: '#6b7280' }}>
        {[['#22c55e','Done'],['#f59e0b','In Progress'],['#ef4444','Failed'],['#374151','Not Started']].map(([c,l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: c, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>

      {!data && <p style={{ color: '#6b7280' }}>Loading pipeline state…</p>}

      {data?.albums.map(album => (
        <AlbumTable key={album.id} album={album} stages={data.stages} />
      ))}
    </div>
  )
}
