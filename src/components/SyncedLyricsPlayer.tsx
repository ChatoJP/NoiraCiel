'use client'

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { useAudio } from '@/context/AudioContext'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WordEntry {
  word: string
  start: number
  end: number
}

interface TimestampData {
  title: string
  slug: string
  duration: number
  words: WordEntry[]
}

interface LyricLine {
  words: WordEntry[]
  start: number
  end: number
}

interface Props {
  slug: string
  audioUrl: string
  className?: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const GAP_THRESHOLD = 1.8 // seconds — gap that splits a new lyric line
const GOLD = '#C4953A'
const GOLD_LIGHT = '#D4A84B'
const IVORY = '#F2EDE3'
const VOID = '#04040A'
const BLACK = '#080810'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function groupWordsIntoLines(words: WordEntry[]): LyricLine[] {
  if (!words.length) return []
  const lines: LyricLine[] = []
  let current: WordEntry[] = [words[0]]

  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end
    if (gap > GAP_THRESHOLD) {
      lines.push({
        words: current,
        start: current[0].start,
        end: current[current.length - 1].end,
      })
      current = [words[i]]
    } else {
      current.push(words[i])
    }
  }
  if (current.length) {
    lines.push({
      words: current,
      start: current[0].start,
      end: current[current.length - 1].end,
    })
  }
  return lines
}

