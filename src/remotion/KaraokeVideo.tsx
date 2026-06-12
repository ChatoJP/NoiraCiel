import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
} from 'remotion'
import { useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Word {
  word: string
  start: number  // seconds
  end: number    // seconds
}

export interface Line {
  words: Word[]
}

export interface KaraokeVideoProps {
  trackTitle: string
  trackNumber: number | null
  albumTitle: string
  audioUrl: string | null
  songArtPath: string | null
  chapterBannerPath: string | null
  chapterEmotion: string | null
  lines: Line[]
  bgImages: string[]
}

// ─── Font loading ─────────────────────────────────────────────────────────────
function useFonts() {
  const handle = useRef<number | null>(null)
  useEffect(() => {
    handle.current = delayRender('Loading fonts')
    document.fonts.ready.then(() => {
      if (handle.current !== null) continueRender(handle.current)
    })
  }, [])
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FONT  = "'EB Garamond', 'Cormorant Garamond', Georgia, serif"
const GOLD  = '#C4953A'
const IVORY = '#F5F0E8'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getActiveLineIndex(lines: Line[], t: number): number {
  if (!lines.length) return -1
  const firstStart = lines[0].words[0]?.start ?? 0
  if (t < firstStart) return -1

  for (let i = 0; i < lines.length; i++) {
    const lineStart = lines[i].words[0]?.start ?? 0
    const nextStart = i + 1 < lines.length
      ? lines[i + 1].words[0]?.start ?? Infinity
      : Infinity
    if (t >= lineStart && t < nextStart) return i
  }
  return lines.length - 1
}

// ─── Background ───────────────────────────────────────────────────────────────
// Strategy: image at natural brightness + blur, with a single dark overlay
// for depth. Never stack multiple darkening layers.
function Background({ pool }: { pool: string[] }) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  if (pool.length === 0) {
    return <AbsoluteFill style={{ background: '#06060e' }} />
  }

  // Ken Burns — gentle zoom + drift across full video duration
  const scale = interpolate(frame, [0, durationInFrames], [1.04, 1.18], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const panX = interpolate(frame, [0, durationInFrames], [-2.5, 2.5], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const panY = interpolate(frame, [0, durationInFrames], [1.2, -1.2], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // Crossfade between images every 40s with 3s transition
  const CYCLE_FRAMES = Math.round(40 * fps)
  const FADE_FRAMES  = Math.round(3 * fps)
  const cycleIdx  = Math.floor(frame / CYCLE_FRAMES)
  const cyclePos  = frame % CYCLE_FRAMES
  const fadeStart = CYCLE_FRAMES - FADE_FRAMES

  const imgA = pool[cycleIdx % pool.length]
  const imgB = pool[(cycleIdx + 1) % pool.length]

  const crossfade = cyclePos >= fadeStart
    ? interpolate(cyclePos, [fadeStart, CYCLE_FRAMES], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      })
    : 0

  // On each cycle, alternate pan direction for cinematic variety
  const panDir = cycleIdx % 2 === 0 ? 1 : -1

  const makeTransform = (extraScale = 0) =>
    `scale(${scale + extraScale}) translate(${panX * panDir}%, ${panY}%)`

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    // Light blur — image stays recognisable. No brightness reduction here;
    // the single dark overlay below handles overall darkening uniformly.
    filter: 'blur(7px)',
    transform: makeTransform(),
  }

  return (
    <AbsoluteFill>
      {/* Near-black fallback base */}
      <AbsoluteFill style={{ background: '#06060e' }} />

      {/* Image A */}
      <AbsoluteFill style={{ overflow: 'hidden', opacity: 1 - crossfade }}>
        <Img src={staticFile(imgA)} style={imgStyle} />
      </AbsoluteFill>

      {/* Image B fading in at end of cycle */}
      {crossfade > 0 && (
        <AbsoluteFill style={{ overflow: 'hidden', opacity: crossfade }}>
          <Img
            src={staticFile(imgB)}
            style={{ ...imgStyle, transform: makeTransform(0.03) }}
          />
        </AbsoluteFill>
      )}

      {/* Single cinematic dark overlay — gives depth without destroying image.
          0.38 leaves bright parts clearly visible (~60% pass-through) */}
      <AbsoluteFill style={{ background: 'rgba(0,0,0,0.38)' }} />

      {/* Text-safety gradient — ONLY bottom quarter */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to bottom, transparent 65%, rgba(4,4,14,0.75) 100%)',
      }} />

      {/* Very subtle top shadow — just enough to frame chapter info */}
      <AbsoluteFill style={{
        background: 'linear-gradient(to bottom, rgba(4,4,14,0.35) 0%, transparent 14%)',
      }} />

      {/* Gentle edge vignette — keeps frame tight without darkening the center */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse 120% 110% at 50% 50%, transparent 55%, rgba(4,4,14,0.42) 100%)',
      }} />
    </AbsoluteFill>
  )
}

