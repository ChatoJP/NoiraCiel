'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

export interface GalleryItem {
  id: string
  title: string
  imageUrl: string
  linkTo?: string
  trackNumber?: number
  kind: 'gallery' | 'song-art'
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
  item,
  items,
  onClose,
  onPrev,
  onNext,
}: {
  item: GalleryItem
  items: GalleryItem[]
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const idx = items.indexOf(item)
  const [hintVisible, setHintVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(4,4,10,0.96)' }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-6 right-6 text-noir-silver/50 hover:text-noir-ivory transition-colors z-10"
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-noir-silver/40 hover:text-noir-gold transition-colors z-10 p-3"
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        aria-label="Previous"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Image */}
      <div
        className="relative max-h-[88vh] max-w-[88vw] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.title}
          className="max-h-[80vh] max-w-[80vw] object-contain"
          style={{ boxShadow: '0 0 120px rgba(0,0,0,0.9)' }}
        />

        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full pt-5 text-center">
          {item.trackNumber !== undefined && (
            <p className="font-body text-[9px] tracking-[0.45em] text-noir-gold/50 uppercase mb-1">
              Chapter {String(item.trackNumber).padStart(2, '0')}
            </p>
          )}
          <p className="font-heading italic text-lg text-noir-ivory/80">{item.title}</p>
          <p className="font-body text-[10px] tracking-[0.3em] text-noir-silver/25 uppercase mt-1">
            {idx + 1} / {items.length}
          </p>
          {item.linkTo && (
            <Link
              href={`/songs/${item.linkTo}`}
              className="inline-block mt-3 font-body text-[9px] tracking-[0.3em] uppercase text-noir-gold/60 hover:text-noir-gold border-b border-noir-gold/20 hover:border-noir-gold/50 pb-0.5 transition-colors"
              onClick={onClose}
            >
              Open chapter →
            </Link>
          )}
        </div>
      </div>

      {/* Next */}
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-noir-silver/40 hover:text-noir-gold transition-colors z-10 p-3"
        onClick={(e) => { e.stopPropagation(); onNext() }}
        aria-label="Next"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Keyboard hint — fades after 3s */}
      <div
        className={`absolute bottom-6 right-6 flex items-center gap-2 font-body text-[10px] tracking-[0.25em] uppercase text-noir-silver/35 pointer-events-none transition-opacity duration-700 ${hintVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      >
        <span>← →</span>
        <span className="text-noir-silver/20">·</span>
        <span>Esc</span>
      </div>
    </div>
  )
}

// ─── Gallery piece ─────────────────────────────────────────────────────────────
function GalleryPiece({
  item,
  span = 'normal',
  onOpen,
}: {
  item: GalleryItem
  span?: 'normal' | 'wide' | 'tall'
  onOpen: (item: GalleryItem) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Fix for cached images that fire onLoad before React hydration
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [])

  const isChapter = item.kind === 'song-art' && item.trackNumber !== undefined

  const spanClass = span === 'wide' ? 'col-span-2' : span === 'tall' ? 'row-span-2' : ''
  const aspectClass = span === 'wide' ? 'aspect-[2/1]' : span === 'tall' ? 'aspect-[1/2]' : 'aspect-square'

  return (
    <div
      className={`group relative overflow-hidden cursor-pointer bg-noir-deep ${spanClass}`}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
      aria-label={`View ${item.title}`}
    >
      <div className={`relative ${aspectClass} overflow-hidden`}>
        {/* Placeholder shimmer */}
        {!loaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-noir-deep via-noir-navy/40 to-noir-deep animate-pulse" />
        )}

        {/* Image — ref fixes the cached-load bug */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={item.imageUrl}
          alt={item.title}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Cinematic overlay: dark at bottom, clear at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-noir-void/95 via-noir-void/20 to-transparent opacity-55 group-hover:opacity-90 transition-opacity duration-500" />

        {/* Track number badge — always visible for song-art items */}
        {isChapter && item.trackNumber !== undefined && (
          <div className="absolute top-3 left-3">
            <span className="font-body text-[8px] tracking-[0.25em] text-noir-gold/80 bg-noir-void/80 border border-noir-gold/25 px-1.5 py-0.5 backdrop-blur-sm">
              {String(item.trackNumber).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Expand icon — top right on hover */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-100 scale-90">
          <div className="w-8 h-8 border border-noir-ivory/35 flex items-center justify-center backdrop-blur-sm bg-noir-void/40">
            <svg className="w-3.5 h-3.5 text-noir-ivory/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>

        {/* Caption at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
          {isChapter && (
            <p className="font-body text-[8px] tracking-[0.45em] text-noir-gold/75 uppercase mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
              Chapter {String(item.trackNumber).padStart(2, '0')}
            </p>
          )}
          <p className="font-heading italic text-sm leading-snug text-noir-ivory/90">{item.title}</p>
          {item.linkTo && (
            <p className="font-body text-[8px] tracking-[0.25em] text-noir-gold/55 uppercase mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-400 delay-75">
              Open chapter →
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Horizontal filmstrip ─────────────────────────────────────────────────────
function Filmstrip({ images }: { images: string[] }) {
  const doubled = [...images, ...images]

  return (
    <div className="w-full overflow-hidden mb-0 group/strip" aria-hidden>
      <div
        className="flex gap-1"
        style={{
          width: `${doubled.length * 176}px`,
          animation: 'filmstrip 50s linear infinite',
          animationPlayState: 'running',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'paused')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.animationPlayState = 'running')}
      >
        {doubled.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 overflow-hidden relative"
            style={{ width: '168px', height: '100px' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              aria-hidden
              loading="lazy"
              className="w-full h-full object-cover opacity-55 hover:opacity-85 transition-opacity duration-700 animate-ken-burns"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────
type GalleryFilter = 'all' | 'photography' | 'song-art' | 'objects'

const GALLERY_FILTERS: { value: GalleryFilter; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'photography', label: 'Photography' },
  { value: 'song-art',   label: 'Song Art' },
  { value: 'objects',    label: 'Objects' },
]

interface Props { items: GalleryItem[] }

export default function GallerySection({ items }: Props) {
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null)
  const [filter, setFilter] = useState<GalleryFilter>('all')

  const openLightbox = useCallback((item: GalleryItem) => setLightboxItem(item), [])
  const closeLightbox = useCallback(() => setLightboxItem(null), [])

  const prevItem = useCallback(() => {
    if (!lightboxItem) return
    const idx = filteredItems.indexOf(lightboxItem)
    setLightboxItem(filteredItems[(idx - 1 + filteredItems.length) % filteredItems.length])
  }, [lightboxItem, items]) // eslint-disable-line react-hooks/exhaustive-deps

  const nextItem = useCallback(() => {
    if (!lightboxItem) return
    const idx = filteredItems.indexOf(lightboxItem)
    setLightboxItem(filteredItems[(idx + 1) % filteredItems.length])
  }, [lightboxItem, items]) // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0) return null

  const filteredItems = filter === 'all' ? items
    : filter === 'photography' ? items.filter(i => i.kind === 'gallery' && !i.id.startsWith('object-'))
    : filter === 'song-art'   ? items.filter(i => i.kind === 'song-art')
    : items.filter(i => i.id.startsWith('object-'))

  const featured = filteredItems[0]
  const rest = filteredItems.slice(1)

  return (
    <>
      <section id="gallery" className="py-0 relative overflow-hidden">

        {/* ── Cinematic section divider ── */}
        <div className="divider-gold mx-6 max-w-6xl" />

        {/* ── Section header ── */}
        <div className="pt-24 pb-8 px-6 max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-body text-[9px] tracking-[0.6em] text-noir-gold/60 uppercase mb-3">The Visual Archive</p>
            <h2 className="font-heading font-light text-6xl md:text-8xl text-noir-ivory tracking-wide leading-none">
              Gallery
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <p className="font-heading italic text-sm text-noir-silver/50 max-w-xs text-right leading-relaxed">
              Each chapter has its own world,<br />painted in dark Atlantic light.
            </p>
            <Link href="/music"
              className="font-body text-[10px] tracking-[0.25em] uppercase text-noir-silver/45 hover:text-noir-gold border-b border-noir-silver/20 hover:border-noir-gold/50 pb-0.5 transition-all duration-300">
              Full tracklist →
            </Link>
          </div>
        </div>

        {/* Filter tabs (#30) */}
        <div className="px-6 max-w-6xl mx-auto pb-6 flex items-center gap-0.5">
          {GALLERY_FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`font-body text-[9px] tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 ${
                filter === f.value
                  ? 'text-noir-gold border-b border-noir-gold'
                  : 'text-noir-silver/32 hover:text-noir-ivory border-b border-transparent'
              }`}>
              {f.label}
              <span className="ml-1 opacity-35 text-[8px]">
                ({f.value === 'all' ? items.length
                  : f.value === 'photography' ? items.filter(i => i.kind === 'gallery' && !i.id.startsWith('object-')).length
                  : f.value === 'song-art' ? items.filter(i => i.kind === 'song-art').length
                  : items.filter(i => i.id.startsWith('object-')).length})
              </span>
            </button>
          ))}
        </div>

        {/* ── Filmstrip ── */}
        <Filmstrip images={filteredItems.map((i) => i.imageUrl)} />

        {/* ── Masonry grid ── */}
        <div className="px-6 pt-1 max-w-6xl mx-auto">
          {filteredItems.length === 0 && (
            <div className="py-24 text-center font-body text-xs text-noir-silver/30 tracking-[0.3em] uppercase">No items in this category</div>
          )}

          {/* Row 1: wide featured + 2 normals */}
          {featured && <div className="grid grid-cols-4 gap-1 mb-1">
            <div className="col-span-2">
              <GalleryPiece item={featured} span="wide" onOpen={openLightbox} />
            </div>
            {rest.slice(0, 2).map((item) => (
              <GalleryPiece key={item.id} item={item} onOpen={openLightbox} />
            ))}
          </div>}

          {/* Row 2: 4 normal */}
          <div className="grid grid-cols-4 gap-1 mb-1">
            {rest.slice(2, 6).map((item) => (
              <GalleryPiece key={item.id} item={item} onOpen={openLightbox} />
            ))}
          </div>

          {/* Row 3: 3 normal + 1 wide */}
          {rest.length > 6 && (
            <div className="grid grid-cols-4 gap-1 mb-1">
              {rest.slice(6, 9).map((item) => (
                <GalleryPiece key={item.id} item={item} onOpen={openLightbox} />
              ))}
              {rest[9] && (
                <GalleryPiece item={rest[9]} onOpen={openLightbox} />
              )}
            </div>
          )}

          {/* Remaining items */}
          {rest.length > 10 && (
            <div className="grid grid-cols-4 gap-1">
              {rest.slice(10).map((item) => (
                <GalleryPiece key={item.id} item={item} onOpen={openLightbox} />
              ))}
            </div>
          )}

          {/* Museum label */}
          <div className="mt-10 pb-24 flex items-center gap-5">
            <div className="divider-silver flex-1" />
            <p className="font-body text-[9px] tracking-[0.4em] text-noir-silver/25 uppercase">
              Digital Museum · NoiraCiel · Atlantic Noir
            </p>
            <div className="divider-silver flex-1" />
          </div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxItem && (
        <Lightbox
          item={lightboxItem}
          items={items}
          onClose={closeLightbox}
          onPrev={prevItem}
          onNext={nextItem}
        />
      )}
    </>
  )
}
