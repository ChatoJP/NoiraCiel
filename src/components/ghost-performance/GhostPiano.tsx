'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioMidiSync } from './useAudioMidiSync'
import { getBandEnergy, smooth, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

const CW = 800
const CH = 360

// 2 octaves: 14 white keys, 10 black keys
const KEY_W      = 54   // white key width
const KEY_GAP    = 2    // gap between white keys
const KEY_H      = 210  // white key height
const BLACK_W    = 34
const BLACK_H    = 138
const KEY_Y      = CH - KEY_H - 20  // top of white keys

const WHITE_KEYS = 14
const TOTAL_W    = WHITE_KEYS * (KEY_W + KEY_GAP)
const START_X    = (CW - TOTAL_W) / 2

// White key layout: C D E F G A B repeated twice (indices 0-13)
// Notes: 0=C, 1=D, 2=E, 3=F, 4=G, 5=A, 6=B
// Black keys sit between: C-D, D-E, F-G, G-A, A-B (no black between E-F and B-C)
const BLACK_KEY_POSITIONS: { x: number; noteIdx: number }[] = []
;[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].forEach((wIdx) => {
  // Black key center is at white key right edge – small offset
  BLACK_KEY_POSITIONS.push({
    x: START_X + wIdx * (KEY_W + KEY_GAP) + KEY_W - BLACK_W / 2 + KEY_GAP * 0.5,
    noteIdx: wIdx,
  })
})

// Frequency bands → white keys (log scale across audible spectrum)
// Maps each of the 14 white keys to a frequency range
function whiteKeyFreqRange(idx: number): [number, number] {
  const LOW = Math.log2(65)    // C2 ≈ 65 Hz
  const HIGH = Math.log2(8000) // high treble
  const lo = Math.pow(2, LOW + (idx / 14) * (HIGH - LOW))
  const hi = Math.pow(2, LOW + ((idx + 1) / 14) * (HIGH - LOW))
  return [lo, hi]
}

function blackKeyFreqRange(noteIdx: number): [number, number] {
  const [wLo, wHi] = whiteKeyFreqRange(noteIdx)
  const [wLo2, wHi2] = whiteKeyFreqRange(noteIdx + 1)
  return [(wLo + wHi) / 2, (wLo2 + wHi2) / 2]
}

export default function GhostPiano({ meta }: { meta?: GhostPerformanceMeta }) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rafRef      = useRef<number>(0)
  const whiteLevels = useRef<number[]>(Array(WHITE_KEYS).fill(0))
  const blackLevels = useRef<number[]>(Array(10).fill(0))
  const frame       = useRef(0)

  const { getFrequencyData, isPlaying } = useAudioMidiSync(meta)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frame.current++
    const freq  = isPlaying ? getFrequencyData() : null
    const wLvls = whiteLevels.current
    const bLvls = blackLevels.current

    if (freq) {
      for (let i = 0; i < WHITE_KEYS; i++) {
        const [lo, hi] = whiteKeyFreqRange(i)
        wLvls[i] = smooth(wLvls[i], getBandEnergy(freq, lo, hi), 0.45, 0.1)
      }
      for (let i = 0; i < BLACK_KEY_POSITIONS.length; i++) {
        const [lo, hi] = blackKeyFreqRange(BLACK_KEY_POSITIONS[i].noteIdx)
        bLvls[i] = smooth(bLvls[i], getBandEnergy(freq, lo, hi), 0.5, 0.1)
      }
    } else {
      for (let i = 0; i < wLvls.length; i++) wLvls[i] *= 0.93
      for (let i = 0; i < bLvls.length; i++) bLvls[i] *= 0.93
    }

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = COLORS.VOID
    ctx.fillRect(0, 0, CW, CH)

    const vig = ctx.createRadialGradient(CW / 2, CH * 0.5, CH * 0.05, CW / 2, CH * 0.55, CH * 0.85)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(4,4,10,0.7)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, CW, CH)

    // Subtle ambient glow above piano
    if (isPlaying) {
      const ambientEnergy = wLvls.reduce((a, b) => a + b, 0) / WHITE_KEYS
      if (ambientEnergy > 0.05) {
        const ambGrad = ctx.createRadialGradient(CW / 2, KEY_Y + KEY_H * 0.3, 20, CW / 2, KEY_Y + KEY_H * 0.3, CW * 0.6)
        ambGrad.addColorStop(0, rgba(COLORS.GOLD, ambientEnergy * 0.12))
        ambGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = ambGrad
        ctx.fillRect(0, 0, CW, CH)
      }
    }

    // ── White keys ────────────────────────────────────────────────────
    for (let i = 0; i < WHITE_KEYS; i++) {
      const x     = START_X + i * (KEY_W + KEY_GAP)
      const level = wLvls[i]

      // Key body — very dark, not pure white (noir aesthetic)
      const keyGrad = ctx.createLinearGradient(x, KEY_Y, x, KEY_Y + KEY_H)
      keyGrad.addColorStop(0, `rgba(22,24,34,${0.9 + level * 0.05})`)
      keyGrad.addColorStop(0.7, `rgba(18,20,28,0.95)`)
      keyGrad.addColorStop(1, `rgba(14,16,24,1)`)
      ctx.fillStyle = keyGrad

      ctx.beginPath()
      ctx.roundRect(x, KEY_Y, KEY_W, KEY_H, [2, 2, 4, 4])
      ctx.fill()

      // Key border
      ctx.strokeStyle = rgba(COLORS.SILVER, 0.12 + level * 0.2)
      ctx.lineWidth   = 1
      ctx.stroke()

      // Glow from top when active
      if (level > 0.06) {
        const glowH = Math.min(KEY_H, level * KEY_H * 2.5 + 20)
        const glowGrad = ctx.createLinearGradient(x, KEY_Y, x, KEY_Y + glowH)
        glowGrad.addColorStop(0, rgba(COLORS.GOLD, level * 0.7))
        glowGrad.addColorStop(0.5, rgba(COLORS.GOLD, level * 0.3))
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.roundRect(x + 2, KEY_Y, KEY_W - 4, glowH, 2)
        ctx.fill()

        // Top edge highlight
        ctx.shadowColor = rgba(COLORS.GOLD, level)
        ctx.shadowBlur  = 12 * level
        ctx.fillStyle   = rgba(COLORS.GOLD, level * 0.9)
        ctx.fillRect(x + 3, KEY_Y, KEY_W - 6, 2)
        ctx.shadowBlur  = 0
        ctx.shadowColor = 'transparent'
      }
    }

    // ── Black keys (drawn on top) ─────────────────────────────────────
    for (let i = 0; i < BLACK_KEY_POSITIONS.length; i++) {
      const { x }  = BLACK_KEY_POSITIONS[i]
      const level  = bLvls[i]

      const keyGrad = ctx.createLinearGradient(x, KEY_Y, x, KEY_Y + BLACK_H)
      keyGrad.addColorStop(0, `rgba(6,6,12,1)`)
      keyGrad.addColorStop(1, `rgba(10,12,20,1)`)
      ctx.fillStyle = keyGrad

      ctx.beginPath()
      ctx.roundRect(x, KEY_Y, BLACK_W, BLACK_H, [0, 0, 3, 3])
      ctx.fill()

      ctx.strokeStyle = rgba(COLORS.SILVER, 0.08 + level * 0.18)
      ctx.lineWidth   = 1
      ctx.stroke()

      if (level > 0.07) {
        const glowH = Math.min(BLACK_H, level * BLACK_H * 2 + 15)
        const bGlow = ctx.createLinearGradient(x, KEY_Y, x, KEY_Y + glowH)
        bGlow.addColorStop(0, rgba(COLORS.BLUE, level * 0.8))
        bGlow.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = bGlow
        ctx.beginPath()
        ctx.roundRect(x + 3, KEY_Y, BLACK_W - 6, glowH, 2)
        ctx.fill()

        ctx.shadowColor = rgba(COLORS.BLUE, level)
        ctx.shadowBlur  = 10 * level
        ctx.fillStyle   = rgba(COLORS.BLUE, level * 0.9)
        ctx.fillRect(x + 4, KEY_Y, BLACK_W - 8, 2)
        ctx.shadowBlur  = 0
        ctx.shadowColor = 'transparent'
      }
    }

    // ── Label ─────────────────────────────────────────────────────────
    if (!isPlaying) {
      ctx.fillStyle = rgba(COLORS.SILVER, 0.14)
      ctx.font      = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '0.3em'
      ctx.fillText('PLAY THE TRACK TO ACTIVATE', CW / 2, 28)
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
        style={{ maxHeight: 360 }}
        aria-label="Ghost Piano — audio-reactive piano key visualizer"
      />
    </div>
  )
}
