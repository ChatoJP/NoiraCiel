'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAudio } from '@/context/AudioContext'
import type { Track } from '@/lib/types'
import type { DiscographyEntry } from '@/lib/musicScanner'

interface AlbumSection {
  entry: DiscographyEntry
  tracks: Track[]
  totalDurationFormatted: string
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
      {/* Track number / play */}
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

      {/* Thumbnail */}
      <div className="w-7 h-7 flex-shrink-0 overflow-hidden border border-noir-silver/8">
        {track.songArtUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.songArtUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-noir-navy to-noir-atlantic" />
        )}
      </div>

      {/* Title */}
      <button
        onClick={handlePlay}
        className={`flex-1 min-w-0 text-left font-body text-sm truncate transition-colors duration-200 ${
          isCurrent ? 'text-noir-gold' : 'text-noir-ivory/85 hover:text-noir-ivory'
        }`}
      >
        {isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-noir-gold mr-2 align-middle animate-pulse-gold" />}
        {track.title}
      </button>

      {/* Chapter link */}
      {track.slug && (
        <Link
          href={`/songs/${track.slug}`}
          className="hidden group-hover:block flex-shrink-0 font-body text-[9px] tracking-[0.2em] uppercase text-noir-silver/40 hover:text-noir-gold transition-colors duration-200 mr-2"
          onClick={e => e.stopPropagation()}
        >
          Chapter →
        </Link>
      )}

      {/* Duration */}
      <span className="font-body text-[10px] text-noir-silver/40 flex-shrink-0 tabular-nums">{track.durationFormatted}</span>
    </div>
  )
}

function AlbumCard({ entry, tracks, totalDurationFormatted, index }: AlbumSection & { index: number }) {
  const [open, setOpen] = useState(false)
  const { setPlaylistAndPlay } = useAudio()

  const hasTracks = tracks.length > 0

  return (
    <div className={`border transition-all duration-400 ${open ? 'border-noir-gold/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)]' : 'border-noir-silver/10 hover:border-noir-gold/18 hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]'}`}>

      {/* Album header — always visible */}
      <div className="flex items-center gap-4 md:gap-6 p-4 md:p-5">

        {/* Cover art */}
        <Link href={entry.href} className="group relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 overflow-hidden border border-noir-gold/10">
          {entry.coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.coverSrc}
              alt={entry.meta.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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

        {/* Album info */}
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

        {/* Right actions */}
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

          {/* Expand toggle */}
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

      {/* Collapsible track list */}
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
  const activeSections   = sections.filter(s => s.tracks.length > 0)
  const forthcoming      = sections.filter(s => s.tracks.length === 0)
  const totalTracks      = activeSections.reduce((n, s) => n + s.tracks.length, 0)

  return (
    <div className="min-h-screen bg-noir-black text-noir-ivory">
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-32">

        {/* Page header */}
        <div className="mb-16">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-noir-silver/30 hover:text-noir-ivory transition-colors mb-12"
          >
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
            Back
          </Link>

          <p className="font-body text-[10px] tracking-[0.45em] uppercase text-noir-gold/65 mb-3">
            NoiraCiel · Discography
          </p>
          <h1 className="font-heading font-light italic text-5xl md:text-6xl text-noir-ivory leading-none mb-4">
            Music
          </h1>
          <p className="font-body text-sm text-noir-silver/45 mt-2">
            {activeSections.length} albums · {totalTracks} songs
          </p>
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
