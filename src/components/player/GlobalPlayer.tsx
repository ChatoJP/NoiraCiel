'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useAudio } from '@/context/AudioContext'
import { formatDuration } from '@/lib/formatters'
import { TrackCover } from './TrackCard'

const TurntablePlayer = lazy(() => import('./TurntablePlayer'))

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
          background: `linear-gradient(to right, rgb(var(--t-accent-rgb)) ${pct}%, rgba(184,197,208,0.15) ${pct}%)`,
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
          background: `linear-gradient(to right, rgb(var(--t-accent-rgb)) ${displayVol * 100}%, rgba(184,197,208,0.15) ${displayVol * 100}%)`,
        }}
      />
    </div>
  )
}

// G81: session listening history (last 5 songs)
const SESSION_HISTORY_KEY = 'nr-session-history'

function pushHistory(title: string, slug: string) {
  try {
    const prev: { title: string; slug: string }[] = JSON.parse(sessionStorage.getItem(SESSION_HISTORY_KEY) || '[]')
    const filtered = prev.filter(e => e.slug !== slug)
    const next = [{ title, slug }, ...filtered].slice(0, 5)
    sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(next))
  } catch { /* SSR / blocked */ }
}

function useSessionHistory() {
  const [history, setHistory] = useState<{ title: string; slug: string }[]>([])
  useEffect(() => {
    try {
      setHistory(JSON.parse(sessionStorage.getItem(SESSION_HISTORY_KEY) || '[]'))
    } catch { /* blocked */ }
  }, [])
  return history
}

// ── Keyboard shortcut overlay ─────────────────────────────────────────────────

