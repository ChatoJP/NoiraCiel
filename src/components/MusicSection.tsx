'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAudio } from '@/context/AudioContext'
import type { MusicCatalogue, Track } from '@/lib/types'
import VideoModal from '@/components/VideoModal'

const SPOTIFY_URL = 'https://open.spotify.com/album/49QDSwM3584OawGtC0O7eR?si=yTeObxPpRBivSExi1ehuXg'

const ALBUM_ORDER = [
  {
    slug: 'main',
    label: 'The Life Lessons I Hope You Learn',
    genre: 'Atlantic Noir · Sea-Soul',
    href: '/music/the-life-lessons',
    coverSrc: '/images/album-cover.png',
  },
  {
    slug: 'the-velvet-machine',
    label: 'The Velvet Machine',
    genre: 'Electronic · Fado · Atlantic Noir',
    href: '/music/the-velvet-machine',
    coverSrc: '/images/song-art/the-velvet-machine.jpg',
  },
  {
    slug: 'still-we-sail',
    label: 'Still We Sail',
    genre: 'Atlantic Noir · Fado · Sea-Soul',
    href: '/music/still-we-sail',
    coverSrc: '/images/song-art/still-we-sail.jpg',
  },
  {
    slug: 'jazz-sessions',
    label: 'NoiraCiel Jazz Sessions',
    genre: 'Jazz · Atlantic Noir',
    href: '/music/jazz-sessions',
    coverSrc: '/images/album-covers/jazz-sessions.jpg',
  },
  {
    slug: 'blind-angel',
    label: 'The Blind Angel — Intimate Metal Sessions',
    genre: 'Intimate Metal',
    href: '/music/blind-angel',
    coverSrc: '/images/album-covers/blind-angel.jpg',
  },
  {
    slug: 'whats-youre-made-of',
    label: "What You're Made Of",
    genre: 'Hip-Hop · DnB · Soul · Trap · Piano & Violin',
    href: '/music/whats-youre-made-of',
    coverSrc: '/images/song-art/whats-youre-made-of.jpg',
  },
  {
    slug: 'the-sacred-drift',
    label: 'The Sacred Drift',
    genre: 'Indie Pop · R&B · DnB · Trip-Pop · Psych · Mantras',
    href: '/music/the-sacred-drift',
    coverSrc: '/images/song-art/the-sacred-drift.jpg',
  },
  {
    slug: 'funk-my-way-in',
    label: 'Funk My Way In',
    genre: 'Funk · Soul · Groove',
    href: '/music/funk-my-way-in',
    coverSrc: '/images/song-art/the-work-nobody-sees.jpg',
  },
  {
    slug: 'world-musics',
    label: 'World Musics',
    genre: 'World Music · African · Latin · Global',
    href: '/music/world-musics',
    coverSrc: '/images/song-art/so-hum.jpg',
  },
  {
    slug: 'reggae-sessions',
    label: 'Reggae Sessions',
    genre: 'Reggae · Roots · Dub',
    href: '/music/reggae-sessions',
    coverSrc: '/images/song-art/the-quiet-revolution.jpg',
  },
]

type AlbumMeta = typeof ALBUM_ORDER[0]

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function Equalizer() {
  return (
    <div className="flex items-end gap-[2px] h-3.5 w-3.5">
      {['animate-equalizer-1','animate-equalizer-2','animate-equalizer-3','animate-equalizer-4','animate-equalizer-5'].map((cls, i) => (
        <div key={i} className={`w-0.5 bg-noir-gold rounded-full ${cls}`} style={{ animationDelay: `${i * 0.07}s` }} />
      ))}
    </div>
  )
}

