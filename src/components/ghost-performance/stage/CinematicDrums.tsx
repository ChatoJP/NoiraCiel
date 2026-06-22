'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioAnalysis } from '../useAudioAnalysis'
import { getBandEnergy, smooth, rgba, COLORS } from '../ghostPerformanceTypes'

const CW = 320
const CH = 480

interface Hit { x: number; y: number; r: number; maxR: number; t: number }

interface DrumPiece {
  label: string
  x: number; y: number
  w: number; h: number
  hzLo: number; hzHi: number
  shape: 'circle' | 'oval' | 'hat'
  baseOpacity: number
}

const PIECES: DrumPiece[] = [
  { label: 'KICK',   x: CW*0.50, y: CH*0.72, w: 90, h: 90, hzLo: 30,   hzHi: 80,   shape: 'circle', baseOpacity: 0.25 },
  { label: 'SNARE',  x: CW*0.28, y: CH*0.55, w: 60, h: 55, hzLo: 120,  hzHi: 400,  shape: 'circle', baseOpacity: 0.20 },
  { label: 'TOM',    x: CW*0.72, y: CH*0.52, w: 52, h: 52, hzLo: 80,   hzHi: 200,  shape: 'circle', baseOpacity: 0.18 },
  { label: 'CRASH',  x: CW*0.18, y: CH*0.24, w: 88, h: 18, hzLo: 6000, hzHi: 14000,shape: 'oval',   baseOpacity: 0.16 },
  { label: 'RIDE',   x: CW*0.78, y: CH*0.26, w: 72, h: 14, hzLo: 4000, hzHi: 10000,shape: 'oval',   baseOpacity: 0.16 },
  { label: 'HH',     x: CW*0.50, y: CH*0.12, w: 40, h: 8,  hzLo: 9000, hzHi: 18000,shape: 'hat',    baseOpacity: 0.14 },
]

// Rods connecting kick to toms
const RODS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],
]

