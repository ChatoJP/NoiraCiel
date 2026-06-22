'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudio } from '@/context/AudioContext'
import type { Track, MusicCatalogue } from '@/lib/types'

function useReveal() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() } }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function FeaturedTrack({ track, playlist, label }: { track: Track; playlist: Track[]; label: string }) {
  const { currentTrack, isPlaying, play, toggle } = useAudio()
  const isCurrent = currentTrack?.id === track.id

  return (
    <div
      className="group relative overflow-hidden border border-noir-silver/8 hover:border-noir-gold/35 transition-all duration-500 cursor-pointer"
      onClick={() => isCurrent ? toggle() : play(track, playlist)}
    >
      {/* Background art */}
      <div className="aspect-square bg-gradient-to-br from-noir-navy via-noir-atlantic to-noir-deep relative overflow-hidden">
        {track.songArtUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.songArtUrl}
            alt={track.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading text-7xl text-noir-gold/12 select-none">
              {track.trackNumber ? String(track.trackNumber).padStart(2, '0') : '◆'}
            </span>
          </div>
        )}
        {/* Dark gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-noir-void/70" />

        {/* Play overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-noir-void/40 ${
          isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className="w-16 h-16 border border-noir-gold/60 bg-noir-void/50 flex items-center justify-center">
            {isCurrent && isPlaying ? (
              <svg className="w-5 h-5 text-noir-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-noir-gold ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>

        {/* Label badge */}
        <div className="absolute top-3 left-3">
          <span className="font-body text-[8px] tracking-[0.35em] text-noir-gold uppercase bg-noir-void/70 px-2 py-1 border border-noir-gold/25">
            {label}
          </span>
        </div>

        {/* Duration badge — appears on hover (#25) */}
        {track.durationFormatted && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="font-body text-[8px] tracking-[0.2em] text-noir-ivory/70 bg-noir-void/70 border border-noir-silver/15 px-2 py-0.5 backdrop-blur-sm">
              {track.durationFormatted}
            </span>
          </div>
        )}

        {/* Track number corner — gold (#28) */}
        <div className="absolute bottom-3 right-3 opacity-30 group-hover:opacity-60 transition-opacity">
          <span className="font-heading text-3xl text-noir-gold/25 tabular-nums select-none">
            {String(track.trackNumber ?? 0).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Gold bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-noir-gold/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

      {/* Info */}
      <div className="p-5 border-t border-noir-silver/10">
        <p className={`font-heading text-xl leading-tight ${isCurrent ? 'text-noir-gold' : 'text-noir-ivory group-hover:text-noir-gold'} transition-colors mb-1`}>
          {track.title}
        </p>
        <p className="font-body text-xs text-noir-silver/45 tracking-wide">
          {track.artist || 'NoiraCiel'} · {track.durationFormatted}
        </p>
        {isCurrent && isPlaying && (
          <p className="font-body text-[9px] tracking-[0.2em] uppercase text-noir-gold/60 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-noir-gold animate-pulse-gold" />
            Now playing
          </p>
        )}
      </div>
    </div>
  )
}

export default function FeaturedReleases() {
  const [catalogue, setCatalogue] = useState<MusicCatalogue | null>(null)
  const sectionRef = useReveal() as React.RefObject<HTMLElement>

  useEffect(() => {
    fetch('/api/music')
      .then((r) => r.json())
      .then(setCatalogue)
      .catch(() => {})
  }, [])

  if (!catalogue || catalogue.tracks.length === 0) return null

  const tracks = catalogue.tracks
  const featured: { track: Track; label: string }[] = []

  if (tracks[0]) featured.push({ track: tracks[0], label: 'Opening Track' })
  const mid = Math.floor(tracks.length / 2)
  if (tracks[mid] && tracks[mid].id !== tracks[0]?.id) featured.push({ track: tracks[mid], label: 'Featured' })
  const last = tracks[tracks.length - 1]
  if (last && last.id !== tracks[0]?.id && last.id !== tracks[mid]?.id) featured.push({ track: last, label: 'Closing Track' })

  return (
    <section className="py-28 px-6 bg-gradient-to-b from-noir-black to-noir-deep/40 section-gold-top">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-body text-[9px] tracking-[0.6em] text-noir-gold/65 uppercase mb-3">Highlights</p>
            <h2 className="font-heading text-5xl md:text-8xl text-noir-ivory font-light tracking-wide section-reveal">
              Featured
            </h2>
          </div>
          <p className="font-body text-xs text-noir-silver/50 max-w-xs leading-relaxed italic font-heading">
            "Not a genre. Not a medium.<br />Art in its truest form — a way of living."
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map(({ track, label }) => (
            <FeaturedTrack key={track.id} track={track} playlist={tracks} label={label} />
          ))}
        </div>

        <div className="mt-14 flex items-center justify-center gap-6">
          <div className="w-24 h-px bg-noir-gold/20" />
          <a
            href="/music"
            className="inline-flex items-center gap-3 font-body text-xs tracking-[0.25em] uppercase text-noir-gold/70 hover:text-noir-gold transition-colors duration-300 border-b border-noir-gold/20 hover:border-noir-gold/50 pb-0.5"
          >
            View all {tracks.length} tracks &amp; albums
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <div className="w-24 h-px bg-noir-gold/20" />
        </div>
      </div>
    </section>
  )
}
