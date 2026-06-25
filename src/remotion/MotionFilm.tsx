import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'

export type MotionFilmStyle = 'spirals' | 'brutalist' | 'sleek' | 'tribal' | 'objects' | 'default'

export interface MotionFilmProps {
  trackTitle: string
  visualStyle: MotionFilmStyle
  palette: string[] // hex colors, darkest-to-brightest order
  bpm: number
  energyLevel: number // 1-10
  durationInSeconds: number
}

function useBeat(bpm: number, fps: number, frame: number) {
  const t = frame / fps
  const beatDur = 60 / Math.max(bpm, 1)
  const phase = (t % beatDur) / beatDur
  const pulse = Math.pow(1 - phase, 3) // sharp decay, 1 right on the beat
  return { t, phase, pulse }
}

function Spirals({ palette, bpm, energy }: { palette: string[]; bpm: number; energy: number }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const { t, pulse } = useBeat(bpm, fps, frame)
  const cx = width / 2, cy = height / 2
  const amp = 0.5 + energy / 20
  const rings = 6
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle, ${palette[1]} 0%, ${palette[0]} 70%)` }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: rings }).map((_, i) => {
          const baseR = (Math.min(width, height) * 0.08) * (i + 1)
          const r = baseR * (1 + 0.06 * amp * Math.sin(t * 0.6 + i)) * (1 + pulse * 0.04)
          const rotation = t * (10 + i * 4) * (i % 2 === 0 ? 1 : -1)
          const color = palette[(i + 1) % palette.length]
          const points = 64
          const path = Array.from({ length: points }).map((_, p) => {
            const a = (p / points) * Math.PI * 2
            const wobble = 1 + 0.12 * Math.sin(a * (4 + i) + t * 1.5)
            const x = cx + Math.cos(a) * r * wobble
            const y = cy + Math.sin(a) * r * wobble
            return `${p === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
          }).join(' ') + ' Z'
          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={1.5 + (rings - i) * 0.4}
              opacity={0.55 - i * 0.06}
              transform={`rotate(${rotation} ${cx} ${cy})`}
            />
          )
        })}
        <circle cx={cx} cy={cy} r={20 + pulse * 30 * amp} fill={palette[palette.length - 1]} opacity={0.5 + pulse * 0.4} />
      </svg>
    </AbsoluteFill>
  )
}

function Brutalist({ palette, bpm, energy }: { palette: string[]; bpm: number; energy: number }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const { t, pulse } = useBeat(bpm, fps, frame)
  const amp = 0.5 + energy / 20
  const lines = 9
  return (
    <AbsoluteFill style={{ background: palette[0] }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: lines }).map((_, i) => {
          const yBase = (height / lines) * i + (height / lines) * 0.5
          const drift = Math.sin(t * 0.8 + i * 1.3) * width * 0.15 * amp
          const w = width * (0.3 + 0.5 * Math.abs(Math.sin(t * 0.5 + i)))
          const x = (width / 2) - w / 2 + drift
          const color = palette[(i + 1) % palette.length]
          return (
            <rect
              key={i}
              x={x} y={yBase - 3} width={w} height={6 + (i % 3)}
              fill={color}
              opacity={0.65}
              transform={`skewX(${-15 + i}) `}
            />
          )
        })}
        <rect x={0} y={0} width={width} height={height} fill="#FFFFFF" opacity={pulse * 0.08} />
      </svg>
    </AbsoluteFill>
  )
}

function Sleek({ palette, bpm, energy }: { palette: string[]; bpm: number; energy: number }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const { t, pulse } = useBeat(bpm, fps, frame)
  const amp = 0.5 + energy / 20
  const blobs = 4
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${palette[0]}, ${palette[1]})` }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="blur1"><feGaussianBlur stdDeviation="40" /></filter>
        </defs>
        <g filter="url(#blur1)">
          {Array.from({ length: blobs }).map((_, i) => {
            const cx = width * (0.2 + 0.6 * ((Math.sin(t * 0.25 + i * 2) + 1) / 2))
            const cy = height * (0.2 + 0.6 * ((Math.cos(t * 0.2 + i * 1.7) + 1) / 2))
            const r = (Math.min(width, height) * 0.18) * (1 + 0.1 * amp * Math.sin(t * 0.4 + i))
            const color = palette[(i + 1) % palette.length]
            return <circle key={i} cx={cx} cy={cy} r={r} fill={color} opacity={0.55} />
          })}
        </g>
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.32 + pulse * 14} fill="none" stroke={palette[palette.length - 1]} strokeWidth={1.5} opacity={0.35 + pulse * 0.25} />
      </svg>
    </AbsoluteFill>
  )
}

function Tribal({ palette, bpm, energy }: { palette: string[]; bpm: number; energy: number }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const { t, phase, pulse } = useBeat(bpm, fps, frame)
  const amp = 0.5 + energy / 20
  const cx = width / 2, cy = height / 2
  const ripples = 5
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle, ${palette[1]} 0%, ${palette[0]} 75%)` }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: ripples }).map((_, i) => {
          const localPhase = (phase + i / ripples) % 1
          const r = localPhase * Math.min(width, height) * 0.55 * amp
          const opacity = (1 - localPhase) * 0.5
          const color = palette[(i + 1) % palette.length]
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={3} opacity={opacity} />
        })}
        <circle cx={cx} cy={cy} r={30 + pulse * 24 * amp} fill={palette[palette.length - 1]} opacity={0.4 + pulse * 0.4} />
        <ellipse cx={cx} cy={cy} rx={Math.min(width, height) * 0.4} ry={Math.min(width, height) * 0.4} fill="none" stroke={palette[2 % palette.length]} strokeWidth={1} opacity={0.15} transform={`rotate(${t * 6} ${cx} ${cy})`} />
      </svg>
    </AbsoluteFill>
  )
}

