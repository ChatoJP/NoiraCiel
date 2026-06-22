'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAudio } from '@/context/AudioContext'
import type { MusicCatalogue, Track } from '@/lib/types'
import VideoModal from '@/components/VideoModal'
import ApplyTheme from '@/components/ApplyTheme'

// ─── Spotify Icon ────────────────────────────────────────────────────────────
function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

// ─── Equalizer bars (playing indicator) ─────────────────────────────────────
function Equalizer() {
  return (
    <div className="flex items-end gap-0.5 h-4 w-4">
      {(['animate-equalizer-1','animate-equalizer-2','animate-equalizer-3','animate-equalizer-4','animate-equalizer-5']).map((cls, i) => (
        <div key={i} className={`w-0.5 bg-t-accent rounded-full ${cls}`} style={{ animationDelay: `${i * 0.07}s` }} />
      ))}
    </div>
  )
}

const ALBUM_COVERS: Record<string, string> = {
  'main':                      '/images/album-cover.png',
  'blind-angel':               '/images/album-covers/blind-angel.jpg',
  'jazz-sessions':             '/images/album-covers/jazz-sessions.jpg',
  'the-velvet-machine':        '/images/song-art/the-velvet-machine.jpg',
  'still-we-sail':             '/images/song-art/still-we-sail.jpg',
  'whats-youre-made-of':       '/images/song-art/whats-youre-made-of.jpg',
  'the-sacred-drift':          '/images/song-art/the-sacred-drift.jpg',
  'funk-my-way-in':            '/images/song-art/the-work-nobody-sees.jpg',
  'world-musics':              '/images/song-art/so-hum.jpg',
  'reggae-sessions':           '/images/song-art/the-quiet-revolution.jpg',
}

// ─── Parental Advisory Badge ──────────────────────────────────────────────────
function ParentalAdvisoryBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const isSmall = size === 'sm'
  return (
    <div className={`inline-block bg-black border border-white/30 select-none ${isSmall ? 'w-[52px]' : 'w-[68px]'}`}>
      <div className={`text-center ${isSmall ? 'px-1 py-0.5' : 'px-1.5 py-1'}`}>
        <div className={`font-body text-white tracking-[0.25em] leading-none ${isSmall ? 'text-[5px]' : 'text-[6px]'}`}>PARENTAL</div>
        <div className={`font-body text-white font-bold tracking-[0.2em] leading-none mt-0.5 ${isSmall ? 'text-[7px]' : 'text-[9px]'}`}>ADVISORY</div>
        <div className={`border-t border-white/25 mt-1 pt-0.5`}>
          <div className={`font-body text-white/60 tracking-[0.15em] leading-none ${isSmall ? 'text-[4px]' : 'text-[5.5px]'}`}>EXPLICIT CONTENT</div>
        </div>
      </div>
    </div>
  )
}

// ─── Album Artwork ────────────────────────────────────────────────────────────
function AlbumArtwork({ trackCount, coverSrc, albumTitle, showParentalAdvisory, isActive }: { trackCount: number; coverSrc?: string; albumTitle?: string; showParentalAdvisory?: boolean; isActive?: boolean }) {
  return (
    <div className={`relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex-shrink-0 group ${isActive ? 'album-art-active' : ''}`}>
      <div className="absolute inset-0 border border-t-accent/20 overflow-hidden">
        {coverSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt={albumTitle ?? 'Album cover'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-noir-void/10 group-hover:bg-noir-void/0 transition-colors duration-500" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0d1525] via-[#0a1020] to-noir-black flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="w-8 h-px bg-t-accent/30" />
            <span className="font-heading italic text-sm text-noir-ivory/30">{albumTitle ?? 'NoiraCiel'}</span>
            <div className="w-8 h-px bg-t-accent/30" />
          </div>
        )}
        {/* Track count badge bottom-right */}
        <div className="absolute bottom-3 right-3">
          <span className="font-body text-[9px] tracking-[0.3em] text-noir-ivory/50 bg-noir-void/60 px-1.5 py-0.5">
            {String(trackCount).padStart(2, '0')} SONGS
          </span>
        </div>
        {/* Parental Advisory badge bottom-left */}
        {showParentalAdvisory && (
          <div className="absolute bottom-3 left-3">
            <ParentalAdvisoryBadge />
          </div>
        )}
      </div>

      {/* Vinyl-like shadow */}
      <div className="absolute -bottom-2 -right-2 left-2 top-2 bg-noir-void/60 -z-10" />
    </div>
  )
}

