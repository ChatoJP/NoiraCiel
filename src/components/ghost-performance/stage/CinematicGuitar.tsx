'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioAnalysis } from '../useAudioAnalysis'
import { getBandEnergy, smooth, rgba, COLORS } from '../ghostPerformanceTypes'

const CW = 600
const CH = 480

const NUM_STRINGS = 6
const STRING_TOP  = 140
const SPACING     = 38
const NUT_X       = 110
const BRIDGE_X    = CW - 30
const STRING_LEN  = BRIDGE_X - NUT_X
const NUM_FRETS   = 12
const HZ_PER_BIN  = 48000 / 2048

// Standard tuning open string Hz
const OPEN_HZ = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]

interface GString {
  name: string; y: number
  hzLo: number; hzHi: number; openHz: number; thickness: number
}

const STRINGS: GString[] = [
  { name: 'E', y: STRING_TOP + 0*SPACING, hzLo: 75,  hzHi: 110, openHz: OPEN_HZ[0], thickness: 4.5 },
  { name: 'A', y: STRING_TOP + 1*SPACING, hzLo: 100, hzHi: 155, openHz: OPEN_HZ[1], thickness: 3.6 },
  { name: 'D', y: STRING_TOP + 2*SPACING, hzLo: 138, hzHi: 210, openHz: OPEN_HZ[2], thickness: 2.8 },
  { name: 'G', y: STRING_TOP + 3*SPACING, hzLo: 180, hzHi: 280, openHz: OPEN_HZ[3], thickness: 2.2 },
  { name: 'B', y: STRING_TOP + 4*SPACING, hzLo: 230, hzHi: 360, openHz: OPEN_HZ[4], thickness: 1.6 },
  { name: 'e', y: STRING_TOP + 5*SPACING, hzLo: 300, hzHi: 480, openHz: OPEN_HZ[5], thickness: 1.0 },
]

const NECK_TOP    = STRING_TOP - 32
const NECK_BOTTOM = STRING_TOP + (NUM_STRINGS - 1) * SPACING + 32

function fretX(fret: number): number {
  if (fret === 0) return NUT_X
  return NUT_X + (1 - Math.pow(2, -fret / 12)) * STRING_LEN
}
function fretCenterX(fret: number): number { return (fretX(fret - 1) + fretX(fret)) / 2 }

// Item 16: find dominant Hz in a band → fret on a string
function getDominantHz(freq: Uint8Array, hzLo: number, hzHi: number): number {
  const bLo = Math.max(1, Math.round(hzLo / HZ_PER_BIN))
  const bHi = Math.min(freq.length - 1, Math.round(hzHi / HZ_PER_BIN))
  let maxVal = 0, maxBin = bLo
  for (let b = bLo; b <= bHi; b++) if (freq[b] > maxVal) { maxVal = freq[b]; maxBin = b }
  return maxBin * HZ_PER_BIN
}
function hzToFret(hz: number, openHz: number): number {
  if (hz <= openHz * 0.95) return 0
  return Math.max(0, Math.min(NUM_FRETS, Math.round(12 * Math.log2(hz / openHz))))
}

