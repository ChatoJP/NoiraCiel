'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioMidiSync } from './useAudioMidiSync'
import { extractBands, smooth, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

const CW = 800
const CH = 420

// Bow arcs represent individual string voices in the orchestra
const VOICES = [
  { offset: -220, delay: 0    },
  { offset: -110, delay: 0.3  },
  { offset:    0, delay: 0.6  },
  { offset:  110, delay: 0.9  },
  { offset:  220, delay: 1.2  },
]

export default function GhostStrings({ meta }: { meta?: GhostPerformanceMeta }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const smoothed  = useRef({ mid: 0, highMid: 0, overall: 0, bass: 0 })
  const frame     = useRef(0)

  const { getFrequencyData, isPlaying } = useAudioMidiSync(meta)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frame.current++
    const freq = isPlaying ? getFrequencyData() : null
    const s    = smoothed.current

    if (freq) {
      const b = extractBands(freq)
      s.mid     = smooth(s.mid,     b.mid,     0.3, 0.08)
      s.highMid = smooth(s.highMid, b.highMid, 0.35, 0.08)
      s.overall = smooth(s.overall, b.overall, 0.3, 0.08)
      s.bass    = smooth(s.bass,    b.bass,    0.35, 0.1)
    } else {
      s.mid *= 0.95; s.highMid *= 0.95; s.overall *= 0.95; s.bass *= 0.95
    }

    // Background
    ctx.fillStyle = COLORS.VOID
    ctx.fillRect(0, 0, CW, CH)

    const cx = CW / 2
    const cy = CH * 0.55

    // Atmospheric deep glow
    const atm = ctx.createRadialGradient(cx, cy, 30, cx, cy, CH * 0.85)
    atm.addColorStop(0, rgba(COLORS.BLUE, s.overall * 0.1))
    atm.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = atm
    ctx.fillRect(0, 0, CW, CH)

    // ── Bow stroke arcs for each voice ────────────────────────────────
    VOICES.forEach(({ offset, delay }) => {
      const phase     = frame.current * 0.025 + delay
      const voiceE    = Math.max(0, s.mid * 0.7 + s.highMid * 0.3)
      const amplitude = 20 + voiceE * 80
      const arcR      = 80 + voiceE * 60

      // Bow position oscillates (back and forth stroke)
      const bowT      = Math.sin(phase * 0.4) * 0.5 + 0.5 // 0 to 1
      const bowX      = cx + offset + (bowT - 0.5) * amplitude * 2
      const bowY      = cy - arcR * 0.3

      // Draw arc (represents the bow path)
      const arcStartA = Math.PI * 0.9 + Math.sin(phase * 0.2) * 0.2
      const arcEndA   = Math.PI * 2.1 + Math.sin(phase * 0.2) * 0.2
      const arcAlpha  = 0.08 + voiceE * 0.3

      ctx.beginPath()
      ctx.arc(cx + offset, cy, arcR, arcStartA, arcEndA)
      ctx.strokeStyle = rgba(COLORS.IVORY, arcAlpha)
      ctx.lineWidth   = 1 + voiceE * 1.5
      ctx.stroke()

      // Glowing bow tip
      if (voiceE > 0.06) {
        const tipGrad = ctx.createRadialGradient(bowX, bowY, 0, bowX, bowY, 20 + voiceE * 20)
        tipGrad.addColorStop(0, rgba(COLORS.GOLD, voiceE * 0.7))
        tipGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(bowX, bowY, 20 + voiceE * 20, 0, Math.PI * 2)
        ctx.fillStyle = tipGrad
        ctx.fill()
      }

      // String itself (thin horizontal)
      ctx.beginPath()
      ctx.moveTo(cx + offset - 45, cy)
      ctx.lineTo(cx + offset + 45, cy)
      ctx.strokeStyle = rgba(COLORS.SILVER, 0.06 + voiceE * 0.22)
      ctx.lineWidth   = 0.8
      ctx.stroke()
    })

    // ── Central swell ─────────────────────────────────────────────────
    if (s.overall > 0.05) {
      const swellGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 220 * (0.3 + s.overall))
      swellGrad.addColorStop(0, rgba(COLORS.GOLD, s.bass * 0.12))
      swellGrad.addColorStop(0.5, rgba(COLORS.BLUE, s.mid * 0.06))
      swellGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 220 * (0.3 + s.overall), 0, Math.PI * 2)
      ctx.fillStyle = swellGrad
      ctx.fill()
    }

    // Idle label
    if (!isPlaying) {
      ctx.fillStyle = rgba(COLORS.SILVER, 0.14)
      ctx.font      = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '0.3em'
      ctx.fillText('PLAY THE TRACK TO ACTIVATE', CW / 2, CH - 14)
      ctx.letterSpacing = '0'
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [getFrequencyData, isPlaying, meta])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return (
    <div className="relative w-full" style={{ background: COLORS.VOID }}>
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="w-full block"
        style={{ maxHeight: 420 }}
        aria-label="Ghost Strings — audio-reactive orchestral strings visualizer"
      />
    </div>
  )
}
