'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Story {
  slug: string
  title: string
  song: string
}

function formatSlug(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function AudiobookSection({ stories }: { stories: Story[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setProgress(audio.currentTime)
    const onDuration = () => setDuration(audio.duration)
    const onEnded = () => { setPlaying(false); setProgress(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [activeSlug])

  function formatTime(s: number) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  function handleSelect(slug: string) {
    if (activeSlug === slug) {
      if (playing) {
        audioRef.current?.pause()
        setPlaying(false)
      } else {
        audioRef.current?.play()
        setPlaying(true)
      }
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = `/Audio/audiobook/${slug}.mp3`
      audioRef.current.load()
      audioRef.current.play()
    }
    setActiveSlug(slug)
    setPlaying(true)
    setProgress(0)
    setDuration(0)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = t
    setProgress(t)
  }

  const active = stories.find(s => s.slug === activeSlug)

  return (
    <section className="mt-24 pt-16 border-t border-noir-silver/10">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="font-body text-[10px] tracking-[0.4em] text-noir-gold/60 uppercase mb-3">NoiraCiel</p>
        <h2 className="font-heading italic text-4xl md:text-5xl text-noir-ivory font-light mb-3">
          Audiobooks
        </h2>
        <p className="font-body text-sm text-noir-silver/40">
          Short stories — read aloud. One for each song.
        </p>
        <div className="w-px h-10 bg-gradient-to-b from-noir-gold/30 to-transparent mx-auto mt-6" />
      </div>

      {/* Sticky mini-player */}
      {activeSlug && (
        <div className="sticky top-0 z-20 bg-noir-black/95 backdrop-blur border-b border-noir-silver/10 px-6 py-3 mb-8">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <button
              onClick={() => handleSelect(activeSlug)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-noir-gold/40 hover:border-noir-gold transition-colors duration-300"
            >
              {playing ? (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <rect x="0" y="0" width="3" height="12" fill="#C4953A"/>
                  <rect x="7" y="0" width="3" height="12" fill="#C4953A"/>
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <polygon points="0,0 10,6 0,12" fill="#C4953A"/>
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-heading italic text-sm text-noir-ivory/90 truncate">{active?.title}</p>
              <p className="font-body text-[9px] tracking-[0.2em] text-noir-silver/40 truncate">{active ? formatSlug(active.slug) : ''}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <span className="font-body text-[10px] text-noir-silver/40 tabular-nums">{formatTime(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={progress}
                onChange={handleSeek}
                className="w-24 accent-amber-600 cursor-pointer"
              />
              <span className="font-body text-[10px] text-noir-silver/40 tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Story list */}
      <div className="space-y-px">
        {stories.map((story, i) => {
          const isActive = story.slug === activeSlug
          return (
            <button
              key={story.slug}
              onClick={() => handleSelect(story.slug)}
              className={`w-full text-left px-6 py-4 flex items-center gap-5 group transition-colors duration-200 ${
                isActive ? 'bg-noir-silver/5' : 'hover:bg-noir-silver/3'
              }`}
            >
              {/* Track number / play indicator */}
              <div className="flex-shrink-0 w-8 text-right">
                {isActive && playing ? (
                  <svg width="12" height="12" viewBox="0 0 10 12" fill="none" className="ml-auto">
                    <rect x="0" y="0" width="3" height="12" fill="#C4953A"/>
                    <rect x="7" y="0" width="3" height="12" fill="#C4953A"/>
                  </svg>
                ) : isActive ? (
                  <svg width="12" height="12" viewBox="0 0 10 12" fill="none" className="ml-auto">
                    <polygon points="0,0 10,6 0,12" fill="#C4953A"/>
                  </svg>
                ) : (
                  <span className="font-body text-[10px] text-noir-silver/25 group-hover:hidden">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                )}
                {!isActive && (
                  <svg width="12" height="12" viewBox="0 0 10 12" fill="none" className="ml-auto hidden group-hover:block">
                    <polygon points="0,0 10,6 0,12" fill="#C4953A"/>
                  </svg>
                )}
              </div>

              {/* Titles */}
              <div className="flex-1 min-w-0">
                <p className={`font-heading italic text-base leading-snug transition-colors duration-200 ${
                  isActive ? 'text-noir-ivory' : 'text-noir-ivory/70 group-hover:text-noir-ivory/90'
                }`}>
                  {story.title}
                </p>
                <p className="font-body text-[9px] tracking-[0.2em] text-noir-silver/35 mt-0.5">
                  {formatSlug(story.slug)}
                </p>
              </div>

              {/* Progress bar when active */}
              {isActive && duration > 0 && (
                <div className="hidden sm:block flex-shrink-0 w-20 h-px bg-noir-silver/15 relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-noir-gold/60 transition-all"
                    style={{ width: `${(progress / duration) * 100}%` }}
                  />
                </div>
              )}

              {/* Read link */}
              <Link
                href={`/stories/${story.slug}`}
                onClick={e => e.stopPropagation()}
                className="hidden sm:block flex-shrink-0 font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/25 hover:text-noir-gold opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                Read
              </Link>
            </button>
          )
        })}
      </div>

      <audio ref={audioRef} preload="none" />
    </section>
  )
}
