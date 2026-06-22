'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAudio } from '@/context/AudioContext'
import type { Track } from '@/lib/types'
import type { DiscographyEntry } from '@/lib/musicScanner'

interface AlbumSection {
  entry: DiscographyEntry
  tracks: Track[]
  totalDurationFormatted: string
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

function Equalizer() {
  return (
    <div className="flex items-end gap-[2px] h-4 w-4">
      {['animate-equalizer-1', 'animate-equalizer-2', 'animate-equalizer-3', 'animate-equalizer-4', 'animate-equalizer-5'].map((cls, i) => (
        <div key={i} className={`w-0.5 bg-noir-gold rounded-full ${cls}`} style={{ animationDelay: `${i * 0.07}s` }} />
      ))}
    </div>
  )
}

// ── Ambient room background ───────────────────────────────────────────────
// Uses the now-playing track's Film footage (musicVideoUrl) as a blurred,
// darkened backdrop when available; otherwise falls back to static art,
// then to a plain noir gradient. Never blocks render on the video loading,
// and never shows broken media — failures fall through silently.
function RoomBackdrop({ track }: { track: Track | null }) {
  const reducedMotion = usePrefersReducedMotion()
  const [videoFailed, setVideoFailed] = useState(false)
  const [artFailed, setArtFailed] = useState(false)

  useEffect(() => {
    setVideoFailed(false)
    setArtFailed(false)
  }, [track?.id])

  const artUrl = track?.songArtUrl ?? track?.coverArt ?? null
  const canUseVideo = !reducedMotion && !!track?.musicVideoUrl && !videoFailed

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-noir-black">
      {canUseVideo && (
        <video
          key={track!.musicVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-30 scale-110"
          style={{ filter: 'blur(60px) saturate(0.6) brightness(0.5)' }}
        >
          <source src={track!.musicVideoUrl!} type="video/mp4" />
        </video>
      )}

      {!canUseVideo && artUrl && !artFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artUrl}
          alt=""
          aria-hidden
          onError={() => setArtFailed(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110"
          style={{ filter: 'blur(70px) saturate(0.5) brightness(0.4)' }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(13,22,37,0.4) 0%, rgba(4,4,10,0.92) 65%, rgba(4,4,10,1) 100%)' }}
      />
      <div className="absolute inset-0 bg-noir-black/40" />
    </div>
  )
}

// ── Vinyl centerpiece ───────────────────────────────────────────────────────
function VinylCenterpiece({ track, isPlaying }: { track: Track | null; isPlaying: boolean }) {
  const [artFailed, setArtFailed] = useState(false)
  const artUrl = track?.songArtUrl ?? track?.coverArt ?? null

  useEffect(() => { setArtFailed(false) }, [track?.id])

  return (
    <div className="relative flex-shrink-0 mx-auto" style={{ width: 'clamp(160px, 30vw, 220px)', height: 'clamp(160px, 30vw, 220px)' }}>
      <div
        className="absolute inset-[6%] rounded-full"
        style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.85), 0 0 50px rgba(196,149,58,0.06)' }}
      />
      <div
        className="absolute inset-0 rounded-full nc-room-vinyl"
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
      >
        <svg viewBox="0 0 300 300" width="100%" height="100%">
          <defs>
            <radialGradient id="room-vb" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#1a1a24" />
              <stop offset="45%" stopColor="#0d0d14" />
              <stop offset="100%" stopColor="#070710" />
            </radialGradient>
            <radialGradient id="room-lo" cx="42%" cy="38%" r="65%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
            </radialGradient>
            <clipPath id="room-lc"><circle cx="150" cy="150" r="56" /></clipPath>
          </defs>
          <circle cx="150" cy="150" r="148" fill="url(#room-vb)" />
          {[143, 136, 129, 122, 115, 108, 101, 94, 87, 80, 73].map((r, i) => (
            <circle key={r} cx="150" cy="150" r={r} fill="none"
              stroke={i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.35)'}
              strokeWidth={i % 2 === 0 ? 1.3 : 0.7} />
          ))}
          <circle cx="150" cy="150" r="59" fill="#09090f" />
          {artUrl && !artFailed ? (
            <image href={artUrl} x="94" y="94" width="112" height="112"
              clipPath="url(#room-lc)" preserveAspectRatio="xMidYMid slice"
              onError={() => setArtFailed(true)} />
          ) : (
            <text x="150" y="159" textAnchor="middle" fontSize="26" fill="rgba(196,149,58,0.32)" fontFamily="serif">◆</text>
          )}
          <circle cx="150" cy="150" r="56" fill="url(#room-lo)" />
          <circle cx="150" cy="150" r="58" fill="none" stroke="rgba(196,149,58,0.35)" strokeWidth="1.2" />
          <circle cx="150" cy="150" r="148" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="2.5" />
          <circle cx="150" cy="150" r="5" fill="#060609" />
        </svg>
      </div>
    </div>
  )
}

// ── Queue panel ──────────────────────────────────────────────────────────
function QueuePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { playlist, currentIndex, currentTrack, isPlaying, play, toggle } = useAudio()
  const upcoming = playlist.slice(currentIndex + 1)

  if (!open) return null

  return (
    <div
      className="fixed inset-y-0 right-0 z-[150] w-full sm:w-80 border-l border-noir-silver/10"
      style={{ background: 'rgba(6,6,14,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-noir-silver/8">
        <p className="font-body text-[10px] tracking-[0.35em] uppercase text-noir-gold/65">Queue</p>
        <button onClick={onClose} aria-label="Close queue" className="text-noir-silver/40 hover:text-noir-ivory transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-72px)]">
        {currentTrack && (
          <div className="px-5 py-4 border-b border-noir-silver/8 bg-noir-gold/5">
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-gold/50 mb-2">Now Playing</p>
            <button onClick={toggle} className="flex items-center gap-3 w-full text-left">
              {isPlaying ? <Equalizer /> : (
                <svg className="w-3.5 h-3.5 text-noir-gold flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
              <span className="font-heading italic text-sm text-noir-ivory truncate">{currentTrack.title}</span>
            </button>
          </div>
        )}
        {upcoming.length === 0 ? (
          <p className="px-5 py-8 font-body text-xs text-noir-silver/30 text-center">Queue is empty — play an album to fill it.</p>
        ) : (
          upcoming.map((t, i) => (
            <button
              key={t.id}
              onClick={() => play(t, playlist)}
              className="w-full flex items-center gap-3 px-5 py-3 border-b border-noir-silver/6 text-left hover:bg-noir-silver/5 transition-colors"
            >
              <span className="font-body text-[10px] tabular-nums text-noir-silver/30 w-5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-body text-sm text-noir-ivory/80 truncate flex-1">{t.title}</span>
              <span className="font-body text-[10px] text-noir-silver/35 tabular-nums flex-shrink-0">{t.durationFormatted}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function TrackRow({ track, playlist, index }: { track: Track; playlist: Track[]; index: number }) {
  const { currentTrack, isPlaying, play, toggle } = useAudio()
  const isCurrent = currentTrack?.id === track.id

  const handlePlay = () => {
    if (isCurrent) toggle()
    else play(track, playlist)
  }

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 border-b border-noir-silver/6 last:border-0 transition-all duration-200 ${
        isCurrent ? 'bg-noir-gold/6 border-noir-gold/10' : 'hover:bg-noir-silver/5'
      }`}
    >
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {isCurrent && isPlaying ? (
          <button onClick={handlePlay} className="text-noir-gold" aria-label="Pause"><Equalizer /></button>
        ) : isCurrent ? (
          <button onClick={handlePlay} className="text-noir-gold" aria-label={`Play ${track.title}`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
        ) : (
          <>
            <span className="font-body text-[10px] tabular-nums text-noir-silver/30 group-hover:hidden">
              {String(track.trackNumber ?? index + 1).padStart(2, '0')}
            </span>
            <button
              onClick={handlePlay}
              className="hidden group-hover:flex text-noir-silver/70 hover:text-noir-gold transition-colors duration-200"
              aria-label={`Play ${track.title}`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
          </>
        )}
      </div>

      <div className="w-7 h-7 flex-shrink-0 overflow-hidden border border-noir-silver/8">
        {track.songArtUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.songArtUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-noir-navy to-noir-atlantic" />
        )}
      </div>

      <button
        onClick={handlePlay}
        className={`flex-1 min-w-0 text-left font-body text-sm truncate transition-colors duration-200 ${
          isCurrent ? 'text-noir-gold' : 'text-noir-ivory/85 hover:text-noir-ivory'
        }`}
      >
        {isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-noir-gold mr-2 align-middle animate-pulse-gold" />}
        {track.title}
      </button>

      {track.slug && (
        <Link
          href={`/songs/${track.slug}`}
          className="hidden group-hover:block flex-shrink-0 font-body text-[9px] tracking-[0.2em] uppercase text-noir-silver/40 hover:text-noir-gold transition-colors duration-200 mr-2"
          onClick={e => e.stopPropagation()}
        >
          Enter the Chapter →
        </Link>
      )}

      <span className="font-body text-[10px] text-noir-silver/40 flex-shrink-0 tabular-nums">{track.durationFormatted}</span>
    </div>
  )
}

function AlbumCard({ entry, tracks, totalDurationFormatted, index }: AlbumSection & { index: number }) {
  const [open, setOpen] = useState(false)
  const [coverFailed, setCoverFailed] = useState(false)
  const { setPlaylistAndPlay } = useAudio()

  const hasTracks = tracks.length > 0

  return (
    <div className={`border transition-all duration-400 ${open ? 'border-noir-gold/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)]' : 'border-noir-silver/10 hover:border-noir-gold/18 hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]'}`}
      style={{ background: 'rgba(6,6,14,0.55)' }}
    >

      <div className="flex items-center gap-4 md:gap-6 p-4 md:p-5">

        <Link href={entry.href} className="group relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 overflow-hidden border border-noir-gold/10">
          {entry.coverSrc && !coverFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.coverSrc}
              alt={entry.meta.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0d1525] to-noir-black" />
          )}
          <div className="absolute inset-0 bg-noir-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg className="w-4 h-4 text-noir-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <p className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-gold/60 mb-1">{entry.genre}</p>
          <Link href={entry.href}>
            <h2 className="font-heading font-light italic text-lg md:text-xl text-noir-ivory hover:text-noir-gold transition-colors duration-300 leading-tight truncate">
              {entry.meta.title}
            </h2>
          </Link>
          <p className="font-body text-[10px] text-noir-silver/40 mt-1">
            {hasTracks ? (
              <>
                {tracks.length} tracks
                {totalDurationFormatted && <span className="ml-2 opacity-60">· {totalDurationFormatted}</span>}
              </>
            ) : (
              <span className="text-noir-silver/20">Coming soon</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {hasTracks && (
            <button
              onClick={() => { setPlaylistAndPlay(tracks, 0); setOpen(true) }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-noir-gold/8 border border-noir-gold/30 text-noir-gold/90 font-body text-[9px] tracking-[0.2em] uppercase hover:bg-noir-gold/15 hover:border-noir-gold/50 hover:text-noir-gold hover:shadow-[0_0_16px_rgba(196,149,58,0.12)] transition-all duration-300"
              aria-label={`Play ${entry.meta.title}`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Play
            </button>
          )}

          {hasTracks && (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 font-body text-[9px] tracking-[0.2em] uppercase text-noir-silver/45 hover:text-noir-ivory transition-all duration-300"
              aria-expanded={open}
              aria-label={open ? 'Collapse tracklist' : 'Expand tracklist'}
            >
              <span className="hidden sm:inline">{open ? 'Hide' : 'Tracks'}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {hasTracks && open && (
        <div className="border-t border-noir-silver/8">
          {tracks.map((track, i) => (
            <TrackRow key={track.id} track={track} playlist={tracks} index={i} />
          ))}
          <div className="px-4 py-3 flex items-center justify-between border-t border-noir-silver/6">
            <Link
              href={entry.href}
              className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 hover:text-noir-gold transition-colors duration-300"
            >
              Full album page →
            </Link>
            <button
              onClick={() => setPlaylistAndPlay(tracks, 0)}
              className="sm:hidden flex items-center gap-1 font-body text-[9px] tracking-[0.2em] uppercase text-noir-gold/60 hover:text-noir-gold transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Play all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DiscographyView({ sections }: { sections: AlbumSection[] }) {
  const { currentTrack, isPlaying, playlist } = useAudio()
  const [queueOpen, setQueueOpen] = useState(false)

  const activeSections   = sections.filter(s => s.tracks.length > 0)
  const forthcoming      = sections.filter(s => s.tracks.length === 0)
  const totalTracks      = activeSections.reduce((n, s) => n + s.tracks.length, 0)

  const featuredTrack = useMemo(
    () => currentTrack ?? activeSections[0]?.tracks[0] ?? null,
    [currentTrack, activeSections],
  )

  return (
    <div className="min-h-screen text-noir-ivory relative">
      <style>{`
        @keyframes nc-room-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .nc-room-vinyl { animation: nc-room-spin 10s linear infinite; animation-play-state: paused; will-change: transform; }
      `}</style>

      <RoomBackdrop track={featuredTrack} />

      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-32 relative">

        {/* Page header */}
        <div className="mb-14">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-noir-silver/30 hover:text-noir-ivory transition-colors mb-12"
          >
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
            Back
          </Link>

          <p className="font-body text-[10px] tracking-[0.5em] uppercase text-noir-gold/65 mb-4">
            NoiraCiel · A Private Listening Room
          </p>
          <h1 className="font-heading font-light italic text-6xl md:text-7xl text-noir-ivory leading-[0.95] mb-5 tracking-tight">
            Music
          </h1>
          <p className="font-body text-sm text-noir-silver/45 mt-2 tracking-wide">
            {activeSections.length} albums · {totalTracks} songs
          </p>
        </div>

        {/* Listening room centerpiece */}
        <div className="mb-16 flex flex-col items-center gap-6 py-10 border-y border-noir-silver/8">
          <VinylCenterpiece track={featuredTrack} isPlaying={isPlaying} />
          {featuredTrack && (
            <div className="text-center max-w-md">
              <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/50 mb-2">
                {isPlaying ? 'Now Playing' : currentTrack ? 'Paused' : 'Featured'}
              </p>
              <h2 className="font-heading italic text-2xl text-noir-ivory leading-tight">{featuredTrack.title}</h2>
              {featuredTrack.album && (
                <p className="font-body text-xs text-noir-silver/40 mt-2 tracking-wide">{featuredTrack.album}</p>
              )}
            </div>
          )}
          <button
            onClick={() => setQueueOpen(true)}
            className="flex items-center gap-2 font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 hover:text-noir-gold transition-colors duration-300"
          >
            Queue
            {playlist.length > 0 && <span className="text-noir-gold/50">({playlist.length})</span>}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Album list */}
        <div className="space-y-2">
          {activeSections.map((section, i) => (
            <AlbumCard key={section.entry.slug} {...section} index={i} />
          ))}
        </div>

        {/* Forthcoming */}
        {forthcoming.length > 0 && (
          <div className="mt-16 pt-12 border-t border-noir-silver/8">
            <p className="font-body text-[9px] tracking-[0.35em] uppercase text-noir-silver/25 mb-6">Forthcoming</p>
            <div className="space-y-2">
              {forthcoming.map(s => (
                <div key={s.entry.slug} className="flex items-center gap-4 py-3 border-b border-noir-silver/6 last:border-0">
                  <div className="w-12 h-12 flex-shrink-0 border border-noir-gold/15 bg-gradient-to-br from-[#0d1525] via-[#0a1020] to-noir-black" />
                  <div>
                    <p className="font-heading italic text-sm text-noir-ivory/25">{s.entry.meta.title}</p>
                    <p className="font-body text-[9px] tracking-[0.2em] uppercase text-noir-gold/20 mt-0.5">{s.entry.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
