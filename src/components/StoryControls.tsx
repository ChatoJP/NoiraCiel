'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  audiobookUrl: string | null
  title: string
  slug?: string
  songAudioUrl?: string | null
}

export default function StoryControls({ audiobookUrl, title, slug, songAudioUrl }: Props) {
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [visible, setVisible] = useState(false)
  const [nightMode, setNightMode] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [songPlaying, setSongPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const songRef = useRef<HTMLAudioElement | null>(null)

  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? scrolled / total : 0)
      setVisible(scrolled > window.innerHeight * 0.6)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // G37: load bookmark state
  useEffect(() => {
    if (slug) setBookmarked(!!localStorage.getItem(`nr-bookmark-${slug}`))
  }, [slug])

  // G41: active paragraph highlighting via IntersectionObserver
  useEffect(() => {
    let activePara: Element | null = null
    const obs = new IntersectionObserver(
      (entries) => {
        let best: { el: Element; ratio: number } | null = null
        for (const e of entries) {
          if (!best || e.intersectionRatio > best.ratio) {
            best = { el: e.target, ratio: e.intersectionRatio }
          }
        }
        if (best && best.ratio > 0.3) {
          if (activePara && activePara !== best.el) activePara.classList.remove('story-para-active')
          best.el.classList.add('story-para-active')
          activePara = best.el
        }
      },
      { threshold: [0.3, 0.6] }
    )
    const paras = document.querySelectorAll('.story-para')
    paras.forEach(p => obs.observe(p))
    return () => { obs.disconnect(); paras.forEach(p => p.classList.remove('story-para-active')) }
  }, [])

  // G38: apply night mode class to body
  useEffect(() => {
    document.body.style.filter = nightMode ? 'brightness(0.6)' : ''
    return () => { document.body.style.filter = '' }
  }, [nightMode])

  // G39: song audio events
  useEffect(() => {
    const audio = songRef.current
    if (!audio) return
    const onEnded = () => setSongPlaying(false)
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [])

  const toggleBookmark = useCallback(() => {
    if (!slug) return
    const next = !bookmarked
    setBookmarked(next)
    if (next) localStorage.setItem(`nr-bookmark-${slug}`, title)
    else localStorage.removeItem(`nr-bookmark-${slug}`)
  }, [slug, title, bookmarked])

  const toggleSong = useCallback(() => {
    const audio = songRef.current
    if (!audio) return
    if (songPlaying) { audio.pause(); setSongPlaying(false) }
    else { audio.volume = 0.35; audio.play(); setSongPlaying(true) }
  }, [songPlaying])

  // Audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(audio.duration)
    const onEnded = () => { setPlaying(false); setCurrentTime(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  function fmt(s: number) {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  return (
    <>
      {/* Scroll progress bar — fixed top (G35) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px bg-noir-silver/10">
        <div
          className="h-full transition-none"
          style={{ width: `${progress * 100}%`, background: 'rgb(var(--t-accent-rgb))' }}
        />
      </div>

      {/* G37/G38/G39: Floating action bar top-right */}
      <div className="fixed top-5 right-4 z-50 flex items-center gap-2">
        {/* G39: Play song while reading */}
        {songAudioUrl && (
          <button
            onClick={toggleSong}
            title={songPlaying ? 'Stop music' : 'Play song while reading'}
            className="flex items-center gap-1.5 font-body text-[8px] tracking-[0.2em] uppercase px-2.5 py-1.5 border transition-all duration-200"
            style={{
              borderColor: songPlaying ? 'rgba(196,149,58,0.5)' : 'rgba(184,197,208,0.2)',
              color: songPlaying ? '#C4953A' : 'rgba(184,197,208,0.45)',
              background: songPlaying ? 'rgba(196,149,58,0.08)' : 'transparent',
            }}
          >
            {songPlaying ? '♫ Playing' : '♫ Play Song'}
          </button>
        )}
        {/* G38: Night mode */}
        <button
          onClick={() => setNightMode(v => !v)}
          title={nightMode ? 'Exit night mode' : 'Night read mode'}
          className="font-body text-[8px] tracking-[0.2em] uppercase px-2 py-1.5 border transition-all duration-200"
          style={{
            borderColor: nightMode ? 'rgba(196,149,58,0.4)' : 'rgba(184,197,208,0.15)',
            color: nightMode ? '#C4953A' : 'rgba(184,197,208,0.35)',
            background: nightMode ? 'rgba(196,149,58,0.06)' : 'transparent',
          }}
        >
          {nightMode ? '☀' : '☾'}
        </button>
        {/* G37: Bookmark */}
        {slug && (
          <button
            onClick={toggleBookmark}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark this story'}
            className="font-body text-[8px] tracking-[0.2em] uppercase px-2 py-1.5 border transition-all duration-200"
            style={{
              borderColor: bookmarked ? 'rgba(196,149,58,0.5)' : 'rgba(184,197,208,0.15)',
              color: bookmarked ? '#C4953A' : 'rgba(184,197,208,0.35)',
              background: bookmarked ? 'rgba(196,149,58,0.08)' : 'transparent',
            }}
          >
            {bookmarked ? '◆' : '◇'}
          </button>
        )}
      </div>

      {/* G39: Hidden background song audio */}
      {songAudioUrl && <audio ref={songRef} src={songAudioUrl} loop preload="none" />}

      {/* Sticky audio bar — bottom */}
      {audiobookUrl && (
        <div
          className={`fixed bottom-16 left-0 right-0 z-40 border-t border-noir-silver/10 bg-noir-black/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 transition-transform duration-500 ${
            visible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 border border-t-accent/40 hover:border-t-accent flex items-center justify-center transition-colors duration-200"
              aria-label={playing ? 'Pause audiobook' : 'Play audiobook'}
            >
              {playing ? (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <rect x="0" y="0" width="3" height="12" fill="rgb(var(--t-accent-rgb))"/>
                  <rect x="7" y="0" width="3" height="12" fill="rgb(var(--t-accent-rgb))"/>
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                  <polygon points="0,0 10,6 0,12" fill="rgb(var(--t-accent-rgb))"/>
                </svg>
              )}
            </button>

            {/* Labels */}
            <div className="flex-1 min-w-0">
              <p className="font-body text-[8px] tracking-[0.2em] uppercase text-t-accent/60">Audiobook</p>
              <p className="font-heading italic text-sm text-noir-ivory/80 truncate">{title}</p>
            </div>

            {/* Seek */}
            <div className="flex-1 flex items-center gap-2">
              <span className="font-body text-[10px] text-noir-silver/40 tabular-nums flex-shrink-0">{fmt(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.5}
                value={currentTime}
                onChange={seek}
                className="flex-1 accent-amber-600 cursor-pointer h-px"
              />
              <span className="font-body text-[10px] text-noir-silver/40 tabular-nums flex-shrink-0">{fmt(duration)}</span>
            </div>
          </div>

          <audio ref={audioRef} src={audiobookUrl} preload="metadata" />
        </div>
      )}
    </>
  )
}
