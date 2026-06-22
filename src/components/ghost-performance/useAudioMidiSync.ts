'use client'

// Phase 2 — Unified sync layer.
//
// This hook resolves the best available data source (MIDI > stems > audio)
// and exposes a single interface to all visualizer components.
// In Phase 1 it simply wraps useAudioAnalysis (audio-reactive fallback).

import { useAudioAnalysis } from './useAudioAnalysis'
import type { GhostPerformanceMeta } from '@/lib/types'

export function useAudioMidiSync(meta: GhostPerformanceMeta | undefined) {
  const audio = useAudioAnalysis()

  // Future: if meta.midiPath → useMidiParser; if meta.stems → useStemAnalysis
  // Phase 1: always return audio-reactive data
  return {
    inputMode:       'audio' as const,
    getFrequencyData: audio.getFrequencyData,
    getWaveformData:  audio.getWaveformData,
    isActive:         audio.isActive,
    isPlaying:        audio.isPlaying,
    // Phase 2 additions (stubs):
    getActiveNotes:   () => [],
    stems:            {} as Record<string, never>,
  }
}
