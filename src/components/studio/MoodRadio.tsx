'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const MOODS = [
  {
    id: 'melancholy',
    label: 'Melancholy',
    icon: '◆',
    description: 'quiet · heavy · honest',
    tracks: ['the-empty-chair', 'borrowed-time', 'the-house-we-couldnt-leave', 'i-never-knew-any-other-way', 'maybe-i-was-wrong'],
  },
  {
    id: 'hope',
    label: 'Hope',
    icon: '◇',
    description: 'light · warm · forward',
    tracks: ['leave-a-light-on', 'always-in-your-corner', 'good-things-grow-slow', 'still-worth-it', 'it-was-already-there'],
  },
  {
    id: 'truth',
    label: 'Truth',
    icon: '▣',
    description: 'direct · unflinching · free',
    tracks: ['free-men-tell-the-truth', 'if-we-cant-say-the-hard-truths', 'who-wins-if-i-win', 'why', 'maybe-i-was-wrong'],
  },
  {
    id: 'love',
    label: 'Love',
    icon: '♡',
    description: 'tender · present · silent',
    tracks: ['side-by-side', 'as-long-as-youre-okay', 'it-was-already-there', 'leave-a-light-on', 'always-in-your-corner'],
  },
  {
    id: 'roots',
    label: 'Roots',
    icon: '❧',
    description: 'ancestral · earth · memory',
    tracks: ['the-roots-we-cannot-see', 'good-things-grow-slow', 'free-men-tell-the-truth', 'the-house-we-couldnt-leave', 'why'],
  },
  {
    id: 'solitude',
    label: 'Solitude',
    icon: '○',
    description: 'alone · still · searching',
    tracks: ['why', 'the-empty-chair', 'borrowed-time', 'i-never-knew-any-other-way', 'the-roots-we-cannot-see'],
  },
]

