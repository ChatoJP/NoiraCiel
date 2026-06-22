'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioMidiSync } from './useAudioMidiSync'
import { extractBands, smooth, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; opacity: number; life: number; maxLife: number
}

interface BassRing {
  radius: number; maxRadius: number; opacity: number
}

const CANVAS_W = 800
const CANVAS_H = 420

function initParticles(count: number, W: number, H: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: W * 0.5 + (Math.random() - 0.5) * W * 0.6,
    y: H * 0.5 + (Math.random() - 0.5) * H * 0.6,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -Math.random() * 0.5 - 0.1,
    size: Math.random() * 1.8 + 0.4,
    opacity: Math.random() * 0.4 + 0.1,
    life: Math.random() * 200,
    maxLife: 180 + Math.random() * 120,
  }))
}

function spawnParticle(W: number, H: number, energy: number): Particle {
  const angle = Math.random() * Math.PI * 2
  const dist  = Math.random() * 40 * energy
  return {
    x: W * 0.5 + Math.cos(angle) * dist,
    y: H * 0.5 + Math.sin(angle) * dist,
    vx: Math.cos(angle) * (0.3 + energy * 1.2),
    vy: Math.sin(angle) * (0.3 + energy * 1.2) - 0.4,
    size: 0.8 + energy * 2.5,
    opacity: 0.6 + energy * 0.4,
    life: 0,
    maxLife: 80 + Math.random() * 80,
  }
}

