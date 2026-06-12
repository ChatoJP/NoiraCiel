'use client'

import { useState, useEffect } from 'react'
import { useAudio } from '@/context/AudioContext'
import { formatDuration } from '@/lib/formatters'
import { TrackCover } from './TrackCard'

function ProgressBar() {
  const { currentTime, duration, seek } = useAudio()
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="relative group">
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
        className="w-full h-1 cursor-pointer"
        style={{
          background: `linear-gradient(to right, #C4953A ${pct}%, rgba(184,197,208,0.15) ${pct}%)`,
          borderRadius: 0,
        }}
      />
    </div>
  )
}

function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute } = useAudio()
  const displayVol = isMuted ? 0 : volume

  return (
    <div className="hidden lg:flex items-center gap-2 w-28">
      <button onClick={toggleMute} className="text-noir-silver/50 hover:text-noir-ivory transition-colors flex-shrink-0">
        {displayVol === 0 ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : displayVol < 0.5 ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={displayVol}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="flex-1"
        style={{
          background: `linear-gradient(to right, #C4953A ${displayVol * 100}%, rgba(184,197,208,0.15) ${displayVol * 100}%)`,
        }}
      />
    </div>
  )
}

export default function GlobalPlayer() {
  const {
    currentTrack, isPlaying, isLoading, isShuffled, repeatMode,
    currentTime, duration, toggle, next, prev, toggleShuffle, toggleRepeat,
  } = useAudio()

  const [expanded, setExpanded] = useState(false)

  if (!currentTrack) return null

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* Backdrop for expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-noir-void/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ${
          expanded ? 'bottom-0' : ''
        }`}
      >
        {/* Full player (expanded) */}
        {expanded && (
          <div className="bg-noir-deep/95 backdrop-blur-2xl border-t border-noir-silver/10 px-6 py-8 max-w-2xl mx-auto mb-0 rounded-t-2xl">
            {/* Close */}
            <button
              className="absolute top-4 right-6 text-noir-silver/40 hover:text-noir-ivory"
              onClick={() => setExpanded(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Track info large */}
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-40 h-40 mb-5 bg-gradient-to-br from-noir-navy to-noir-atlantic border border-noir-gold/20 flex items-center justify-center">
                <span className="font-heading text-5xl text-noir-gold/30">
                  {currentTrack.trackNumber ? String(currentTrack.trackNumber).padStart(2, '0') : '◆'}
                </span>
              </div>
              <h3 className="font-heading text-2xl text-noir-ivory tracking-wide">{currentTrack.title}</h3>
              <p className="font-body text-sm text-noir-silver/50 mt-1">{currentTrack.artist || 'NoiraCiel'}</p>
            </div>

            {/* Progress */}
            <div className="mb-2">
              <ProgressBar />
            </div>
            <div className="flex justify-between font-body text-xs text-noir-silver/40 mb-6">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${isShuffled ? 'text-noir-gold' : 'text-noir-silver/40 hover:text-noir-silver'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                </svg>
              </button>

              <button onClick={prev} className="text-noir-silver/60 hover:text-noir-ivory transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={toggle}
                className="w-14 h-14 rounded-full border border-noir-gold/60 bg-noir-gold/10 flex items-center justify-center hover:bg-noir-gold/20 transition-all text-noir-gold"
              >
                {isLoading ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button onClick={next} className="text-noir-silver/60 hover:text-noir-ivory transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              <button
                onClick={toggleRepeat}
                className={`transition-colors ${repeatMode !== 'none' ? 'text-noir-gold' : 'text-noir-silver/40 hover:text-noir-silver'}`}
              >
                {repeatMode === 'one' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v5zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mini bar */}
        <div className="glass border-t border-noir-silver/10">
          {/* Progress line */}
          <div className="w-full h-0.5 bg-noir-silver/10">
            <div className="h-full bg-gradient-to-r from-noir-gold to-noir-gold-light transition-none" style={{ width: `${pct}%` }} />
          </div>

          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            {/* Cover + info */}
            <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setExpanded(!expanded)}>
              <TrackCover track={currentTrack} size="sm" />
              <div className="min-w-0">
                <p className="font-body text-sm text-noir-ivory truncate">{currentTrack.title}</p>
                <p className="font-body text-xs text-noir-silver/50 truncate">{currentTrack.artist || 'NoiraCiel'}</p>
              </div>
            </button>

            {/* Center controls */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={prev} className="hidden sm:block text-noir-silver/50 hover:text-noir-ivory transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={toggle}
                className="w-9 h-9 rounded-full border border-noir-gold/60 bg-noir-gold/10 flex items-center justify-center hover:bg-noir-gold/20 transition-all text-noir-gold"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button onClick={next} className="hidden sm:block text-noir-silver/50 hover:text-noir-ivory transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>

            {/* Time + Volume */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <span className="font-body text-xs text-noir-silver/40 w-20 text-right">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
              <VolumeControl />
            </div>

            {/* Expand button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-noir-silver/40 hover:text-noir-ivory transition-colors flex-shrink-0"
            >
              <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