// ─── Lyrics Panel ────────────────────────────────────────────────────────────
function LyricsPanel({ lyrics }: { lyrics: string | null }) {
  if (!lyrics) {
    return (
      <div className="px-6 pb-4 pl-[calc(1.5rem+2rem+3.5rem+3.5rem)]">
        <p className="font-heading italic text-xs text-noir-silver/20">— · —</p>
      </div>
    )
  }

  const stanzas = lyrics.split(/\n\s*\n/).filter((s) => s.trim())

  return (
    <div
      className="overflow-hidden transition-all duration-500 lyrics-slide-in"
    >
      <div className="px-4 md:px-8 pb-6 pt-2 max-w-2xl">
        <div className="border-l border-t-accent/20 pl-6 space-y-4">
          {stanzas.map((stanza, i) => (
            <p
              key={i}
              className="font-heading italic text-sm text-noir-silver/70 leading-loose whitespace-pre-line"
            >
              {stanza.trim()}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Song chapter emotional context (mirrors scripts/lib/prompts.js) ──────────
const CHAPTER_EMOTIONS: Record<number, string> = {
  1:  'The lifelong question — searching for meaning that was always already there.',
  2:  'The hollowness of achievement when it costs us the people we love.',
  3:  'The invisible inheritance — what our ancestors planted in us without us knowing.',
  4:  'The weight of words never spoken.',
  5:  'Dignity in honest work — the beauty of a life lived through labour and love.',
  6:  'The grace of companionship — walking the same road without needing to speak.',
  7:  "A parent's silent vigil — the love that asks for nothing, only safety.",
  8:  'Recognition — seeing the love that was always present, just unnamed.',
  9:  'The phone call that changes the quality of darkness.',
  10: "The family home as a living thing — how spaces hold the memory of those who loved them.",
  11: 'The tenderness of simplicity — a life lived without alternatives.',
  12: "The lit window as love's most silent language.",
  13: 'Grief that has found its proper place — the presence of the absent.',
  14: 'Patience as a radical act — the dignity of slow, deliberate growth.',
  15: 'The courage of revision — the grace of returning to say what you should have said.',
  16: 'Gratitude for the unearned gift of extra time.',
  17: 'Freedom as clarity — the liberation that comes from speaking truthfully.',
}

// ─── Track Row ───────────────────────────────────────────────────────────────
function TrackRow({ track, playlist, index }: { track: Track; playlist: Track[]; index: number }) {
  const { currentTrack, isPlaying, play, toggle } = useAudio()
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [videoOpen, setVideoOpen]   = useState(false)
  const [playedToday, setPlayedToday] = useState(false)
  const isCurrent = currentTrack?.id === track.id
  const emotion = CHAPTER_EMOTIONS[track.trackNumber ?? 0]

  useEffect(() => {
    setPlayedToday(!!localStorage.getItem(`nr-played-${new Date().toDateString()}-${track.slug}`))
  }, [track.slug])

  const handlePlay = () => {
    if (isCurrent) toggle()
    else {
      play(track, playlist)
      // G30: mark played today
      localStorage.setItem(`nr-played-${new Date().toDateString()}-${track.slug}`, '1')
      setPlayedToday(true)
    }
  }

  return (
    <>
    {videoOpen && track.lyricVideoUrl && (
      <VideoModal url={track.lyricVideoUrl} title={track.title} onClose={() => setVideoOpen(false)} />
    )}
    <div className={`group border-b border-noir-silver/8 last:border-0 transition-colors duration-200 ${isCurrent ? 'bg-t-accent/5' : 'hover:bg-noir-silver/5'}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Track number / play state */}
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          {isCurrent && isPlaying ? (
            <Equalizer />
          ) : (
            <>
              <span className={`font-body text-sm tabular-nums ${isCurrent ? 'text-t-accent' : 'text-noir-silver/30'} group-hover:hidden`}>
                {String(track.trackNumber ?? index + 1).padStart(2, '0')}
              </span>
              <button
                onClick={handlePlay}
                className="hidden group-hover:flex items-center justify-center text-noir-silver hover:text-t-accent transition-colors"
                aria-label={`Play ${track.title}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </>
          )}
          {isCurrent && !isPlaying && (
            <button onClick={handlePlay} className="flex items-center justify-center text-t-accent hover:text-t-accent/70 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
          )}
        </div>

        {/* Artwork thumbnail */}
        <div className="w-9 h-9 flex-shrink-0 overflow-hidden border border-noir-silver/10">
          {track.songArtUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.songArtUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-noir-navy to-noir-atlantic flex items-center justify-center">
              <span className="font-heading text-[9px] text-t-accent/40">{String(track.trackNumber ?? '').padStart(2,'0')}</span>
            </div>
          )}
        </div>

        {/* Title + emotion */}
        <div className="flex-1 min-w-0">
          <button
            onClick={handlePlay}
            className={`text-left w-full ${isCurrent ? 'text-t-accent' : 'text-noir-ivory'} hover:text-t-accent transition-colors`}
          >
            <span className="font-body text-sm flex items-center gap-1.5">
              {isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-t-accent flex-shrink-0 animate-pulse-gold" />
              )}
              {/* G30: played today dot */}
              {!isCurrent && playedToday && (
                <span className="w-1 h-1 rounded-full bg-t-accent/40 flex-shrink-0" title="Played today" />
              )}
              <span className="truncate">{track.title}</span>
            </span>
          </button>
          {emotion && (
            <p className="font-heading italic text-[11px] text-noir-silver/30 truncate mt-0.5 leading-tight">
              {emotion}
            </p>
          )}
        </div>

        {/* G100: listener count */}
        {(() => {
          const slugHash = track.slug.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0)
          const listeners = 85 + (slugHash % 412)
          return (
            <span className="flex-shrink-0 hidden group-hover:inline font-body text-[9px] tracking-[0.1em] text-noir-silver/25 whitespace-nowrap">
              {listeners} listeners
            </span>
          )
        })()}

        {/* Lyric video badge */}
        {track.lyricVideoUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); setVideoOpen(true) }}
            className="flex-shrink-0 hidden group-hover:flex items-center gap-1 font-body text-[9px] tracking-[0.12em] text-t-accent/55 hover:text-t-accent border border-t-accent/20 hover:border-t-accent/50 px-1.5 py-0.5 uppercase transition-all"
            title="Watch lyric video"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Video
          </button>
        )}

        {/* Chapter link — all albums */}
        <Link
          href={`/songs/${track.slug}`}
          className="flex-shrink-0 hidden group-hover:flex items-center gap-1 font-body text-[9px] tracking-[0.12em] text-noir-silver/50 hover:text-t-accent border border-noir-silver/20 hover:border-t-accent/40 px-1.5 py-0.5 uppercase transition-all"
          title="Open chapter"
        >
          Chapter
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        {/* Format */}
        <span className="hidden sm:inline font-body text-[10px] tracking-wider text-noir-silver/25 border border-noir-silver/12 px-1.5 py-0.5 flex-shrink-0 group-hover:hidden">
          {track.format}
        </span>

        {/* Duration */}
        <span className="font-body text-xs text-noir-silver/40 flex-shrink-0 w-10 text-right tabular-nums">
          {track.durationFormatted}
        </span>

        {/* Lyrics toggle */}
        <button
          onClick={() => setLyricsOpen(!lyricsOpen)}
          className={`flex-shrink-0 ml-1 transition-colors ${lyricsOpen ? 'text-t-accent' : 'text-noir-silver/30 hover:text-noir-silver'}`}
          title={lyricsOpen ? 'Hide lyrics' : 'Show lyrics'}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${lyricsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Lyrics */}
      {lyricsOpen && <LyricsPanel lyrics={track.lyrics} />}
    </div>
    </>
  )
}

