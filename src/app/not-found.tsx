'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function NotFound() {
  useEffect(() => {
    try {
      const ctx = new AudioContext()
      // D3 sad piano: D3 (146.8 Hz)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(146.8, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 1.8)
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 2.2)
    } catch {
      // audio blocked
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.55rem',
        letterSpacing: '0.45em',
        textTransform: 'uppercase',
        color: 'rgba(196,149,58,0.5)',
        marginBottom: '3rem',
      }}>
        404
      </p>

      <blockquote style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
        lineHeight: 1.65,
        color: 'rgba(242,237,227,0.72)',
        maxWidth: '520px',
        marginBottom: '3.5rem',
      }}>
        <p>Some roads lead to doors that don&apos;t exist —</p>
        <p>even memory gets lost in the mist.</p>
      </blockquote>

      <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.3)', marginBottom: '3rem' }} />

      <Link
        href="/"
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.65rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(196,149,58,0.85)',
          border: '1px solid rgba(196,149,58,0.35)',
          padding: '0.75rem 2rem',
          textDecoration: 'none',
        }}
      >
        Return Home
      </Link>
    </div>
  )
}
