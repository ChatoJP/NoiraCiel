'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioMidiSync } from './useAudioMidiSync'
import { getBandEnergy, smooth, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

const CW = 800
const CH = 420

// 4 bass strings: E A D G
const BASS_STRINGS = [
  { lo: 41,  hi: 75,  label: 'E' },
  { lo: 55,  hi: 100, label: 'A' },
  { lo: 73,  hi: 140, label: 'D' },
  { lo: 98,  hi: 185, label: 'G' },
]

export default function GhostBass({ meta }: { meta?: GhostPerformanceMeta }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const levels    = useRef<number[]>(Array(4).fill(0))
  const phases    = useRef<number[]>(Array(4).fill(0))
  const subPulse  = useRef(0)
  const frame     = useRef(0)

  const { getFrequencyData, isPlaying } = useAudioMidiSync(meta)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frame.current++
    const freq = isPlaying ? getFrequencyData() : null
    const lv   = levels.current
    const ph   = phases.current
    const sub  = freq ? getBandEnergy(freq, 20, 60) : 0
    subPulse.current = smooth(subPulse.current, sub, 0.5, 0.08)

    if (freq) {
      BASS_STRINGS.forEach(({ lo, hi }, i) => {
        lv[i] = smooth(lv[i], getBandEnergy(freq, lo, hi), 0.5, 0.1)
        ph[i] += 0.06 + lv[i] * 0.2
      })
    } else {
      for (let i = 0; i < 4; i++) { lv[i] *= 0.92; ph[i] += 0.02 }
    }

    // Background
    ctx.fillStyle = COLORS.VOID
    ctx.fillRect(0, 0, CW, CH)

    // Sub-bass atmospheric pulse
    if (subPulse.current > 0.05) {
      const subGrad = ctx.createRadialGradient(CW / 2, CH, 10, CW / 2, CH, CH * 1.2)
      subGrad.addColorStop(0, rgba(COLORS.BLUE, subPulse.current * 0.18))
      subGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = subGrad
      ctx.fillRect(0, 0, CW, CH)
    }

    // ── Bass strings ───────────────────────────────────────────────────
    const strTopY = 60
    const strBotY = CH - 40
    const strH    = strBotY - strTopY
    const cx      = CW / 2

    // String spacing
    const spacing = 24
    const strX    = [cx - spacing * 1.5, cx - spacing * 0.5, cx + spacing * 0.5, cx + spacing * 1.5]

    BASS_STRINGS.forEach((_, i) => {
      const x     = strX[i]
      const level = lv[i]
      const phase = ph[i]
      // Lower strings (0, 1) are thicker
      const weight = 3.2 - i * 0.55
      const amp    = level * 18

      // String body
      ctx.beginPath()
      const segments = 80
      for (let s = 0; s <= segments; s++) {
        const t  = s / segments
        const y  = strTopY + t * strH
        const dx = Math.sin(phase + t * Math.PI * 2.5) * amp * Math.sin(Math.PI * t)
        if (s === 0) ctx.moveTo(x + dx, y)
        else ctx.lineTo(x + dx, y)
      }
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.12 + level * 0.55)
      ctx.lineWidth   = weight
      ctx.stroke()

      // Glow pass
      if (level > 0.08) {
        ctx.shadowColor = rgba(COLORS.GOLD, level * 0.9)
        ctx.shadowBlur  = 14 * level
        ctx.beginPath()
        for (let s = 0; s <= segments; s++) {
          const t  = s / segments
          const y  = strTopY + t * strH
          const dx = Math.sin(phase + t * Math.PI * 2.5) * amp * Math.sin(Math.PI * t)
          if (s === 0) ctx.moveTo(x + dx, y)
          else ctx.lineTo(x + dx, y)
        }
        ctx.strokeStyle = rgba(COLORS.GOLD, level * 0.6)
        ctx.lineWidth   = weight * 0.7
        ctx.stroke()
        ctx.shadowBlur  = 0
        ctx.shadowColor = 'transparent'
      }

      // Nut (top)
      ctx.fillStyle = rgba(COLORS.SILVER, 0.12 + level * 0.2)
      ctx.fillRect(x - weight / 2 - 2, strTopY - 4, weight + 4, 6)

      // Bridge (bottom)
      ctx.fillRect(x - weight / 2 - 2, strBotY - 2, weight + 4, 6)
    })

    // Sub-wave rings from bottom
    if (subPulse.current > 0.1) {
      const waveAmp = subPulse.current * 20
      for (let w = 0; w < 3; w++) {
        const wphase = frame.current * 0.04 + w * Math.PI * 0.66
        ctx.beginPath()
        for (let x = 0; x < CW; x++) {
          const y = CH - 20 - w * 18 + Math.sin(x * 0.02 + wphase) * waveAmp * (1 - w * 0.3)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = rgba(COLORS.BLUE, subPulse.current * (0.3 - w * 0.08))
        ctx.lineWidth   = 1.2 - w * 0.3
        ctx.stroke()
      }
    }

    // Label
    if (!isPlaying) {
      ctx.fillStyle = rgba(COLORS.SILVER, 0.14)
      ctx.font      = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '0.3em'
      ctx.fillText('PLAY THE TRACK TO ACTIVATE', CW / 2, CH - 12)
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
        aria-label="Ghost Bass — audio-reactive bass string visualizer"
      />
    </div>
  )
}
