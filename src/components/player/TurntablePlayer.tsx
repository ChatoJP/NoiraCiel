'use client'

import { useEffect, useRef } from 'react'
import { useAudio } from '@/context/AudioContext'
import { formatDuration } from '@/lib/formatters'

const GOLD = '#C4953A'
const IVORY = 'rgba(242,237,227,0.92)'
const SILVER = 'rgba(200,196,190,0.5)'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('nc-turntable-styles')) return
  const s = document.createElement('style')
  s.id = 'nc-turntable-styles'
  s.textContent = `
    @keyframes nc-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes nc-tp-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes nc-content-up {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .nc-vinyl {
      animation: nc-spin 8s linear infinite;
      animation-play-state: paused;
      will-change: transform;
    }
    .nc-vinyl.spinning {
      animation-play-state: running;
    }
    .nc-arm-wrap {
      transition: transform 1.8s cubic-bezier(0.34, 1.2, 0.64, 1);
    }
    .nc-tp-overlay {
      animation: nc-tp-in 0.3s ease forwards;
    }
    .nc-tp-content {
      animation: nc-content-up 0.45s 0.08s ease both;
    }
    .nc-scrub {
      -webkit-appearance: none;
      appearance: none;
      height: 3px;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      width: 100%;
    }
    .nc-scrub::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: ${GOLD};
      cursor: pointer;
      box-shadow: 0 0 8px rgba(196,149,58,0.5);
      transition: transform 0.15s;
    }
    .nc-scrub::-webkit-slider-thumb:hover { transform: scale(1.3); }
    .nc-scrub::-moz-range-thumb {
      width: 14px; height: 14px; border-radius: 50%;
      background: ${GOLD}; border: none; cursor: pointer;
    }
    .nc-ctrl {
      background: none; border: none; cursor: pointer;
      color: ${SILVER}; padding: 0.45rem;
      display: flex; align-items: center; justify-content: center;
      transition: color 0.2s, transform 0.15s;
    }
    .nc-ctrl:hover { color: ${IVORY}; transform: scale(1.1); }
    .nc-ctrl.on  { color: ${GOLD}; }
    .nc-play {
      width: 62px; height: 62px; border-radius: 50%;
      border: 1.5px solid rgba(196,149,58,0.45);
      background: rgba(196,149,58,0.07); color: ${GOLD};
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
      flex-shrink: 0;
    }
    .nc-play:hover { background: rgba(196,149,58,0.16); border-color: rgba(196,149,58,0.75); transform: scale(1.05); }
    .nc-play:active { transform: scale(0.96); }
    @media (max-width: 600px) {
      .nc-play { width: 54px; height: 54px; }
    }
  `
  document.head.appendChild(s)
}

