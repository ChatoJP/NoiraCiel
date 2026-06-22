'use client'

import dynamic from 'next/dynamic'
import type { Room } from '../types'
import type { GhostTrack } from '@/components/ghost-performance/stage/GhostStage'

const GhostStage        = dynamic(() => import('@/components/ghost-performance/stage/GhostStage'),                            { ssr: false })
const SmokeCanvas       = dynamic(() => import('./SmokeCanvas'),                                                               { ssr: false })
const RainWindow        = dynamic(() => import('./RainWindow'),                                                                { ssr: false })
const NeonSign          = dynamic(() => import('./NeonSign'),                                                                  { ssr: false })
const BarNoiseAmbience  = dynamic(() => import('./BarNoiseAmbience'),                                                          { ssr: false })

// R03: Candle flicker CSS — injected once
const CANDLE_CSS = `
@keyframes nr-candle-flame {
  0%, 100% { transform: scaleY(1) scaleX(1) rotate(-1deg); opacity: 0.9; }
  15%       { transform: scaleY(1.08) scaleX(0.94) rotate(1.5deg); opacity: 1; }
  30%       { transform: scaleY(0.93) scaleX(1.06) rotate(-2deg); opacity: 0.82; }
  50%       { transform: scaleY(1.12) scaleX(0.92) rotate(1deg); opacity: 0.95; }
  70%       { transform: scaleY(0.96) scaleX(1.04) rotate(-1.5deg); opacity: 0.88; }
  85%       { transform: scaleY(1.05) scaleX(0.97) rotate(2deg); opacity: 1; }
}
@keyframes nr-candle-glow {
  0%, 100% { box-shadow: 0 0 14px 6px rgba(220,140,40,0.22), 0 0 28px 12px rgba(200,100,20,0.10); }
  40%       { box-shadow: 0 0 20px 10px rgba(220,140,40,0.30), 0 0 40px 18px rgba(200,100,20,0.14); }
  70%       { box-shadow: 0 0 10px 4px rgba(220,140,40,0.18), 0 0 22px 8px rgba(200,100,20,0.08); }
}
`

interface RoomAmbienceProps {
  room:         Room
  liveCount:    number
  dimmerLevel:  number  // 0–4, default 2
  candlelight:  boolean
}

// R06: bar stool SVG
function BarStool({ filled }: { filled: boolean }) {
  const c = filled ? 'rgba(196,149,58,0.65)' : 'rgba(184,197,208,0.18)'
  return (
    <svg width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden>
      <rect x="2" y="0" width="12" height="4" rx="1" fill={c} />
      <rect x="6.5" y="4" width="3" height="12" fill={c} />
      <path d="M4 16 L1 24 M12 16 L15 24" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="20" x2="13" y2="20" stroke={c} strokeWidth="1.2" />
    </svg>
  )
}

export default function RoomAmbience({ room, liveCount, dimmerLevel, candlelight }: RoomAmbienceProps) {
  const ghostTrack: GhostTrack = {
    id:        room.currentTrack.id,
    albumSlug: room.currentTrack.albumSlug ?? room.albumSlug,
  }

  // R07: fog density tied to liveCount
  const fogOpacity = Math.min(0.7, 0.18 + (liveCount / 30) * 0.52)

  // R08: dimmer brightness
  const dimmerBrightness = [0.45, 0.65, 1, 1.15, 1.28][dimmerLevel] ?? 1

  // R09: candlelight palette vars
  const candleStyle: React.CSSProperties = candlelight
    ? { filter: `brightness(${dimmerBrightness}) sepia(0.25) hue-rotate(-10deg)` }
    : { filter: `brightness(${dimmerBrightness})` }

  // R06: bar stools — 8 total, fill proportionally to liveCount (max fill at 15)
  const stoolCount   = 8
  const filledStools = Math.round(Math.min(stoolCount, (liveCount / 15) * stoolCount))

  return (
    <div className="nr-ambience" style={{ background: room.gradient, position: 'relative', overflow: 'hidden', ...candleStyle }}>
      <style>{CANDLE_CSS}</style>

      {/* Audio-reactive stage fills the ambience background */}
      <div className="nr-ambience-stage" aria-hidden="true">
        <GhostStage track={ghostTrack} />
      </div>

      {/* R07: Fog overlay with density tied to liveCount */}
      <div
        className="nr-ambience-fog"
        aria-hidden="true"
        style={{ opacity: fogOpacity }}
      />

      {/* R02: Smoke wisps */}
      <SmokeCanvas />

      {/* R04: Rain-streaked window */}
      <RainWindow />

      {/* R05: Neon sign */}
      <NeonSign roomId={room.id} />

      {/* R03: Candle flicker — bottom-left corner */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '0.9rem',
          left: '1.1rem',
          zIndex: 4,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* Flame */}
        <div
          style={{
            width: 8,
            height: 14,
            background: 'radial-gradient(ellipse at 50% 80%, #ffd060, #ff8820 55%, transparent 100%)',
            borderRadius: '50% 50% 35% 35%',
            animation: 'nr-candle-flame 2.1s ease-in-out infinite',
            transformOrigin: '50% 100%',
          }}
        />
        {/* Wax body */}
        <div
          style={{
            width: 6,
            height: 18,
            background: 'linear-gradient(to bottom, #e8d8b0, #c4b088)',
            borderRadius: '2px 2px 1px 1px',
            animation: 'nr-candle-glow 3.2s ease-in-out infinite',
            boxShadow: '0 0 14px 6px rgba(220,140,40,0.22)',
          }}
        />
      </div>

      {/* R06: Bar stools row */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.6rem',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: stoolCount }, (_, i) => (
          <BarStool key={i} filled={i < filledStools} />
        ))}
      </div>

      {/* R01: Bar noise toggle */}
      <BarNoiseAmbience />

      {/* Room identity — overlaid on top of stage */}
      <div className="nr-ambience-identity">
        <div className="nr-ambience-mood-tags">
          {room.mood.slice(0, 3).map((m) => (
            <span key={m} className="nr-mood-tag">{m}</span>
          ))}
        </div>
        <p className="nr-ambience-tagline">{room.tagline}</p>
        <p className="nr-ambience-description">{room.description}</p>
        {room.album && (
          <div className="nr-ambience-album">
            From the world of · {room.album}
          </div>
        )}
      </div>
    </div>
  )
}
