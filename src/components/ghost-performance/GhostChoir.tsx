'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioMidiSync } from './useAudioMidiSync'
import { getBandEnergy, smooth, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

const CW = 800
const CH = 440

// 5 abstract choir silhouettes
const SILHOUETTES = [
  { x: 0.14, scale: 0.82 },
  { x: 0.30, scale: 0.95 },
  { x: 0.50, scale: 1.0  },
  { x: 0.70, scale: 0.95 },
  { x: 0.86, scale: 0.82 },
]

interface BreathParticle {
  x: number; y: number; vx: number; vy: number
  size: number; opacity: number; life: number; maxLife: number
}

export default function GhostChoir({ meta }: { meta?: GhostPerformanceMeta }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const voiceLvl  = useRef(0)
  const breathLvl = useRef(0)
  const particles = useRef<BreathParticle[]>([])
  const frame     = useRef(0)

  const { getFrequencyData, isPlaying } = useAudioMidiSync(meta)

  // Init breath particles
  useEffect(() => {
    particles.current = Array.from({ length: 30 }, (_, i) => ({
      x: CW * SILHOUETTES[i % 5].x,
      y: CH * 0.35 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.8 - 0.2,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.3 + 0.05,
      life: Math.random() * 100,
      maxLife: 120 + Math.random() * 80,
    }))
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frame.current++
    const freq = isPlaying ? getFrequencyData() : null
    const rawVoice  = freq ? getBandEnergy(freq, 300, 3500) : 0
    const rawBreath = freq ? getBandEnergy(freq, 3500, 8000) : 0

    voiceLvl.current  = smooth(voiceLvl.current,  rawVoice,  0.35, 0.08)
    breathLvl.current = smooth(breathLvl.current, rawBreath, 0.45, 0.1)

    const vl = voiceLvl.current
    const bl = breathLvl.current

    // Background
    ctx.fillStyle = COLORS.VOID
    ctx.fillRect(0, 0, CW, CH)

    // Deep floor glow
    const floorGrad = ctx.createLinearGradient(0, CH * 0.7, 0, CH)
    floorGrad.addColorStop(0, 'rgba(0,0,0,0)')
    floorGrad.addColorStop(1, rgba(COLORS.BLUE, 0.04 + vl * 0.06))
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, 0, CW, CH)

    // ── Silhouettes ───────────────────────────────────────────────────
    SILHOUETTES.forEach(({ x, scale }, idx) => {
      const sil_x = CW * x
      const breath = Math.sin(frame.current * 0.018 + idx * 1.2) * 0.5 + 0.5
      const sil_h  = (CH * 0.48 + breath * 15 + vl * 25) * scale
      const sil_w  = 28 * scale
      const sil_y  = CH * 0.72 - sil_h * 0.7

      // Body form (vertical light pillar)
      const pillarGrad = ctx.createLinearGradient(sil_x, sil_y, sil_x, sil_y + sil_h)
      pillarGrad.addColorStop(0, rgba(COLORS.IVORY, 0.0))
      pillarGrad.addColorStop(0.2, rgba(COLORS.IVORY, 0.04 + vl * 0.12))
      pillarGrad.addColorStop(0.55, rgba(COLORS.IVORY, 0.06 + vl * 0.18))
      pillarGrad.addColorStop(0.8, rgba(COLORS.IVORY, 0.03 + vl * 0.1))
      pillarGrad.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.beginPath()
      ctx.ellipse(sil_x, sil_y + sil_h * 0.5, sil_w * 0.5, sil_h * 0.5, 0, 0, Math.PI * 2)
      ctx.fillStyle = pillarGrad
      ctx.fill()

      // Head glow (top of silhouette)
      const headY = sil_y + sil_h * 0.08
      if (vl > 0.04) {
        const headGrad = ctx.createRadialGradient(sil_x, headY, 0, sil_x, headY, 22 * scale)
        headGrad.addColorStop(0, rgba(COLORS.IVORY, 0.06 + vl * 0.25))
        headGrad.addColorStop(0.5, rgba(COLORS.GOLD, vl * 0.1))
        headGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(sil_x, headY, 22 * scale, 0, Math.PI * 2)
        ctx.fillStyle = headGrad
        ctx.fill()
      }

      // Breath wave from mouth
      if (vl > 0.06) {
        const mouthY = sil_y + sil_h * 0.16
        const wPhase = frame.current * 0.06 + idx * 0.8
        for (let w = 0; w < 2; w++) {
          ctx.beginPath()
          const r = 15 + w * 12 + breath * 8 + vl * 20
          ctx.arc(sil_x, mouthY, r, 0, Math.PI * 2)
          ctx.strokeStyle = rgba(COLORS.IVORY, Math.max(0, (vl * 0.25 - w * 0.08) * Math.sin(wPhase - w)))
          ctx.lineWidth   = 0.8
          ctx.stroke()
        }
      }
    })

    // ── Breath particles ──────────────────────────────────────────────
    const showParticles = meta?.showParticles !== false
    if (showParticles) {
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.x += p.vx * (1 + bl * 1.5)
        p.y += p.vy * (1 + vl * 1.2)
        p.life++
        const progress = p.life / p.maxLife
        const alpha    = p.opacity * (1 - progress) * (0.3 + vl * 0.7)

        if (p.life >= p.maxLife || alpha < 0.01) {
          const si = i % 5
          p.x   = CW * SILHOUETTES[si].x + (Math.random() - 0.5) * 20
          p.y   = CH * 0.4 - Math.random() * 20
          p.vx  = (Math.random() - 0.5) * 0.5
          p.vy  = -Math.random() * 0.7 - 0.15
          p.life = 0
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = rgba(COLORS.IVORY, alpha)
        ctx.fill()
      }
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
        style={{ maxHeight: 440 }}
        aria-label="Ghost Choir — audio-reactive choir visualizer"
      />
    </div>
  )
}
