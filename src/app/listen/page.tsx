'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const TRACKS = [
  { slug: 'why', title: 'Why', duration: 314 },
  { slug: 'who-wins-if-i-win', title: 'Who Wins If I Win', duration: 282 },
  { slug: 'the-roots-we-cannot-see', title: 'The Roots We Cannot See', duration: 361 },
  { slug: 'if-we-cant-say-the-hard-truths', title: "If We Can't Say the Hard Truths", duration: 268 },
  { slug: 'still-worth-it', title: 'Still Worth It', duration: 333 },
  { slug: 'side-by-side', title: 'Side by Side', duration: 295 },
  { slug: 'as-long-as-youre-okay', title: "As Long as You're Okay", duration: 302 },
  { slug: 'it-was-already-there', title: 'It Was Already There', duration: 258 },
  { slug: 'always-in-your-corner', title: 'Always in Your Corner', duration: 347 },
  { slug: 'the-house-we-couldnt-leave', title: "The House We Couldn't Leave", duration: 279 },
]

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function ListenPage() {
  const [roomId, setRoomId] = useState('')
  const [inputId, setInputId] = useState('')
  const [joined, setJoined] = useState(false)
  const [trackIdx, setTrackIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)
  const pausedAtRef = useRef<number>(0)

  const track = TRACKS[trackIdx]

  const shareUrl = typeof window !== 'undefined' && roomId
    ? `${window.location.origin}/listen?room=${roomId}`
    : ''

  // Sync from URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = params.get('room')
    if (room) {
      setRoomId(room.toUpperCase())
      setInputId(room.toUpperCase())
      setJoined(true)
    }
  }, [])

  const tick = useCallback(() => {
    if (!playing) return
    const elapsed = (Date.now() - startedAtRef.current) / 1000 + pausedAtRef.current
    setCurrentTime(Math.min(elapsed, track.duration))
    if (elapsed >= track.duration) {
      setPlaying(false)
      pausedAtRef.current = 0
      setCurrentTime(0)
    }
  }, [playing, track.duration])

  useEffect(() => {
    if (playing) {
      startedAtRef.current = Date.now()
      timerRef.current = setInterval(tick, 500)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [playing, tick])

  const togglePlay = () => {
    if (!playing) {
      startedAtRef.current = Date.now()
    } else {
      pausedAtRef.current = currentTime
    }
    setPlaying(p => !p)
  }

  const createRoom = () => {
    const id = generateRoomId()
    setRoomId(id)
    setJoined(true)
    const url = new URL(window.location.href)
    url.searchParams.set('room', id)
    window.history.replaceState({}, '', url.toString())
  }

  const joinRoom = () => {
    if (!inputId.trim()) return
    const id = inputId.trim().toUpperCase()
    setRoomId(id)
    setJoined(true)
    const url = new URL(window.location.href)
    url.searchParams.set('room', id)
    window.history.replaceState({}, '', url.toString())
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const selectTrack = (idx: number) => {
    setTrackIdx(idx)
    setPlaying(false)
    setCurrentTime(0)
    pausedAtRef.current = 0
  }

  if (!joined) {
    return (
      <main style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '1rem' }}>
            Listening Room
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 300, color: 'rgba(242,237,227,0.92)', lineHeight: 1.05, marginBottom: '1rem' }}>
            Listen together.
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'rgba(200,196,190,0.5)', lineHeight: 1.7, marginBottom: '3rem' }}>
            Create a room, share the link, and listen to the same track at the same time — from anywhere in the world.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <button onClick={createRoom}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 1.5rem', background: '#C4953A', color: '#080810', border: 'none', cursor: 'pointer', width: '100%' }}>
              Create a Room
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input value={inputId} onChange={e => setInputId(e.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'rgba(242,237,227,0.8)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem 1rem', flex: 1, outline: 'none', letterSpacing: '0.15em', textTransform: 'uppercase' }} />
              <button onClick={joinRoom}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.65rem 1.25rem', border: '1px solid rgba(196,149,58,0.4)', color: 'rgba(196,149,58,0.85)', background: 'transparent', cursor: 'pointer' }}>
                Join
              </button>
            </div>
          </div>

          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(200,196,190,0.25)', marginTop: '2rem', lineHeight: 1.6 }}>
            Synchronized playback uses client-side timers. Share the room link and hit play at the same moment.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080810', paddingTop: '7rem', paddingBottom: '4rem', padding: '7rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Room info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', padding: '1rem 1.25rem', border: '1px solid rgba(196,149,58,0.15)', background: 'rgba(196,149,58,0.03)' }}>
          <div>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', display: 'block', marginBottom: '0.25rem' }}>
              Room
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.75rem', fontWeight: 300, color: 'rgba(196,149,58,0.85)', letterSpacing: '0.3em' }}>
              {roomId}
            </span>
          </div>
          <button onClick={copyLink}
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: '1px solid rgba(196,149,58,0.3)', color: copied ? 'rgba(196,149,58,1)' : 'rgba(196,149,58,0.6)', background: 'transparent', cursor: 'pointer', transition: 'color 0.2s' }}>
            {copied ? '✓ Copied' : 'Copy link'}
          </button>
        </div>

        {/* Now playing */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.3)', marginBottom: '0.75rem' }}>
            Now playing
          </p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 300, fontStyle: 'italic', color: 'rgba(242,237,227,0.9)', marginBottom: '2rem' }}>
            {track.title}
          </h2>

          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.06)', height: '3px', borderRadius: '2px', marginBottom: '0.5rem', position: 'relative' }}>
            <div style={{ background: '#C4953A', height: '100%', borderRadius: '2px', width: `${(currentTime / track.duration) * 100}%`, transition: 'width 0.5s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(200,196,190,0.35)' }}>{fmtTime(currentTime)}</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(200,196,190,0.35)' }}>{fmtTime(track.duration)}</span>
          </div>

          {/* Play button */}
          <button onClick={togglePlay}
            style={{ marginTop: '2rem', width: '64px', height: '64px', borderRadius: '50%', border: '1px solid rgba(196,149,58,0.4)', background: playing ? 'rgba(196,149,58,0.12)' : 'transparent', color: '#C4953A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2rem auto 0', transition: 'all 0.2s' }}>
            {playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
          </button>
        </div>

        {/* Track list */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '3rem' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.3)', padding: '1.5rem 0 1rem' }}>
            Queue
          </p>
          {TRACKS.map((t, i) => (
            <button key={t.slug} onClick={() => selectTrack(i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: i === trackIdx ? 'rgba(196,149,58,0.7)' : 'rgba(200,196,190,0.25)', minWidth: '1.5rem' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.05rem', color: i === trackIdx ? 'rgba(242,237,227,0.95)' : 'rgba(242,237,227,0.55)', flex: 1 }}>
                {t.title}
              </span>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(200,196,190,0.25)' }}>
                {fmtTime(t.duration)}
              </span>
            </button>
          ))}
        </div>

        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(200,196,190,0.2)', marginTop: '2rem', lineHeight: 1.6, textAlign: 'center' }}>
          Share the room link and press play together for synchronized listening.
          Playback uses client-side timers only — no audio streaming.
        </p>
      </div>
    </main>
  )
}