// ─── Opening title card ────────────────────────────────────────────────────────
function TitleCard({
  trackTitle,
  trackNumber,
  albumTitle,
  chapterEmotion,
  artPath,
  endFrame,
}: {
  trackTitle: string
  trackNumber: number | null
  albumTitle: string
  chapterEmotion: string | null
  artPath: string | null
  endFrame: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const opacity = interpolate(
    frame,
    [0, fps * 0.8, endFrame - fps * 0.7, endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const y = interpolate(frame, [0, fps * 1.0], [30, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity, transform: `translateY(${y}px)`,
    }}>
      {/* Subtle extra centre-darkening during title only */}
      {artPath && (
        <AbsoluteFill style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(4,4,14,0.25) 0%, transparent 100%)',
        }} />
      )}

      <div style={{ textAlign: 'center', padding: '0 120px', position: 'relative', zIndex: 1 }}>
        {trackNumber !== null && (
          <div style={{
            fontFamily: FONT, fontSize: 14, letterSpacing: '0.55em',
            color: GOLD, textTransform: 'uppercase', marginBottom: 28, opacity: 0.85,
          }}>
            Chapter {String(trackNumber).padStart(2, '0')}
          </div>
        )}
        <div style={{
          fontFamily: FONT, fontSize: 88, fontWeight: 300,
          color: IVORY, lineHeight: 1.05, letterSpacing: '0.04em',
          textShadow: '0 2px 40px rgba(0,0,0,0.7)',
        }}>
          {trackTitle}
        </div>
        {chapterEmotion && (
          <div style={{
            fontFamily: FONT, fontStyle: 'italic', fontSize: 20,
            color: 'rgba(245,240,232,0.48)', marginTop: 30,
            letterSpacing: '0.02em', lineHeight: 1.65,
            maxWidth: 680, margin: '30px auto 0',
            textShadow: '0 1px 12px rgba(0,0,0,0.6)',
          }}>
            {chapterEmotion}
          </div>
        )}
        <div style={{ width: 28, height: 1, background: GOLD, margin: '32px auto 0', opacity: 0.5 }} />
        <div style={{
          fontFamily: FONT, fontSize: 12, letterSpacing: '0.42em',
          color: 'rgba(245,240,232,0.30)', textTransform: 'uppercase', marginTop: 18,
        }}>
          {albumTitle}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ─── Karaoke word span ─────────────────────────────────────────────────────────
function WordSpan({ w, t, isActiveLine }: { w: Word; t: number; isActiveLine: boolean }) {
  const isPast   = t > w.end + 0.05
  const isActive = t >= w.start - 0.05 && t <= w.end + 0.05

  let color: string
  let shadow: string

  if (!isActiveLine) {
    color  = 'rgba(245,240,232,0.22)'
    shadow = 'none'
  } else if (isActive) {
    color  = '#FFFFFF'
    shadow = '0 0 30px rgba(255,255,255,0.65), 0 0 12px rgba(255,255,255,0.4)'
  } else if (isPast) {
    color  = GOLD
    shadow = '0 0 10px rgba(196,149,58,0.3)'
  } else {
    color  = 'rgba(245,240,232,0.40)'
    shadow = 'none'
  }

  return (
    <span style={{
      color, textShadow: shadow,
      display: 'inline', whiteSpace: 'pre',
    }}>
      {w.word}{' '}
    </span>
  )
}

// ─── Display line with entry animation ───────────────────────────────────────
function DisplayLine({
  line, isActive, isPrev, isNext, t,
}: {
  line: Line
  isActive: boolean
  isPrev: boolean
  isNext: boolean
  t: number
}) {
  const lineStart = line.words[0]?.start ?? 0
  const ENTRY = 0.45  // seconds for entry animation

  let fontSize: number
  let opacity: number
  let translateY: number

  if (isActive) {
    // Slide up + fade in as line becomes active
    fontSize   = interpolate(t, [lineStart, lineStart + ENTRY], [34, 56], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    })
    opacity    = interpolate(t, [lineStart, lineStart + ENTRY * 0.7], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    })
    translateY = interpolate(t, [lineStart, lineStart + ENTRY], [18, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    })
  } else if (isPrev) {
    fontSize = 28; opacity = 0.24; translateY = 0
  } else if (isNext) {
    fontSize = 28; opacity = 0.30; translateY = 0
  } else {
    fontSize = 28; opacity = 0; translateY = 0
  }

  return (
    <div style={{
      fontFamily: FONT,
      fontSize,
      fontWeight: 300,
      lineHeight: 1.4,
      letterSpacing: isActive ? '0.01em' : '0.022em',
      textAlign: 'center',
      opacity,
      transform: `translateY(${translateY}px)`,
      maxWidth: 1440,
      padding: '0 100px',
      userSelect: 'none',
    }}>
      {line.words.map((w, i) => (
        <WordSpan key={i} w={w} t={t} isActiveLine={isActive} />
      ))}
    </div>
  )
}