function ShortcutOverlay({ onClose }: { onClose: () => void }) {
  const SHORTCUTS = [
    ['Space',  'Play / Pause'],
    ['←',      'Seek back 10 seconds'],
    ['→',      'Seek forward 10 seconds'],
    ['M',      'Toggle mute'],
    ['?',      'Show / hide shortcuts'],
  ]
  const history = useSessionHistory()
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-noir-void/80 backdrop-blur-sm" />
      <div
        className="relative glass border border-noir-silver/10 p-8 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-lg text-noir-ivory mb-6 tracking-wide">
          Keyboard Shortcuts
        </h2>
        <div className="space-y-3">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="font-body text-xs text-noir-silver/60">{desc}</span>
              <kbd className="font-body text-xs px-2 py-1 bg-noir-silver/10 text-noir-ivory border border-noir-silver/20 flex-shrink-0 min-w-[2rem] text-center">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        {/* G81: recent history */}
        {history.length > 0 && (
          <div className="mt-6 pt-5 border-t border-noir-silver/10">
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/30 mb-3">Recently played</p>
            {history.map(h => (
              <p key={h.slug} className="font-body text-xs text-noir-silver/50 truncate py-0.5">{h.title}</p>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full font-body text-xs tracking-[0.2em] uppercase text-noir-silver/40 hover:text-noir-ivory transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// G78: liked songs hook
function useLiked(slug: string | undefined) {
  const key = slug ? `nr-liked-${slug}` : null
  const [liked, setLiked] = useState(false)
  useEffect(() => {
    if (key) setLiked(!!localStorage.getItem(key))
  }, [key])
  const toggle = () => {
    if (!key) return
    const next = !liked
    if (next) localStorage.setItem(key, '1')
    else localStorage.removeItem(key)
    setLiked(next)
  }
  return [liked, toggle] as const
}

export default function GlobalPlayer() {
  const {
    currentTrack, isPlaying, isLoading,
    currentTime, duration,
    toggle, next, prev, toggleMute, seek,
    playlist, currentIndex,
  } = useAudio()

  const [expanded, setExpanded]         = useState(false)
  const [showShortcuts, setShortcuts]   = useState(false)
  const [mobileSheet, setMobileSheet]   = useState(false)
  const prevSlugRef = useRef<string | null>(null)
  const touchStartRef = useRef<number | null>(null)
  const [liked, toggleLike] = useLiked(currentTrack?.slug)

  // Auto-open turntable whenever a new track starts; G81: push to session history
  useEffect(() => {
    if (currentTrack && currentTrack.slug !== prevSlugRef.current) {
      prevSlugRef.current = currentTrack.slug
      setExpanded(true)
      pushHistory(currentTrack.title, currentTrack.slug)
    }
  }, [currentTrack?.slug])

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentTrack) return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === ' ')            { e.preventDefault(); toggle() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); seek(Math.min(duration, currentTime + 10)) }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); seek(Math.max(0, currentTime - 10)) }
      else if (e.key === 'm' || e.key === 'M') toggleMute()
      else if (e.key === '?') setShortcuts((v) => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentTrack, toggle, next, prev, toggleMute, seek, currentTime, duration])

  if (!currentTrack) return null

  const pct      = duration > 0 ? (currentTime / duration) * 100 : 0
  const nextTrack = playlist[currentIndex + 1] ?? null
  // SVG ring — TrackCover sm = w-10 h-10 = 40px, viewBox 44 gives 2px padding
  const C = 125.66 // 2π × 20
  const ringOffset = C * (1 - pct / 100)

  return (
    <>
      {/* Prefetch next track audio */}
      {nextTrack && (
        <link rel="prefetch" href={nextTrack.audioUrl} as="audio" />
      )}

      {/* Keyboard shortcut overlay */}
      {showShortcuts && <ShortcutOverlay onClose={() => setShortcuts(false)} />}

      {/* Floating "now playing" pill — top-right, desktop only, appears while playing */}
      {isPlaying && !expanded && (
        <div
          className="fixed top-20 right-4 z-[199] hidden md:flex items-center gap-2 px-3 py-1.5"
          style={{
            background: 'rgba(4,4,10,0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(196,149,58,0.18)',
            maxWidth: '230px',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: 'rgb(var(--t-accent-rgb))',
              boxShadow: '0 0 5px rgb(var(--t-accent-rgb))',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <p className="font-body text-xs text-noir-ivory truncate flex-1">{currentTrack.title}</p>
          <button
            onClick={toggle}
            className="text-noir-silver/50 hover:text-noir-ivory flex-shrink-0 transition-colors"
            aria-label="Pause"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        </div>
      )}

      {/* Turntable overlay */}
      {expanded && (
        <Suspense fallback={null}>
          <TurntablePlayer onClose={() => setExpanded(false)} />
        </Suspense>
      )}

      {/* G86: Mobile bottom sheet for track info */}
      {mobileSheet && currentTrack && (
        <div className="fixed inset-0 z-[250] sm:hidden flex items-end" onClick={() => setMobileSheet(false)}>
          <div className="absolute inset-0 bg-noir-void/70 backdrop-blur-sm" />
          <div
            className="relative w-full glass border-t border-noir-silver/15 p-6 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-8 h-0.5 bg-noir-silver/30 mx-auto mb-5 rounded-full" />
            <p className="font-heading italic text-xl text-noir-ivory mb-1">{currentTrack.title}</p>
            <p className="font-body text-xs text-noir-silver/50 mb-4">{currentTrack.album || 'NoiraCiel'}</p>
            {currentTrack.bpm && <p className="font-body text-xs text-noir-gold/50 mb-1">{currentTrack.bpm} BPM</p>}
            {currentTrack.songKey && <p className="font-body text-xs text-noir-gold/50 mb-3">Key: {currentTrack.songKey}</p>}
            <ProgressBar />
            <div className="flex justify-center gap-8 mt-5">
              <button onClick={prev} className="text-noir-silver/60 hover:text-noir-ivory">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              <button onClick={toggle} className="w-12 h-12 rounded-full border border-t-accent/60 bg-t-accent/10 flex items-center justify-center text-t-accent">
                {isPlaying
                  ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  : <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                }
              </button>
              <button onClick={next} className="text-noir-silver/60 hover:text-noir-ivory">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini bar — always on top */}
      <div className="fixed bottom-0 left-0 right-0 z-[200]">
        {/* Thin progress line */}
        <div className="w-full h-0.5 bg-noir-silver/10">
          <div className="h-full transition-none" style={{ width: `${pct}%`, background: 'rgb(var(--t-accent-rgb))' }} />
        </div>

        {/* G87: swipe left/right on the mini bar to skip */}
        <div
          className="border-t border-noir-gold/10"
          style={{
            background: 'linear-gradient(180deg, rgba(8,8,16,0.78) 0%, rgba(4,4,10,0.94) 100%)',
            backdropFilter: 'blur(28px) saturate(1.1)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.1)',
            boxShadow: '0 -1px 0 rgba(196,149,58,0.06) inset, 0 -16px 40px rgba(0,0,0,0.35)',
          }}
          onTouchStart={(e) => { touchStartRef.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (touchStartRef.current === null) return
            const diff = e.changedTouches[0].clientX - touchStartRef.current
            if (Math.abs(diff) > 50) { diff < 0 ? next() : prev() }
            touchStartRef.current = null
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            {/* Cover with progress ring + info → opens turntable (desktop) or bottom sheet (mobile) */}
            <button
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
              onClick={() => {
                if (window.innerWidth < 640) setMobileSheet(v => !v)
                else setExpanded(true)
              }}
              title="Open player"
            >
              {/* Progress ring wrapper */}
              <div className="relative flex-shrink-0 w-10 h-10">
                <TrackCover track={currentTrack} size="sm" />
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 44 44"
                  aria-hidden="true"
                >
                  <circle
                    cx="22" cy="22" r="20"
                    fill="none"
                    stroke="rgb(var(--t-accent-rgb))"
                    strokeWidth="2"
                    strokeDasharray={C}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 22 22)"
                    style={{ opacity: 0.65, transition: 'stroke-dashoffset 0.4s linear' }}
                  />
                </svg>
              </div>

              {/* Track info — G10: album name instead of artist */}
              <div className="min-w-0">
                <p className="font-body text-sm text-noir-ivory truncate">{currentTrack.title}</p>
                <p className="font-body text-xs text-noir-silver/50 truncate">
                  {currentTrack.album || 'NoiraCiel'}
                </p>
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
                className="w-9 h-9 rounded-full border border-t-accent/60 bg-t-accent/10 flex items-center justify-center hover:bg-t-accent/20 transition-all text-t-accent"
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
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
              <span className="font-body text-xs text-noir-silver/40 tabular-nums hidden md:block">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
              <VolumeControl />
            </div>

            {/* Like + Shortcuts hint + expand chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* G78: heart/like button */}
              <button
                onClick={toggleLike}
                title={liked ? 'Remove from liked songs' : 'Like this song'}
                aria-label={liked ? 'Unlike' : 'Like'}
                className="hidden sm:block transition-colors"
                style={{ color: liked ? 'rgb(var(--t-accent-rgb))' : 'rgba(184,197,208,0.25)', fontSize: '14px', lineHeight: 1 }}
              >
                {liked ? '♥' : '♡'}
              </button>
              <button
                onClick={() => setShortcuts((v) => !v)}
                className="hidden md:block text-noir-silver/25 hover:text-noir-silver/60 transition-colors text-xs font-body"
                title="Keyboard shortcuts (?)"
              >
                ?
              </button>
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-noir-silver/40 hover:text-noir-ivory transition-colors"
                title={expanded ? 'Close player' : 'Open player'}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
