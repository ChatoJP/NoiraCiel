// Detailed types for the Ghost Performance Engine used by visualizer components.
// The core GhostPerformanceMeta and GhostInstrument types live in src/lib/types.ts
// since they are part of the Track data model.

export type { GhostPerformanceMeta, GhostInstrument } from '@/lib/types'

// ─── Color palettes ───────────────────────────────────────────────────────────

export const COLORS = {
  GOLD:   { r: 196, g: 149, b: 58  },
  BLUE:   { r: 30,  g: 90,  b: 160 },
  SILVER: { r: 184, g: 197, b: 208 },
  IVORY:  { r: 242, g: 237, b: 227 },
  VOID:   '#080810',
} as const

export type RGB = { r: number; g: number; b: number }

export function rgba(c: RGB, a: number): string {
  return `rgba(${c.r},${c.g},${c.b},${a})`
}

// ─── Frequency bands ──────────────────────────────────────────────────────────

export interface FrequencyBands {
  subBass:  number   // 20–60 Hz  (0–1)
  bass:     number   // 60–250 Hz (0–1)
  lowMid:   number   // 250–500 Hz
  mid:      number   // 500–2000 Hz
  highMid:  number   // 2000–4000 Hz
  high:     number   // 4000–8000 Hz
  presence: number   // 8000–16000 Hz
  overall:  number   // full-spectrum RMS
  transient: boolean // true when energy spikes sharply
  peak:     number   // peak single-bin energy (0–1)
}

// ─── Shared visualizer props ──────────────────────────────────────────────────

export interface GhostVisualizerProps {
  // Injected by GhostPerformanceEngine
  getFrequencyData: () => Uint8Array | null
  getWaveformData:  () => Float32Array | null
  isPlaying: boolean
  // Future Remotion: currentFrame and fps replace the RAF loop
  currentFrame?: number
  fps?: number
}

// ─── Utility: frequency → band energy ────────────────────────────────────────

// Assumes analyser FFT size 2048 at 48kHz sample rate, matching AudioContext.tsx
const HZ_PER_BUCKET = 48000 / 2048

function hzToBucket(hz: number): number {
  return Math.round(hz / HZ_PER_BUCKET)
}

export function getBandEnergy(data: Uint8Array, hzLo: number, hzHi: number): number {
  const lo = Math.max(0, hzToBucket(hzLo))
  const hi = Math.min(data.length - 1, hzToBucket(hzHi))
  if (lo >= hi) return 0
  let sum = 0
  for (let i = lo; i <= hi; i++) sum += data[i]
  return sum / ((hi - lo + 1) * 255)
}

export function extractBands(data: Uint8Array): FrequencyBands {
  const subBass  = getBandEnergy(data, 20, 60)
  const bass     = getBandEnergy(data, 60, 250)
  const lowMid   = getBandEnergy(data, 250, 500)
  const mid      = getBandEnergy(data, 500, 2000)
  const highMid  = getBandEnergy(data, 2000, 4000)
  const high     = getBandEnergy(data, 4000, 8000)
  const presence = getBandEnergy(data, 8000, 16000)

  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i]
  const overall = sum / (data.length * 255)

  let maxVal = 0
  for (let i = 0; i < data.length; i++) if (data[i] > maxVal) maxVal = data[i]
  const peak = maxVal / 255

  const transient = overall > 0.55 && peak > 0.75

  return { subBass, bass, lowMid, mid, highMid, high, presence, overall, transient, peak }
}

// ─── Inertia smoother ─────────────────────────────────────────────────────────

export function smooth(current: number, target: number, rise = 0.35, fall = 0.12): number {
  return target > current
    ? current + (target - current) * rise
    : current + (target - current) * fall
}

// ─── Resolved mode for a track ───────────────────────────────────────────────

import type { GhostInstrument, GhostPerformanceMeta } from '@/lib/types'

export function resolveVisualizer(meta: GhostPerformanceMeta | undefined): GhostInstrument {
  if (!meta || !meta.enabled) return 'guitar'
  if (meta.mode !== 'auto') return meta.mode as GhostInstrument
  return meta.primaryInstrument
}

export function resolveInputMode(meta: GhostPerformanceMeta | undefined): 'midi' | 'stems' | 'audio' {
  if (!meta) return 'audio'
  const priority = meta.inputPriority ?? ['midi', 'stems', 'audio']
  // Phase 1: MIDI and stems not yet implemented; always fall back to audio
  if (meta.midiPath) return 'midi'   // reserved — will activate when useMidiParser is complete
  if (meta.stems && Object.keys(meta.stems).length > 0) return 'stems' // reserved for useStemAnalysis
  return 'audio'
}

// Instrumental label for the mode badge
export const INSTRUMENT_LABELS: Record<GhostInstrument, string> = {
  piano:    'Ghost Piano',
  guitar:   'Ghost Guitar',
  drums:    'Ghost Drums',
  bass:     'Ghost Bass',
  strings:  'Ghost Strings',
  orchestra:'Ghost Orchestra',
  synth:    'Ghost Synth',
  choir:    'Ghost Choir',
  energy:   'Ghost Energy',
}
