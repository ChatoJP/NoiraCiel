'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { VideoEntry } from '@/lib/types'
import { useTheme } from '@/context/ThemeContext'
import { getThemeForAlbum } from '@/lib/themes'

// Extended with trackNumber and albumSlug for ordering and grouping
interface LyricVideo extends VideoEntry {
  trackNumber?: number
  albumSlug?: string
}

const ALBUM_TABS = [
  { slug: 'all',                    label: 'All',            genre: 'All Albums' },
  { slug: 'main',                   label: 'Life Lessons',   genre: 'Atlantic Noir' },
  { slug: 'jazz-sessions',          label: 'Jazz Sessions',  genre: 'Jazz · Atlantic Noir' },
  { slug: 'reggae-sessions',        label: 'Reggae Sessions', genre: 'Reggae · Roots · Dub' },
  { slug: 'blind-angel',            label: 'Blind Angel',    genre: 'Intimate Metal' },
  { slug: 'the-velvet-machine',     label: 'Velvet Machine', genre: 'Electronic · Fado' },
  { slug: 'still-we-sail',          label: 'Still We Sail',  genre: 'Atlantic Noir · Fado' },
  { slug: 'whats-youre-made-of',    label: "Made Of",        genre: 'Hip-Hop · DnB · Soul' },
  { slug: 'the-sacred-drift',       label: 'Sacred Drift',   genre: 'Indie Pop · Psych' },
]

// Album slug → short display name for badges in "All" view
const ALBUM_BADGE: Record<string, string> = {
  'main':             'Life Lessons',
  'jazz-sessions':    'Jazz',
  'reggae-sessions':  'Reggae',
  'blind-angel':      'Blind Angel',
}

