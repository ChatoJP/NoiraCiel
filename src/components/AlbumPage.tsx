'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAudio } from '@/context/AudioContext'
import type { MusicCatalogue, Track } from '@/lib/types'

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
        <div key={i} className={`w-0.5 bg-noir-gold rounded-full ${cls}`} style={{ animationDelay: `${i * 0.07}s` }} />
      ))}
    </div>
  )
}

// ─── Album Artwork ────────────────────────────────────────────────────────────
function AlbumArtwork({ trackCount }: { trackCount: number }) {
  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex-shrink-0 group">
      {/* Real album cover */}
      <div className="absolute inset-0 border border-noir-gold/20 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Images/album-cover.png"
          alt="The Life Lessons I Hope You Learn"
          className="w-full h-full object-cover"
        />
        {/* Subtle dark overlay to keep design cohesion */}
        <div className="absolute inset-0 bg-noir-void/10 group-hover:bg-noir-void/0 transition-colors duration-500" />
        {/* Track count badge bottom-right */}
        <div className="absolute bottom-3 right-3">
          <span className="font-body text-[9px] tracking-[0.3em] text-noir-ivory/50 bg-noir-void/60 px-1.5 py-0.5">
            {String(trackCount).padStart(2, '0')} SONGS
          </span>
        </div>
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
      className="overflow-hidden transition-all duration-500"
    >
      <div className="px-4 md:px-8 pb-6 pt-2 max-w-2xl">
        <div className="border-l border-noir-gold/20 pl-6 space-y-4">
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
  const isCurrent = currentTrack?.id === track.id
  const emotion = CHAPTER_EMOTIONS[track.trackNumber ?? 0]

  const handlePlay = () => {
    if (isCurrent) toggle()
    else play(track, playlist)
  }

  return (
    <div className={`group border-b border-noir-silver/8 last:border-0 transition-colors duration-200 ${isCurrent ? 'bg-noir-gold/5' : 'hover:bg-noir-silver/5'}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Track number / play state */}
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          {isCurrent && isPlaying ? (
            <Equalizer />
          ) : (
            <>
              <span className={`font-body text-sm tabular-nums ${isCurrent ? 'text-noir-gold' : 'text-noir-silver/30'} group-hover:hidden`}>
                {String(track.trackNumber ?? index + 1).padStart(2, '0')}
              </span>
              <button
                onClick={handlePlay}
                className="hidden group-hover:flex items-center justify-center text-noir-silver hover:text-noir-gold transition-colors"
                aria-label={`Play ${track.title}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </>
          )}
          {isCurrent && !isPlaying && (
            <button onClick={handlePlay} className="flex items-center justify-center text-noir-gold hover:text-noir-gold-light transition-colors">
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
              <span className="font-heading text-[9px] text-noir-gold/40">{String(track.trackNumber ?? '').padStart(2,'0')}</span>
            </div>
          )}
        </div>

        {/* Title + emotion */}
        <div className="flex-1 min-w-0">
          <button
            onClick={handlePlay}
            className={`text-left w-full ${isCurrent ? 'text-noir-gold' : 'text-noir-ivory'} hover:text-noir-gold transition-colors`}
          >
            <span className="font-body text-sm truncate block">{track.title}</span>
          </button>
          {emotion && (
            <p className="font-heading italic text-[11px] text-noir-silver/30 truncate hidden md:block mt-0.5 leading-tight">
              {emotion}
            </p>
          )}
        </div>

        {/* Chapter link */}
        <Link
          href={`/songs/${track.slug}`}
          className="flex-shrink-0 hidden group-hover:flex items-center gap-1 font-body text-[10px] tracking-[0.15em] text-noir-silver/40 hover:text-noir-gold uppercase transition-colors"
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
          className={`flex-shrink-0 ml-1 transition-colors ${lyricsOpen ? 'text-noir-gold' : 'text-noir-silver/30 hover:text-noir-silver'}`}
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
  )
}

// ─── Main Album Page ─────────────────────────────────────────────────────────
export default function AlbumPage({ catalogue }: { catalogue: MusicCatalogue }) {
  const { setPlaylistAndPlay } = useAudio()
  const { tracks, albumMeta } = catalogue

  const handlePlayAll = () => {
    if (tracks.length > 0) setPlaylistAndPlay(tracks, 0)
  }

  return (
    <div className="min-h-screen bg-noir-black">
      {/* Header with back link */}
      <div className="pt-24 pb-2 px-4 md:px-8 max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-noir-silver/40 hover:text-noir-ivory transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Album hero */}
      <div className="px-4 md:px-8 py-10 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
          <AlbumArtwork trackCount={tracks.length} />

          <div className="flex-1 min-w-0">
            <p className="font-body text-[10px] tracking-[0.4em] text-noir-gold/60 uppercase mb-3">
              Album
            </p>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl text-noir-ivory font-light tracking-wide leading-snug mb-3">
              The Life Lessons<br />
              <em className="not-italic text-gradient-gold">I Hope You Learn</em>
            </h1>
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
                className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-noir-gold text-noir-void font-body text-xs tracking-[0.15em] uppercase hover:bg-noir-gold-light transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play All
              </button>

              {/* Streaming links */}
              <a
                href={albumMeta.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#1DB954]/40 text-[#1DB954]/80 font-body text-xs tracking-[0.15em] uppercase hover:bg-[#1DB954]/10 hover:text-[#1DB954] transition-all"
              >
                <SpotifyIcon className="w-4 h-4" />
                Spotify
              </a>
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
          <div className="flex items-center gap-3 flex-wrap">
            <a href={albumMeta.spotifyUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.12em] uppercase text-[#1DB954]/60 hover:text-[#1DB954] border border-[#1DB954]/20 hover:border-[#1DB954]/50 px-3 py-1.5 transition-all">
              <SpotifyIcon className="w-3.5 h-3.5" />
              Spotify
            </a>
            <a href={albumMeta.appleMusicUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.12em] uppercase text-[#fc3c44]/55 hover:text-[#fc3c44] border border-[#fc3c44]/15 hover:border-[#fc3c44]/45 px-3 py-1.5 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.916.195 1.815.59 2.65.522 1.078 1.32 1.86 2.46 2.286.84.313 1.705.43 2.59.43H17.282c.97 0 1.89-.136 2.77-.49 1.247-.496 2.115-1.36 2.59-2.598.19-.488.292-.997.354-1.516.048-.43.074-.86.074-1.293V6.124zM9.23 17.44V8.52l8.192 4.458-8.193 4.463z" />
              </svg>
              Apple Music
            </a>
            <a href={albumMeta.youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-body text-xs tracking-[0.12em] uppercase text-[#FF0000]/50 hover:text-[#FF0000] border border-[#FF0000]/15 hover:border-[#FF0000]/40 px-3 py-1.5 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
              </svg>
              YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
