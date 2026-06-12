import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
} from 'remotion'
import { useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LyricVideoProps {
  trackTitle: string
  trackNumber: number | null
  albumTitle: string
  lyrics: string
  songArtPath: string | null  // e.g. "Images/song-art/why.jpg" (relative to public/)
  chapterEmotion: string | null
  audioUrl: string | null     // absolute file:// URL or public URL for the WAV/MP3
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
const OPENING_S = 3
const CLOSING_S = 2.5
const STANZA_FADE_S = 0.45
const STANZA_GAP_S = 0.25  // black gap between stanzas

// ─── Helper: opacity interpolation with fade-in and fade-out ─────────────────
function useFadeOpacity(
  startFrame: number,
  endFrame: number,
  fadeInFrames: number,
  fadeOutFrames: number
): number {
  const frame = useCurrentFrame()
  if (frame < startFrame || frame > endFrame) return 0
  const local = frame - startFrame
  const duration = endFrame - startFrame
  return interpolate(
    local,
    [0, fadeInFrames, duration - fadeOutFrames, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
}

// ─── Background component ─────────────────────────────────────────────────────
function Background({ songArtPath }: { songArtPath: string | null }) {
  return (
    <AbsoluteFill>
      {/* Solid dark base */}
      <AbsoluteFill style={{ background: '#06060e' }} />

      {/* Song artwork — blurred heavy, as texture */}
      {songArtPath && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={staticFile(songArtPath)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(40px) saturate(0.6)',
              transform: 'scale(1.15)',
              opacity: 0.25,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Gradient overlays for depth */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(6,6,14,0.3) 0%, rgba(6,6,14,0.75) 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(6,6,14,0.6) 0%, transparent 20%, transparent 80%, rgba(6,6,14,0.8) 100%)',
        }}
      />
    </AbsoluteFill>
  )
}

// ─── Opening card ─────────────────────────────────────────────────────────────
function OpeningCard({
  trackTitle,
  trackNumber,
  albumTitle,
  chapterEmotion,
  songArtPath,
  durationFrames,
}: {
  trackTitle: string
  trackNumber: number | null
  albumTitle: string
  chapterEmotion: string | null
  songArtPath: string | null
  durationFrames: number
}) {
  const { fps } = useVideoConfig()
  const frame = useCurrentFrame()

  // Artwork slides in and fills frame
  const artOpacity = interpolate(frame, [0, fps * 0.8, durationFrames - fps * 0.5, durationFrames], [0, 0.6, 0.6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const artScale = interpolate(frame, [0, fps], [1.06, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Text rises in
  const textY = interpolate(frame, [fps * 0.5, fps * 1.2], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const textOpacity = interpolate(frame, [fps * 0.5, fps * 1.3, durationFrames - fps * 0.5, durationFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill>
      {/* Full artwork behind */}
      {songArtPath && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={staticFile(songArtPath)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: artOpacity, transform: `scale(${artScale})`,
            }}
          />
          <AbsoluteFill style={{ background: 'rgba(6,6,14,0.55)' }} />
        </AbsoluteFill>
      )}

      {/* Text content */}
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, textAlign: 'center', padding: '0 80px' }}>
          {trackNumber !== null && (
            <div style={{
              fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
              fontSize: 18, letterSpacing: '0.5em', color: '#C4953A',
              textTransform: 'uppercase', marginBottom: 28, opacity: 0.8,
            }}>
              Chapter {String(trackNumber).padStart(2, '0')}
            </div>
          )}

          <div style={{
            fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
            fontSize: 80, fontWeight: 300, color: '#F5F0E8',
            lineHeight: 1.1, letterSpacing: '0.05em',
          }}>
            {trackTitle}
          </div>

          {chapterEmotion && (
            <div style={{
              fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic', fontSize: 24, color: 'rgba(245,240,232,0.5)',
              marginTop: 28, letterSpacing: '0.02em', lineHeight: 1.5, maxWidth: 700,
              margin: '28px auto 0',
            }}>
              {chapterEmotion}
            </div>
          )}

          <div style={{
            width: 40, height: 1, background: '#C4953A', margin: '36px auto 0', opacity: 0.5,
          }} />

          <div style={{
            fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
            fontSize: 14, letterSpacing: '0.35em', color: 'rgba(245,240,232,0.35)',
            textTransform: 'uppercase', marginTop: 20,
          }}>
            {albumTitle}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// ─── Single stanza display ────────────────────────────────────────────────────
function StanzaDisplay({
  lines,
  startFrame,
  endFrame,
}: {
  lines: string[]
  startFrame: number
  endFrame: number
}) {
  const { fps } = useVideoConfig()
  const fadeFrames = Math.round(STANZA_FADE_S * fps)
  const opacity = useFadeOpacity(startFrame, endFrame, fadeFrames, fadeFrames)

  const frame = useCurrentFrame()
  const y = interpolate(frame, [startFrame, startFrame + fadeFrames], [18, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 160px',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          textAlign: 'center',
          maxWidth: 900,
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
              fontSize: line.length < 40 ? 48 : line.length < 70 ? 38 : 30,
              fontWeight: 300,
              color: '#F5F0E8',
              lineHeight: 1.65,
              letterSpacing: '0.015em',
              marginBottom: i < lines.length - 1 ? 4 : 0,
            }}
          >
            {line || ' '}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

// ─── Closing card ─────────────────────────────────────────────────────────────
function ClosingCard({ startFrame, durationFrames }: { startFrame: number; durationFrames: number }) {
  const { fps } = useVideoConfig()
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const opacity = interpolate(local, [0, fps * 0.5, durationFrames - fps * 0.5, durationFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity, textAlign: 'center' }}>
        <div style={{
          fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
          fontSize: 52, letterSpacing: '0.35em', color: '#F5F0E8', textTransform: 'uppercase',
          fontWeight: 300,
        }}>
          NoiraCiel
        </div>
        <div style={{
          width: 32, height: 1, background: '#C4953A', margin: '20px auto', opacity: 0.6,
        }} />
        <div style={{
          fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
          fontSize: 16, letterSpacing: '0.3em', color: 'rgba(245,240,232,0.35)', textTransform: 'uppercase',
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
      {/* Bottom-left: chapter info */}
      <div style={{
        position: 'absolute', bottom: 44, left: 64,
        fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
        fontSize: 13, letterSpacing: '0.25em', color: 'rgba(245,240,232,0.2)',
        textTransform: 'uppercase',
      }}>
        {trackNumber !== null ? `${String(trackNumber).padStart(2, '0')} · ` : ''}{trackTitle}
      </div>
      {/* Bottom-right: NoiraCiel */}
      <div style={{
        position: 'absolute', bottom: 44, right: 64,
        fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
        fontSize: 13, letterSpacing: '0.3em', color: 'rgba(196,149,58,0.3)',
        textTransform: 'uppercase',
      }}>
        NoiraCiel
      </div>
    </AbsoluteFill>
  )
}

// ─── Main composition ─────────────────────────────────────────────────────────
export function LyricVideo({ trackTitle, trackNumber, albumTitle, lyrics, songArtPath, chapterEmotion, audioUrl }: LyricVideoProps) {
  useFonts()

  const { fps, durationInFrames } = useVideoConfig()

  const openingFrames = Math.round(OPENING_S * fps)
  const closingFrames = Math.round(CLOSING_S * fps)
  const gapFrames = Math.round(STANZA_GAP_S * fps)

  // Parse stanzas
  const stanzas = lyrics
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.split('\n').map((l) => l.trim()).filter(Boolean))

  // Calculate timing — lyrics fill middle section
  const lyricFrames = durationInFrames - openingFrames - closingFrames
  const framesPerStanza = Math.floor(lyricFrames / stanzas.length)

  return (
    <AbsoluteFill style={{ background: '#06060e', fontFamily: 'Georgia, serif' }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
      `}</style>

      {/* Audio track — full duration from frame 0 */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* Persistent background */}
      <Background songArtPath={songArtPath} />

      {/* Opening */}
      <Sequence from={0} durationInFrames={openingFrames}>
        <OpeningCard
          trackTitle={trackTitle}
          trackNumber={trackNumber}
          albumTitle={albumTitle}
          chapterEmotion={chapterEmotion}
          songArtPath={songArtPath}
          durationFrames={openingFrames}
        />
      </Sequence>

      {/* Stanzas */}
      {stanzas.map((lines, i) => {
        const stanzaStart = openingFrames + i * framesPerStanza
        const stanzaEnd = stanzaStart + framesPerStanza - gapFrames
        return (
          <StanzaDisplay
            key={i}
            lines={lines}
            startFrame={stanzaStart}
            endFrame={stanzaEnd}
          />
        )
      })}

      {/* Closing */}
      <Sequence from={durationInFrames - closingFrames} durationInFrames={closingFrames}>
        <ClosingCard startFrame={durationInFrames - closingFrames} durationFrames={closingFrames} />
      </Sequence>

      {/* Persistent watermark */}
      <Watermark trackTitle={trackTitle} trackNumber={trackNumber} />
    </AbsoluteFill>
  )
}
