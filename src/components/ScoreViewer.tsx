'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAudio } from '@/context/AudioContext'

interface ScoreManifest {
  slug: string
  stems: string[]
  pages: Record<string, number>
}

const STEM_LABEL: Record<string, string> = {
  vocals: 'Vocal Melody',
  other:  'Harmony',
  bass:   'Bass',
  drums:  'Percussion',
}

interface Props {
  trackSlug: string
  manifestUrl: string
}

export default function ScoreViewer({ trackSlug, manifestUrl }: Props) {
  const [manifest, setManifest]         = useState<ScoreManifest | null>(null)
  const [activeStem, setActiveStem]     = useState('')
  const [activePage, setActivePage]     = useState(0)
  const [progressInPage, setProgress]   = useState(0)   // 0–1 within the current page
  const [noteXs, setNoteXs]             = useState<number[]>([])  // sorted x% positions of note attacks
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const noteCache = useRef<Map<string, number[]>>(new Map())
  const { currentTime, duration, currentTrack, isPlaying } = useAudio()

  useEffect(() => {
    fetch(manifestUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ScoreManifest | null) => {
        if (data) { setManifest(data); setActiveStem(data.stems[0] ?? '') }
      })
      .catch(() => {})
  }, [manifestUrl])

  const scrollToPage = useCallback((index: number) => {
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    if (!manifest || !currentTrack || currentTrack.slug !== trackSlug) return
    if (!duration || duration === 0) return

    const pageCount  = manifest.pages[activeStem] ?? 1
    const fraction   = Math.min(currentTime / duration, 0.9999)
    const pageIndex  = Math.floor(fraction * pageCount)
    const pageStart  = pageIndex / pageCount
    const pageEnd    = (pageIndex + 1) / pageCount
    const progress   = (fraction - pageStart) / (pageEnd - pageStart)

    setProgress(Math.max(0, Math.min(1, progress)))

    if (pageIndex !== activePage) {
      setActivePage(pageIndex)
      scrollToPage(pageIndex)
    }
  }, [currentTime, duration, currentTrack, trackSlug, manifest, activeStem, activePage, scrollToPage])

  useEffect(() => {
    if (!manifest) return
    const key = `${manifest.slug}-${activeStem}-${activePage}`
    if (noteCache.current.has(key)) {
      setNoteXs(noteCache.current.get(key)!)
      return
    }
    const url = `/Books/scores/${manifest.slug}/${activeStem}-page-${activePage + 1}.svg`
    fetch(url).then(r => r.text()).then(text => {
      // Parse notehead x-positions from verovio SVG
      const noteheadRe = /class="notehead">\s*<use\s[^>]*transform="translate\((\d+),\s*(\d+)\)"/g
      const rawXs = [...text.matchAll(noteheadRe)].map(m => parseInt(m[1]))
      // Cluster notes within 200 SVG units (chords / ornaments) → one attack point
      const sortedXs = [...new Set(rawXs)].sort((a, b) => a - b)
      const beats: number[] = []
      let lastX = -Infinity
      for (const x of sortedXs) {
        if (x - lastX > 200) {
          beats.push(x / 21000 * 100)
          lastX = x
        }
      }
      noteCache.current.set(key, beats)
      setNoteXs(beats)
    }).catch(() => {})
  }, [manifest, activeStem, activePage])

  if (!manifest || manifest.stems.length === 0) return null

  const pageCount = manifest.pages[activeStem] ?? 0
  const isLive    = currentTrack?.slug === trackSlug && isPlaying

  const activeNoteIdx = noteXs.length > 0
    ? Math.min(Math.floor(progressInPage * noteXs.length), noteXs.length - 1)
    : -1

  return (
    <div className="mt-16 border-t border-noir-silver/10 pt-10">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="font-body text-[10px] tracking-[0.35em] text-noir-gold/50 uppercase mb-1">
            Musical Score
          </p>
          <p className="font-body text-[9px] text-noir-silver/25 italic">
            AI transcription · creative reference only
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stem tabs */}
          {manifest.stems.length > 1 && (
            <div className="flex gap-1">
              {manifest.stems.map((stem) => (
                <button
                  key={stem}
                  onClick={() => { setActiveStem(stem); setActivePage(0); setProgress(0) }}
                  className={`px-3 py-1.5 font-body text-[9px] tracking-[0.15em] uppercase border transition-all ${
                    stem === activeStem
                      ? 'border-noir-gold/40 text-noir-gold'
                      : 'border-noir-silver/15 text-noir-silver/35 hover:border-noir-silver/30 hover:text-noir-silver/60'
                  }`}
                >
                  {STEM_LABEL[stem] ?? stem}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live indicator + page count */}
      <div className="flex items-center justify-between mb-4">
        {isLive ? (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-noir-gold animate-pulse" />
            <span className="font-body text-[9px] tracking-[0.2em] text-noir-gold/55 uppercase">
              Following playback
            </span>
          </div>
        ) : (
          <div />
        )}
        <span className="font-body text-[9px] text-noir-silver/25">
          {activePage + 1} / {pageCount}
        </span>
      </div>

      {/* Master progress bar across all pages */}
      {isLive && duration > 0 && (
        <div className="w-full h-px bg-noir-silver/10 mb-5 relative overflow-hidden rounded-full">
          <div
            className="absolute inset-y-0 left-0 bg-noir-gold/60 rounded-full"
            style={{
              width: `${(currentTime / duration) * 100}%`,
              transition: 'width 0.25s linear',
            }}
          />
        </div>
      )}

      {/* Score pages */}
      <div ref={containerRef} className="space-y-3 max-h-[80vh] overflow-y-auto">
        {Array.from({ length: pageCount }, (_, i) => {
          const isActive = i === activePage
          return (
            <div
              key={`${activeStem}-${i}`}
              ref={(el) => { pageRefs.current[i] = el }}
              className="relative select-none"
              style={{
                opacity: isLive ? (isActive ? 1 : 0.35) : 1,
                transition: 'opacity 0.6s ease',
              }}
            >
              {/* Score image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/Books/scores/${manifest.slug}/${activeStem}-page-${i + 1}.svg`}
                alt={`Score page ${i + 1} of ${pageCount}`}
                className="w-full block"
                style={{ background: '#f9f7f2' }}
                loading={i === 0 ? 'eager' : 'lazy'}
              />

              {/* Playhead — only on active page while playing */}
              {isLive && isActive && (
                <>
                  {/* Note cursor needle */}
                  {activeNoteIdx >= 0 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0"
                      style={{
                        left: `${noteXs[activeNoteIdx]}%`,
                        width: '2px',
                        transform: 'translateX(-1px)',
                        background: 'rgba(196,149,58,0.85)',
                        boxShadow: '0 0 10px 3px rgba(196,149,58,0.35), 0 0 24px 6px rgba(196,149,58,0.12)',
                        transition: 'left 0.12s ease',
                      }}
                    />
                  )}
                  {/* Soft glow behind current note column */}
                  {activeNoteIdx >= 0 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0"
                      style={{
                        left: `${noteXs[activeNoteIdx]}%`,
                        width: '32px',
                        transform: 'translateX(-16px)',
                        background: 'rgba(196,149,58,0.06)',
                        transition: 'left 0.12s ease',
                      }}
                    />
                  )}
                  {/* Page progress strip at top */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: 'rgba(196,149,58,0.12)' }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-noir-gold/70"
                      style={{
                        width: `${progressInPage * 100}%`,
                        transition: 'width 0.28s linear',
                      }}
                    />
                  </div>
                </>
              )}

              {/* Page number badge */}
              {!isLive && (
                <div className="absolute bottom-2 right-3 font-body text-[8px] text-noir-silver/20 tabular-nums">
                  {i + 1}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Page dots */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => { setActivePage(i); scrollToPage(i) }}
              aria-label={`Go to page ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === activePage
                  ? 'w-4 h-1.5 bg-noir-gold'
                  : 'w-1.5 h-1.5 bg-noir-silver/20 hover:bg-noir-silver/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
