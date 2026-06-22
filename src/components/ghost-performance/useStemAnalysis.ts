'use client'

// Phase 2 — Stem-reactive mode.
//
// This hook loads separate audio stems (drums.wav, bass.wav, piano.wav, etc.)
// and creates an independent AnalyserNode for each stem so that each
// instrument visualizer reacts to its own stem rather than the full mix.
//
// Activation requires:
//   1. Stems uploaded to public/stems/{slug}/{instrument}.wav (or served via R2/CDN)
//   2. Stem paths set in the ghostPerformance.stems config for the track
//   3. Implementation of per-stem Web Audio routing in this hook

export interface StemAnalyser {
  name:            string
  getFrequencyData: () => Uint8Array | null
  getWaveformData:  () => Float32Array | null
  energy:          number  // 0–1 current RMS level
}

export interface UseStemAnalysisReturn {
  stems:    Record<string, StemAnalyser>
  isLoaded: boolean
  error:    string | null
}

export function useStemAnalysis(
  _stems: Record<string, string> | undefined,
  _isPlaying: boolean,
): UseStemAnalysisReturn {
  return {
    stems: {},
    isLoaded: false,
    error: null,
  }
}