function CompactTrackRow({ track, playlist, index, isMain }: { track: Track; playlist: Track[]; index: number; isMain: boolean }) {
  const { currentTrack, isPlaying, play, toggle } = useAudio()
  const [videoOpen, setVideoOpen] = useState(false)
  const isCurrent = currentTrack?.id === track.id

  const handlePlay = () => {
    if (isCurrent) toggle()
    else play(track, playlist)
  }

  return (
    <>
    {videoOpen && track.lyricVideoUrl && (
      <VideoModal url={track.lyricVideoUrl} title={track.title} onClose={() => setVideoOpen(false)} />
    )}
    <div
      className={`group flex items-center gap-3 px-3 py-3 border-b border-noir-silver/8 last:border-0 transition-all duration-200 cursor-pointer ${
        isCurrent ? 'bg-noir-gold/6' : 'hover:bg-noir-silver/5'
      }`}
      onClick={handlePlay}
    >
      {/* Number / play */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {isCurrent && isPlaying ? (
          <Equalizer />
        ) : isCurrent ? (
          <svg className="w-3.5 h-3.5 text-noir-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        ) : (
          <>
            <span className="font-body text-[10px] tabular-nums text-noir-silver/35 group-hover:hidden">
              {String(track.trackNumber ?? index + 1).padStart(2, '0')}
            </span>
            <svg className="w-3.5 h-3.5 hidden group-hover:block text-noir-silver/80 hover:text-noir-gold transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-8 h-8 flex-shrink-0 overflow-hidden border border-noir-silver/10">
        {track.songArtUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.songArtUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-noir-navy to-noir-atlantic" />
        )}
      </div>

      {/* Title */}
      <span className={`flex-1 min-w-0 font-body text-sm truncate transition-colors ${isCurrent ? 'text-noir-gold' : 'text-noir-ivory'}`}>
        {isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-noir-gold mr-2 align-middle animate-pulse-gold" />}
        {track.title}
      </span>

      {/* Lyric video button */}
      {track.lyricVideoUrl && (
        <button
          onClick={(e) => { e.stopPropagation(); setVideoOpen(true) }}
          className="hidden group-hover:flex flex-shrink-0 items-center gap-1 font-body text-[9px] tracking-[0.12em] uppercase text-noir-gold/55 hover:text-noir-gold border border-noir-gold/20 hover:border-noir-gold/50 px-1.5 py-0.5 transition-all"
          title="Watch lyric video"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Video
        </button>
      )}

      {/* Chapter link — main album only, hover */}
      {isMain && (
        <Link
          href={`/songs/${track.slug}`}
          className="hidden group-hover:flex flex-shrink-0 items-center gap-0.5 font-body text-[9px] tracking-[0.15em] uppercase text-noir-silver/40 hover:text-noir-gold transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Chapter
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      )}

      {/* Duration */}
      <span className="font-body text-[10px] text-noir-silver/45 flex-shrink-0 tabular-nums">
        {track.durationFormatted}
      </span>
    </div>
    </>
  )
}

function AlbumBlock({ meta, tracks }: { meta: AlbumMeta; tracks: Track[] }) {
  const [expanded, setExpanded] = useState(meta.slug === 'main')
  const { setPlaylistAndPlay } = useAudio()

  if (tracks.length === 0) return null

  return (
    <div className="border border-noir-silver/10 hover:border-noir-gold/18 hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-400">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3.5 bg-noir-deep/20">
        {/* Cover */}
        <div className="w-10 h-10 flex-shrink-0 overflow-hidden border border-noir-gold/15 group-hover:border-noir-gold/30 transition-colors duration-300">
          {meta.coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.coverSrc} alt={meta.label} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0d1525] to-noir-black" />
          )}
        </div>

        {/* Title + genre */}
        <div className="flex-1 min-w-0">
          <p className="font-body text-[9px] tracking-[0.25em] uppercase text-noir-gold/60">{meta.genre}</p>
          <p className="font-heading italic text-sm text-noir-ivory/90 truncate leading-tight mt-0.5">{meta.label}</p>
        </div>

        {/* Track count */}
        <span className="font-body text-[10px] text-noir-silver/45 flex-shrink-0 hidden sm:block">
          {tracks.length} tracks
        </span>

        {/* Play All */}
        <button
          onClick={() => { setPlaylistAndPlay(tracks, 0); setExpanded(true) }}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-noir-gold/8 border border-noir-gold/30 text-noir-gold/90 font-body text-[9px] tracking-[0.2em] uppercase hover:bg-noir-gold/15 hover:border-noir-gold/50 hover:text-noir-gold hover:shadow-[0_0_16px_rgba(196,149,58,0.12)] transition-all duration-300"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          Play
        </button>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 text-noir-silver/40 hover:text-noir-ivory transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Track list */}
      {expanded && (
        <>
          {tracks.map((track, i) => (
            <CompactTrackRow key={track.id} track={track} playlist={tracks} index={i} isMain={true} />
          ))}
          <div className="px-4 py-3 border-t border-noir-silver/8">
            <Link href={meta.href} className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/45 hover:text-noir-gold transition-colors duration-300">
              Full album →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function MusicSection() {
  const [catalogue, setCatalogue] = useState<MusicCatalogue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/music')
      .then((r) => r.json())
      .then((data: MusicCatalogue) => { setCatalogue(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const albumsWithTracks = ALBUM_ORDER.map(meta => ({
    meta,
    tracks: (catalogue?.tracks || []).filter(t => t.albumSlug === meta.slug),
  })).filter(a => a.tracks.length > 0)

  return (
    <section id="music" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-body text-xs tracking-[0.35em] text-noir-gold/65 uppercase mb-2">Discography</p>
            <h2 className="font-heading text-5xl md:text-6xl text-noir-ivory font-light tracking-wide">Music</h2>
            {catalogue && (
              <p className="font-body text-sm text-noir-silver/50 mt-3">
                {albumsWithTracks.length} albums · {catalogue.tracks.length} tracks
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href={SPOTIFY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#1DB954]/35 text-[#1DB954]/75 font-body text-xs tracking-[0.18em] uppercase hover:bg-[#1DB954]/10 hover:text-[#1DB954] hover:border-[#1DB954]/55 hover:shadow-[0_0_16px_rgba(29,185,84,0.1)] transition-all duration-300"
              title="The Life Lessons I Hope You Learn — on Spotify"
            >
              <SpotifyIcon className="w-3.5 h-3.5" />
              Life Lessons · Spotify
            </a>
            <Link
              href="/music"
              className="inline-flex items-center gap-2 px-4 py-2 border border-noir-silver/20 text-noir-silver/65 font-body text-xs tracking-[0.18em] uppercase hover:border-noir-gold/35 hover:text-noir-ivory transition-all duration-300"
            >
              All albums
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-noir-deep/40 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        {/* Albums */}
        {!loading && (
          <div className="space-y-4">
            {albumsWithTracks.map(({ meta, tracks }) => (
              <AlbumBlock key={meta.slug} meta={meta} tracks={tracks} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-noir-silver/10">
          <Link
            href="/music"
            className="inline-flex items-center gap-3 font-body text-sm tracking-[0.15em] uppercase text-noir-silver/65 hover:text-noir-ivory border-b border-noir-silver/20 hover:border-noir-gold/50 pb-1 transition-all duration-300"
          >
            Full discography — lyrics & tracklists
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href={SPOTIFY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-[#1DB954]/60 hover:text-[#1DB954] transition-colors"
            title="The Life Lessons I Hope You Learn — on Spotify"
          >
            <SpotifyIcon className="w-4 h-4" />
            Life Lessons on Spotify
          </a>
        </div>

      </div>
    </section>
  )
}
