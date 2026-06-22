'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioMidiSync } from './useAudioMidiSync'
import { getBandEnergy, smooth, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

const W = 800
const H = 420

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawDrum(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  level: number, color: typeof COLORS.GOLD = COLORS.GOLD,
) {
  // Shell
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(6, 6, 14, 0.95)'
  ctx.fill()
  ctx.strokeStyle = rgba(color, 0.12 + level * 0.35)
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Inner head rim
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2)
  ctx.strokeStyle = rgba(color, 0.06 + level * 0.18)
  ctx.lineWidth = 1
  ctx.stroke()

  // Glow
  if (level > 0.08) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0,   rgba(color, level * 0.55))
    g.addColorStop(0.6, rgba(color, level * 0.2))
    g.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = g
    ctx.fill()

    // Shadow glow
    ctx.shadowColor = rgba(color, level * 0.9)
    ctx.shadowBlur  = 18 * level
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = rgba(color, level * 0.7)
    ctx.lineWidth   = 1.5
    ctx.stroke()
    ctx.shadowBlur  = 0
    ctx.shadowColor = 'transparent'
  }
}

function drawKick(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, level: number) {
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(6, 6, 14, 0.98)'
  ctx.fill()
  ctx.strokeStyle = rgba(COLORS.GOLD, 0.18 + level * 0.55)
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(cx, cy, rx * 0.8, ry * 0.7, 0, 0, Math.PI * 2)
  ctx.strokeStyle = rgba(COLORS.GOLD, 0.08 + level * 0.2)
  ctx.lineWidth = 1
  ctx.stroke()

  if (level > 0.12) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx)
    g.addColorStop(0,   rgba(COLORS.GOLD, level * 0.5))
    g.addColorStop(0.7, rgba(COLORS.GOLD, level * 0.12))
    g.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = g
    ctx.fill()

    ctx.shadowColor = rgba(COLORS.GOLD, level)
    ctx.shadowBlur  = 30 * level
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.strokeStyle = rgba(COLORS.GOLD, level * 0.8)
    ctx.lineWidth   = 2
    ctx.stroke()
    ctx.shadowBlur  = 0
    ctx.shadowColor = 'transparent'
  }
}

function drawCymbal(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  angleDeg: number, level: number,
  color: typeof COLORS.SILVER = COLORS.SILVER,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angleDeg * Math.PI / 180)

  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(8, 10, 20, 0.85)'
  ctx.fill()
  ctx.strokeStyle = rgba(color, 0.1 + level * 0.45)
  ctx.lineWidth   = 1.5
  ctx.stroke()

  // Bell dome
  ctx.beginPath()
  ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2)
  ctx.fillStyle = rgba(color, 0.15 + level * 0.4)
  ctx.fill()

  if (level > 0.1) {
    ctx.shadowColor = rgba(color, level * 0.8)
    ctx.shadowBlur  = 15 * level
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.strokeStyle = rgba(color, level * 0.6)
    ctx.lineWidth   = 2
    ctx.stroke()
    ctx.shadowBlur  = 0
    ctx.shadowColor = 'transparent'
  }

  ctx.restore()
}