// ─── Inline video player ───────────────────────────────────────────────────────
function VideoCard({ video, featured = false, showAlbumBadge = false }: { video: LyricVideo; featured?: boolean; showAlbumBadge?: boolean }) {
  const [playing, setPlaying] = useState(false)

  const chapterSlug = video.trackId ?? null

  if (featured) {
    return (
      <div className="relative overflow-hidden border border-noir-silver/10 hover:border-t-accent/25 transition-all duration-500 group">
        <div className="aspect-video relative bg-noir-deep">
          {playing ? (
            <video
              src={video.url}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              autoPlay
            />
          ) : (
            <>
              {video.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-65 transition-opacity duration-500 group-hover:scale-105 transition-transform"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-noir-void/90 via-noir-void/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setPlaying(true)}
                  className="w-20 h-20 rounded-full border border-noir-ivory/30 bg-noir-void/50 flex items-center justify-center hover:bg-t-accent/15 hover:border-t-accent/50 transition-all duration-300"
                  aria-label={`Play ${video.title}`}
                >
                  <svg className="w-8 h-8 text-noir-ivory ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                {video.trackNumber != null && (
                  <p className="font-body text-[10px] tracking-[0.4em] text-t-accent/65 uppercase mb-2">
                    Chapter {String(video.trackNumber).padStart(2, '0')} · Lyric Video
                  </p>
                )}
                <h3 className="font-heading font-light text-3xl md:text-4xl text-noir-ivory mb-2 leading-tight">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="font-heading italic text-sm md:text-base text-noir-ivory/55 max-w-xl leading-relaxed">
                    {video.description}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        {/* Chapter link */}
        {!playing && chapterSlug && (
          <div className="absolute top-4 right-4">
            <Link
              href={`/songs/${chapterSlug}`}
              className="font-body text-[9px] tracking-[0.25em] uppercase text-noir-silver/40 hover:text-t-accent border border-noir-silver/15 hover:border-t-accent/40 px-3 py-1.5 bg-noir-void/60 transition-all"
            >
              Chapter →
            </Link>
          </div>
        )}
      </div>
    )
  }

  // Grid card
  return (
    <div className="group relative overflow-hidden border border-noir-silver/8 hover:border-t-accent/25 transition-all duration-400 bg-noir-deep">
      <div className="aspect-video relative overflow-hidden">
        {playing ? (
          <video
            src={video.url}
            className="absolute inset-0 w-full h-full object-cover"
            controls
            autoPlay
          />
        ) : (
          <>
            {video.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnail}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-noir-navy to-noir-atlantic" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-noir-void/80 via-transparent to-transparent" />
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => setPlaying(true)}
                className="w-12 h-12 rounded-full border border-noir-ivory/40 bg-noir-void/60 flex items-center justify-center hover:bg-t-accent/15 hover:border-t-accent/50 transition-all"
                aria-label={`Play ${video.title}`}
              >
                <svg className="w-5 h-5 text-noir-ivory ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            {/* Track number badge */}
            {video.trackNumber != null && (
              <div className="absolute top-2 left-2">
                <span className="font-body text-[8px] tracking-[0.25em] text-t-accent/70 bg-noir-void/75 border border-t-accent/25 px-1.5 py-0.5">
                  {String(video.trackNumber).padStart(2, '0')}
                </span>
              </div>
            )}
            {/* Album badge in "All" view */}
            {showAlbumBadge && video.albumSlug && ALBUM_BADGE[video.albumSlug] && (
              <div className="absolute bottom-2 left-2">
                <span className="font-body text-[7px] tracking-[0.2em] text-noir-silver/60 bg-noir-void/80 border border-noir-silver/15 px-1.5 py-0.5 uppercase">
                  {ALBUM_BADGE[video.albumSlug]}
                </span>
              </div>
            )}
          </>
        )}
      </div>
      {/* Card footer */}
      {!playing && (
        <div className="p-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading italic text-sm text-noir-ivory/85 leading-tight truncate">
              {video.title}
            </p>
            {video.description && (
              <p className="font-body text-[10px] text-noir-silver/45 mt-0.5 leading-snug line-clamp-1">
                {video.description}
              </p>
            )}
          </div>
          {chapterSlug && (
            <Link
              href={`/songs/${chapterSlug}`}
              className="flex-shrink-0 font-body text-[9px] tracking-[0.15em] uppercase text-noir-silver/30 hover:text-t-accent transition-colors mt-0.5 whitespace-nowrap"
              title="Open chapter"
            >
              →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Videos section ──────────────────────────────────────────────────────
export default function Videos() {
  const [allVideos, setAllVideos] = useState<LyricVideo[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showAll, setShowAll]     = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    fetch('/lyric-videos.json')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.videos)) {
          setAllVideos(data.videos)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Reset showAll and shift theme when switching tabs
  useEffect(() => {
    setShowAll(false)
    if (activeTab !== 'all') {
      setTheme(getThemeForAlbum(activeTab))
    }
  }, [activeTab, setTheme])

  const isAllTab = activeTab === 'all'

  const ALBUM_SLUG_ORDER = ['main', 'jazz-sessions', 'reggae-sessions', 'blind-angel']

  const videos = isAllTab
    ? [...allVideos].sort((a, b) => {
        const aIdx = ALBUM_SLUG_ORDER.indexOf(a.albumSlug ?? 'main')
        const bIdx = ALBUM_SLUG_ORDER.indexOf(b.albumSlug ?? 'main')
        const idxDiff = (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
        if (idxDiff !== 0) return idxDiff
        return (a.trackNumber ?? 99) - (b.trackNumber ?? 99)
      })
    : allVideos
        .filter((v) => (v.albumSlug ?? 'main') === activeTab)
        .sort((a, b) => (a.trackNumber ?? 99) - (b.trackNumber ?? 99))

  const currentTab = ALBUM_TABS.find((t) => t.slug === activeTab) ?? ALBUM_TABS[0]
  const featured   = isAllTab ? null : (videos[0] ?? null)
  const rest       = isAllTab ? videos : videos.slice(1)
  const INITIAL_GRID = 9
  const visible    = (showAll || isAllTab) ? rest : rest.slice(0, INITIAL_GRID)

  return (
    <section id="videos" className="py-14 md:py-20 lg:py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-body text-[9px] tracking-[0.5em] text-t-accent/65 uppercase mb-3">Visual</p>
            <h2 className="font-heading text-5xl md:text-6xl text-noir-ivory font-light tracking-wide">
              Lyric Videos
            </h2>
            <p className="font-body text-sm text-noir-silver/40 mt-3 max-w-md leading-relaxed">
              Every chapter, word for word — lyric videos across all albums.
            </p>
          </div>
          <Link
            href="/music"
            className="btn-noir self-start md:self-auto"
          >
            Full catalogue →
          </Link>
        </div>

        {/* Album tabs */}
        <div className="flex items-stretch mb-8 border-b border-noir-silver/10">
          {/* "All" tab — always pinned left */}
          {(() => {
            const isActive = activeTab === 'all'
            return (
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-shrink-0 font-body text-[10px] tracking-[0.2em] uppercase px-5 py-3 border-b-2 transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'border-t-accent text-t-accent bg-t-accent/8'
                    : 'border-transparent text-noir-silver/55 hover:text-noir-silver/85'
                }`}
              >
                All
                <span className={`ml-2 text-[9px] ${isActive ? 'text-t-accent/70' : 'text-noir-silver/35'}`}>
                  {allVideos.length}
                </span>
              </button>
            )
          })()}
          {/* Divider */}
          <div className="w-px bg-noir-silver/10 my-2 flex-shrink-0" />
          {/* Per-album tabs — scrollable */}
          <div className="flex overflow-x-auto scrollbar-none flex-1">
            {ALBUM_TABS.filter(t => t.slug !== 'all').map((tab) => {
              const count = allVideos.filter((v) => (v.albumSlug ?? 'main') === tab.slug).length
              const isActive = activeTab === tab.slug
              return (
                <button
                  key={tab.slug}
                  onClick={() => setActiveTab(tab.slug)}
                  className={`flex-shrink-0 font-body text-[10px] tracking-[0.2em] uppercase px-5 py-3 border-b-2 transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'border-t-accent text-t-accent bg-t-accent/8'
                      : 'border-transparent text-noir-silver/50 hover:text-noir-silver/80'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-2 text-[9px] ${isActive ? 'text-t-accent/70' : 'text-noir-silver/25'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-noir-deep/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && !isAllTab && (
          <div className="border border-noir-silver/10 p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full border border-noir-silver/20 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-noir-silver/30 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="font-heading italic text-xl text-noir-silver/50 mb-3">The visuals are coming.</p>
            <p className="font-body text-sm text-noir-silver/40 max-w-sm">
              Lyric videos for this album are in production.
            </p>
          </div>
        )}

        {/* Featured video */}
        {!loading && featured && (
          <div className="mb-3">
            <VideoCard video={featured} featured />
          </div>
        )}

        {/* Grid of remaining videos */}
        {!loading && rest.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visible.map((video) => (
                <VideoCard key={video.id} video={video} showAlbumBadge={isAllTab} />
              ))}
            </div>

            {rest.length > INITIAL_GRID && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="font-body text-xs tracking-[0.25em] uppercase text-noir-silver/40 hover:text-noir-ivory border border-noir-silver/15 hover:border-noir-silver/35 px-8 py-3 transition-all"
                >
                  {showAll ? 'Show less' : `Show all ${videos.length} videos`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
