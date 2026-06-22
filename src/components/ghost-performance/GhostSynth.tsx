'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useAudioMidiSync } from './useAudioMidiSync'
import { extractBands, getBandEnergy, smooth, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

const CW = 800
const CH = 400

const STEPS = 16  // step sequencer columns

export default function GhostSynth({ meta }: { meta?: GhostPerformanceMeta }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number>(0)
  const smoothed   = useRef({ bass: 0, mid: 0, high: 0, overall: 0 })
  const stepLevels = useRef<number[]>(Array(STEPS).fill(0))
  const frame      = useRef(0)

  const { getFrequencyData, getWaveformData, isPlaying } = useAudioMidiSync(meta)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frame.current++
    const freq = isPlaying ? getFrequencyData() : null
    const wave = isPlaying ? getWaveformData()  : null
    const s    = smoothed.current
    const sl   = stepLevels.current

    if (freq) {
      const bands = extractBands(freq)
      s.bass    = smooth(s.bass,    bands.bass,    0.4,  0.1)
      s.mid     = smooth(s.mid,     bands.mid,     0.38, 0.1)
      s.high    = smooth(s.high,    bands.high,    0.45, 0.08)
      s.overall = smooth(s.overall, bands.overall, 0.35, 0.1)

      // Drive step sequencer lights with sub-band energies
      for (let i = 0; i < STEPS; i++) {
        const lo  = 40 + i * 480
        const hi  = lo + 500
        const raw = getBandEnergy(freq, lo, hi)
        sl[i] = smooth(sl[i], raw, 0.5, 0.12)
      }
    } else {
      s.bass *= 0.94; s.mid *= 0.94; s.high *= 0.94; s.overall *= 0.94
      for (let i = 0; i < STEPS; i++) sl[i] *= 0.94
    }

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = COLORS.VOID
    ctx.fillRect(0, 0, CW, CH)

    // Subtle scan-line effect (CRT aesthetic)
    for (let y = 0; y < CH; y += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, y, CW, 1)
    }

    // ── Oscilloscope panel (center) ────────────────────────────────────
    const osc = { x: 80, y: 50, w: CW - 160, h: 160 }
    ctx.fillStyle = 'rgba(4,8,16,0.9)'
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.2)
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.rect(osc.x, osc.y, osc.w, osc.h)
    ctx.fill()
    ctx.stroke()

    // Grid lines inside oscilloscope
    ctx.strokeStyle = rgba(COLORS.GOLD, 0.06)
    ctx.lineWidth   = 0.5
    for (let gx = 1; gx < 6; gx++) {
      const x = osc.x + (gx / 6) * osc.w
      ctx.beginPath(); ctx.moveTo(x, osc.y); ctx.lineTo(x, osc.y + osc.h); ctx.stroke()
    }
    for (let gy = 1; gy < 4; gy++) {
      const y = osc.y + (gy / 4) * osc.h
      ctx.beginPath(); ctx.moveTo(osc.x, y); ctx.lineTo(osc.x + osc.w, y); ctx.stroke()
    }

    // Oscilloscope waveform
    const oscMid = osc.y + osc.h / 2
    ctx.beginPath()
    if (wave && wave.length > 0) {
      const step = osc.w / wave.length
      for (let i = 0; i < wave.length; i++) {
        const x = osc.x + i * step
        const y = oscMid + wave[i] * (osc.h * 0.42)
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.7 + s.overall * 0.3)
      ctx.lineWidth   = 1.5
    } else {
      // Idle: simple sine
      for (let i = 0; i <= osc.w; i++) {
        const x  = osc.x + i
        const ph = frame.current * 0.04
        const y  = oscMid + Math.sin((i / osc.w) * Math.PI * 4 + ph) * 12
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.22)
      ctx.lineWidth   = 1.5
    }
    ctx.stroke()

    // Oscilloscope label
    ctx.fillStyle = rgba(COLORS.GOLD, 0.4)
    ctx.font      = '9px monospace'
    ctx.textAlign = 'left'
    ctx.letterSpacing = '0.15em'
    ctx.fillText('OSC · WAVEFORM', osc.x + 8, osc.y + 14)
    ctx.letterSpacing = '0'

    // ── Step sequencer ────────────────────────────────────────────────
    const seq   = { x: 80, y: 245, w: CW - 160, h: 60 }
    const padW  = (seq.w - STEPS + 1) / STEPS
    const padH  = seq.h

    for (let i = 0; i < STEPS; i++) {
      const sx    = seq.x + i * (padW + 1)
      const level = sl[i]
      const isOn  = level > 0.25

      ctx.fillStyle = isOn
        ? rgba(COLORS.GOLD, 0.15 + level * 0.5)
        : 'rgba(12,14,24,0.8)'
      ctx.beginPath()
      ctx.rect(sx, seq.y, padW, padH)
      ctx.fill()
      ctx.strokeStyle = rgba(COLORS.GOLD, isOn ? 0.5 + level * 0.4 : 0.1)
      ctx.lineWidth   = 1
      ctx.stroke()

      if (isOn && level > 0.3) {
        ctx.shadowColor = rgba(COLORS.GOLD, level)
        ctx.shadowBlur  = 8 * level
        ctx.strokeStyle = rgba(COLORS.GOLD, level * 0.8)
        ctx.lineWidth   = 1.5
        ctx.beginPath()
        ctx.rect(sx, seq.y, padW, padH)
        ctx.stroke()
        ctx.shadowBlur  = 0
        ctx.shadowColor = 'transparent'
      }
    }

    ctx.fillStyle = rgba(COLORS.GOLD, 0.35)
    ctx.font      = '9px monospace'
    ctx.textAlign = 'left'
    ctx.letterSpacing = '0.15em'
    ctx.fillText('SEQ · 16 STEPS', seq.x, seq.y - 10)
    ctx.letterSpacing = '0'

    // ── Frequency meters (left + right panels) ─────────────────────────
    const meterBands = [
      { label: 'SUB',  lo: 20,   hi: 60,   x: 20  },
      { label: 'BASS', lo: 60,   hi: 250,  x: 44  },
    ]
    const freqMeters = freq
      ? meterBands.map(b => ({ ...b, level: getBandEnergy(freq, b.lo, b.hi) }))
      : meterBands.map(b => ({ ...b, level: 0 }))

    freqMeters.forEach(({ label, level, x }) => {
      const mH = 200; const mW = 14; const mY = 50
      ctx.fillStyle = 'rgba(4,8,16,0.8)'
      ctx.strokeStyle = rgba(COLORS.GOLD, 0.15)
      ctx.lineWidth   = 1
      ctx.beginPath(); ctx.rect(x, mY, mW, mH); ctx.fill(); ctx.stroke()

      const fillH = level * mH
      const mGrad = ctx.createLinearGradient(x, mY + mH, x, mY + mH - fillH)
      mGrad.addColorStop(0, rgba(COLORS.GOLD, 0.7))
      mGrad.addColorStop(1, rgba(COLORS.BLUE, 0.5))
      ctx.fillStyle = mGrad
      ctx.fillRect(x + 2, mY + mH - fillH, mW - 4, fillH)

      ctx.fillStyle = rgba(COLORS.GOLD, 0.4)
      ctx.font      = '7px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(label, x + mW / 2, mY + mH + 12)
    })

    // ── Panel labels ──────────────────────────────────────────────────
    ctx.fillStyle = rgba(COLORS.GOLD, 0.18)
    ctx.font      = '10px monospace'
    ctx.textAlign = 'center'
    ctx.letterSpacing = '0.35em'
    ctx.fillText('GHOST SYNTH · AUDIO REACTIVE', CW / 2, CH - 14)
    ctx.letterSpacing = '0'

    if (!isPlaying) {
      ctx.fillStyle = rgba(COLORS.SILVER, 0.14)
      ctx.font      = '11px system-ui'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '0.3em'
      ctx.fillText('PLAY THE TRACK TO ACTIVATE', CW / 2, CH / 2 + 80)
      ctx.letterSpacing = '0'
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [getFrequencyData, getWaveformData, isPlaying, meta])

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
        style={{ maxHeight: 400 }}
        aria-label="Ghost Synth — audio-reactive synthesizer visualizer"
      />
    </div>
  )
}
