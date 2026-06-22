'use client'

import dynamic from 'next/dynamic'
import { useAudio } from '@/context/AudioContext'
import type { Track } from '@/lib/types'
import { THEMES, ALBUM_THEMES } from '@/lib/themes'
import MediaProvenanceBadge from '@/components/MediaProvenanceBadge'

const GhostStage = dynamic(() => import('./stage/GhostStage'), { ssr: false })

// G91: map album slug to a faint tinted background
function getAlbumBg(albumSlug: string | null | undefined): string {
  const themeName = albumSlug ? (ALBUM_THEMES[albumSlug] ?? 'dark-noir') : 'dark-noir'
  const [r, g, b] = THEMES[themeName].bgTintRgb.split(',').map(s => s.trim())
  return `rgb(${r},${g},${b})`
}

interface Props {
  track: Track
}

export default function GhostPerformanceTab({ track }: Props) {
  const { isPlaying, currentTrack, play, pause } = useAudio()
  const isThisTrack = currentTrack?.id === track.id
  const isActive    = isThisTrack && isPlaying

  function handlePlayPause() {
    if (isThisTrack) {
      if (isPlaying) pause()
      else play(track, [track])
    } else {
      play(track, [track])
    }
  }

  return (
    <div className="pt-6 pb-12">

      {/* ── Header bar ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p
            className="font-body text-[9px] tracking-[0.4em] uppercase mb-1"
            style={{ color: 'rgba(196,149,58,0.5)' }}
          >
            Ghost Performance
          </p>
          <p className="font-heading italic text-sm" style={{ color: 'rgba(242,237,227,0.5)' }}>
            {track.title}
          </p>
          <MediaProvenanceBadge type="algorithmic" className="mt-1 block" />
        </div>
      </div>

      {/* ── Stage canvas ── */}
      <div style={{ position: 'relative', border: '1px solid rgba(196,149,58,0.08)', background: getAlbumBg(track.albumSlug), overflow: 'hidden' }}>
        <GhostStage track={track} />

        {/* Play / pause overlay — fades out while playing */}
        <button
          onClick={handlePlayPause}
          aria-label={isActive ? 'Pause' : 'Play'}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            background: isActive ? 'transparent' : 'rgba(8,8,16,0.55)',
            backdropFilter: isActive ? 'none' : 'blur(2px)',
            cursor: 'pointer',
            border: 'none',
            transition: 'background 0.4s ease, opacity 0.4s ease',
            opacity: isActive ? 0 : 1,
            pointerEvents: isActive ? 'none' : 'auto',
          }}
        >
          {/* Circle button */}
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            border: '1.5px solid rgba(196,149,58,0.55)',
            background: 'rgba(196,149,58,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(196,149,58,0.18)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polygon points="6,3 21,12 6,21" fill="rgba(196,149,58,0.9)" />
            </svg>
          </div>
          <p style={{
            fontFamily: 'var(--font-body, sans-serif)',
            fontSize: '0.6rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'rgba(196,149,58,0.6)',
            margin: 0,
          }}>
            Play to activate
          </p>
        </button>

        {/* Pause strip — only while playing */}
        {isActive && (
          <button
            onClick={handlePlayPause}
            aria-label="Pause"
            style={{
              position: 'absolute',
              bottom: 12, right: 14,
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(8,8,16,0.55)',
              border: '1px solid rgba(196,149,58,0.18)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px 4px 8px',
              cursor: 'pointer',
            }}
          >
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <rect x="0" y="0" width="3" height="12" fill="rgba(196,149,58,0.7)" />
              <rect x="6" y="0" width="3" height="12" fill="rgba(196,149,58,0.7)" />
            </svg>
            <span style={{ fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', fontFamily: 'var(--font-body, sans-serif)' }}>
              Pause
            </span>
          </button>
        )}
      </div>

      {/* ── Caption ── */}
      <div className="mt-4">
        <p className="font-body text-[9px] tracking-[0.2em] uppercase mb-1.5"
           style={{ color: 'rgba(184,197,208,0.3)' }}>
          How it works
        </p>
        <p className="font-body text-xs leading-relaxed"
           style={{ color: 'rgba(184,197,208,0.35)' }}>
          Cinematic self-playing performance — keys press, strings vibrate, instruments respond to the live frequency spectrum.
        </p>
      </div>

    </div>
  )
}