export default function CinematicGuitar() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rafRef      = useRef<number>(0)
  const levelsRef   = useRef<number[]>(Array(NUM_STRINGS).fill(0))
  const phaseRef    = useRef<number[]>(Array(NUM_STRINGS).fill(0))
  const fretsRef    = useRef<number[]>(Array(NUM_STRINGS).fill(0))
  const pluckRef    = useRef<number[]>(Array(NUM_STRINGS).fill(0))
  const lastTimeRef = useRef<number>(0)
  const neckBowRef  = useRef<number>(0)

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
    const frets  = fretsRef.current
    const plucks = pluckRef.current

    // Item 26: whammy bar from subBass
    const subBass   = freq ? getBandEnergy(freq, 30, 80) : 0
    const targetBow = subBass > 0.42 ? (subBass - 0.42) * 20 : 0
    neckBowRef.current = smooth(neckBowRef.current, targetBow, 0.35, 0.08)
    const bow = neckBowRef.current

    for (let i = 0; i < NUM_STRINGS; i++) {
      const s      = STRINGS[i]
      const prev   = levels[i]
      const target = freq ? getBandEnergy(freq, s.hzLo, s.hzHi) : 0
      levels[i]    = smooth(levels[i], target, 0.4, 0.08)
      phases[i]   += (3 + levels[i] * 10) * dt

      // Item 16: fret from dominant frequency
      if (freq) {
        const domHz = getDominantHz(freq, s.hzLo, s.hzHi)
        frets[i]    = Math.round(smooth(frets[i], hzToFret(domHz, s.openHz), 0.25, 0.08))
      }

      // Item 17: pluck transient
      const delta = levels[i] - prev
      if (delta > 0.16) plucks[i] = Math.min(1.0, plucks[i] + delta * 2.8)
      plucks[i] = Math.max(0, plucks[i] - dt * 5.5)
    }

    const avgLevel = levels.reduce((a, b) => a + b, 0) / NUM_STRINGS

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = '#07070f'
    ctx.fillRect(0, 0, CW, CH)

    // ── Item 19: neck edge glow ───────────────────────────────────────
    const edgeA = 0.055 + avgLevel * 0.10
    const tg    = ctx.createLinearGradient(0, NECK_TOP - 4, 0, NECK_TOP + 10)
    tg.addColorStop(0, rgba(COLORS.GOLD, edgeA * 0.7)); tg.addColorStop(1, rgba(COLORS.GOLD, 0))
    ctx.fillStyle = tg; ctx.fillRect(NUT_X - 10, NECK_TOP - 4, STRING_LEN + 10, 14)

    const bg = ctx.createLinearGradient(0, NECK_BOTTOM - 10, 0, NECK_BOTTOM + 4)
    bg.addColorStop(0, rgba(COLORS.GOLD, 0)); bg.addColorStop(1, rgba(COLORS.GOLD, edgeA * 0.7))
    ctx.fillStyle = bg; ctx.fillRect(NUT_X - 10, NECK_BOTTOM - 10, STRING_LEN + 10, 14)

    // ── Neck body (with optional whammy bow) ──────────────────────────
    ctx.save()
    ctx.beginPath()
    if (bow > 1) {
      ctx.moveTo(NUT_X - 10, NECK_TOP)
      ctx.bezierCurveTo(NUT_X + STRING_LEN*0.33, NECK_TOP + bow, NUT_X + STRING_LEN*0.66, NECK_TOP + bow, BRIDGE_X, NECK_TOP)
      ctx.lineTo(BRIDGE_X, NECK_BOTTOM)
      ctx.bezierCurveTo(NUT_X + STRING_LEN*0.66, NECK_BOTTOM - bow, NUT_X + STRING_LEN*0.33, NECK_BOTTOM - bow, NUT_X - 10, NECK_BOTTOM)
      ctx.closePath()
    } else {
      ctx.roundRect(NUT_X - 10, NECK_TOP, STRING_LEN + 10, NECK_BOTTOM - NECK_TOP, [4, 2, 2, 4])
    }
    const ng = ctx.createLinearGradient(NUT_X, 0, BRIDGE_X, 0)
    ng.addColorStop(0, 'rgba(26,20,14,0.98)')
    ng.addColorStop(0.5, 'rgba(18,14,10,0.98)')
    ng.addColorStop(1, 'rgba(22,18,12,0.98)')
    ctx.fillStyle   = ng; ctx.fill()
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.10 + avgLevel * 0.08)
    ctx.lineWidth   = 1; ctx.stroke()
    ctx.restore()

    // ── Item 23: headstock silhouette ─────────────────────────────────
    const hsTop = NECK_TOP + 4
    const hsBot = NECK_BOTTOM - 4
    ctx.fillStyle   = 'rgba(22,17,11,0.96)'
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.13)
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(NUT_X - 10, hsTop)
    ctx.lineTo(NUT_X - 72, hsTop + 8)
    ctx.lineTo(NUT_X - 82, hsTop + 18)
    ctx.lineTo(NUT_X - 82, hsBot - 18)
    ctx.lineTo(NUT_X - 72, hsBot - 8)
    ctx.lineTo(NUT_X - 10, hsBot)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
    // Tuner pegs
    for (let p = 0; p < 6; p++) {
      const py = hsTop + 16 + p * ((hsBot - hsTop - 32) / 5)
      ctx.beginPath()
      ctx.arc(NUT_X - 78, py, 3, 0, Math.PI * 2)
      ctx.fillStyle   = rgba(COLORS.GOLD, 0.18 + levels[p] * 0.40)
      ctx.shadowColor = rgba(COLORS.GOLD, levels[p] * 0.45)
      ctx.shadowBlur  = levels[p] * 5
      ctx.fill()
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
    }

    // ── Nut ───────────────────────────────────────────────────────────
    ctx.fillStyle = rgba(COLORS.GOLD, 0.38)
    ctx.fillRect(NUT_X - 4, NECK_TOP, 4, NECK_BOTTOM - NECK_TOP)

    // ── Fret lines ────────────────────────────────────────────────────
    for (let f = 1; f <= NUM_FRETS; f++) {
      const fx = fretX(f)
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.18 + avgLevel * 0.07)
      ctx.lineWidth   = f === 12 ? 2 : 1
      ctx.beginPath(); ctx.moveTo(fx, NECK_TOP + 6); ctx.lineTo(fx, NECK_BOTTOM - 6); ctx.stroke()
    }

    // ── Item 25: fret number labels ───────────────────────────────────
    ctx.fillStyle = rgba(COLORS.GOLD, 0.12)
    ctx.font = '6px system-ui, sans-serif'
    ctx.textAlign = 'center'
    for (const f of [3, 5, 7, 9, 12]) ctx.fillText(`${f}`, fretCenterX(f), NECK_TOP - 3)

    // ── Item 20: harmonic node dots ───────────────────────────────────
    for (const hf of [12, 7]) {
      ctx.beginPath()
      ctx.arc(fretCenterX(hf), (NECK_TOP + NECK_BOTTOM) / 2, hf === 12 ? 5 : 3.5, 0, Math.PI * 2)
      ctx.fillStyle = rgba(COLORS.GOLD, 0.12 + avgLevel * 0.06)
      ctx.fill()
    }

    // ── Item 21: barre chord indicator ───────────────────────────────
    const active = levels.map((l, i) => ({ i, l, f: frets[i] })).filter(s => s.l > 0.16 && s.f > 0)
    if (active.length >= 3) {
      const fc: Record<number, number[]> = {}
      for (const s of active) fc[s.f] = [...(fc[s.f] ?? []), s.i]
      for (const [fStr, idxs] of Object.entries(fc)) {
        if (idxs.length < 3) continue
        const bf  = Number(fStr)
        const bx  = fretCenterX(bf)
        const y1  = STRINGS[idxs[0]].y
        const y2  = STRINGS[idxs[idxs.length - 1]].y
        ctx.strokeStyle = rgba(COLORS.GOLD, 0.42)
        ctx.lineWidth   = 3
        ctx.shadowColor = rgba(COLORS.GOLD, 0.50); ctx.shadowBlur = 8
        ctx.beginPath(); ctx.moveTo(bx, y1 - 6); ctx.lineTo(bx, y2 + 6); ctx.stroke()
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
      }
    }

    // ── Strings ───────────────────────────────────────────────────────
    for (let i = 0; i < NUM_STRINGS; i++) {
      const s     = STRINGS[i]
      const level = levels[i]
      const fret  = frets[i]
      const pluck = plucks[i]
      const SEGS  = 60

      // Item 17: pluck flash at nut
      if (pluck > 0.05) {
        const fr = pluck * 15
        const fg = ctx.createRadialGradient(NUT_X, s.y, 0, NUT_X, s.y, fr)
        fg.addColorStop(0, rgba(COLORS.GOLD, pluck * 0.80))
        fg.addColorStop(0.5, rgba(COLORS.GOLD, pluck * 0.25))
        fg.addColorStop(1, rgba(COLORS.GOLD, 0))
        ctx.fillStyle = fg
        ctx.beginPath(); ctx.arc(NUT_X, s.y, fr, 0, Math.PI * 2); ctx.fill()
      }

      // Vibrating path
      const pts: [number, number][] = []
      for (let seg = 0; seg <= SEGS; seg++) {
        const t   = seg / SEGS
        const x   = NUT_X + t * STRING_LEN
        const env = Math.sin(Math.PI * t)
        const bowDy = bow > 0 ? Math.sin(Math.PI * t) * bow * 0.35 : 0
        const dy  = Math.sin(phases[i] * 4.5 + t * Math.PI * 2) * level * 7 * env
                  + Math.sin(phases[i] * 9.2 + t * Math.PI * 4) * level * 2.8 * env
        pts.push([x, s.y + dy + bowDy])
      }

      // Item 18: coil texture for thick strings
      if (s.thickness >= 3.5) {
        ctx.save()
        ctx.setLineDash([3, 2])
        ctx.beginPath()
        ctx.moveTo(pts[0][0], pts[0][1])
        for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1])
        ctx.strokeStyle = rgba(COLORS.GOLD, 0.05 + level * 0.08)
        ctx.lineWidth   = s.thickness + 3
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }

      // Dim depth stroke
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1])
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.05 + level * 0.09)
      ctx.lineWidth   = s.thickness + 2
      ctx.stroke()

      // Bright stroke with glow
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let p = 1; p < pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1])
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.55 + level * 0.45)
      ctx.lineWidth   = s.thickness
      ctx.shadowColor = rgba(COLORS.GOLD, level * 0.85 + pluck * 0.45)
      ctx.shadowBlur  = level > 0.05 ? 5 + level * 10 + pluck * 12 : 0
      ctx.stroke()
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

      // Item 24: bridge pin glow
      ctx.beginPath()
      ctx.arc(BRIDGE_X + 5, s.y, 3 + level * 2, 0, Math.PI * 2)
      ctx.fillStyle   = rgba(COLORS.GOLD, 0.18 + level * 0.55)
      ctx.shadowColor = rgba(COLORS.GOLD, level * 0.60)
      ctx.shadowBlur  = level * 10
      ctx.fill()
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

      // Fret dot
      if (level > 0.12 && fret >= 1) {
        const dotX = fretCenterX(fret)
        ctx.beginPath()
        ctx.arc(dotX, s.y, 5 + level * 4, 0, Math.PI * 2)
        ctx.fillStyle   = rgba(COLORS.GOLD, level * 0.85)
        ctx.shadowColor = rgba(COLORS.GOLD, level)
        ctx.shadowBlur  = 12 * level
        ctx.fill()
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
      }

      // Item 27: mute × at nut
      if (level < 0.05 && isPlaying) {
        ctx.fillStyle = rgba(COLORS.GOLD, 0.16)
        ctx.font = '8px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('×', NUT_X - 16, s.y + 4)
      }

      // Item 22: string label + Hz
      const domHz = freq ? getDominantHz(freq, s.hzLo, s.hzHi) : 0
      ctx.fillStyle   = rgba(COLORS.GOLD, 0.28 + level * 0.55)
      ctx.font        = `${8 + level * 2}px system-ui, sans-serif`
      ctx.textAlign   = 'right'
      ctx.shadowColor = rgba(COLORS.GOLD, level * 0.50)
      ctx.shadowBlur  = level > 0.1 ? 4 * level : 0
      ctx.fillText(
        level > 0.18 && domHz > 0 ? `${s.name} ${Math.round(domHz)}` : s.name,
        NUT_X - 22, s.y + 4,
      )
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
    }

    // ── Label ─────────────────────────────────────────────────────────
    ctx.fillStyle = rgba(COLORS.GOLD, 0.11)
    ctx.font = '8px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.letterSpacing = '0.35em'
    ctx.fillText('GUITAR', CW / 2, 26)
    ctx.letterSpacing = '0'

    if (!isPlaying) {
      const breathe = 0.5 + 0.5 * Math.sin((Date.now() / 4000) * Math.PI * 2)
      ctx.beginPath()
      ctx.arc(CW / 2, CH / 2 + 60, 18 + breathe * 4, 0, Math.PI * 2)
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
      aria-label="Cinematic Guitar"
    />
  )
}
