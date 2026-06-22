'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAudio } from '@/context/AudioContext'
import { useAudioAnalysis } from '../useAudioAnalysis'
import { getBandEnergy } from '../ghostPerformanceTypes'
import type { GhostPerformanceMeta } from '@/lib/types'

const CinematicPianoRoll = dynamic(() => import('./CinematicPianoRoll'), { ssr: false })
const CinematicStrings   = dynamic(() => import('./CinematicStrings'),   { ssr: false })
const CinematicGuitar    = dynamic(() => import('./CinematicGuitar'),    { ssr: false })
const CinematicBass      = dynamic(() => import('./CinematicBass'),      { ssr: false })
const CinematicDrums     = dynamic(() => import('./CinematicDrums'),     { ssr: false })

export type InstrumentId = 'piano' | 'strings' | 'guitar' | 'bass' | 'drums' | 'orchestra' | 'choir' | 'synth' | 'energy'

export interface GhostTrack {
  id: string
  albumSlug?: string | null
  ghostPerformance?: GhostPerformanceMeta
  title?: string
}

const ALBUM_COMBOS: Record<string, InstrumentId[]> = {
  'main':                ['guitar', 'strings'],
  'jazz-sessions':       ['piano', 'strings'],
  'blind-angel':         ['guitar', 'strings'],
  'the-velvet-machine':  ['piano', 'strings'],
  'still-we-sail':       ['strings', 'guitar'],
  'whats-youre-made-of': ['strings', 'piano'],
  'the-sacred-drift':    ['strings', 'guitar'],
  'funk-my-way-in':      ['piano', 'bass'],
  'reggae-sessions':     ['guitar', 'bass'],
  'world-musics':        ['strings', 'piano'],
  'the-life-lessons':    ['guitar', 'strings'],
}

const INSTRUMENT_DISPLAY: Record<InstrumentId, string> = {
  piano: 'Piano', strings: 'Strings', guitar: 'Guitar', bass: 'Bass', drums: 'Drums',
  orchestra: 'Orchestra', choir: 'Choir', synth: 'Synth', energy: 'Energy',
}

interface Props { track: GhostTrack }

// G15: beat detection hook
function useBeat(): boolean {
  const { getFrequencyData, isPlaying } = useAudioAnalysis()
  const [isBeat, setIsBeat] = useState(false)
  const lastBeatRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!isPlaying) { setIsBeat(false); return }
    const check = () => {
      const freq = getFrequencyData()
      if (freq) {
        const sub = getBandEnergy(freq, 30, 80)
        const now = Date.now()
        if (sub > 0.55 && now - lastBeatRef.current > 200) {
          lastBeatRef.current = now
          setIsBeat(true)
          setTimeout(() => setIsBeat(false), 100)
        }
      }
      rafRef.current = requestAnimationFrame(check)
    }
    rafRef.current = requestAnimationFrame(check)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, getFrequencyData])

  return isBeat
}

function InstrumentPanel({ id, trackId }: { id: InstrumentId; trackId: string }) {
  if (id === 'piano'  || id === 'synth'  || id === 'energy')    return <CinematicPianoRoll key={trackId} />
  if (id === 'strings'|| id === 'orchestra' || id === 'choir')  return <CinematicStrings   key={trackId} />
  if (id === 'guitar')  return <CinematicGuitar key={trackId} />
  if (id === 'bass')    return <CinematicBass   key={trackId} />
  if (id === 'drums')   return <CinematicDrums  key={trackId} />
  return <CinematicStrings key={trackId} />
}

// ── Waveform strip ─────────────────────────────────────────────────────────────

function WaveformStrip() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const { getWaveformData, isPlaying } = useAudioAnalysis()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
    const ctx = canvas.getContext('2d')
    if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    if (isPlaying) {
      const data = getWaveformData()
      if (data && data.length > 0) {
        const step = W / data.length
        ctx.beginPath()
        for (let i = 0; i < data.length; i++) {
          const x = i * step
          const y = (0.5 + data[i] * 0.5) * H
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = 'rgba(196,149,58,0.28)'
        ctx.lineWidth = 1; ctx.stroke()
      }
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [getWaveformData, isPlaying])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={28}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 28, pointerEvents: 'none', zIndex: 5 }}
      aria-hidden="true"
    />
  )
}

