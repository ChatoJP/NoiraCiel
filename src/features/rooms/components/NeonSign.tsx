'use client'

// R05: Animated neon sign unique per room — glows and flickers
const ROOM_GLYPHS: Record<string, { glyph: string; color: string }> = {
  'the-blue-hour':         { glyph: 'BLUE HOUR',     color: '#6b9ebe' },
  'midnight-salt':         { glyph: 'MIDNIGHT',      color: '#9478c0' },
  'the-smoking-room':      { glyph: 'SMOKING ROOM',  color: '#c4953a' },
  'quiet-corner':          { glyph: 'QUIET CORNER',  color: '#a0b8a0' },
  'the-velvet-booth':      { glyph: 'VELVET BOOTH',  color: '#c05070' },
  'lost-atlantic':         { glyph: 'LOST ATLANTIC', color: '#6b9ebe' },
  'ember-room':            { glyph: 'EMBER ROOM',    color: '#d4703a' },
  'the-last-round':        { glyph: 'LAST ROUND',    color: '#c4953a' },
  'vinyl-back-room':       { glyph: 'VINYL',         color: '#b0a0d8' },
  'no-mans-land':          { glyph: 'NO MAN\'S LAND',color: '#8699b0' },
}

const FLICKER_KEYFRAMES = `
@keyframes nr-neon-flicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    opacity: 1;
    text-shadow: var(--neon-glow);
  }
  20%, 24%, 55% {
    opacity: 0.4;
    text-shadow: none;
  }
}
`

export default function NeonSign({ roomId }: { roomId: string }) {
  const def   = ROOM_GLYPHS[roomId] ?? { glyph: 'OPEN', color: '#c4953a' }
  const color = def.color
  const glow  = `0 0 6px ${color}, 0 0 12px ${color}80, 0 0 22px ${color}40`

  return (
    <>
      <style>{FLICKER_KEYFRAMES}</style>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontStyle: 'italic',
            fontSize: '0.75rem',
            letterSpacing: '0.25em',
            color,
            ['--neon-glow' as string]: glow,
            textShadow: glow,
            animation: 'nr-neon-flicker 8s infinite',
            animationDelay: '2s',
            userSelect: 'none',
          }}
        >
          {def.glyph}
        </span>
      </div>
    </>
  )
}
