'use client'

import { useAudio } from '@/context/AudioContext'
import { formatDuration } from '@/lib/formatters'
import type { Track } from '@/lib/types'

function Equalizer({ isPlaying }: { isPlaying: boolean }) {
  if (!isPlaying) return (
    <div className="flex items-end gap-0.5 h-4 w-4">
      {[3, 5, 4, 5, 3].map((h, i) => (
        <div key={i} className="w-0.5 bg-noir-gold/40 rounded-full" style={{ height: `${h * 3}px` }} />
      ))}
    </div>
  )

  return (
    <div className="flex items-end gap-0.5 h-4 w-4">
      {(['animate-equalizer-1','animate-equalizer-2','animate-equalizer-3','animate-equalizer-4','animate-equalizer-5']).map((cls, i) => (
        <div
          key={i}
          className={`w-0.5 bg-noir-gold rounded-full ${cls}`}
          style={{ animationDelay: `${i * 0.07}s` }}
        />
      ))}
    </div>
  )
}

function TrackCover({ track, size = 'md' }: { track: Track; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-20 h-20' }[size]
  const artUrl = track.songArtUrl ?? track.coverArt

  if (artUrl) {
    return (
      <div className={`${sizeClass} flex-shrink-0 relative overflow-hidden border border-noir-silver/10`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    )
  }

  const gradients = [
    'from-[#0D1B2A] to-[#1B3A4B]',
    'from-[#1B3A4B] to-[#0D1625]',
    'from-[#0D1625] to-[#2C4A5E]',
    'from-[#080810] to-[#1B3A4B]',
  ]
  const grad = gradients[(track.trackNumber ?? 0) % gradients.length]

  return (
    <div className={`${sizeClass} flex-shrink-0 relative bg-gradient-to-br ${grad} flex items-center justify-center border border-noir-silver/10`}>
      <span className="font-heading text-noir-gold/50 text-xs font-light tracking-wider">
        {track.trackNumber ? String(track.trackNumber).padStart(2, '0') : '◆'}
      </span>
    </div>
  )
}

export { TrackCover }

interface TrackCardProps {
  track: Track
  playlist: Track[]
  index: number
  variant?: 'list' | 'grid'
}

export default function TrackCard({ track, playlist, index, variant = 'list' }: TrackCardProps) {
  const { currentTrack, isPlaying, play, pause, toggle } = useAudio()
  const isCurrent = currentTrack?.id === track.id

  const handleClick = () => {
    if (isCurrent) {
      toggle()
    } else {
      play(track, playlist)
    }
  }

  if (variant === 'grid') {
    return (
      <div
        className={`group relative cursor-pointer transition-all duration-300 ${
          isCurrent ? 'ring-1 ring-noir-gold/40' : 'hover:ring-1 hover:ring-noir-silver/20'
        }`}
        onClick={handleClick}
      >
        <div className="aspect-square relative bg-gradient-to-br from-noir-navy to-noir-atlantic flex items-center justify-center overflow-hidden">
          {track.songArtUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.songArtUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-noir-deep/80 to-noir-atlantic/80" />
              <div className="relative text-center px-4">
                <span className="font-heading text-4xl text-noir-gold/30 block">
                  {track.trackNumber ? String(track.trackNumber).padStart(2, '0') : '◆'}
                </span>
              </div>
            </>
          )}

          {/* Play overlay */}
          <div className={`absolute inset-0 flex items-center justify-center bg-noir-void/60 transition-opacity duration-300 ${
            isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {isCurrent && isPlaying ? (
              <div className="flex gap-1.5">
                <div className="w-1 bg-noir-gold rounded-full animate-equalizer-1 h-8" />
                <div className="w-1 bg-noir-gold rounded-full animate-equalizer-2 h-8" />
                <div className="w-1 bg-noir-gold rounded-full animate-equalizer-3 h-8" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full border border-noir-gold/60 flex items-center justify-center bg-noir-void/40">
                <svg className="w-5 h-5 text-noir-gold ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-noir-deep/80">
          <p className={`font-body text-sm truncate ${isCurrent ? 'text-noir-gold' : 'text-noir-ivory'}`}>
            {track.title}
          </p>
          <p className="font-body text-xs text-noir-silver/50 mt-0.5 flex items-center justify-between">
            <span>{track.format}</span>
            <span>{track.durationFormatted}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3 cursor-pointer transition-all duration-200 border-b border-transparent ${
        isCurrent
          ? 'bg-noir-gold/5 border-b-noir-gold/20'
          : 'hover:bg-noir-silver/5'
      }`}
      onClick={handleClick}
    >
      {/* Track number / play state */}
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {isCurrent ? (
          <Equalizer isPlaying={isPlaying} />
        ) : (
          <>
            <span className={`font-body text-sm text-noir-silver/40 group-hover:hidden ${isCurrent ? 'hidden' : ''}`}>
              {index + 1}
            </span>
            <svg className="w-4 h-4 text-noir-silver hidden group-hover:block" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </>
        )}
      </div>

      {/* Cover */}
      <TrackCover track={track} size="sm" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-body text-sm truncate ${isCurrent ? 'text-noir-gold' : 'text-noir-ivory group-hover:text-noir-ivory/90'}`}>
          {track.title}
        </p>
        <p className="font-body text-xs text-noir-silver/40 truncate">
          {track.artist || 'NoiraCiel'} {track.album ? `· ${track.album}` : ''}
        </p>
      </div>

      {/* Format badge */}
      <span className="hidden sm:inline font-body text-[10px] tracking-wider text-noir-silver/30 border border-noir-silver/15 px-2 py-0.5 flex-shrink-0">
        {track.format}
      </span>

      {/* Duration */}
      <span className="font-body text-xs text-noir-silver/50 flex-shrink-0 w-10 text-right">
        {track.durationFormatted}
      </span>
    </div>
  )
}
