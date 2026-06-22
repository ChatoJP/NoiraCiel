// renderGhostPerformance — Phase 2 offline render script (stub).
//
// Usage (Phase 2):
//   npx ts-node scripts/renderGhostPerformance.ts --slug=why --output=output/why-ghost.mp4
//
// The script will:
//   1. Load ghost performance config from public/ghost-performance/config.json
//   2. Run offline audio analysis → scripts/analyse-audio.ts → PreAnalysedFrame[]
//   3. Load MIDI data if midiPath is set
//   4. Bundle and render via @remotion/renderer
//   5. Upload to R2 / update music-videos.json

import type { GhostPerformanceVideoProps } from './ghostPerformanceSchema'

export async function renderGhostPerformance(
  _slug: string,
  _outputPath: string,
  _props: Partial<GhostPerformanceVideoProps> = {},
): Promise<void> {
  throw new Error('renderGhostPerformance is not yet implemented (Phase 2). See docs/GHOST_PERFORMANCE_ENGINE.md for the roadmap.')
}

// ─── Offline audio analysis (Phase 2) ────────────────────────────────────────
//
// Will use node-web-audio-api or ffmpeg + audiowaveform to extract per-frame
// frequency data offline, producing a PreAnalysedFrame[] array that the
// Remotion composition reads instead of a live AnalyserNode.
//
// Approximate pipeline:
//   audioFile → decode with music-metadata / ffmpeg
//   → Web Audio OfflineAudioContext (analyser per frame at 30fps)
//   → JSON array of { frequencies, waveform, bass, mid, high, ... }
//   → passed to GhostPerformanceComposition as analysedFrames prop
