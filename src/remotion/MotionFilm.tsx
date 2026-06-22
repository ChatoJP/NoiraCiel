import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'

export type MotionFilmStyle = 'spirals' | 'brutalist' | 'sleek' | 'tribal' | 'default'

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