export default function GhostEnergy({ meta }: { meta?: GhostPerformanceMeta }) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const rafRef      = useRef<number>(0)
  const particles   = useRef<Particle[]>([])
  const bassRings   = useRef<BassRing[]>([])
  const prevBass    = useRef(0)
  const smoothed    = useRef({ bass: 0, mid: 0, high: 0, overall: 0, presence: 0 })
  const frameRef    = useRef(0)

  const { getFrequencyData, getWaveformData, isPlaying, isActive } = useAudioMidiSync(meta)

  // Init particles once
  useEffect(() => {
    particles.current = initParticles(45, CANVAS_W, CANVAS_H)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W  = CANVAS_W
    const H  = CANVAS_H
    const cx = W / 2
    const cy = H / 2

    frameRef.current++

    const freqData = isPlaying ? getFrequencyData() : null
    const waveData = isPlaying ? getWaveformData() : null

    const bands = freqData ? extractBands(freqData) : null
    const s     = smoothed.current

    s.bass     = smooth(s.bass,     bands?.bass    ?? 0, 0.4, 0.1)
    s.mid      = smooth(s.mid,      bands?.mid     ?? 0, 0.35, 0.1)
    s.high     = smooth(s.high,     bands?.high    ?? 0, 0.45, 0.08)
    s.overall  = smooth(s.overall,  bands?.overall ?? 0, 0.35, 0.1)
    s.presence = smooth(s.presence, bands?.presence ?? 0, 0.4, 0.08)

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = COLORS.VOID
    ctx.fillRect(0, 0, W, H)

    // Atmospheric vignette
    const vigGrad = ctx.createRadialGradient(cx, cy, H * 0.2, cx, cy, H * 0.85)
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)')
    vigGrad.addColorStop(1, 'rgba(4,4,10,0.7)')
    ctx.fillStyle = vigGrad
    ctx.fillRect(0, 0, W, H)

    const INNER_R  = Math.min(W, H) * 0.17
    const MAX_BAR  = Math.min(W, H) * 0.21

    // ── Circular frequency spectrum ───────────────────────────────────
    if (freqData) {
      const BARS = 128
      for (let i = 0; i < BARS; i++) {
        const angle    = (i / BARS) * Math.PI * 2 - Math.PI / 2
        const binIdx   = Math.floor((i / BARS) * (freqData.length * 0.6))
        const value    = freqData[binIdx] / 255
        if (value < 0.04) continue
        const barLen   = value * MAX_BAR

        const x1 = cx + Math.cos(angle) * INNER_R
        const y1 = cy + Math.sin(angle) * INNER_R
        const x2 = cx + Math.cos(angle) * (INNER_R + barLen)
        const y2 = cy + Math.sin(angle) * (INNER_R + barLen)

        // Interpolate: bass (low i) → gold, highs (high i) → silver-blue
        const t  = i / BARS
        const r  = Math.round(COLORS.GOLD.r + (COLORS.SILVER.r - COLORS.GOLD.r) * t)
        const g  = Math.round(COLORS.GOLD.g + (COLORS.SILVER.g - COLORS.GOLD.g) * t)
        const b  = Math.round(COLORS.GOLD.b + (COLORS.SILVER.b - COLORS.GOLD.b) * t)
        const al = 0.3 + value * 0.65

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = `rgba(${r},${g},${b},${al})`
        ctx.lineWidth   = 1.5
        ctx.stroke()
      }
    } else {
      // Idle state: subtle static ring
      const dormantAlpha = 0.06 + Math.sin(frameRef.current * 0.025) * 0.02
      ctx.beginPath()
      ctx.arc(cx, cy, INNER_R, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(COLORS.GOLD, dormantAlpha)
      ctx.lineWidth   = 1
      ctx.stroke()
    }

    // ── Bass rings ─────────────────────────────────────────────────────
    const bassNow = s.bass
    if (bassNow > 0.45 && prevBass.current < 0.45 && bassRings.current.length < 8) {
      bassRings.current.push({ radius: INNER_R * 0.9, maxRadius: H * 0.55, opacity: 0.6 + bassNow * 0.3 })
    }
    prevBass.current = bassNow

    for (let i = bassRings.current.length - 1; i >= 0; i--) {
      const ring = bassRings.current[i]
      ring.radius  += 3.5 + s.bass * 2
      ring.opacity *= 0.94
      if (ring.opacity < 0.01 || ring.radius >= ring.maxRadius) {
        bassRings.current.splice(i, 1)
        continue
      }
      const progress = ring.radius / ring.maxRadius
      ctx.beginPath()
      ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(COLORS.GOLD, ring.opacity * (1 - progress * 0.8))
      ctx.lineWidth   = 1.5
      ctx.stroke()
    }

    // ── Outer atmospheric glow ─────────────────────────────────────────
    const atmosGrad = ctx.createRadialGradient(cx, cy, INNER_R, cx, cy, INNER_R * 4)
    atmosGrad.addColorStop(0, rgba(COLORS.GOLD, s.bass * 0.12))
    atmosGrad.addColorStop(0.5, rgba(COLORS.BLUE, s.high * 0.06))
    atmosGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, INNER_R * 4, 0, Math.PI * 2)
    ctx.fillStyle = atmosGrad
    ctx.fill()

    // ── Central orb ───────────────────────────────────────────────────
    const orbR      = INNER_R * (0.45 + s.overall * 0.55)
    const goldMix   = s.bass / (s.bass + s.presence + 0.001)

    // Outer glow bloom
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR * 3.5)
    glowGrad.addColorStop(0, rgba(COLORS.GOLD, goldMix * s.overall * 0.25))
    glowGrad.addColorStop(0.4, rgba(COLORS.BLUE, (1 - goldMix) * s.overall * 0.1))
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, orbR * 3.5, 0, Math.PI * 2)
    ctx.fillStyle = glowGrad
    ctx.fill()

    // Core orb
    const orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR)
    orbGrad.addColorStop(0, `rgba(255,255,255,${0.08 + s.overall * 0.38})`)
    orbGrad.addColorStop(0.35, rgba(COLORS.GOLD, 0.2 + s.bass * 0.55))
    orbGrad.addColorStop(0.75, rgba(COLORS.BLUE, 0.05 + s.mid * 0.2))
    orbGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
    ctx.fillStyle = orbGrad
    ctx.fill()

    // ── Waveform spine ────────────────────────────────────────────────
    if (waveData && waveData.length > 0) {
      ctx.beginPath()
      const step = W / waveData.length
      for (let i = 0; i < waveData.length; i++) {
        const x = i * step
        const y = cy + waveData[i] * H * 0.09
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = rgba(COLORS.SILVER, 0.10 + s.overall * 0.08)
      ctx.lineWidth   = 0.8
      ctx.stroke()
    } else {
      // Static idle waveform
      ctx.beginPath()
      for (let x = 0; x < W; x++) {
        const idle = Math.sin(x * 0.02 + frameRef.current * 0.02) * 3
        if (x === 0) ctx.moveTo(x, cy + idle)
        else ctx.lineTo(x, cy + idle)
      }
      ctx.strokeStyle = rgba(COLORS.SILVER, 0.04)
      ctx.lineWidth   = 0.8
      ctx.stroke()
    }

    // ── Particles ─────────────────────────────────────────────────────
    const showParticles = meta?.showParticles !== false
    if (showParticles) {
      // Spawn new particles on energy bursts
      if (bands?.transient && Math.random() < 0.4) {
        particles.current.push(spawnParticle(W, H, s.overall))
      } else if (s.overall > 0.15 && Math.random() < 0.08) {
        particles.current.push(spawnParticle(W, H, s.overall * 0.5))
      }

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.x    += p.vx
        p.y    += p.vy
        p.life += 1
        const progress = p.life / p.maxLife
        const alpha    = p.opacity * (1 - progress) * (isPlaying ? 1 : 0.3)

        if (alpha < 0.01 || p.life >= p.maxLife) {
          // Recycle into a drifting idle particle
          const ip = particles.current[i]
          ip.x      = W * 0.5 + (Math.random() - 0.5) * W * 0.55
          ip.y      = H * 0.5 + (Math.random() - 0.5) * H * 0.55
          ip.vx     = (Math.random() - 0.5) * 0.3
          ip.vy     = -Math.random() * 0.3 - 0.05
          ip.size   = Math.random() * 1.5 + 0.3
          ip.opacity = Math.random() * 0.25 + 0.05
          ip.life   = 0
          ip.maxLife = 200 + Math.random() * 160
          continue
        }

        const useBlue = p.vy > 0 || progress > 0.5
        const color   = useBlue ? COLORS.BLUE : COLORS.GOLD

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = rgba(color, alpha)
        ctx.fill()
      }
    }

    // ── Idle label ────────────────────────────────────────────────────
    if (!isPlaying && !isActive.current) {
      ctx.fillStyle = rgba(COLORS.SILVER, 0.18)
      ctx.font      = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '0.3em'
      ctx.fillText('PLAY THE TRACK TO ACTIVATE', cx, H - 24)
      ctx.letterSpacing = '0'
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [getFrequencyData, getWaveformData, isPlaying, isActive, meta])

  // Start / stop RAF with playback
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return (
    <div className="relative w-full" style={{ background: COLORS.VOID }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full block"
        style={{ display: 'block', maxHeight: 420 }}
        aria-label="Ghost Energy — audio-reactive visualizer"
      />
    </div>
  )
}