const TRACK_TITLES: Record<string, string> = {
  'the-empty-chair': 'The Empty Chair',
  'borrowed-time': 'Borrowed Time',
  'the-house-we-couldnt-leave': "The House We Couldn't Leave",
  'i-never-knew-any-other-way': 'I Never Knew Any Other Way',
  'maybe-i-was-wrong': 'Maybe I Was Wrong',
  'leave-a-light-on': 'Leave a Light On',
  'always-in-your-corner': 'Always in Your Corner',
  'good-things-grow-slow': 'Good Things Grow Slow',
  'still-worth-it': 'Still Worth It',
  'it-was-already-there': 'It Was Already There',
  'free-men-tell-the-truth': 'Free Men Tell the Truth',
  'if-we-cant-say-the-hard-truths': "If We Can't Say the Hard Truths",
  'who-wins-if-i-win': 'Who Wins If I Win',
  'why': 'Why',
  'side-by-side': 'Side by Side',
  'as-long-as-youre-okay': "As Long as You're Okay",
  'the-roots-we-cannot-see': 'The Roots We Cannot See',
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function MoodRadio() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [queue, setQueue] = useState<string[]>([])
  const [queueIdx, setQueueIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const mood = MOODS.find(m => m.id === selectedMood)
  const currentSlug = queue[queueIdx] ?? null
  const currentTitle = currentSlug ? TRACK_TITLES[currentSlug] : null

  const startMood = useCallback((moodId: string) => {
    const m = MOODS.find(m => m.id === moodId)
    if (!m) return
    const shuffled = [...m.tracks].sort(() => Math.random() - 0.5)
    setSelectedMood(moodId)
    setQueue(shuffled)
    setQueueIdx(0)
    setCurrentTime(0)
    setPlaying(true)
  }, [])

  // Wire audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSlug) return

    const src = `/Audio/${currentSlug}.mp3`
    if (audio.src !== src) {
      audio.src = src
      audio.load()
    }

    const onTime = () => setCurrentTime(audio.currentTime)
    const onEnded = () => {
      if (queueIdx < queue.length - 1) {
        setQueueIdx(i => i + 1)
        setCurrentTime(0)
      } else {
        setPlaying(false)
        setCurrentTime(0)
      }
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)

    if (playing) audio.play().catch(() => {})
    else audio.pause()

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
    }
  }, [currentSlug, playing, queueIdx, queue.length])

  const duration = audioRef.current?.duration || 0

  if (!selectedMood) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '0.75rem' }}>
            Mood Radio
          </p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2.2rem', fontWeight: 300, color: 'rgba(242,237,227,0.88)', marginBottom: '0.75rem' }}>
            How are you feeling?
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(200,196,190,0.45)', lineHeight: 1.7 }}>
            Choose a mood. We&apos;ll build a queue from the catalogue.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {MOODS.map(m => (
            <button key={m.id} onClick={() => startMood(m.id)}
              className="group"
              style={{ padding: '1.5rem 1.25rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.25s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,149,58,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(196,149,58,0.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.6rem', color: 'rgba(196,149,58,0.6)', marginBottom: '0.75rem' }}>{m.icon}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', color: 'rgba(242,237,227,0.85)', marginBottom: '0.35rem' }}>{m.label}</div>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: 'rgba(200,196,190,0.35)', letterSpacing: '0.1em' }}>{m.description}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', marginBottom: '0.4rem' }}>
            {mood?.icon} {mood?.label} Radio
          </p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(242,237,227,0.88)' }}>
            {currentTitle}
          </h2>
        </div>
        <button onClick={() => setSelectedMood(null)}
          style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.35)', background: 'none', border: '1px solid rgba(255,255,255,0.08)', padding: '0.4rem 0.75rem', cursor: 'pointer' }}>
          Change mood
        </button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', height: '2px', borderRadius: '1px', marginBottom: '0.5rem' }}>
          <div style={{ background: '#C4953A', height: '100%', width: duration ? `${(currentTime / duration) * 100}%` : '0%', transition: 'width 0.5s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(200,196,190,0.3)' }}>{fmtTime(currentTime)}</span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(200,196,190,0.3)' }}>{duration ? fmtTime(duration) : '--:--'}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <button onClick={() => { setQueueIdx(i => Math.max(0, i - 1)); setCurrentTime(0) }}
          style={{ color: queueIdx > 0 ? 'rgba(196,149,58,0.7)' : 'rgba(200,196,190,0.2)', background: 'none', border: 'none', cursor: queueIdx > 0 ? 'pointer' : 'default', padding: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button onClick={() => setPlaying(p => !p)}
          style={{ width: '52px', height: '52px', borderRadius: '50%', border: '1px solid rgba(196,149,58,0.4)', background: playing ? 'rgba(196,149,58,0.12)' : 'transparent', color: '#C4953A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          {playing
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
        </button>
        <button onClick={() => { setQueueIdx(i => Math.min(queue.length - 1, i + 1)); setCurrentTime(0) }}
          style={{ color: queueIdx < queue.length - 1 ? 'rgba(196,149,58,0.7)' : 'rgba(200,196,190,0.2)', background: 'none', border: 'none', cursor: queueIdx < queue.length - 1 ? 'pointer' : 'default', padding: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6l5.5-4L9 8v8l-0.5-4z"/></svg>
        </button>
        <button onClick={() => startMood(selectedMood)}
          style={{ marginLeft: 'auto', color: 'rgba(200,196,190,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          Reshuffle
        </button>
      </div>

      {/* Queue */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.25)', padding: '1rem 0 0.75rem' }}>
          Up next
        </p>
        {queue.map((slug, i) => (
          <button key={slug} onClick={() => { setQueueIdx(i); setCurrentTime(0); setPlaying(true) }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: i === queueIdx ? 'rgba(196,149,58,0.7)' : 'rgba(200,196,190,0.2)', minWidth: '1.25rem' }}>
              {i === queueIdx ? '▶' : String(i + 1)}
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1rem', color: i === queueIdx ? 'rgba(242,237,227,0.95)' : 'rgba(242,237,227,0.5)' }}>
              {TRACK_TITLES[slug]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
