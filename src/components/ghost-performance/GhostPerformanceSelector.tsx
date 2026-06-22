'use client'

// GhostPerformanceSelector resolves which visualizer and input mode to use
// for a given track, and renders a small mode badge for the UI.

import { resolveVisualizer, resolveInputMode, INSTRUMENT_LABELS, rgba, COLORS } from './ghostPerformanceTypes'
import type { GhostPerformanceMeta, GhostInstrument } from '@/lib/types'

export { resolveVisualizer, resolveInputMode }

const INPUT_MODE_LABELS = {
  midi:  'MIDI · Exact',
  stems: 'Stem · Precise',
  audio: 'Audio Reactive',
} as const

const INSTRUMENT_ICONS: Record<GhostInstrument, string> = {
  piano:    '♩',
  guitar:   '♪',
  drums:    '◈',
  bass:     '♫',
  strings:  '〰',
  orchestra:'◇',
  synth:    '⊞',
  choir:    '◎',
  energy:   '◉',
}

interface Props {
  meta: GhostPerformanceMeta | undefined
  className?: string
}

export default function GhostPerformanceSelector({ meta, className = '' }: Props) {
  const visualizer = resolveVisualizer(meta)
  const inputMode  = resolveInputMode(meta)
  const label      = INSTRUMENT_LABELS[visualizer]
  const icon       = INSTRUMENT_ICONS[visualizer]
  const modeLabel  = INPUT_MODE_LABELS[inputMode]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Visualizer badge */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1"
        style={{
          border: '1px solid rgba(196,149,58,0.2)',
          background: 'rgba(196,149,58,0.04)',
        }}
      >
        <span className="text-base" style={{ color: 'rgba(196,149,58,0.7)', lineHeight: 1 }}>
          {icon}
        </span>
        <span className="font-body text-[9px] tracking-[0.25em] uppercase" style={{ color: 'rgba(196,149,58,0.7)' }}>
          {label}
        </span>
      </div>

      {/* Input mode badge */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1"
        style={{
          border: `1px solid ${inputMode === 'audio' ? 'rgba(30,90,160,0.25)' : 'rgba(196,149,58,0.35)'}`,
          background: inputMode === 'audio' ? 'rgba(30,90,160,0.04)' : 'rgba(196,149,58,0.06)',
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: inputMode === 'audio' ? 'rgba(30,90,160,0.7)' : '#C4953A' }}
        />
        <span
          className="font-body text-[9px] tracking-[0.2em] uppercase"
          style={{ color: inputMode === 'audio' ? 'rgba(30,90,160,0.8)' : 'rgba(196,149,58,0.8)' }}
        >
          {modeLabel}
        </span>
      </div>
    </div>
  )
}
