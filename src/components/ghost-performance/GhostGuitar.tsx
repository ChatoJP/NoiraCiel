'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioMidiSync } from './useAudioMidiSync'
import { getBandEnergy, smooth, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

const CW = 800
const CH = 440

// 6 guitar strings: low E → high e
const STRINGS = [
  { freq: [41, 90],   label: 'E',  y: 0 },
  { freq: [55, 130],  label: 'A',  y: 1 },
  { freq: [73, 180],  label: 'D',  y: 2 },
  { freq: [98, 250],  label: 'G',  y: 3 },
  { freq: [123, 320], label: 'B',  y: 4 },
  { freq: [165, 440], label: 'e',  y: 5 },
]

export default function GhostGuitar({ meta }: { meta?: GhostPerformanceMeta }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const vibLevels = useRef<number[]>(Array(6).fill(0))
  const vibPhase  = useRef<number[]>(Array(6).fill(0))
  const frame     = useRef(0)

  const { getFrequencyData, isPlaying } = useAudioMidiSync(meta)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frame.current++
    const freq = isPlaying ? getFrequencyData() : null
    const vl   = vibLevels.current
    const vp   = vibPhase.current

    if (freq) {
      STRINGS.forEach(({ freq: [lo, hi] }, i) => {
        vl[i] = smooth(vl[i], getBandEnergy(freq, lo, hi), 0.5, 0.1)
        vp[i] += 0.08 + vl[i] * 0.25
      })
    } else {
      for (let i = 0; i < 6; i++) { vl[i] *= 0.92; vp[i] += 0.03 }
    }

    // Background
    ctx.fillStyle = COLORS.VOID
    ctx.fillRect(0, 0, CW, CH)

    // ── Guitar body silhouette (acoustic shape) ────────────────────────
    const bx = CW * 0.5   // body center x
    const by = CH * 0.63  // body center y

    // Lower bout (larger)
    const lowerGrad = ctx.createRadialGradient(bx, by + 30, 20, bx, by + 30, 130)
    lowerGrad.addColorStop(0, 'rgba(18,20,30,0.9)')
    lowerGrad.addColorStop(0.7, 'rgba(10,12,20,0.95)')
    lowerGrad.addColorStop(1, 'rgba(6,8,14,1)')

    ctx.beginPath()
    ctx.ellipse(bx, by + 35, 120, 130, 0, 0, Math.PI * 2)
    ctx.fillStyle = lowerGrad
    ctx.fill()
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.15)
    ctx.lineWidth   = 1.5
    ctx.stroke()

    // Upper bout (smaller)
    const upperGrad = ctx.createRadialGradient(bx, by - 100, 15, bx, by - 100, 90)
    upperGrad.addColorStop(0, 'rgba(16,18,28,0.9)')
    upperGrad.addColorStop(1, 'rgba(8,10,18,0.95)')

    ctx.beginPath()
    ctx.ellipse(bx, by - 95, 88, 90, 0, 0, Math.PI * 2)
    ctx.fillStyle = upperGrad
    ctx.fill()
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.12)
    ctx.lineWidth   = 1.5
    ctx.stroke()

    // Waist cover (hide the overlap)
    ctx.beginPath()
    ctx.rect(bx - 55, by - 40, 110, 80)
    ctx.fillStyle = 'rgba(10,11,20,0.98)'
    ctx.fill()
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.08)
    ctx.lineWidth   = 1
    ctx.stroke()

    // Sound hole
    const shLevel = vl.reduce((a, b) => a + b, 0) / 6
    ctx.beginPath()
    ctx.arc(bx, by - 42, 32, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(4,4,8,0.98)'
    ctx.fill()
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.2 + shLevel * 0.35)
    ctx.lineWidth   = 2
    ctx.stroke()

    // Sound hole glow
    if (shLevel > 0.08) {
      const shGrad = ctx.createRadialGradient(bx, by - 42, 0, bx, by - 42, 32)
      shGrad.addColorStop(0, rgba(COLORS.GOLD, shLevel * 0.4))
      shGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(bx, by - 42, 32, 0, Math.PI * 2)
      ctx.fillStyle = shGrad
      ctx.fill()
    }

    // ── Neck ──────────────────────────────────────────────────────────
    const neckTop = 18
    ctx.beginPath()
    ctx.rect(bx - 14, neckTop, 28, by - 140 - neckTop)
    ctx.fillStyle = 'rgba(10,12,20,0.95)'
    ctx.fill()
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.1)
    ctx.lineWidth   = 1
    ctx.stroke()

    // Fret markers
    const fretY0 = neckTop + 10
    const fretH  = by - 140 - neckTop - 10
    for (let f = 0; f < 7; f++) {
      const fy = fretY0 + (f / 7) * fretH
      ctx.beginPath()
      ctx.moveTo(bx - 13, fy)
      ctx.lineTo(bx + 13, fy)
      ctx.strokeStyle = rgba(COLORS.SILVER, 0.12)
      ctx.lineWidth   = 0.8
      ctx.stroke()
    }

    // ── Strings ───────────────────────────────────────────────────────
    const strX0 = bx - 18  // leftmost string x
    const strSpacing = 7.5
    const strTopY = neckTop + 5
    const strBotY = by + 60

    STRINGS.forEach((str, i) => {
      const sx = strX0 + i * strSpacing
      const lv = vl[i]
      const phase = vp[i]

      // String weight: lower strings are thicker
      const weight = 2.0 - i * 0.22

      ctx.beginPath()
      const pts = 60
      for (let p = 0; p <= pts; p++) {
        const t    = p / pts
        const y    = strTopY + t * (strBotY - strTopY)
        const amp  = Math.sin(Math.PI * t) * lv * 6
        const vibX = sx + amp * Math.sin(phase + t * Math.PI * 3)
        if (p === 0) ctx.moveTo(vibX, y)
        else ctx.lineTo(vibX, y)
      }

      ctx.strokeStyle = rgba(COLORS.GOLD, 0.15 + lv * 0.6)
      ctx.lineWidth   = weight
      ctx.stroke()

      // Glow on active strings
      if (lv > 0.1) {
        ctx.shadowColor = rgba(COLORS.GOLD, lv * 0.8)
        ctx.shadowBlur  = 8 * lv
        ctx.beginPath()
        for (let p = 0; p <= pts; p++) {
          const t    = p / pts
          const y    = strTopY + t * (strBotY - strTopY)
          const amp  = Math.sin(Math.PI * t) * lv * 6
          const vibX = sx + amp * Math.sin(phase + t * Math.PI * 3)
          if (p === 0) ctx.moveTo(vibX, y)
          else ctx.lineTo(vibX, y)
        }
        ctx.strokeStyle = rgba(COLORS.GOLD, lv * 0.7)
        ctx.lineWidth   = weight * 0.8
        ctx.stroke()
        ctx.shadowBlur  = 0
        ctx.shadowColor = 'transparent'
      }
    })

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
        style={{ maxHeight: 440 }}
        aria-label="Ghost Guitar — audio-reactive guitar string visualizer"
      />
    </div>
  )
}
