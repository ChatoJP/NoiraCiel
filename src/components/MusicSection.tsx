'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TrackCard from './player/TrackCard'
import type { MusicCatalogue, Track } from '@/lib/types'

const SPOTIFY_URL = 'https://open.spotify.com/album/49QDSwM3584OawGtC0O7eR?si=yTeObxPpRBivSExi1ehuXg'

const CHAPTER_EMOTIONS: Record<number, string> = {
  1:'The lifelong question.', 2:'The hollowness of achievement.', 3:'The invisible inheritance.',
  4:'The weight of unspoken words.', 5:'Dignity in honest work.', 6:'The grace of companionship.',
  7:"A parent's silent vigil.", 8:'Recognition — love that was always there.', 9:'The call that changes darkness.',
  10:'The house that holds memory.', 11:'The tenderness of simplicity.', 12:"Love's most silent language.",
  13:'Grief that found its place.', 14:'Patience as a radical act.', 15:'The courage of revision.',
  16:'Gratitude for borrowed time.', 17:'Freedom as clarity.',
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-silver/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="Search tracks..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-noir-deep/60 border border-noir-silver/15 text-noir-ivory font-body text-sm placeholder-noir-silver/30 focus:outline-none focus:border-noir-gold/40 transition-colors"
      />
    </div>
  )
}

export default function MusicSection() {
  const [catalogue, setCatalogue] = useState<MusicCatalogue | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    fetch('/api/music')
      .then((r) => r.json())
      .then((data: MusicCatalogue) => {
        setCatalogue(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered: Track[] = (catalogue?.tracks || []).filter((t) =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.artist || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section id="music" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-body text-xs tracking-[0.35em] text-noir-gold/60 uppercase mb-2">
              {catalogue?.albumMeta?.title ?? 'The Catalogue'}
            </p>
            <h2 className="font-heading text-5xl md:text-6xl text-noir-ivory font-light tracking-wide">
              Music
            </h2>
            {catalogue && (
              <p className="font-body text-sm text-noir-silver/40 mt-3">
                {catalogue.total} track{catalogue.total !== 1 ? 's' : ''}
                {catalogue.albumMeta?.totalDurationFormatted && (
                  <span> · {catalogue.albumMeta.totalDurationFormatted}</span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Spotify CTA */}
            <a
              href={SPOTIFY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#1DB954]/30 text-[#1DB954]/70 font-body text-xs tracking-[0.15em] uppercase hover:bg-[#1DB954]/10 hover:text-[#1DB954] transition-all"
            >
              <SpotifyIcon className="w-3.5 h-3.5" />
              Spotify
            </a>

            {/* View toggle */}
            <div className="flex border border-noir-silver/15">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 transition-colors ${view === 'list' ? 'bg-noir-silver/15 text-noir-ivory' : 'text-noir-silver/40 hover:text-noir-ivory'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
              </button>
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 transition-colors ${view === 'grid' ? 'bg-noir-silver/15 text-noir-ivory' : 'text-noir-silver/40 hover:text-noir-ivory'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-sm">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-noir-deep/40 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="font-heading italic text-xl text-noir-silver/40">No tracks found.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            {view === 'list' ? (
              <div className="border border-noir-silver/10">
                <div className="flex items-center gap-4 px-4 py-2 border-b border-noir-silver/10">
                  <span className="w-8 font-body text-[10px] tracking-[0.2em] text-noir-silver/30 uppercase">#</span>
                  <span className="w-14 flex-shrink-0" />
                  <span className="flex-1 font-body text-[10px] tracking-[0.2em] text-noir-silver/30 uppercase">Chapter</span>
                  <span className="hidden sm:block w-16 font-body text-[10px] tracking-[0.2em] text-noir-silver/30 uppercase">Format</span>
                  <span className="font-body text-[10px] tracking-[0.2em] text-noir-silver/30 uppercase w-10 text-right">Time</span>
                </div>
                {filtered.map((track, i) => (
                  <div key={track.id} className="group relative">
                    <TrackCard track={track} playlist={filtered} index={i} variant="list" />
                    {/* Chapter link on hover */}
                    <Link
                      href={`/songs/${track.slug}`}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 font-body text-[10px] tracking-[0.15em] text-noir-silver/40 hover:text-noir-gold uppercase transition-colors bg-noir-black/80 px-2 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((track, i) => (
                  <div key={track.id} className="relative group">
                    <TrackCard track={track} playlist={filtered} index={i} variant="grid" />
                    <Link
                      href={`/songs/${track.slug}`}
                      className="absolute bottom-0 left-0 right-0 py-1.5 bg-noir-void/90 text-center font-body text-[9px] tracking-[0.2em] text-noir-silver/50 hover:text-noir-gold uppercase transition-colors translate-y-full group-hover:translate-y-0 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {CHAPTER_EMOTIONS[track.trackNumber ?? 0] ?? 'Open chapter'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Bottom: full album link + Spotify */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-noir-silver/10">
          <Link
            href="/music"
            className="inline-flex items-center gap-3 font-body text-sm tracking-[0.15em] uppercase text-noir-silver/60 hover:text-noir-ivory border-b border-noir-silver/20 hover:border-noir-ivory pb-1 transition-all duration-300"
          >
            Full album — lyrics & tracklist
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <a
            href={SPOTIFY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-[#1DB954]/60 hover:text-[#1DB954] transition-colors"
          >
            <SpotifyIcon className="w-4 h-4" />
            Open on Spotify
          </a>
        </div>
      </div>
    </section>
  )
}
