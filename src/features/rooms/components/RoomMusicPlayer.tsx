'use client'

import { useState, useEffect } from 'react'
import { useAudio } from '@/context/AudioContext'
import type { MockTrack } from '../types'
import type { Track } from '@/lib/types'

interface RoomMusicPlayerProps {
  track: MockTrack
  accentClass: string
}

function formatSeconds(s: number): string {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function parseDuration(dur: string): number {
  const parts = dur.split(':').map(Number)
  return (parts[0] || 0) * 60 + (parts[1] || 0)
}

// Minimal cast so AudioContext can play the track from its audioUrl
function toFakeTrack(t: MockTrack): Track {
  return {
    id: t.id,
    slug: t.id,
    title: t.title,
    filename: t.id,
    audioUrl: t.audioUrl!,
    albumSlug: t.albumSlug ?? 'main',
  } as unknown as Track
}

export default function RoomMusicPlayer({ track, accentClass }: RoomMusicPlayerProps) {
  const audio      = useAudio()
  const hasReal    = !!track.audioUrl
  const [mockElapsed, setMockElapsed] = useState(37)
  const totalMock  = parseDuration(track.duration)

  // Mock timer for rooms without real audio
  useEffect(() => {
    if (hasReal) return
    const id = setInterval(() => setMockElapsed((p) => (p + 1) % (totalMock || 263)), 1000)
    return () => clearInterval(id)
  }, [hasReal, totalMock])

  const isThisTrack = hasReal && audio.currentTrack?.id === track.id
  const elapsed     = isThisTrack ? Math.floor(audio.currentTime)   : (hasReal ? 0     : mockElapsed)
  const totalSec    = isThisTrack && audio.duration > 0 ? audio.duration : (totalMock || 263)
  const isRoomPlaying = isThisTrack && audio.isPlaying
  const progress    = (elapsed / totalSec) * 100

  function handlePlayPause() {
    if (!hasReal) return
    if (isRoomPlaying) {
      audio.pause()
    } else {
      audio.play(toFakeTrack(track))
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    if (!hasReal || !isThisTrack) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    audio.seek(pct * totalSec)
  }

  return (
    <div className={`nr-player nr-player--${accentClass}`}>
      <div className="nr-player-label">Now playing in this room</div>
      <div className="nr-player-track">
        <div className="nr-player-title">{track.title}</div>
        <div className="nr-player-artist">{track.artist} · {track.albumName}</div>
      </div>

      {hasReal && (
        <button
          className={`nr-player-play-btn${isRoomPlaying ? ' nr-player-play-btn--playing' : ''}`}
          onClick={handlePlayPause}
          aria-label={isRoomPlaying ? 'Pause' : 'Play'}
        >
          {isRoomPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <rect x="2" y="2" width="4" height="10" rx="1"/>
              <rect x="8" y="2" width="4" height="10" rx="1"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <path d="M3 2l9 5-9 5V2z"/>
            </svg>
          )}
        </button>
      )}

      <div
        className="nr-player-progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalSec}
        aria-valuenow={elapsed}
        aria-label="Track progress"
        onClick={handleSeek}
        style={{ cursor: hasReal ? 'pointer' : 'default' }}
      >
        <div className="nr-player-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="nr-player-times">
        <span>{formatSeconds(elapsed)}</span>
        <span>{track.duration === '???' ? '—' : track.duration}</span>
      </div>

      <div className="nr-player-sync-notice">
        <span className={`nr-player-sync-dot${isRoomPlaying ? ' nr-player-sync-dot--active' : ''}`} aria-hidden="true" />
        {isRoomPlaying ? 'Playing live · you hear this together' : 'Synced with room · all listeners hear this together'}
      </div>
    </div>
  )
}