export default function TurntablePlayer({ onClose }: { onClose: () => void }) {
  const {
    currentTrack, isPlaying, isLoading, isShuffled, repeatMode,
    currentTime, duration, volume, isMuted,
    toggle, next, prev, seek, toggleShuffle, toggleRepeat, toggleMute, setVolume,
  } = useAudio()

  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => { injectStyles() }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!currentTrack) return null

  const artUrl = currentTrack.songArtUrl ?? currentTrack.coverArt ?? null
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0
  const vol = isMuted ? 0 : volume

  return (
    <div
      ref={overlayRef}
      className="nc-tp-overlay"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', overflowY: 'auto',
      }}
    >
      {/* Blurred background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {artUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artUrl} alt="" aria-hidden
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'blur(80px) saturate(0.55) brightness(0.22)',
              transform: 'scale(1.18)',
            }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#080810' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(8,8,16,0.9) 0%, rgba(8,8,20,0.82) 100%)',
        }} />
      </div>

      {/* Minimize button */}
      <button
        onClick={onClose}
        aria-label="Minimize player"
        style={{
          position: 'absolute', top: '1.2rem', right: '1.4rem',
          background: 'none', border: '1px solid rgba(200,196,190,0.12)', cursor: 'pointer',
          color: 'rgba(200,196,190,0.35)', padding: '0.35rem 0.7rem',
          borderRadius: '2rem', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          transition: 'color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.color = IVORY
          el.style.borderColor = 'rgba(200,196,190,0.3)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.color = 'rgba(200,196,190,0.35)'
          el.style.borderColor = 'rgba(200,196,190,0.12)'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        Minimize
      </button>

      {/* Main content */}
      <div
        className="nc-tp-content"
        style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', width: '100%', maxWidth: '780px',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 'clamp(1.5rem, 5vw, 4.5rem)',
          width: '100%',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>

          {/* ── Vinyl record + tonearm ── */}
          <div style={{
            position: 'relative',
            width: 'clamp(200px, 36vw, 310px)',
            height: 'clamp(200px, 36vw, 310px)',
            flexShrink: 0,
          }}>
            {/* Ambient shadow */}
            <div style={{
              position: 'absolute', inset: '8%', borderRadius: '50%',
              boxShadow: '0 28px 80px rgba(0,0,0,0.9), 0 0 40px rgba(196,149,58,0.05)',
            }} />

            {/* Spinning vinyl */}
            <div
              className={`nc-vinyl${isPlaying ? ' spinning' : ''}`}
              style={{ position: 'absolute', inset: 0 }}
            >
              <svg viewBox="0 0 300 300" width="100%" height="100%"
                style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <radialGradient id="nc-vb" cx="40%" cy="35%" r="70%">
                    <stop offset="0%"   stopColor="#191922" />
                    <stop offset="45%"  stopColor="#0d0d14" />
                    <stop offset="100%" stopColor="#070710" />
                  </radialGradient>
                  <radialGradient id="nc-vs" cx="33%" cy="28%" r="55%">
                    <stop offset="0%"   stopColor="rgba(255,255,255,0.09)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                  <radialGradient id="nc-lo" cx="42%" cy="38%" r="65%">
                    <stop offset="0%"   stopColor="rgba(255,255,255,0.15)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
                  </radialGradient>
                  <clipPath id="nc-lc"><circle cx="150" cy="150" r="54" /></clipPath>
                </defs>

                {/* Vinyl body */}
                <circle cx="150" cy="150" r="148" fill="url(#nc-vb)" />

                {/* Groove rings */}
                {[144,138,133,127,121,115,109,103,97,91,85,79,73,67].map((r, i) => (
                  <circle key={r} cx="150" cy="150" r={r}
                    fill="none"
                    stroke={i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.35)'}
                    strokeWidth={i % 2 === 0 ? 1.4 : 0.7}
                  />
                ))}

                {/* Label backing */}
                <circle cx="150" cy="150" r="57" fill="#09090f" />
                <circle cx="150" cy="150" r="55" fill="#0b0b16" />

                {/* Album art or fallback */}
                {artUrl ? (
                  <image href={artUrl} x="96" y="96" width="108" height="108"
                    clipPath="url(#nc-lc)" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <text x="150" y="158" textAnchor="middle" fontSize="22"
                    fill="rgba(196,149,58,0.35)" fontFamily="serif">◆</text>
                )}

                {/* Label sheen */}
                <circle cx="150" cy="150" r="54" fill="url(#nc-lo)" />

                {/* Label gold ring */}
                <circle cx="150" cy="150" r="56" fill="none"
                  stroke="rgba(196,149,58,0.38)" strokeWidth="1.2" />

                {/* Vinyl sheen */}
                <circle cx="150" cy="150" r="148" fill="url(#nc-vs)" />

                {/* Rim */}
                <circle cx="150" cy="150" r="148" fill="none"
                  stroke="rgba(255,255,255,0.035)" strokeWidth="2.5" />

                {/* Spindle */}
                <circle cx="150" cy="150" r="5" fill="#060609" />
                <circle cx="150" cy="150" r="4.5" fill="none"
                  stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              </svg>
            </div>

            {/* Tonearm */}
            <div
              className="nc-arm-wrap"
              style={{
                position: 'absolute',
                top: '0%',
                right: '-8%',
                transformOrigin: '14px 14px',
                transform: `rotate(${isPlaying ? 30 : 8}deg)`,
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              {/* Pivot bearing */}
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 32%, #d4b060, #6a5020)',
                border: '1px solid rgba(196,149,58,0.65)',
                boxShadow: '0 3px 10px rgba(0,0,0,0.85), inset 0 1px 3px rgba(255,255,255,0.22)',
              }} />

              {/* Arm shaft */}
              <div style={{
                marginLeft: 9,
                width: 4,
                height: 'clamp(100px, 18vw, 155px)',
                background: 'linear-gradient(180deg, rgba(218,175,85,0.95) 0%, rgba(155,118,48,0.65) 100%)',
                borderRadius: '3px 3px 1px 1px',
                boxShadow: '2px 0 5px rgba(0,0,0,0.55), -1px 0 3px rgba(0,0,0,0.35)',
              }} />

              {/* Headshell */}
              <div style={{
                marginLeft: 3,
                width: 22,
                height: 4,
                background: 'linear-gradient(90deg, rgba(196,149,58,0.8), rgba(180,140,60,0.45))',
                borderRadius: 2,
                transform: 'rotate(-42deg)',
                transformOrigin: '0 50%',
                boxShadow: '1px 1px 4px rgba(0,0,0,0.55)',
              }} />

              {/* Stylus needle */}
              <div style={{
                marginLeft: 6, marginTop: -1,
                width: 2, height: 13,
                background: 'rgba(196,149,58,0.5)',
                borderRadius: '0 0 1px 1px',
                transform: 'rotate(-42deg)',
                transformOrigin: '0 0',
              }} />
            </div>
          </div>

          {/* ── Track info + Controls ── */}
          <div style={{
            flex: 1,
            minWidth: 'min(100%, 240px)',
            maxWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
          }}>

            {/* Track meta */}
            <div>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.58rem',
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: 'rgba(196,149,58,0.5)',
                marginBottom: '0.55rem',
              }}>
                {currentTrack.trackNumber
                  ? `Track ${String(currentTrack.trackNumber).padStart(2, '0')}`
                  : 'Now Playing'}
              </p>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 'clamp(1.55rem, 3.2vw, 2.3rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: IVORY,
                lineHeight: 1.1,
                marginBottom: '0.45rem',
              }}>
                {currentTrack.title}
              </h2>
              <p style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.75rem',
                color: SILVER,
                letterSpacing: '0.04em',
              }}>
                {currentTrack.artist || 'NoiraCiel'}
                {currentTrack.album ? ` · ${currentTrack.album}` : ''}
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <input
                type="range"
                className="nc-scrub"
                min={0} max={duration || 100} step={0.1}
                value={currentTime}
                onChange={e => seek(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, ${GOLD} ${pct}%, rgba(200,196,190,0.12) ${pct}%)`,
                }}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: '0.35rem',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.68rem',
                color: 'rgba(200,196,190,0.35)',
              }}>
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Playback controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>

              <button className={`nc-ctrl${isShuffled ? ' on' : ''}`} onClick={toggleShuffle} title="Shuffle">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                </svg>
              </button>

              <button className="nc-ctrl" onClick={prev} title="Previous">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button className="nc-play" onClick={toggle} title={isPlaying ? 'Pause' : 'Play'}>
                {isLoading ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    style={{ animation: 'nc-spin 0.9s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.22" />
                    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                ) : isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button className="nc-ctrl" onClick={next} title="Next">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              <button className={`nc-ctrl${repeatMode !== 'none' ? ' on' : ''}`} onClick={toggleRepeat} title={`Repeat: ${repeatMode}`}>
                {repeatMode === 'one' ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v5zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v5z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <button className="nc-ctrl" onClick={toggleMute} style={{ padding: '0.25rem', flexShrink: 0 }}>
                {vol === 0 ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                className="nc-scrub"
                min={0} max={1} step={0.02}
                value={vol}
                onChange={e => setVolume(Number(e.target.value))}
                style={{
                  flex: 1,
                  background: `linear-gradient(to right, rgba(196,149,58,0.55) ${vol * 100}%, rgba(200,196,190,0.1) ${vol * 100}%)`,
                }}
              />
            </div>

            {/* Song page link */}
            {currentTrack.slug && (
              <a
                href={`/songs/${currentTrack.slug}`}
                onClick={onClose}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.62rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(196,149,58,0.42)',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(196,149,58,0.18)',
                  paddingBottom: '1px',
                  alignSelf: 'flex-start',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.color = 'rgba(196,149,58,0.82)'
                  el.style.borderColor = 'rgba(196,149,58,0.48)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.color = 'rgba(196,149,58,0.42)'
                  el.style.borderColor = 'rgba(196,149,58,0.18)'
                }}
              >
                Open song page →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