// ─── Karaoke display ──────────────────────────────────────────────────────────
function KaraokeDisplay({ lines, t }: { lines: Line[]; t: number }) {
  const activeIdx = getActiveLineIndex(lines, t)
  const prevIdx   = activeIdx > 0 ? activeIdx - 1 : -1
  const nextIdx   = activeIdx + 1 < lines.length ? activeIdx + 1 : -1

  return (
    <AbsoluteFill style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      {prevIdx >= 0 && (
        <DisplayLine line={lines[prevIdx]} isActive={false} isPrev isNext={false} t={t} />
      )}
      {activeIdx >= 0 && (
        <DisplayLine line={lines[activeIdx]} isActive isPrev={false} isNext={false} t={t} />
      )}
      {nextIdx >= 0 && (
        <DisplayLine line={lines[nextIdx]} isActive={false} isPrev={false} isNext t={t} />
      )}
    </AbsoluteFill>
  )
}

// ─── Closing card ─────────────────────────────────────────────────────────────
function ClosingCard({ startFrame }: { startFrame: number }) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const local = frame - startFrame
  const total = durationInFrames - startFrame

  const opacity = interpolate(
    local,
    [0, fps * 0.8, total - fps * 0.5, total],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: FONT, fontSize: 60, letterSpacing: '0.40em',
          color: IVORY, textTransform: 'uppercase', fontWeight: 300,
          textShadow: '0 2px 30px rgba(0,0,0,0.8)',
        }}>
          NoiraCiel
        </div>
        <div style={{ width: 26, height: 1, background: GOLD, margin: '18px auto', opacity: 0.55 }} />
        <div style={{
          fontFamily: FONT, fontSize: 13, letterSpacing: '0.32em',
          color: 'rgba(245,240,232,0.30)', textTransform: 'uppercase',
        }}>
          Atlantic Noir
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ─── Watermark ────────────────────────────────────────────────────────────────
function Watermark({ trackTitle, trackNumber }: { trackTitle: string; trackNumber: number | null }) {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', bottom: 38, left: 56,
        fontFamily: FONT, fontSize: 12, letterSpacing: '0.26em',
        color: 'rgba(245,240,232,0.18)', textTransform: 'uppercase',
      }}>
        {trackNumber !== null ? `${String(trackNumber).padStart(2, '0')} · ` : ''}{trackTitle}
      </div>
      <div style={{
        position: 'absolute', bottom: 38, right: 56,
        fontFamily: FONT, fontSize: 12, letterSpacing: '0.34em',
        color: 'rgba(196,149,58,0.28)', textTransform: 'uppercase',
      }}>
        NoiraCiel
      </div>
    </AbsoluteFill>
  )
}

// ─── Main composition ─────────────────────────────────────────────────────────
const OPENING_S = 3.5
const CLOSING_S = 3.0

export function KaraokeVideo({
  trackTitle,
  trackNumber,
  albumTitle,
  audioUrl,
  songArtPath,
  chapterBannerPath,
  chapterEmotion,
  lines,
  bgImages,
}: KaraokeVideoProps) {
  useFonts()

  const { fps, durationInFrames } = useVideoConfig()
  const frame = useCurrentFrame()
  const t     = frame / fps

  const openingFrames = Math.round(OPENING_S * fps)
  const closingStart  = durationInFrames - Math.round(CLOSING_S * fps)

  // Build image pool: prefer bgImages, fall back to chapter banner then song art
  const pool: string[] = bgImages.length > 0
    ? bgImages
    : ([chapterBannerPath, songArtPath].filter(Boolean) as string[])

  const lyricsOpacity = interpolate(
    frame,
    [openingFrames - fps * 0.6, openingFrames + fps * 0.5],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <AbsoluteFill style={{ background: '#06060e', fontFamily: 'Georgia, serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
      `}</style>

      {/* Visible cinematic background */}
      <Background pool={pool} />

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* Opening title card */}
      <TitleCard
        trackTitle={trackTitle}
        trackNumber={trackNumber}
        albumTitle={albumTitle}
        chapterEmotion={chapterEmotion}
        artPath={chapterBannerPath ?? songArtPath}
        endFrame={openingFrames}
      />

      {/* Karaoke lyrics */}
      {lines.length > 0 && (
        <AbsoluteFill style={{ opacity: lyricsOpacity }}>
          <KaraokeDisplay lines={lines} t={t} />
        </AbsoluteFill>
      )}

      {/* Closing card */}
      <ClosingCard startFrame={closingStart} />

      {/* Watermark */}
      <Watermark trackTitle={trackTitle} trackNumber={trackNumber} />
    </AbsoluteFill>
  )
}