function drawHiHat(ctx: CanvasRenderingContext2D, cx: number, cy: number, level: number) {
  // Two close cymbals (closed hi-hat)
  drawCymbal(ctx, cx, cy - 6, 38, 8, -8, level, COLORS.SILVER)
  drawCymbal(ctx, cx, cy + 6, 38, 8,  8, level, COLORS.SILVER)

  // Stand post
  ctx.beginPath()
  ctx.moveTo(cx, cy + 14)
  ctx.lineTo(cx, cy + 60)
  ctx.strokeStyle = rgba(COLORS.SILVER, 0.08 + level * 0.1)
  ctx.lineWidth   = 2
  ctx.stroke()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GhostDrums({ meta }: { meta?: GhostPerformanceMeta }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const levels    = useRef({ kick: 0, snare: 0, hihat: 0, crash: 0, ride: 0, tom1: 0, tom2: 0, floor: 0 })
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

    // Audio-reactive mapping (all instruments are audio-driven in Phase 1)
    if (freq) {
      const rawKick  = getBandEnergy(freq,  30,  90)  // sub-bass kick body
      const rawSnare = getBandEnergy(freq, 150, 320)  // snare body
      const rawHiHat = getBandEnergy(freq, 6000, 12000)
      const rawCrash = getBandEnergy(freq, 4000, 9000)
      const rawTom1  = getBandEnergy(freq, 120, 250)
      const rawTom2  = getBandEnergy(freq, 90,  200)
      const rawFloor = getBandEnergy(freq, 60,  140)

      lv.kick  = smooth(lv.kick,  rawKick,  0.5, 0.12)
      lv.snare = smooth(lv.snare, rawSnare, 0.5, 0.1)
      lv.hihat = smooth(lv.hihat, rawHiHat, 0.55, 0.08)
      lv.crash = smooth(lv.crash, rawCrash, 0.45, 0.1)
      lv.ride  = smooth(lv.ride,  rawCrash * 0.7, 0.4, 0.1)
      lv.tom1  = smooth(lv.tom1,  rawTom1,  0.5, 0.12)
      lv.tom2  = smooth(lv.tom2,  rawTom2,  0.5, 0.12)
      lv.floor = smooth(lv.floor, rawFloor, 0.5, 0.12)
    } else {
      // Gentle decay when paused
      for (const k of Object.keys(lv) as Array<keyof typeof lv>) {
        lv[k] *= 0.95
      }
    }

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = COLORS.VOID
    ctx.fillRect(0, 0, W, H)

    const vig = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.1, W / 2, H * 0.55, H * 0.9)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(4,4,10,0.75)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, W, H)

    // ── Floor shadow under kick ────────────────────────────────────────
    const shadowGrad = ctx.createRadialGradient(W / 2, H - 15, 10, W / 2, H - 15, 170)
    shadowGrad.addColorStop(0, rgba(COLORS.GOLD, 0.04 + lv.kick * 0.08))
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = shadowGrad
    ctx.fillRect(0, 0, W, H)

    // ── Ride cymbal (top right) ────────────────────────────────────────
    drawCymbal(ctx, 628, 105, 72, 16, 18, lv.ride, COLORS.SILVER)

    // ── Crash cymbal (top left) ────────────────────────────────────────
    drawCymbal(ctx, 168, 100, 66, 14, -22, lv.crash, COLORS.SILVER)

    // ── Hi-hat (left) ─────────────────────────────────────────────────
    drawHiHat(ctx, 192, 185, lv.hihat)

    // ── Tom 1 (high, center-left) ──────────────────────────────────────
    drawDrum(ctx, 318, 225, 48, lv.tom1)

    // ── Tom 2 (center-right) ──────────────────────────────────────────
    drawDrum(ctx, 492, 232, 54, lv.tom2)

    // ── Snare (left of center) ────────────────────────────────────────
    drawDrum(ctx, 258, 298, 62, lv.snare)

    // ── Floor tom (right) ─────────────────────────────────────────────
    drawDrum(ctx, 572, 318, 68, lv.floor)

    // ── Kick drum (bottom center) ─────────────────────────────────────
    drawKick(ctx, W / 2, H - 55, 148, 48, lv.kick)

    // ── Hardware sticks / stands (minimal) ───────────────────────────
    // Crash stand
    ctx.beginPath()
    ctx.moveTo(168, 114); ctx.lineTo(168, H - 55)
    ctx.strokeStyle = rgba(COLORS.SILVER, 0.05)
    ctx.lineWidth   = 1.5; ctx.stroke()

    // Ride stand
    ctx.beginPath()
    ctx.moveTo(628, 121); ctx.lineTo(628, H - 55)
    ctx.strokeStyle = rgba(COLORS.SILVER, 0.05)
    ctx.lineWidth   = 1.5; ctx.stroke()

    // ── Idle label ────────────────────────────────────────────────────
    if (!isPlaying) {
      ctx.fillStyle = rgba(COLORS.SILVER, 0.14)
      ctx.font      = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '0.3em'
      ctx.fillText('PLAY THE TRACK TO ACTIVATE', W / 2, H - 12)
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
        width={W}
        height={H}
        className="w-full block"
        style={{ maxHeight: 420 }}
        aria-label="Ghost Drums — audio-reactive drum kit visualizer"
      />
    </div>
  )
}
