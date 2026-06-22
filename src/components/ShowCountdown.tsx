'use client'

import { useState, useEffect } from 'react'

interface Props {
  showDate: string
  showName: string
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function ShowCountdown({ showDate, showName }: Props) {
  const [parts, setParts] = useState<{ d: number; h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    function tick() {
      const diff = new Date(showDate + 'T00:00:00').getTime() - Date.now()
      if (diff <= 0) { setParts({ d: 0, h: 0, m: 0, s: 0 }); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setParts({ d, h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [showDate])

  if (!parts) return null

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1rem 1.5rem',
      background: 'rgba(196,149,58,0.04)',
      border: '1px solid rgba(196,149,58,0.12)',
      display: 'inline-block',
    }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.5rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '0.6rem' }}>
        Until {showName}
      </p>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline' }}>
        {[{ v: parts.d, l: 'd' }, { v: parts.h, l: 'h' }, { v: parts.m, l: 'm' }, { v: parts.s, l: 's' }].map(({ v, l }) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: '2rem', lineHeight: 1, color: 'rgba(196,149,58,0.85)' }}>
              {pad(v)}
            </span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(200,196,190,0.3)', display: 'block', marginTop: '0.15rem' }}>
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
