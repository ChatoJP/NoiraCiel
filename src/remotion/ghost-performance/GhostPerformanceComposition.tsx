// Ghost Performance Remotion Composition — Phase 2 (stub).
//
// This component will replace the live useAudioMidiSync hook with
// frame-indexed reads from pre-analysed audio data arrays.
// The visualizer components accept optional currentFrame + fps props
// so they work in both live web and offline Remotion render contexts.

import React from 'react'
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from 'remotion'
import type { GhostPerformanceVideoProps } from './ghostPerformanceSchema'
import type { PreAnalysedFrame } from './ghostPerformanceSchema'

// Phase 2: import visualizers here and pass frame data instead of live analyser

function getFrameData(
  frames: PreAnalysedFrame[],
  currentFrame: number,
  fps: number,
): PreAnalysedFrame | null {
  const idx = currentFrame  // 1:1 if analysed at same fps
  return frames[idx] ?? null
}

export function GhostPerformanceComposition(props: GhostPerformanceVideoProps) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const frameData = getFrameData(props.analysedFrames, frame, fps)
  const progress  = frame / durationInFrames

  // ── Intro overlay ──────────────────────────────────────────────────
  const introFrames = props.showIntro ? Math.round(props.introSec * fps) : 0
  const outroFrames = props.showOutro ? Math.round(props.outroSec * fps) : 0
  const isIntro     = frame < introFrames
  const isOutro     = frame > durationInFrames - outroFrames

  const introAlpha  = isIntro ? 1 - frame / introFrames : 0
  const outroAlpha  = isOutro ? (frame - (durationInFrames - outroFrames)) / outroFrames : 0

  return (
    <AbsoluteFill style={{ background: '#080810' }}>
      {/* Audio */}
      {props.audioPath && (
        <Audio src={props.audioPath} />
      )}

      {/*
        Phase 2 TODO: Mount the correct ghost visualizer component here,
        passing frameData instead of a live analyser hook.
        Example:
          <GhostEnergy
            frameData={frameData}
            currentFrame={frame}
            fps={fps}
            meta={props.ghostMeta}
          />
      */}

      {/* Placeholder canvas until Phase 2 */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <p style={{ fontFamily: 'serif', fontSize: 24, color: 'rgba(196,149,58,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          Ghost Performance
        </p>
        <p style={{ fontFamily: 'sans-serif', fontSize: 13, color: 'rgba(184,197,208,0.3)', letterSpacing: '0.2em' }}>
          {props.trackTitle}
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(184,197,208,0.18)' }}>
          Remotion render — Phase 2 not yet implemented
        </p>
      </AbsoluteFill>

      {/* Intro fade */}
      {isIntro && (
        <AbsoluteFill style={{ background: `rgba(8,8,16,${introAlpha})`, pointerEvents: 'none' }}>
          {introAlpha > 0.5 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <p style={{ fontFamily: 'serif', fontSize: 18, color: `rgba(196,149,58,${1 - introAlpha * 2})`, letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                NoiraCiel
              </p>
              <p style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 28, color: `rgba(242,237,227,${1 - introAlpha * 2})` }}>
                {props.trackTitle}
              </p>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* Outro fade */}
      {isOutro && (
        <AbsoluteFill style={{ background: `rgba(8,8,16,${outroAlpha})`, pointerEvents: 'none' }} />
      )}
    </AbsoluteFill>
  )
}
