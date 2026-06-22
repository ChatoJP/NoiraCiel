'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioAnalysis } from '../useAudioAnalysis'
import { getBandEnergy, smooth, rgba, COLORS } from '../ghostPerformanceTypes'

const CW = 320
const CH = 480

interface StringDef {
  name: string; x: number
  hzLo: number; hzHi: number; thickness: number
  // Item 34: color temperature per string
  colorR: number; colorG: number; colorB: number
}

const STRINGS: StringDef[] = [
  { name: 'C', x: CW*0.20, hzLo: 65,  hzHi: 150,  thickness: 4.5, colorR: 210, colorG: 145, colorB: 45  },  // warm amber
  { name: 'G', x: CW*0.40, hzLo: 150, hzHi: 300,  thickness: 3.2, colorR: 200, colorG: 148, colorB: 55  },  // gold
  { name: 'D', x: CW*0.60, hzLo: 300, hzHi: 600,  thickness: 2.0, colorR: 190, colorG: 152, colorB: 70  },  // neutral
  { name: 'A', x: CW*0.80, hzLo: 600, hzHi: 1200, thickness: 1.1, colorR: 175, colorG: 190, colorB: 210 },  // cool silver
]

const STRING_TOP    = 60
const STRING_BOTTOM = 420
const STRING_LEN    = STRING_BOTTOM - STRING_TOP

interface ResonanceRing { x: number; y: number; r: number; maxR: number; t: number }

const HARMONICS = [
  { amplitude: 1.0, speed: 3.5 },
  { amplitude: 0.42, speed: 7.1 },
  { amplitude: 0.20, speed: 11.3 },
]