type ObjectKind = 'vinyl' | 'note' | 'instrument'
const OBJECT_KINDS: ObjectKind[] = ['vinyl', 'note', 'instrument', 'vinyl', 'note', 'instrument', 'vinyl', 'note']

function VinylRecord({ size, color, accent }: { size: number; color: string; accent: string }) {
  return (
    <g>
      <circle r={size} fill={color} opacity={0.85} />
      <circle r={size * 0.8} fill="none" stroke={accent} strokeWidth={0.6} opacity={0.3} />
      <circle r={size * 0.55} fill="none" stroke={accent} strokeWidth={0.6} opacity={0.25} />
      <circle r={size * 0.3} fill={accent} opacity={0.55} />
      <circle r={size * 0.06} fill="#000" opacity={0.6} />
    </g>
  )
}

function MusicNote({ size, color }: { size: number; color: string }) {
  return (
    <g transform={`scale(${(size / 20).toFixed(2)})`}>
      <ellipse cx={0} cy={20} rx={6} ry={4.2} fill={color} transform="rotate(-18 0 20)" />
      <rect x={5.2} y={-14} width={1.8} height={34} fill={color} />
      <path d="M7 -14 C 16 -10, 17 0, 8 4" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  )
}

function InstrumentSilhouette({ size, color }: { size: number; color: string }) {
  return (
    <g transform={`scale(${(size / 20).toFixed(2)})`} opacity={0.85}>
      <rect x={-5} y={-30} width={10} height={6} fill={color} />
      <rect x={-2} y={-26} width={4} height={40} fill={color} />
      <ellipse cx={0} cy={14} rx={13} ry={16} fill={color} />
      <ellipse cx={0} cy={14} rx={5} ry={6} fill="#000000" opacity={0.35} />
    </g>
  )
}

// Abstract floating-object scene (NOT literal/photographic) — vinyl discs,
// music notes, and instrument silhouettes drift on independent sine paths;
// a slow size pulse on each fakes z-axis depth without a real 3D engine.
function Objects({ palette, bpm, energy }: { palette: string[]; bpm: number; energy: number }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const { t, pulse } = useBeat(bpm, fps, frame)
  const amp = 0.5 + energy / 20
  // Objects sit on a dark backdrop (the two darkest palette colors), so they
  // must only ever use the brighter half of the palette — using the full
  // palette modulo previously picked the near-black color for some objects,
  // making them invisible against the background.
  const bright = palette.slice(Math.max(1, palette.length - 2))
  return (
    <AbsoluteFill style={{ background: `linear-gradient(150deg, ${palette[0]}, ${palette[1]})` }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {OBJECT_KINDS.map((kind, i) => {
          const seedX = ((i * 71 + 13) % 100) / 100
          const seedY = ((i * 37 + 29) % 100) / 100
          const speed = 0.18 + (i % 3) * 0.05
          const x = width * seedX + Math.sin(t * speed + i) * width * 0.12 * amp
          const y = height * seedY + Math.cos(t * speed * 0.8 + i * 1.5) * height * 0.12 * amp
          const depth = 0.85 + 0.35 * Math.sin(t * 0.25 + i * 2) // fakes z-axis drift
          const size = (26 + (i % 3) * 10) * depth
          const rotation = t * (8 + i * 3) * (i % 2 === 0 ? 1 : -1)
          const color = bright[i % bright.length]
          const accent = bright[(i + 1) % bright.length]
          return (
            <g
              key={i}
              transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rotation.toFixed(1)})`}
              opacity={0.55 + depth * 0.4}
            >
              {kind === 'vinyl' && <VinylRecord size={size} color={color} accent={accent} />}
              {kind === 'note' && <MusicNote size={size} color={color} />}
              {kind === 'instrument' && <InstrumentSilhouette size={size} color={color} />}
            </g>
          )
        })}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={Math.min(width, height) * 0.018 + pulse * 8 * amp}
          fill={palette[palette.length - 1]}
          opacity={0.25 + pulse * 0.3}
        />
      </svg>
    </AbsoluteFill>
  )
}

function DefaultStyle({ palette, bpm, energy }: { palette: string[]; bpm: number; energy: number }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const { t, pulse } = useBeat(bpm, fps, frame)
  const amp = 0.5 + energy / 20
  const particles = 24
  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: particles }).map((_, i) => {
          const seedX = (i * 97) % 100 / 100
          const seedY = (i * 53) % 100 / 100
          const x = width * seedX + Math.sin(t * 0.3 + i) * 30 * amp
          const y = height * seedY + Math.cos(t * 0.25 + i) * 30 * amp
          const r = 2 + (i % 4)
          const color = palette[(i + 2) % palette.length]
          return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={0.4} />
        })}
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.3 + pulse * 16} fill="none" stroke={palette[palette.length - 1]} strokeWidth={1.5} opacity={0.3 + pulse * 0.3} />
      </svg>
    </AbsoluteFill>
  )
}

const STYLE_COMPONENTS: Record<MotionFilmStyle, React.FC<{ palette: string[]; bpm: number; energy: number }>> = {
  spirals: Spirals,
  brutalist: Brutalist,
  sleek: Sleek,
  tribal: Tribal,
  objects: Objects,
  default: DefaultStyle,
}

export function MotionFilm(props: MotionFilmProps) {
  const Style = STYLE_COMPONENTS[props.visualStyle] ?? DefaultStyle
  return (
    <AbsoluteFill>
      <Style palette={props.palette} bpm={props.bpm} energy={props.energyLevel} />
      {/* Subtle vignette so the edges fall into NoiraCiel's signature darkness */}
      <AbsoluteFill style={{ background: 'radial-gradient(circle, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
    </AbsoluteFill>
  )
}