// ── Chord overlay ──────────────────────────────────────────────────────────────

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const CHORD_TEMPLATES = [
  { name: '',     intervals: [0, 4, 7] },
  { name: 'm',    intervals: [0, 3, 7] },
  { name: '7',    intervals: [0, 4, 7, 10] },
  { name: 'maj7', intervals: [0, 4, 7, 11] },
  { name: 'm7',   intervals: [0, 3, 7, 10] },
  { name: 'sus2', intervals: [0, 2, 7] },
  { name: 'sus4', intervals: [0, 5, 7] },
  { name: 'dim',  intervals: [0, 3, 6] },
  { name: 'aug',  intervals: [0, 4, 8] },
]

function detectChord(data: Uint8Array): string | null {
  const HZ_PER_BIN = 48000 / 2048
  const pc = new Float32Array(12)
  for (let i = 4; i < 90; i++) {
    const energy = data[i] / 255
    if (energy < 0.15) continue
    const hz = i * HZ_PER_BIN
    const midi = 69 + 12 * Math.log2(hz / 440)
    const pitchClass = ((Math.round(midi) % 12) + 12) % 12
    pc[pitchClass] += energy
  }
  let maxE = 0
  for (let i = 0; i < 12; i++) if (pc[i] > maxE) maxE = pc[i]
  if (maxE < 0.4) return null

  let root = 0
  for (let i = 1; i < 12; i++) if (pc[i] > pc[root]) root = i

  const active = new Set<number>()
  for (let i = 0; i < 12; i++) {
    if (pc[i] / maxE > 0.42) active.add((i - root + 12) % 12)
  }

  for (const tpl of CHORD_TEMPLATES) {
    if (tpl.intervals.every((iv) => active.has(iv))) return `${NOTE_NAMES[root]}${tpl.name}`
  }
  return null
}

function ChordOverlay() {
  const [chord, setChord]     = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const prevRef = useRef<string | null>(null)
  const { getFrequencyData, isPlaying } = useAudioAnalysis()
  const { currentTrack } = useAudio()

  useEffect(() => {
    if (!isPlaying) { setVisible(false); return }
    const id = setInterval(() => {
      const data = getFrequencyData()
      if (!data) return
      const detected = detectChord(data)
      if (detected !== prevRef.current) {
        prevRef.current = detected
        if (detected) { setChord(detected); setVisible(true) }
        else setVisible(false)
      }
    }, 450)
    return () => clearInterval(id)
  }, [isPlaying, getFrequencyData])

  if (!chord) return null

  // G94: show song key below chord name
  const songKey = currentTrack?.songKey

  return (
    <div
      style={{ position: 'absolute', bottom: 44, left: 12, zIndex: 6, opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <span style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '10px', letterSpacing: '0.20em', color: 'rgba(196,149,58,0.52)', textTransform: 'uppercase', display: 'block' }}>
        {chord}
      </span>
      {songKey && (
        <span style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '7px', letterSpacing: '0.18em', color: 'rgba(196,149,58,0.32)', textTransform: 'uppercase', display: 'block', marginTop: '1px' }}>
          Key: {songKey}
        </span>
      )}
    </div>
  )
}

// ── Main stage ─────────────────────────────────────────────────────────────────