export default function CinematicStrings() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number>(0)
  const levelsRef    = useRef<number[]>([0, 0, 0, 0])
  const phaseRef     = useRef<number[]>([0, 0, 0, 0])
  const prevLevRef   = useRef<number[]>([0, 0, 0, 0])
  const bowDirRef    = useRef<number[]>([1, 1, 1, 1])   // +1 up-bow, -1 down-bow
  const pizzaRef     = useRef<number[]>([0, 0, 0, 0])   // pizzicato mode t (0..1)
  const ringsRef     = useRef<ResonanceRing[]>([])
  const lastTimeRef  = useRef<number>(0)
  const prevAvgRef   = useRef<number>(0)

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
    const phases = phaseRef.current
    const prev   = prevLevRef.current
    const pizz   = pizzaRef.current
    const rings  = ringsRef.current

    for (let i = 0; i < STRINGS.length; i++) {
      const s      = STRINGS[i]
      const target = freq ? getBandEnergy(freq, s.hzLo, s.hzHi) : 0
      const delta  = target - prev[i]

      levels[i]    = smooth(levels[i], target, 0.4, 0.08)
      phases[i]   += (2.5 + levels[i] * 12) * dt
      prev[i]      = target

      // Item 28: bow direction detection from energy rise/fall
      if (delta > 0.05)       bowDirRef.current[i] =  1
      else if (delta < -0.05) bowDirRef.current[i] = -1

      // Item 31: pizzicato detection — sharp attack
      if (delta > 0.20) {
        pizz[i] = Math.min(1.0, pizz[i] + delta * 3.0)

        // Item 29: harmonic node flash
        const midY = STRING_TOP + STRING_LEN / 2
        rings.push({ x: s.x, y: midY, r: 0, maxR: 40, t: 0.80 })

        // Item 33: resonance ring at pluck point
        const pluckY = STRING_TOP + STRING_LEN * 0.3
        rings.push({ x: s.x, y: pluckY, r: 0, maxR: 55, t: 0.65 })
      }
      pizz[i] = Math.max(0, pizz[i] - dt * 4.0)
    }

    // Update resonance rings (item 33)
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i]
      ring.r += ring.maxR * dt * 3
      ring.t -= dt * 2.8
      if (ring.t <= 0 || ring.r >= ring.maxR) rings.splice(i, 1)
    }

    const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length
    const avgDelta = avgLevel - prevAvgRef.current
    prevAvgRef.current = avgLevel

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = '#07070f'
    ctx.fillRect(0, 0, CW, CH)

    // Atmospheric radial glow
    if (avgLevel > 0.06) {
      const glow = ctx.createRadialGradient(CW/2, CH*0.5, 20, CW/2, CH*0.5, CW*0.85)
      glow.addColorStop(0, rgba(COLORS.GOLD, avgLevel * 0.11))
      glow.addColorStop(0.6, rgba(COLORS.GOLD, avgLevel * 0.04))
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, CW, CH)
    }

    // ── Item 30: f-hole silhouettes ───────────────────────────────────
    ctx.save()
    ctx.globalAlpha = 0.04 + avgLevel * 0.025
    ctx.strokeStyle = rgba(COLORS.GOLD, 1)
    ctx.lineWidth   = 2
    for (const fhX of [CW * 0.10, CW * 0.90]) {
      const midY = CH * 0.48
      const h    = 80
      ctx.beginPath()
      ctx.moveTo(fhX, midY - h)
      ctx.bezierCurveTo(fhX + 16, midY - h, fhX + 16, midY - 4, fhX, midY - 4)
      ctx.bezierCurveTo(fhX - 16, midY - 4, fhX - 16, midY + 4, fhX, midY + 4)
      ctx.bezierCurveTo(fhX + 16, midY + 4, fhX + 16, midY + h, fhX, midY + h)
      ctx.stroke()
      // Top and bottom serifs of f-hole
      ctx.beginPath()
      ctx.moveTo(fhX - 8, midY - h); ctx.lineTo(fhX + 8, midY - h)
      ctx.moveTo(fhX - 8, midY + h); ctx.lineTo(fhX + 8, midY + h)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.restore()

    // ── Label ─────────────────────────────────────────────────────────
    ctx.fillStyle = rgba(COLORS.GOLD, 0.12)
    ctx.font      = '8px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.letterSpacing = '0.35em'
    ctx.fillText('STRINGS', CW / 2, 30)
    ctx.letterSpacing = '0'

    // ── Draw resonance rings (item 33) ────────────────────────────────
    for (const ring of rings) {
      ctx.beginPath()
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(COLORS.GOLD, ring.t * 0.45)
      ctx.lineWidth   = 1.5
      ctx.stroke()
    }

    // ── Draw each string ──────────────────────────────────────────────
    for (let i = 0; i < STRINGS.length; i++) {
      const s     = STRINGS[i]
      const level = levels[i]
      const phase = phases[i]
      const pizza = pizz[i]
      const { colorR: cr, colorG: cg, colorB: cb } = s

      // Item 32: vibrato depth indicator (small sine icon above string top)
      const amp = level * 20
      if (amp > 3) {
        ctx.save()
        ctx.globalAlpha = Math.min(1, amp / 12)
        ctx.strokeStyle = rgba(COLORS.GOLD, 0.30)
        ctx.lineWidth   = 1
        ctx.beginPath()
        for (let sx = 0; sx < 18; sx++) {
          const sy = STRING_TOP - 14 + Math.sin(sx / 3 * Math.PI) * 4
          sx === 0 ? ctx.moveTo(s.x - 9 + sx, sy) : ctx.lineTo(s.x - 9 + sx, sy)
        }
        ctx.stroke()
        ctx.restore()
      }

      // Build string path — normal vibration or pizzicato pluck shape
      const SEGMENTS = 80
      const points: [number, number][] = []

      for (let seg = 0; seg <= SEGMENTS; seg++) {
        const t   = seg / SEGMENTS
        const y   = STRING_TOP + t * STRING_LEN
        const env = Math.sin(Math.PI * t)

        let dx = 0
        if (pizza > 0.05) {
          // Item 31: pluck waveform — sharp asymmetric impulse
          const pluckEnv = Math.pow(Math.sin(Math.PI * t), 0.5) * Math.exp(-t * 3)
          dx = Math.sin(phase * 8 + t * Math.PI * 3) * pizza * 18 * pluckEnv
        } else {
          for (let h = 0; h < HARMONICS.length; h++) {
            const harm = HARMONICS[h]
            dx += harm.amplitude
              * Math.sin(phase * harm.speed + t * Math.PI * (h + 1) * 2)
              * level * 22 * env
          }
        }

        points.push([s.x + dx, y])
      }

      // Dim thick depth layer
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let p = 1; p < points.length; p++) ctx.lineTo(points[p][0], points[p][1])
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.07 + level * 0.12})`
      ctx.lineWidth   = s.thickness + 2
      ctx.shadowBlur  = 0
      ctx.stroke()

      // Bright thin layer with glow
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let p = 1; p < points.length; p++) ctx.lineTo(points[p][0], points[p][1])
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.55 + level * 0.45})`
      ctx.lineWidth   = s.thickness
      ctx.shadowColor = `rgba(${cr},${cg},${cb},${level * 0.9 + pizza * 0.5})`
      ctx.shadowBlur  = 8 + level * 14 + pizza * 12
      ctx.stroke()
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

      // Item 28: bow direction triangle at top of string
      if (level > 0.08) {
        const dir  = bowDirRef.current[i]
        const bx   = s.x
        const by   = STRING_TOP - 22
        const size = 5 + level * 3
        ctx.fillStyle   = `rgba(${cr},${cg},${cb},${level * 0.65})`
        ctx.shadowColor = `rgba(${cr},${cg},${cb},${level * 0.50})`
        ctx.shadowBlur  = 4 * level
        ctx.beginPath()
        if (dir > 0) {
          // Up-bow: triangle pointing up
          ctx.moveTo(bx, by - size)
          ctx.lineTo(bx - size * 0.7, by + size * 0.4)
          ctx.lineTo(bx + size * 0.7, by + size * 0.4)
        } else {
          // Down-bow: triangle pointing down
          ctx.moveTo(bx, by + size)
          ctx.lineTo(bx - size * 0.7, by - size * 0.4)
          ctx.lineTo(bx + size * 0.7, by - size * 0.4)
        }
        ctx.closePath(); ctx.fill()
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
      }

      // Item 29: harmonic node flash dot at mid-string
      if (pizza > 0.15) {
        ctx.beginPath()
        ctx.arc(s.x, STRING_TOP + STRING_LEN / 2, 4 + pizza * 4, 0, Math.PI * 2)
        ctx.fillStyle   = `rgba(${cr},${cg},${cb},${pizza * 0.70})`
        ctx.shadowColor = `rgba(${cr},${cg},${cb},${pizza * 0.85})`
        ctx.shadowBlur  = 12 * pizza
        ctx.fill()
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
      }

      // String note label below bridge
      const labelY = STRING_BOTTOM + 24
      ctx.fillStyle   = `rgba(${cr},${cg},${cb},${0.25 + level * 0.60})`
      ctx.font        = `${8 + level * 4}px system-ui, sans-serif`
      ctx.textAlign   = 'center'
      ctx.shadowColor = `rgba(${cr},${cg},${cb},${level * 0.65})`
      ctx.shadowBlur  = level > 0.1 ? 6 * level : 0
      ctx.fillText(s.name, s.x, labelY)
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
    }

    // ── Item 35: bridge with knob detail ─────────────────────────────
    const bridgeY = STRING_BOTTOM + 4
    ctx.beginPath()
    ctx.moveTo(STRINGS[0].x - 22, bridgeY)
    ctx.bezierCurveTo(CW * 0.28, bridgeY - 7, CW * 0.72, bridgeY - 7, STRINGS[3].x + 22, bridgeY)
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.26 + avgLevel * 0.18)
    ctx.lineWidth   = 2.5
    ctx.shadowColor = rgba(COLORS.GOLD, avgLevel * 0.38)
    ctx.shadowBlur  = avgLevel * 8
    ctx.stroke()
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

    // Bridge knob dots (item 35)
    for (const s of STRINGS) {
      ctx.beginPath()
      ctx.arc(s.x, bridgeY - 1, 3, 0, Math.PI * 2)
      ctx.fillStyle   = rgba(COLORS.GOLD, 0.30 + levels[STRINGS.indexOf(s)] * 0.45)
      ctx.shadowColor = rgba(COLORS.GOLD, levels[STRINGS.indexOf(s)] * 0.50)
      ctx.shadowBlur  = levels[STRINGS.indexOf(s)] * 8
      ctx.fill()
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
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
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      className="w-full block"
      aria-label="Cinematic Strings"
    />
  )
}