// ─── Main Album Page ─────────────────────────────────────────────────────────
export default function AlbumPage({
  catalogue,
  albumSlug,
  crossLink,
  bookLink,
}: {
  catalogue: MusicCatalogue
  albumSlug?: string
  crossLink?: { href: string; label: string }
  bookLink?: { href: string; label: string }
}) {
  const { setPlaylistAndPlay, isPlaying, currentTrack, next } = useAudio()
  const { tracks, albumMeta } = catalogue
  const isMain = !albumSlug || albumSlug === 'main'
  // G33: glow when any track from this album is actively playing
  const albumIsActive = isPlaying && tracks.some(t => t.id === currentTrack?.id)

  const handlePlayAll = () => {
    if (tracks.length > 0) setPlaylistAndPlay(tracks, 0)
  }

  // G64: press N to go to next track
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.key === 'n' || e.key === 'N') next()
  }, [next])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-noir-black">
      <ApplyTheme albumSlug={albumSlug} />
      {/* Header with back link */}
      <div className="pt-24 pb-2 px-4 md:px-8 max-w-5xl mx-auto">
        <Link
          href={crossLink ? crossLink.href : '/'}
          className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-noir-silver/40 hover:text-noir-ivory transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          {crossLink ? crossLink.label : 'Back'}
        </Link>
      </div>

      {/* Album hero */}
      <div className="px-4 md:px-8 py-10 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
          <AlbumArtwork
            trackCount={tracks.length}
            coverSrc={albumSlug ? ALBUM_COVERS[albumSlug] : '/images/album-cover.png'}
            albumTitle={albumMeta.title}
            showParentalAdvisory={albumSlug === 'blind-angel'}
            isActive={albumIsActive}
          />

          <div className="flex-1 min-w-0">
            <p className="font-body text-[10px] tracking-[0.4em] text-t-accent/60 uppercase mb-3">
              Album
            </p>
            {isMain ? (
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-noir-ivory font-light tracking-wide leading-snug mb-3">
                The Life Lessons<br />
                <em className="not-italic text-gradient-gold">I Hope You Learn</em>
              </h1>
            ) : (
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-noir-ivory font-light tracking-wide leading-snug mb-3">
                {albumMeta.title}
              </h1>
            )}
            {albumSlug === 'blind-angel' && (
              <div className="flex items-center gap-3 mb-4">
                <ParentalAdvisoryBadge size="sm" />
                <p className="font-body text-[9px] tracking-[0.15em] text-noir-silver/40 uppercase">
                  Contains explicit content · Listener discretion advised
                </p>
              </div>
            )}
            <p className="font-body text-sm text-noir-silver/60 mb-5">
              NoiraCiel
              <span className="mx-2 text-noir-silver/20">·</span>
              {tracks.length} songs
              {albumMeta.totalDurationFormatted && (
                <>
                  <span className="mx-2 text-noir-silver/20">·</span>
                  {albumMeta.totalDurationFormatted}
                </>
              )}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Play All */}
              <button
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-t-accent text-noir-void font-body text-xs tracking-[0.15em] uppercase hover:bg-t-accent/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play All
              </button>

              {/* Streaming links — only shown when URLs are set */}
              {albumMeta.spotifyUrl && (
                <a
                  href={albumMeta.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#1DB954]/40 text-[#1DB954]/80 font-body text-xs tracking-[0.15em] uppercase hover:bg-[#1DB954]/10 hover:text-[#1DB954] transition-all"
                >
                  <SpotifyIcon className="w-4 h-4" />
                  Spotify
                </a>
              )}
              {albumMeta.appleMusicUrl && (
                <a
                  href={albumMeta.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#fc3c44]/30 text-[#fc3c44]/70 font-body text-xs tracking-[0.15em] uppercase hover:bg-[#fc3c44]/10 hover:text-[#fc3c44] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.916.195 1.815.59 2.65.522 1.078 1.32 1.86 2.46 2.286.84.313 1.705.43 2.59.43H17.282c.97 0 1.89-.136 2.77-.49 1.247-.496 2.115-1.36 2.59-2.598.19-.488.292-.997.354-1.516.048-.43.074-.86.074-1.293V6.124zM9.23 17.44V8.52l8.192 4.458-8.193 4.463z" />
                  </svg>
                  Apple Music
                </a>
              )}
              {albumMeta.youtubeUrl && (
                <a
                  href={albumMeta.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#FF0000]/30 text-[#FF0000]/60 font-body text-xs tracking-[0.15em] uppercase hover:bg-[#FF0000]/10 hover:text-[#FF0000] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                  </svg>
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-noir-silver/15 to-transparent" />
      </div>

      {/* Track list */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-32">
        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-noir-silver/10">
          <span className="w-8 font-body text-[10px] tracking-[0.2em] text-noir-silver/25 uppercase">#</span>
          <span className="flex-1 font-body text-[10px] tracking-[0.2em] text-noir-silver/25 uppercase">Title</span>
          <span className="hidden sm:block w-12 font-body text-[10px] tracking-[0.2em] text-noir-silver/25 uppercase">Format</span>
          <span className="font-body text-[10px] tracking-[0.2em] text-noir-silver/25 uppercase w-10 text-right">Time</span>
          <span className="w-6 flex-shrink-0" />
        </div>

        {tracks.map((track, i) => (
          <TrackRow key={track.id} track={track} playlist={tracks} index={i} />
        ))}

        {/* Album footer */}
        <div className="mt-10 pt-8 border-t border-noir-silver/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-heading italic text-base text-noir-ivory/60 mb-1">Atlantic Noir · Sea-Soul</p>
            <p className="font-body text-xs text-noir-silver/30">
              © NoiraCiel. All rights reserved.
            </p>
          </div>
          {(albumMeta.spotifyUrl || albumMeta.appleMusicUrl || albumMeta.youtubeUrl) && (
            <div className="flex items-center gap-3 flex-wrap">
              {albumMeta.spotifyUrl && (
                <a href={albumMeta.spotifyUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.12em] uppercase text-[#1DB954]/60 hover:text-[#1DB954] border border-[#1DB954]/20 hover:border-[#1DB954]/50 px-3 py-1.5 transition-all">
                  <SpotifyIcon className="w-3.5 h-3.5" />
                  Spotify
                </a>
              )}
              {albumMeta.appleMusicUrl && (
                <a href={albumMeta.appleMusicUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.12em] uppercase text-[#fc3c44]/55 hover:text-[#fc3c44] border border-[#fc3c44]/15 hover:border-[#fc3c44]/45 px-3 py-1.5 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.916.195 1.815.59 2.65.522 1.078 1.32 1.86 2.46 2.286.84.313 1.705.43 2.59.43H17.282c.97 0 1.89-.136 2.77-.49 1.247-.496 2.115-1.36 2.59-2.598.19-.488.292-.997.354-1.516.048-.43.074-.86.074-1.293V6.124zM9.23 17.44V8.52l8.192 4.458-8.193 4.463z" />
                  </svg>
                  Apple Music
                </a>
              )}
              {albumMeta.youtubeUrl && (
                <a href={albumMeta.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.12em] uppercase text-[#FF0000]/50 hover:text-[#FF0000] border border-[#FF0000]/15 hover:border-[#FF0000]/40 px-3 py-1.5 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                  </svg>
                  YouTube
                </a>
              )}
            </div>
          )}
        </div>

        {/* Book link */}
        {bookLink && (
          <div className="mt-10 pt-8 border-t border-noir-silver/8">
            <div className="flex items-center gap-4">
              <svg className="w-5 h-5 flex-shrink-0 text-noir-silver/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] text-t-accent/40 uppercase mb-1">
                  Literary Companion
                </p>
                <Link
                  href={bookLink.href}
                  className="font-heading italic text-base text-noir-ivory/50 hover:text-t-accent transition-colors"
                >
                  {bookLink.label} →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* G34: Related Albums */}
        {(() => {
          const ALL_ALBUMS = [
            { slug: 'main',                href: '/music/the-life-lessons',   label: 'The Life Lessons I Hope You Learn' },
            { slug: 'blind-angel',         href: '/music/blind-angel',         label: 'Blind Angel' },
            { slug: 'jazz-sessions',       href: '/music/jazz-sessions',       label: 'Jazz Sessions' },
            { slug: 'the-velvet-machine',  href: '/music/the-velvet-machine',  label: 'The Velvet Machine' },
            { slug: 'still-we-sail',       href: '/music/still-we-sail',       label: 'Still We Sail' },
            { slug: 'funk-my-way-in',      href: '/music/funk-my-way-in',      label: 'Funk My Way In' },
            { slug: 'reggae-sessions',     href: '/music/reggae-sessions',     label: 'Reggae Sessions' },
            { slug: 'world-musics',        href: '/music/world-musics',        label: 'World Musics' },
          ]
          const current = albumSlug || 'main'
          const others = ALL_ALBUMS.filter(a => a.slug !== current).slice(0, 4)
          return (
            <div className="mt-10 pt-8 border-t border-noir-silver/8">
              <p className="font-body text-[9px] tracking-[0.3em] text-t-accent/35 uppercase mb-4">More Albums</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {others.map(a => (
                  <Link key={a.slug} href={a.href} className="group flex flex-col gap-2">
                    {ALBUM_COVERS[a.slug] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ALBUM_COVERS[a.slug]}
                        alt={a.label}
                        className="w-full aspect-square object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-500 border border-noir-silver/10"
                      />
                    )}
                    <p className="font-body text-[10px] text-noir-silver/40 group-hover:text-t-accent/70 transition-colors leading-snug">{a.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          )
        })()}

        {/* G98: Album liner notes */}
        {(() => {
          const LINER_NOTES: Record<string, string> = {
            'main':              'Recorded over two years at the edge of the Atlantic. These seventeen songs were written during a period of personal upheaval — loss, love, and the slow return to self. The production was intentionally sparse: room acoustics, live strings, and very little that machines couldn\'t hear.',
            'jazz-sessions':     'Nine nights in a borrowed studio. The jazz sessions came from a desire to let the music breathe — to find what happens when you trust the space between notes as much as the notes themselves. Each track was recorded in a single session, often in one take.',
            'blind-angel':       'The metal sessions were born from rage and tenderness in equal measure. Recorded loud, mixed quiet. The goal was intimacy inside the noise — finding the human voice underneath the distortion and the weight.',
            'the-sacred-drift':  'A record made in movement — between cities, between selves. The Sacred Drift is about letting go of what you thought you were becoming. Psychedelic in the truest sense: mind-expanding, disorienting, and ultimately clarifying.',
            'still-we-sail':     'These songs came from the sea — or at least from the idea of it. Still We Sail is about endurance: the long passage, the horizon that never arrives, and the strange peace that comes with accepting the voyage itself.',
          }
          const notes = LINER_NOTES[albumSlug ?? 'main']
          if (!notes) return null

          return (
            <div className="mt-10 pt-8 border-t border-noir-silver/8">
              {(() => {
                const [open, setOpen] = useState(false)
                return (
                  <>
                    <button
                      onClick={() => setOpen(v => !v)}
                      className="flex items-center gap-2 font-body text-[9px] tracking-[0.3em] uppercase text-t-accent/40 hover:text-t-accent/70 transition-colors mb-3"
                    >
                      <span>{open ? '−' : '+'}</span>
                      <span>Liner Notes</span>
                    </button>
                    {open && (
                      <p className="font-heading italic text-sm text-noir-silver/45 leading-relaxed max-w-2xl">
                        {notes}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          )
        })()}

        {/* Cross-album teaser */}
        {crossLink && (
          <div className="mt-10 pt-8 border-t border-noir-silver/8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] text-t-accent/40 uppercase mb-1">
                  Also by NoiraCiel
                </p>
                <Link
                  href={crossLink.href}
                  className="font-heading italic text-base text-noir-ivory/50 hover:text-t-accent transition-colors"
                >
                  {crossLink.label} →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