export default function CinematicDrums() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rafRef      = useRef<number>(0)
  const levelsRef   = useRef<number[]>(PIECES.map(() => 0))
  const prevLevRef  = useRef<number[]>(PIECES.map(() => 0))
  const hitsRef     = useRef<Hit[]>([])
  const lastTimeRef = useRef<number>(0)

  const { getFrequencyData, isPlaying } = useAudioAnalysis()

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
    const ctx = canvas.getContext('2d')
    if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }

    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = now

    const freq   = isPlaying ? getFrequencyData() : null
    const levels = levelsRef.current

    for (let i = 0; i < PIECES.length; i++) {
      const p      = PIECES[i]
      const prev   = prevLevRef.current[i]
      const target = freq ? getBandEnergy(freq, p.hzLo, p.hzHi) : 0
      levels[i]    = smooth(levels[i], target, 0.65, 0.08)

      const delta = target - prev
      if (delta > 0.18 && target > 0.22) {
        hitsRef.current.push({ x: p.x, y: p.y, r: 0, maxR: p.w * 1.4, t: 0.75 })
      }
      prevLevRef.current[i] = target
    }

    const hits = hitsRef.current
    for (let i = hits.length - 1; i >= 0; i--) {
      hits[i].r += hits[i].maxR * 1.8 * dt
      hits[i].t -= dt * 2.5
      if (hits[i].t <= 0) hits.splice(i, 1)
    }

    const kick = levels[0]

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = '#07070f'
    ctx.fillRect(0, 0, CW, CH)

    // Kick floor aura
    if (kick > 0.08) {
      const fg = ctx.createRadialGradient(CW*0.5, CH, 0, CW*0.5, CH, CW * 0.9)
      fg.addColorStop(0, rgba(COLORS.GOLD, kick * 0.14))
      fg.addColorStop(0.5, rgba(COLORS.GOLD, kick * 0.04))
      fg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = fg; ctx.fillRect(0, 0, CW, CH)
    }

    // Label
    ctx.fillStyle = rgba(COLORS.GOLD, 0.11)
    ctx.font = '8px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.letterSpacing = '0.35em'
    ctx.fillText('DRUMS', CW / 2, 22)
    ctx.letterSpacing = '0'

    // Connecting rods (before pieces for depth)
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.08)
    ctx.lineWidth = 1
    for (const [a, b] of RODS) {
      ctx.beginPath()
      ctx.moveTo(PIECES[a].x, PIECES[a].y)
      ctx.lineTo(PIECES[b].x, PIECES[b].y)
      ctx.stroke()
    }

    // Hit rings
    for (const h of hits) {
      ctx.beginPath()
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(COLORS.GOLD, h.t * 0.40)
      ctx.lineWidth = 1.5; ctx.stroke()
    }

    // Draw pieces
    for (let i = 0; i < PIECES.length; i++) {
      const p   = PIECES[i]
      const lev = levels[i]
      const glow = p.baseOpacity + lev * 0.75

      ctx.save()

      if (p.shape === 'circle') {
        const r = p.w / 2 + lev * 10
        // Outer ring
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(COLORS.GOLD, glow * 0.35)
        ctx.lineWidth = 1; ctx.stroke()

        // Depth fill
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        const radGrad = ctx.createRadialGradient(p.x, p.y - r*0.25, r*0.05, p.x, p.y, r)
        radGrad.addColorStop(0, rgba(COLORS.GOLD, glow * 0.22))
        radGrad.addColorStop(0.7, rgba(COLORS.GOLD, glow * 0.06))
        radGrad.addColorStop(1, rgba(COLORS.GOLD, glow * 0.02))
        ctx.fillStyle = radGrad; ctx.fill()

        // Bright rim
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(COLORS.GOLD, glow)
        ctx.lineWidth = 1.8
        ctx.shadowColor = rgba(COLORS.GOLD, lev * 0.9)
        ctx.shadowBlur  = 6 + lev * 22
        ctx.stroke()
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

        // Label
        ctx.fillStyle = rgba(COLORS.GOLD, 0.18 + lev * 0.50)
        ctx.font = `${7 + lev * 2}px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(p.label, p.x, p.y + (i === 0 ? 5 : 4))

      } else if (p.shape === 'oval') {
        // Cymbal: horizontal oval
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.w / 2 + lev * 12, p.h + lev * 4, 0, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(COLORS.GOLD, glow)
        ctx.lineWidth = 1.5
        ctx.shadowColor = rgba(COLORS.GOLD, lev * 0.80)
        ctx.shadowBlur  = 4 + lev * 16
        ctx.stroke()
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

        // Cymbal center dome
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5 + lev * 3, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(COLORS.GOLD, glow * 0.60)
        ctx.lineWidth = 1; ctx.stroke()

        ctx.fillStyle = rgba(COLORS.GOLD, 0.14 + lev * 0.40)
        ctx.font = '6px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.label, p.x, p.y - p.h - 5)

      } else {
        // Hat: two thin overlapping lines (open/closed position)
        const spread = lev > 0.25 ? lev * 8 : 0
        const y1 = p.y - spread * 0.5
        const y2 = p.y + spread * 0.5
        ctx.strokeStyle = rgba(COLORS.GOLD, glow)
        ctx.lineWidth = 1.8
        ctx.shadowColor = rgba(COLORS.GOLD, lev)
        ctx.shadowBlur  = 3 + lev * 12
        for (const cy of [y1, y2]) {
          ctx.beginPath()
          ctx.ellipse(p.x, cy, p.w / 2 + lev * 8, 4 + lev * 3, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
        ctx.fillStyle = rgba(COLORS.GOLD, 0.14 + lev * 0.40)
        ctx.font = '6px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.label, p.x, p.y - p.h - 7)
      }

      ctx.restore()
    }

    if (!isPlaying) {
      const breathe = 0.5 + 0.5 * Math.sin((Date.now() / 4000) * Math.PI * 2)
      ctx.beginPath()
      ctx.arc(CW / 2, CH / 2, 18 + breathe * 4, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.04 + breathe * 0.04)
      ctx.lineWidth = 1
      ctx.stroke()
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [getFrequencyData, isPlaying])

  useEffect(() => {
    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return (
    <canvas ref={canvasRef} width={CW} height={CH} className="w-full block" aria-label="Cinematic Drums" />
  )
}