export default function GhostStage({ track }: Props) {
  const { isPlaying, currentTrack } = useAudio()
  const isActive    = isPlaying && currentTrack?.id === track.id
  const isBeat      = useBeat()
  const [isMinimal, setIsMinimal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  // G92: recording state
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  function startRecording() {
    const container = containerRef.current
    if (!container) return
    const canvas = container.querySelector('canvas')
    if (!canvas || !('captureStream' in canvas)) return
    const stream = (canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }).captureStream(30)
    const mr = new MediaRecorder(stream, { mimeType: 'video/webm' })
    chunksRef.current = []
    mr.ondataavailable = e => chunksRef.current.push(e.data)
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `ghost-${track.slug ?? 'performance'}.webm`; a.click()
      URL.revokeObjectURL(url)
      setRecording(false)
    }
    mr.start()
    recorderRef.current = mr
    setRecording(true)
    setTimeout(() => { if (mr.state === 'recording') mr.stop() }, 30000) // max 30s
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  // G17: ghost hour — midnight palette shift
  const isGhostHour = typeof window !== 'undefined' && new Date().getHours() === 0

  // G93: first listen badge
  const [isFirstListen, setIsFirstListen] = useState(false)
  useEffect(() => {
    const key = `nr-gp-seen-${track.id}`
    if (!localStorage.getItem(key)) {
      setIsFirstListen(true)
      localStorage.setItem(key, '1')
      setTimeout(() => setIsFirstListen(false), 4000)
    }
  }, [track.id])

  // Per-track instrument override from ghostPerformance metadata
  let combo: InstrumentId[] = ALBUM_COMBOS[track.albumSlug ?? 'main'] ?? ['guitar', 'strings']
  const gp = track.ghostPerformance
  if (gp?.enabled && gp.primaryInstrument) {
    const primary = gp.primaryInstrument as InstrumentId
    const seconds = (gp.secondaryInstruments ?? []) as InstrumentId[]
    combo = seconds.length > 0 ? [primary, ...seconds] : [primary, combo[1] ?? 'strings']
  }
  const count = combo.length

  function flexFor(_id: InstrumentId, idx: number): number {
    if (count === 1) return 1
    if (count === 3) return 1
    return idx === 0 ? 3 : 2
  }

  // G12: screenshot
  function handleScreenshot() {
    const container = containerRef.current
    if (!container) return
    const canvases = Array.from(container.querySelectorAll('canvas'))
    const rect = container.getBoundingClientRect()
    const out = document.createElement('canvas')
    out.width  = Math.round(rect.width)
    out.height = Math.round(rect.height)
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#07070f'
    ctx.fillRect(0, 0, out.width, out.height)
    for (const c of canvases) {
      const cr = c.getBoundingClientRect()
      ctx.drawImage(c, cr.left - rect.left, cr.top - rect.top, cr.width, cr.height)
    }
    const a = document.createElement('a')
    a.href     = out.toDataURL('image/png')
    a.download = `ghost-${track.albumSlug ?? 'performance'}-${Date.now()}.png`
    a.click()
  }

  const trackTitle = isActive ? (currentTrack?.title ?? track.title) : track.title
  const albumName  = isActive ? (currentTrack?.album ?? track.albumSlug) : track.albumSlug

  return (
    <>
      <style>{`
        @keyframes gp-live-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1.0; }
        }
        @keyframes gp-label-pulse {
          0%, 100% { color: rgba(196,149,58,0.38); }
          50%       { color: rgba(196,149,58,0.70); }
        }
        @keyframes gp-divider-pulse {
          0%, 100% { background: rgba(196,149,58,0.06); }
          50%       { background: rgba(196,149,58,0.22); }
        }
        @keyframes gp-panel-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes gp-ghost-pulse {
          0%, 100% { border-color: rgba(180,30,30,0.25); }
          50%       { border-color: rgba(180,30,30,0.65); }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'relative', width: '100%', minHeight: 320,
          background: '#07070f', overflow: 'hidden',
          // G17: ghost hour — subtle crimson border
          border: isGhostHour ? '1px solid rgba(180,30,30,0.30)' : undefined,
          animation: isGhostHour ? 'gp-ghost-pulse 3s ease-in-out infinite' : undefined,
        }}
      >
        {/* Waveform strip */}
        {isActive && <WaveformStrip />}

        {/* G11: Track header bar */}
        {trackTitle && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'linear-gradient(to bottom, rgba(4,4,10,0.72) 0%, transparent 100%)',
            // G15: header border flashes on beat
            borderBottom: isActive && isBeat ? '1px solid rgba(196,149,58,0.55)' : '1px solid transparent',
            transition: 'border-color 0.08s ease',
            pointerEvents: 'none',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.75)' }}>
                {trackTitle}
              </span>
              {albumName && (
                <span style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '7px', letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(184,197,208,0.35)' }}>
                  {albumName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* LIVE dot */}
        {isActive && (
          <div style={{ position: 'absolute', top: 10, right: 12, zIndex: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isGhostHour ? 'rgba(220,50,50,0.9)' : 'rgba(196,149,58,0.9)',
              boxShadow: `0 0 6px 2px ${isGhostHour ? 'rgba(220,50,50,0.45)' : 'rgba(196,149,58,0.45)'}`,
              animation: 'gp-live-pulse 1.4s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '7px', letterSpacing: '0.35em', textTransform: 'uppercase', color: isGhostHour ? 'rgba(220,50,50,0.65)' : 'rgba(196,149,58,0.55)' }}>
              {isGhostHour ? 'Ghost Hour' : 'Live'}
            </span>
          </div>
        )}

        {/* G93: First listen badge */}
        {isFirstListen && (
          <div style={{ position: 'absolute', top: 36, right: 12, zIndex: 10, padding: '3px 8px', background: 'rgba(196,149,58,0.12)', border: '1px solid rgba(196,149,58,0.35)', fontFamily: 'var(--font-body, sans-serif)', fontSize: '7px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.75)', animation: 'gp-panel-fade 0.4s ease' }}>
            First Listen
          </div>
        )}

        {/* G13: Minimal mode + screenshot controls */}
        <div style={{ position: 'absolute', top: 8, left: 10, zIndex: 12, display: 'flex', gap: 6 }}>
          <button
            onClick={() => setIsMinimal((v) => !v)}
            title={isMinimal ? 'Show labels' : 'Minimal mode'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(184,197,208,0.2)', padding: '2px', lineHeight: 1, fontSize: '9px', letterSpacing: '0.1em', fontFamily: 'var(--font-body, sans-serif)' }}
          >
            {isMinimal ? '⊞' : '⊟'}
          </button>
          <button
            onClick={handleScreenshot}
            title="Screenshot"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(184,197,208,0.2)', padding: '2px', lineHeight: 1, fontSize: '10px' }}
          >
            ⎙
          </button>
          {/* G92: record/export */}
          <button
            onClick={recording ? stopRecording : startRecording}
            title={recording ? 'Stop recording' : 'Record WebM'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: recording ? 'rgba(220,50,50,0.7)' : 'rgba(184,197,208,0.2)', padding: '2px', lineHeight: 1, fontSize: '9px', fontFamily: 'var(--font-body, sans-serif)', letterSpacing: '0.05em' }}
          >
            {recording ? '◼' : '●'}
          </button>
        </div>

        {/* G14: Instrument panels with fade-in on track change */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
          {combo.map((id, idx) => (
            <div
              key={`${track.id}-${id}-${idx}`}
              style={{
                flex: flexFor(id, idx), position: 'relative', minWidth: 0,
                animation: 'gp-panel-fade 0.2s ease',
              }}
            >
              {idx > 0 && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, zIndex: 1,
                  animation: isActive ? 'gp-divider-pulse 2.2s ease-in-out infinite' : undefined,
                  background: isActive ? undefined : 'rgba(196,149,58,0.06)',
                }} />
              )}
              <InstrumentPanel id={id} trackId={track.id} />
            </div>
          ))}
        </div>

        {/* Chord overlay — hidden in minimal mode */}
        {isActive && !isMinimal && <ChordOverlay />}

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(4,4,10,0.55) 100%)' }} />

        {/* CRT scanlines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.038) 0px, rgba(0,0,0,0.038) 1px, transparent 1px, transparent 3px)' }} />

        {/* G17: Ghost hour red tint overlay */}
        {isGhostHour && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4, background: 'rgba(80,0,0,0.08)' }} />
        )}

        {/* Instrument labels — hidden in minimal mode */}
        {!isMinimal && (
          <div style={{
            position: 'relative', zIndex: 4,
            display: 'flex', flexDirection: 'row',
            borderTop: '1px solid rgba(196,149,58,0.06)',
            paddingTop: 7, paddingBottom: 7, paddingLeft: 16, paddingRight: 48,
            gap: 14, alignItems: 'center', justifyContent: 'center',
          }}>
            {combo.map((id, idx) => (
              <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {idx > 0 && (
                  <span className="font-body" style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(196,149,58,0.22)' }}>·</span>
                )}
                <span
                  className="font-body"
                  style={{
                    fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase',
                    animation: isActive ? 'gp-label-pulse 2.8s ease-in-out infinite' : undefined,
                    color: isActive ? undefined : 'rgba(196,149,58,0.38)',
                    animationDelay: `${idx * 0.4}s`,
                  }}
                >
                  {INSTRUMENT_DISPLAY[id]}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
