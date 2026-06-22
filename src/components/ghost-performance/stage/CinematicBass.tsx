'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioAnalysis } from '../useAudioAnalysis'
import { getBandEnergy, smooth, rgba, COLORS } from '../ghostPerformanceTypes'

const CW = 320
const CH = 480

// Bass guitar: 4 strings, tuned low (E1 A1 D2 G2)
interface BString { name: string; x: number; hzLo: number; hzHi: number; openHz: number; thickness: number }

const STRINGS: BString[] = [
  { name: 'E', x: CW*0.22, hzLo: 38,  hzHi: 80,  openHz: 41.2,  thickness: 6.0 },
  { name: 'A', x: CW*0.38, hzLo: 50,  hzHi: 110, openHz: 55.0,  thickness: 4.8 },
  { name: 'D', x: CW*0.62, hzLo: 68,  hzHi: 150, openHz: 73.4,  thickness: 3.6 },
  { name: 'G', x: CW*0.78, hzLo: 90,  hzHi: 200, openHz: 98.0,  thickness: 2.4 },
]

const STRING_TOP    = 55
const STRING_BOTTOM = 410
const STRING_LEN    = STRING_BOTTOM - STRING_TOP

interface SubPulse { x: number; y: number; r: number; t: number }

export default function CinematicBass() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rafRef      = useRef<number>(0)
  const levelsRef   = useRef<number[]>([0, 0, 0, 0])
  const phaseRef    = useRef<number[]>([0, 0, 0, 0])
  const pluckRef    = useRef<number[]>([0, 0, 0, 0])
  const prevLevRef  = useRef<number[]>([0, 0, 0, 0])
  const pulsesRef   = useRef<SubPulse[]>([])
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
    const phases = phaseRef.current
    const plucks = pluckRef.current

    // Sub-bass aura (20-60 Hz)
    const subBass = freq ? getBandEnergy(freq, 20, 65) : 0

    for (let i = 0; i < STRINGS.length; i++) {
      const s      = STRINGS[i]
      const prev   = levels[i]
      const target = freq ? getBandEnergy(freq, s.hzLo, s.hzHi) : 0
      levels[i]    = smooth(levels[i], target, 0.5, 0.06)
      phases[i]   += (1.5 + levels[i] * 6) * dt

      const delta = levels[i] - prev
      if (delta > 0.15) {
        plucks[i] = Math.min(1.0, plucks[i] + delta * 3.5)
        pulsesRef.current.push({ x: s.x, y: STRING_TOP + STRING_LEN * 0.45, r: 0, t: 0.7 })
      }
      plucks[i] = Math.max(0, plucks[i] - dt * 3.5)
      prevLevRef.current[i] = target
    }

    // Update sub-bass pulses
    const pulses = pulsesRef.current
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].r += 55 * dt
      pulses[i].t -= dt * 2.2
      if (pulses[i].t <= 0) pulses.splice(i, 1)
    }

    const avgLevel = levels.reduce((a, b) => a + b, 0) / 4

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = '#07070f'
    ctx.fillRect(0, 0, CW, CH)

    // Sub-bass floor glow
    if (subBass > 0.06) {
      const floorGrad = ctx.createRadialGradient(CW/2, CH, 10, CW/2, CH, CW * 1.2)
      floorGrad.addColorStop(0, rgba(COLORS.GOLD, subBass * 0.18))
      floorGrad.addColorStop(0.5, rgba(COLORS.GOLD, subBass * 0.05))
      floorGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = floorGrad
      ctx.fillRect(0, 0, CW, CH)
    }

    // Draw pulses
    for (const p of pulses) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(COLORS.GOLD, p.t * 0.35)
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Label
    ctx.fillStyle = rgba(COLORS.GOLD, 0.11)
    ctx.font = '8px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.letterSpacing = '0.35em'
    ctx.fillText('BASS', CW / 2, 28)
    ctx.letterSpacing = '0'

    // Bridge bar at bottom
    ctx.fillStyle = rgba(COLORS.GOLD, 0.25 + avgLevel * 0.20)
    ctx.shadowColor = rgba(COLORS.GOLD, avgLevel * 0.5)
    ctx.shadowBlur  = avgLevel * 12
    ctx.fillRect(STRINGS[0].x - 20, STRING_BOTTOM + 6, STRINGS[3].x - STRINGS[0].x + 40, 3)
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

    // Nut bar at top
    ctx.fillStyle = rgba(COLORS.GOLD, 0.30)
    ctx.fillRect(STRINGS[0].x - 16, STRING_TOP - 4, STRINGS[3].x - STRINGS[0].x + 32, 3)

    // Strings
    for (let i = 0; i < STRINGS.length; i++) {
      const s     = STRINGS[i]
      const level = levels[i]
      const pluck = plucks[i]
      const SEGS  = 70
      const pts: [number, number][] = []

      for (let seg = 0; seg <= SEGS; seg++) {
        const t   = seg / SEGS
        const y   = STRING_TOP + t * STRING_LEN
        const env = Math.sin(Math.PI * t)
        // Bass strings have slow, wide vibration
        const dx  = Math.sin(phases[i] * 2.8 + t * Math.PI * 2) * level * 28 * env
                  + Math.sin(phases[i] * 5.5 + t * Math.PI * 4) * level * 10 * env
                  + (pluck > 0.1 ? Math.sin(phases[i] * 14 + t * Math.PI * 3) * pluck * 18 * Math.exp(-t * 2.5) * env : 0)
        pts.push([s.x + dx, y])
      }

      // Pluck flash
      if (pluck > 0.08) {
        const fr = pluck * 22
        const fg = ctx.createRadialGradient(s.x, STRING_TOP + STRING_LEN * 0.2, 0, s.x, STRING_TOP + STRING_LEN * 0.2, fr)
        fg.addColorStop(0, rgba(COLORS.GOLD, pluck * 0.70))
        fg.addColorStop(1, rgba(COLORS.GOLD, 0))
        ctx.fillStyle = fg
        ctx.beginPath(); ctx.arc(s.x, STRING_TOP + STRING_LEN * 0.2, fr, 0, Math.PI * 2); ctx.fill()
      }

      // Coil texture (all bass strings are wound)
      ctx.save()
      ctx.setLineDash([4, 2])
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
      for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1])
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.05 + level * 0.10)
      ctx.lineWidth   = s.thickness + 3
      ctx.stroke()
      ctx.setLineDash([]); ctx.restore()

      // Dim depth
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
      for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1])
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.06 + level * 0.10)
      ctx.lineWidth   = s.thickness + 2; ctx.stroke()

      // Bright string
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1])
      for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1])
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.50 + level * 0.50)
      ctx.lineWidth   = s.thickness
      ctx.shadowColor = rgba(COLORS.GOLD, level * 0.90 + pluck * 0.55)
      ctx.shadowBlur  = 10 + level * 18 + pluck * 14
      ctx.stroke()
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

      // String label + sub-bass marker on E string
      ctx.fillStyle   = rgba(COLORS.GOLD, 0.28 + level * 0.60)
      ctx.font        = `${8 + level * 4}px system-ui, sans-serif`
      ctx.textAlign   = 'center'
      ctx.shadowColor = rgba(COLORS.GOLD, level * 0.55)
      ctx.shadowBlur  = level > 0.1 ? 5 * level : 0
      ctx.fillText(s.name, s.x, STRING_BOTTOM + 22)
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
    <canvas ref={canvasRef} width={CW} height={CH} className="w-full block" aria-label="Cinematic Bass" />
  )
}
