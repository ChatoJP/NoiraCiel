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
        <div className="absolute inset-0 bg-gradient-to-t from-noir-void via-noir-void/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

        {/* Expand icon — top right on hover */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-8 h-8 border border-noir-ivory/30 flex items-center justify-center backdrop-blur-sm bg-noir-void/30">
            <svg className="w-3.5 h-3.5 text-noir-ivory/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>

        {/* Caption at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-400">
          {isChapter && (
            <p className="font-body text-[8px] tracking-[0.45em] text-noir-gold/65 uppercase mb-1">
              Chapter {String(item.trackNumber).padStart(2, '0')}
            </p>
          )}
          <p className="font-heading italic text-sm leading-snug text-noir-ivory/85">{item.title}</p>
          {item.linkTo && (
            <p className="font-body text-[8px] tracking-[0.25em] text-noir-gold/45 uppercase mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Open chapter →
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Horizontal filmstrip ─────────────────────────────────────────────────────
const STRIP_IMAGES = [
  '/Images/chapter-banners/why.jpg',
  '/Images/gallery/the-atlantic-at-night.jpg',
  '/Images/chapter-banners/the-empty-chair.jpg',
  '/Images/gallery/the-winter-sea.jpg',
  '/Images/chapter-banners/borrowed-time.jpg',
  '/Images/gallery/coastal-road-at-dawn.jpg',
  '/Images/chapter-banners/free-men-tell-the-truth.jpg',
  '/Images/chapter-banners/leave-a-light-on.jpg',
  '/Images/gallery/the-vigil.jpg',
  '/Images/chapter-banners/side-by-side.jpg',
  '/Images/gallery/memory-of-water.jpg',
  '/Images/chapter-banners/still-worth-it.jpg',
]

function Filmstrip() {
  const doubled = [...STRIP_IMAGES, ...STRIP_IMAGES]

  return (
    <div className="w-full overflow-hidden mb-0" aria-hidden>
      <div
        className="flex gap-1"
        style={{
          width: `${doubled.length * 176}px`,
          animation: 'filmstrip 50s linear infinite',
        }}
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
              className="w-full h-full object-cover opacity-50 hover:opacity-80 transition-opacity duration-500 animate-ken-burns"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────
interface Props { items: GalleryItem[] }

export default function GallerySection({ items }: Props) {
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null)

  const openLightbox = useCallback((item: GalleryItem) => setLightboxItem(item), [])
  const closeLightbox = useCallback(() => setLightboxItem(null), [])

  const prevItem = useCallback(() => {
    if (!lightboxItem) return
    const idx = items.indexOf(lightboxItem)
    setLightboxItem(items[(idx - 1 + items.length) % items.length])
  }, [lightboxItem, items])

  const nextItem = useCallback(() => {
    if (!lightboxItem) return
    const idx = items.indexOf(lightboxItem)
    setLightboxItem(items[(idx + 1) % items.length])
  }, [lightboxItem, items])

  if (items.length === 0) return null

  // Build a masonry-style layout: first item wide, then alternating normal/tall
  const featured = items[0]
  const rest = items.slice(1)

  return (
    <>
      <section id="gallery" className="py-0 relative overflow-hidden">

        {/* ── Section header ── */}
        <div className="pt-28 pb-12 px-6 max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-body text-[9px] tracking-[0.55em] text-noir-gold/50 uppercase mb-3">The Visual Archive</p>
            <h2 className="font-heading font-light text-6xl md:text-8xl text-noir-ivory tracking-wide leading-none">
              Gallery
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <p className="font-heading italic text-sm text-noir-silver/40 max-w-xs text-right leading-relaxed">
              Each chapter has its own world,<br />painted in dark Atlantic light.
            </p>
            <Link
              href="/music"
              className="font-body text-[10px] tracking-[0.25em] uppercase text-noir-silver/40 hover:text-noir-gold border-b border-noir-silver/15 hover:border-noir-gold/40 pb-0.5 transition-all duration-300"
            >
              Full tracklist →
            </Link>
          </div>
        </div>

        {/* ── Filmstrip ── */}
        <Filmstrip />

        {/* ── Masonry grid ── */}
        <div className="px-6 pt-1 max-w-6xl mx-auto">

          {/* Row 1: wide featured + 2 normals */}
          <div className="grid grid-cols-4 gap-1 mb-1">
            <div className="col-span-2">
              <GalleryPiece item={featured} span="wide" onOpen={openLightbox} />
            </div>
            {rest.slice(0, 2).map((item) => (
              <GalleryPiece key={item.id} item={item} onOpen={openLightbox} />
            ))}
          </div>

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
          <div className="mt-8 pb-24 flex items-center gap-5">
            <div className="flex-1 h-px bg-noir-silver/6" />
            <p className="font-body text-[9px] tracking-[0.4em] text-noir-silver/15 uppercase">
              Digital Museum · NoiraCiel · Atlantic Noir
            </p>
            <div className="flex-1 h-px bg-noir-silver/6" />
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