function formatTime(secs: number): string {
  if (!isFinite(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Inline CSS injected once ──────────────────────────────────────────────────

const STYLE_ID = 'synced-lyrics-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes fadeWordIn {
      0%   { color: ${GOLD_LIGHT}; text-shadow: 0 0 18px ${GOLD}cc, 0 0 40px ${GOLD}66; transform: scale(1.06); }
      40%  { color: ${GOLD};       text-shadow: 0 0 12px ${GOLD}99, 0 0 28px ${GOLD}44; transform: scale(1.02); }
      100% { color: ${GOLD};       text-shadow: 0 0 8px  ${GOLD}66, 0 0 20px ${GOLD}33; transform: scale(1); }
    }

    @keyframes linePulse {
      0%   { opacity: 0; transform: translateY(6px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0)  scale(1); }
    }

    @keyframes scrubThumb {
      0%   { box-shadow: 0 0 0 0 ${GOLD}66; }
      70%  { box-shadow: 0 0 0 6px ${GOLD}00; }
      100% { box-shadow: 0 0 0 0 ${GOLD}00; }
    }

    .slp-word-active {
      animation: fadeWordIn 0.3s ease-out forwards;
    }

    .slp-line-active {
      animation: linePulse 0.35s ease-out forwards;
    }

    .slp-scrub {
      -webkit-appearance: none;
      appearance: none;
      height: 3px;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      background: linear-gradient(to right, ${GOLD} var(--pct, 0%), rgba(255,255,255,0.12) var(--pct, 0%));
    }
    .slp-scrub::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: ${GOLD};
      cursor: pointer;
      border: none;
      box-shadow: 0 0 6px ${GOLD}88;
      transition: box-shadow 0.2s;
    }
    .slp-scrub::-webkit-slider-thumb:hover {
      box-shadow: 0 0 0 4px ${GOLD}33, 0 0 8px ${GOLD}88;
    }
    .slp-scrub::-moz-range-thumb {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: ${GOLD};
      cursor: pointer;
      border: none;
      box-shadow: 0 0 6px ${GOLD}88;
    }
    .slp-scrub::-moz-range-progress {
      background: ${GOLD};
      height: 3px;
      border-radius: 2px;
    }

    .slp-lines-container:hover .slp-copy-btn,
    [role="button"]:hover .slp-copy-btn {
      opacity: 1 !important;
    }

    .slp-lines-container {
      scrollbar-width: thin;
      scrollbar-color: ${GOLD}33 transparent;
    }
    .slp-lines-container::-webkit-scrollbar {
      width: 3px;
    }
    .slp-lines-container::-webkit-scrollbar-track {
      background: transparent;
    }
    .slp-lines-container::-webkit-scrollbar-thumb {
      background: ${GOLD}44;
      border-radius: 2px;
    }

    @keyframes slp-enter {
      0%   { opacity: 0; transform: translateY(22px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `
  document.head.appendChild(el)
}

// ─── Word span within an active line ──────────────────────────────────────────

function WordSpan({
  word,
  isActive,
  isPast,
}: {
  word: WordEntry
  isActive: boolean
  isPast: boolean
}) {
  const color = isActive
    ? GOLD
    : isPast
    ? IVORY
    : 'rgba(242,237,227,0.92)'

  return (
    <span
      className={isActive ? 'slp-word-active' : undefined}
      style={{
        color,
        transition: 'color 0.2s ease',
        display: 'inline',
        whiteSpace: 'pre-wrap',
      }}
    >
      {word.word}{' '}
    </span>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SyncedLyricsPlayer({ slug, audioUrl, className }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastScrolledLine = useRef<number>(-1)
  const isSeekingRef = useRef(false)

  const [data, setData] = useState<TimestampData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady]     = useState(false)
  const [isLooping, setIsLooping]   = useState(false)
  const [resumeAt, setResumeAt]     = useState<number | null>(null)
  const [copied, setCopied]         = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const { connectExternalAudio, disconnectExternalAudio } = useAudio()

  // G09: sync loop flag to audio element
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.loop = isLooping
  }, [isLooping])

  // G23: sync playback rate
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = playbackRate
  }, [playbackRate])

  // G06: save playback position every 5 seconds
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    let lastSaved = 0
    const onTime = () => {
      const t = audio.currentTime
      if (t > 5 && t - lastSaved > 5) {
        localStorage.setItem(`nr-resume-${slug}`, String(t))
        lastSaved = t
      }
    }
    audio.addEventListener('timeupdate', onTime)
    return () => audio.removeEventListener('timeupdate', onTime)
  }, [slug])

  // G06: check for saved position on mount
  useEffect(() => {
    const saved = localStorage.getItem(`nr-resume-${slug}`)
    if (saved) {
      const t = parseFloat(saved)
      if (t > 5) setResumeAt(t)
    }
  }, [slug])

  // Route this player's audio through the shared Ghost Performance analyser
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (isPlaying) connectExternalAudio(el)
    else disconnectExternalAudio()
  }, [isPlaying, connectExternalAudio, disconnectExternalAudio])

  // Derived — memoised so they don't re-compute on every render
  const lines = useMemo(() => (data ? groupWordsIntoLines(data.words) : []), [data])

  // Active line index
  const activeLineIdx = useMemo(() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].start) return i
    }
    return -1
  }, [lines, currentTime])

  // G21: word density buckets for heatmap (60 segments)
  const densityBuckets = useMemo(() => {
    if (!data || !duration) return []
    const N = 60
    const buckets = new Array(N).fill(0) as number[]
    for (const w of data.words) {
      const i = Math.min(N - 1, Math.floor((w.start / duration) * N))
      buckets[i]++
    }
    const max = Math.max(...buckets, 1)
    return buckets.map(v => v / max)
  }, [data, duration])

  // ── Load timestamp data ───────────────────────────────────────────────────────
  useEffect(() => {
    injectStyles()
    setLoading(true)
    setError(null)
    fetch(`/Lyrics/timestamps/${slug}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<TimestampData>
      })
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load lyrics')
        setLoading(false)
      })
  }, [slug])

  // ── Audio event wiring ────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      if (!isSeekingRef.current) setCurrentTime(audio.currentTime)
    }
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0) }
    const onCanPlay = () => setIsReady(true)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('canplay', onCanPlay)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('canplay', onCanPlay)
    }
  }, [])

  // ── Auto-scroll to active line ────────────────────────────────────────────────
  useEffect(() => {
    if (activeLineIdx < 0 || activeLineIdx === lastScrolledLine.current) return
    lastScrolledLine.current = activeLineIdx
    const container = linesRef.current
    const el = lineRefs.current[activeLineIdx]
    if (!container || !el) return
    const containerMid = container.offsetHeight / 2
    const elTop = el.offsetTop
    const elMid = el.offsetHeight / 2
    container.scrollTo({ top: elTop - containerMid + elMid, behavior: 'smooth' })
  }, [activeLineIdx])

  // ── Playback controls ─────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.pause()
    else audio.play().catch(() => {})
  }, [isPlaying])

  const seek = useCallback((to: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = to
    setCurrentTime(to)
  }, [])

  const seekToLine = useCallback((line: LyricLine) => {
    seek(line.start)
    const audio = audioRef.current
    if (audio && !isPlaying) audio.play().catch(() => {})
  }, [seek, isPlaying])

  const onScrubChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    seek(val)
  }, [seek])

  const onScrubStart = useCallback(() => { isSeekingRef.current = true }, [])
  const onScrubEnd = useCallback((e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    seek(parseFloat((e.target as HTMLInputElement).value))
    isSeekingRef.current = false
  }, [seek])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // G18: share this moment
  const handleShare = useCallback(() => {
    const m = Math.floor(currentTime / 60)
    const s = Math.floor(currentTime % 60)
    const ts = `${m}m${s}s`
    const url = `${window.location.href.split('?')[0]}?t=${ts}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }).catch(() => {})
  }, [currentTime])

  // G23: cycle playback rate 0.75→1→1.25→1.5
  const cycleRate = useCallback(() => {
    const rates = [0.75, 1, 1.25, 1.5]
    setPlaybackRate(r => {
      const idx = rates.indexOf(r)
      return rates[(idx + 1) % rates.length]
    })
  }, [])

  // G24: open print window with lyric sheet
  const printLyrics = useCallback(() => {
    if (!data) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>${data.title} — Lyrics</title><style>
      body{font-family:Georgia,serif;font-style:italic;padding:2cm;line-height:2;color:#111;max-width:600px;margin:0 auto}
      h1{font-size:1.6em;font-weight:400;margin-bottom:1.5em;font-style:normal}
      p{margin:0.3em 0}
    </style></head><body><h1>${data.title}</h1>
    ${lines.map(l => `<p>${l.words.map(w => w.word).join(' ')}</p>`).join('\n')}
    </body></html>`)
    win.document.close()
    win.print()
  }, [data, lines])

  // G19: copy a lyric line to clipboard
  const copyLine = useCallback((line: LyricLine) => {
    const text = line.words.map((w) => w.word).join(' ')
    navigator.clipboard.writeText(text).catch(() => {})
  }, [])

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderLine = (line: LyricLine, idx: number) => {
    const isActive = idx === activeLineIdx
    const isPast = idx < activeLineIdx
    const isFuture = idx > activeLineIdx

    const opacity = isActive ? 1 : isPast ? 0.22 : 0.45
    const fontSize = isActive
      ? 'clamp(1.4rem, 3vw, 2rem)'
      : 'clamp(1rem, 2vw, 1.4rem)'

    return (
      <div
        key={idx}
        ref={(el) => { lineRefs.current[idx] = el }}
        onClick={() => seekToLine(line)}
        className={isActive ? 'slp-line-active' : undefined}
        style={{
          opacity,
          fontSize,
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: 'italic',
          lineHeight: 1.65,
          marginBottom: isActive ? '1.5rem' : '0.85rem',
          marginTop: isActive ? '1.5rem' : '0.85rem',
          cursor: 'pointer',
          transition: 'opacity 0.4s ease, font-size 0.3s ease, margin 0.3s ease',
          paddingLeft: '0.5rem',
          paddingRight: '2rem',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          position: 'relative',
        }}
        role="button"
        tabIndex={0}
        aria-label={`Seek to: ${line.words.map((w) => w.word).join(' ')}`}
        onKeyDown={(e) => e.key === 'Enter' && seekToLine(line)}
      >
        {/* G19: copy this line button — appears on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); copyLine(line) }}
          title="Copy line"
          style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(196,149,58,0.25)', opacity: 0, transition: 'opacity 0.2s',
            padding: '4px', fontSize: '12px',
          }}
          className="slp-copy-btn"
          aria-label="Copy line"
        >
          ⎘
        </button>
        {isActive
          ? line.words.map((w, wi) => {
              const wordIsActive = currentTime >= w.start && currentTime < w.end
              const wordIsPast = currentTime >= w.end
              return (
                <WordSpan
                  key={wi}
                  word={w}
                  isActive={wordIsActive}
                  isPast={wordIsPast}
                />
              )
            })
          : (
            <span style={{ color: isFuture ? 'rgba(242,237,227,0.45)' : 'rgba(242,237,227,0.22)' }}>
              {line.words.map((w) => w.word).join(' ')}
            </span>
          )
        }
      </div>
    )
  }

  // ── Container ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={className}
      style={{
        background: BLACK,
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 'min(70vh, 600px)',
        position: 'relative',
        animation: 'slp-enter 0.45s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* G06: Resume prompt */}
      {resumeAt !== null && (
        <div
          style={{
            position: 'absolute', top: '12px', left: '12px', right: '12px',
            zIndex: 10, background: 'rgba(4,4,10,0.92)',
            border: '1px solid rgba(196,149,58,0.25)',
            padding: '10px 16px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}
        >
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(184,197,208,0.8)' }}>
            Continue from {formatTime(resumeAt)}?
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { seek(resumeAt!); setResumeAt(null) }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#C4953A', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}
            >
              Resume
            </button>
            <button
              onClick={() => setResumeAt(null)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(184,197,208,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top fade gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: `linear-gradient(to bottom, ${BLACK} 0%, ${BLACK}00 100%)`,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Lyrics scroll area */}
      <div
        ref={linesRef}
        className="slp-lines-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: '60px',
          paddingBottom: '60px',
          paddingLeft: '2rem',
          paddingRight: '2rem',
          position: 'relative',
        }}
      >
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              color: 'rgba(196,149,58,0.5)',
              fontSize: '1.1rem',
            }}
          >
            Loading lyrics…
          </div>
        )}

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              color: 'rgba(184,197,208,0.4)',
              fontSize: '1rem',
              textAlign: 'center',
            }}
          >
            Synchronized lyrics unavailable
          </div>
        )}

        {!loading && !error && lines.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              color: 'rgba(184,197,208,0.3)',
            }}
          >
            — · —
          </div>
        )}

        {lines.map((line, idx) => renderLine(line, idx))}
      </div>

      {/* Bottom fade gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: '72px',
          left: 0,
          right: 0,
          height: '80px',
          background: `linear-gradient(to top, ${BLACK} 0%, ${BLACK}00 100%)`,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Controls bar */}
      <div
        style={{
          flexShrink: 0,
          background: VOID,
          borderTop: '1px solid rgba(196,149,58,0.1)',
          padding: '12px 20px 14px',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* G21: Lyrics density heatmap strip */}
        {densityBuckets.length > 0 && (
          <div style={{ display: 'flex', gap: '1px', height: '3px', marginBottom: '4px' }}>
            {densityBuckets.map((v, i) => {
              const isPast = duration > 0 && (i / densityBuckets.length) < (currentTime / duration)
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: '1px',
                    background: `rgba(196,149,58,${isPast ? 0.45 + v * 0.55 : 0.06 + v * 0.32})`,
                    transition: 'background 0.3s',
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Scrub row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
              fontSize: '11px',
              color: 'rgba(184,197,208,0.5)',
              letterSpacing: '0.05em',
              minWidth: '34px',
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            className="slp-scrub"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={onScrubChange}
            onMouseDown={onScrubStart}
            onMouseUp={onScrubEnd}
            onTouchStart={onScrubStart}
            onTouchEnd={onScrubEnd}
            style={{
              flex: 1,
              ['--pct' as string]: `${progress}%`,
            }}
            aria-label="Seek"
          />

          <span
            style={{
              fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
              fontSize: '11px',
              color: 'rgba(184,197,208,0.3)',
              letterSpacing: '0.05em',
              minWidth: '34px',
              flexShrink: 0,
            }}
          >
            {formatTime(duration)}
          </span>
        </div>

        {/* Play/pause row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          {/* G09: Loop toggle */}
          <button
            onClick={() => setIsLooping((v) => !v)}
            title={isLooping ? 'Loop on' : 'Loop off'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              color: isLooping ? '#C4953A' : 'rgba(184,197,208,0.3)',
              transition: 'color 0.2s',
            }}
            aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
          </button>

          {/* Rewind 10s */}
          <button
            onClick={() => seek(Math.max(0, currentTime - 10))}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(184,197,208,0.4)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(184,197,208,0.4)')}
            aria-label="Rewind 10 seconds"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V2L7 7l5 5V8c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              <text x="7.5" y="16" fontSize="5.5" fontFamily="sans-serif" fill="currentColor" textAnchor="middle">10</text>
            </svg>
          </button>

          {/* Play/pause */}
          <button
            onClick={togglePlay}
            disabled={!isReady && !loading}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              border: `1.5px solid ${GOLD}`,
              background: 'transparent',
              cursor: 'pointer',
              color: GOLD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, box-shadow 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${GOLD}18`
              e.currentTarget.style.boxShadow = `0 0 12px ${GOLD}44`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.boxShadow = 'none'
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* G18: Share this moment */}
          <button
            onClick={handleShare}
            title="Share this moment"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              color: copied ? '#C4953A' : 'rgba(184,197,208,0.3)',
              transition: 'color 0.2s', fontSize: '11px',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em',
            }}
            aria-label="Share this moment"
          >
            {copied ? '✓' : '⤴'}
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => seek(Math.min(duration, currentTime + 10))}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(184,197,208,0.4)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(184,197,208,0.4)')}
            aria-label="Forward 10 seconds"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v3l5-5-5-5v3c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/>
              <text x="16.5" y="16" fontSize="5.5" fontFamily="sans-serif" fill="currentColor" textAnchor="middle">10</text>
            </svg>
          </button>

          {/* G23: Playback rate */}
          <button
            onClick={cycleRate}
            title={`Speed: ${playbackRate}×`}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              color: playbackRate !== 1 ? '#C4953A' : 'rgba(184,197,208,0.28)',
              transition: 'color 0.2s', fontSize: '10px',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em',
              minWidth: '28px', textAlign: 'center',
            }}
            aria-label="Change playback speed"
          >
            {playbackRate}×
          </button>

          {/* G24: Print lyric sheet */}
          <button
            onClick={printLyrics}
            title="Download lyric sheet"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              color: 'rgba(184,197,208,0.25)', transition: 'color 0.2s', fontSize: '14px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(196,149,58,0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(184,197,208,0.25)')}
            aria-label="Download lyric sheet"
          >
            ⎙
          </button>
        </div>
      </div>
    </div>
  )
}
