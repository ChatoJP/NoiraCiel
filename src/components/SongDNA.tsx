'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAudio } from '@/context/AudioContext'

// ─── Instrument frequency bands (Hz ranges → FFT bucket mapping at 48kHz, 2048 FFT) ──
// FFT resolution = sampleRate / fftSize = 48000 / 2048 ≈ 23.4 Hz per bucket
const HZ_PER_BUCKET = 48000 / 2048

const INSTRUMENTS = [
  {
    id:    'drums',
    label: 'Drums',
    icon:  '🥁',
    hzLo:  30,
    hzHi:  120,
    color: '#C4953A',
    // Sub-bass kick + snare body
  },
  {
    id:    'bass',
    label: 'Bass',
    icon:  '🎸',
    hzLo:  80,
    hzHi:  320,
    color: '#9B7A2E',
  },
  {
    id:    'piano',
    label: 'Piano',
    icon:  '🎹',
    hzLo:  260,
    hzHi:  1800,
    color: '#D4A84B',
  },
  {
    id:    'guitar',
    label: 'Guitar',
    icon:  '🎸',
    hzLo:  180,
    hzHi:  2400,
    color: '#B8902A',
  },
  {
    id:    'vocals',
    label: 'Vocals',
    icon:  '🎤',
    hzLo:  300,
    hzHi:  4000,
    color: '#E8C86A',
  },
  {
    id:    'sax',
    label: 'Saxophone',
    icon:  '🎷',
    hzLo:  200,
    hzHi:  3500,
    color: '#C4953A',
  },
  {
    id:    'hihat',
    label: 'Hi-Hat',
    icon:  '🥁',
    hzLo:  5000,
    hzHi:  12000,
    color: '#8B6914',
  },
] as const

function hzToBucket(hz: number) {
  return Math.round(hz / HZ_PER_BUCKET)
}

function getBandEnergy(data: Uint8Array<ArrayBuffer>, hzLo: number, hzHi: number): number {
  const lo  = Math.max(0, hzToBucket(hzLo))
  const hi  = Math.min(data.length - 1, hzToBucket(hzHi))
  if (lo >= hi) return 0
  let sum = 0
  for (let i = lo; i <= hi; i++) sum += data[i]
  return sum / ((hi - lo + 1) * 255) // 0–1
}

// ─── Smooth value with inertia ──────────────────────────────────────────────
function smooth(current: number, target: number, rise: number, fall: number) {
  return target > current
    ? current + (target - current) * rise
    : current + (target - current) * fall
}

interface Props {
  className?: string
}

export default function SongDNA({ className = '' }: Props) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const rafRef         = useRef<number>(0)
  const levelsRef      = useRef<number[]>(INSTRUMENTS.map(() => 0))
  const analyserRef    = useRef<AnalyserNode | null>(null)
  const dataRef        = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const [active, setActive] = useState(false)

  const { isPlaying, currentTrack, getAnalyser } = useAudio()

  // Initialize analyser once when playback starts
  useEffect(() => {
    if (!isPlaying) return
    if (analyserRef.current) return
    const a = getAnalyser()
    if (!a) return
    analyserRef.current = a
    dataRef.current = new Uint8Array(a.frequencyBinCount) as Uint8Array<ArrayBuffer>
    setActive(true)
  }, [isPlaying, getAnalyser])

  const draw = useCallback(() => {
    const canvas   = canvasRef.current
    const analyser = analyserRef.current
    const data     = dataRef.current
    if (!canvas || !analyser || !data) return

    analyser.getByteFrequencyData(data)

    const ctx    = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height

    // Clear
    ctx.clearRect(0, 0, W, H)

    const count  = INSTRUMENTS.length
    const barW   = Math.floor(W / count)
    const levels = levelsRef.current
    const safeData = data as Uint8Array<ArrayBuffer>

    for (let i = 0; i < count; i++) {
      const inst   = INSTRUMENTS[i]
      const target = getBandEnergy(safeData, inst.hzLo, inst.hzHi)
      const prev   = levels[i]
      const level  = smooth(prev, target, 0.4, 0.12)
      levels[i]    = level

      const x      = i * barW
      const barH   = Math.floor(level * H * 0.9)
      const y      = H - barH

      // Background column
      ctx.fillStyle = 'rgba(255,255,255,0.02)'
      ctx.fillRect(x + 1, 0, barW - 2, H)

      if (barH < 2) continue

      // Gradient bar
      const grad = ctx.createLinearGradient(0, H, 0, y)
      grad.addColorStop(0,   `${inst.color}cc`)
      grad.addColorStop(0.6, `${inst.color}88`)
      grad.addColorStop(1,   `${inst.color}22`)
      ctx.fillStyle = grad
      ctx.fillRect(x + 2, y, barW - 4, barH)

      // Glow on top
      if (level > 0.15) {
        ctx.fillStyle = `${inst.color}44`
        ctx.fillRect(x + 1, y - 2, barW - 2, 3)
      }

      // Peak dot
      ctx.fillStyle = inst.color
      ctx.fillRect(x + 4, y, barW - 8, 2)
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    if (!active) return
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, draw])

  // Stop loop when paused but keep analyser alive for resume
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current)
    } else if (active) {
      rafRef.current = requestAnimationFrame(draw)
    }
  }, [isPlaying, active, draw])

  if (!currentTrack) return null

  return (
    <div className={`mt-12 border-t border-noir-silver/10 pt-8 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="font-body text-[10px] tracking-[0.35em] text-noir-gold/50 uppercase mb-1">
            Song DNA
          </p>
          <p className="font-body text-[9px] text-noir-silver/25 italic">
            Live frequency analysis · instrument activity
          </p>
        </div>
        {!active && (
          <p className="font-body text-[9px] text-noir-silver/30 italic">
            Play the track to activate
          </p>
        )}
      </div>

      {/* Canvas visualisation */}
      <div className="relative w-full" style={{ height: 120 }}>
        <canvas
          ref={canvasRef}
          width={700}
          height={120}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-3">
              {INSTRUMENTS.map((inst) => (
                <div
                  key={inst.id}
                  className="flex flex-col items-center gap-1"
                  style={{ width: `${100 / INSTRUMENTS.length}%` }}
                >
                  <div
                    className="rounded-sm"
                    style={{
                      width: '60%',
                      height: 40,
                      background: `${inst.color}18`,
                      border: `1px solid ${inst.color}22`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instrument labels */}
      <div className="flex mt-2">
        {INSTRUMENTS.map((inst, i) => (
          <div
            key={inst.id}
            className="flex flex-col items-center gap-0.5"
            style={{ width: `${100 / INSTRUMENTS.length}%` }}
          >
            <span className="text-xs" style={{ opacity: active ? 1 : 0.3 }}>
              {inst.icon}
            </span>
            <span
              className="font-body text-[7px] tracking-[0.1em] uppercase text-center leading-tight hidden sm:block"
              style={{ color: inst.color, opacity: active ? 0.8 : 0.25 }}
            >
              {inst.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
