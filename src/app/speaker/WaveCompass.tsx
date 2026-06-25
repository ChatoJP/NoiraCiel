'use client'

import { useState } from 'react'
import SignGlyph from './SignGlyph'

/**
 * WaveCompass — a circular, data-driven reading instrument for the 13-day wave.
 *
 * 13 outer points = the 13 days/tones. The current day glows; tone 1 (open ring)
 * and tone 13 (filled) are visually distinct; past days dim, future days subtle.
 * The centre (KinCenterCard) shows the active/selected Kin. Hovering or tapping a
 * point selects it and updates the centre + the detail line — readable on mobile.
 */

export interface CompassDay {
  position: number
  date: string
  tone: number
  signName: string
  kinDisplay: string
  shortMeaning: string
  stage: string
  noiracielPrompt: string
}

const SIZE = 320
const C = SIZE / 2
const R_POINTS = 132

function pointXY(i: number) {
  const angle = (-90 + (i / 13) * 360) * (Math.PI / 180)
  return { x: C + Math.cos(angle) * R_POINTS, y: C + Math.sin(angle) * R_POINTS }
}

export default function WaveCompass({
  days,
  currentPosition,
}: {
  days: CompassDay[]
  currentPosition: number
}) {
  const [selected, setSelected] = useState(currentPosition)
  const active = days.find((d) => d.position === selected) ?? days[currentPosition - 1] ?? days[0]

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: '100%', maxWidth: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto text-t-accent" role="group" aria-label="13-day wave compass">
          {/* faint concentric rings */}
          <circle cx={C} cy={C} r={R_POINTS} fill="none" stroke="currentColor" strokeWidth={0.6} opacity={0.22} />
          <circle cx={C} cy={C} r={R_POINTS - 26} fill="none" stroke="currentColor" strokeWidth={0.4} opacity={0.12} />
          <circle cx={C} cy={C} r={64} fill="none" stroke="currentColor" strokeWidth={0.5} opacity={0.25} />

          {/* arc connecting seed → completion (subtle progress to today) */}
          {days.map((d, i) => {
            if (i === 0) return null
            const a = pointXY(i - 1)
            const b = pointXY(i)
            const reached = d.position <= currentPosition
            return (
              <line
                key={`l${d.position}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="currentColor"
                strokeWidth={reached ? 1 : 0.4}
                opacity={reached ? 0.4 : 0.12}
              />
            )
          })}

          {/* the 13 day points */}
          {days.map((d, i) => {
            const { x, y } = pointXY(i)
            const isActive = d.position === currentPosition
            const isSelected = d.position === selected
            const isPast = d.position < currentPosition
            const isFirst = d.position === 1
            const isLast = d.position === 13
            const baseOpacity = isActive ? 1 : isPast ? 0.55 : 0.32
            return (
              <g key={d.position} onClick={() => setSelected(d.position)} onMouseEnter={() => setSelected(d.position)} style={{ cursor: 'pointer' }}>
                {/* generous invisible hit area */}
                <circle cx={x} cy={y} r={16} fill="transparent" />
                {/* active halo */}
                {isActive && <circle cx={x} cy={y} r={11} fill="currentColor" opacity={0.18} />}
                {/* selection ring */}
                {isSelected && <circle cx={x} cy={y} r={9} fill="none" stroke="currentColor" strokeWidth={0.8} opacity={0.8} />}
                {/* the point: tone 1 = open ring (origin), tone 13 = filled+ring (completion) */}
                {isFirst ? (
                  <circle cx={x} cy={y} r={5} fill="none" stroke="currentColor" strokeWidth={1.4} opacity={baseOpacity} />
                ) : isLast ? (
                  <>
                    <circle cx={x} cy={y} r={5.5} fill="currentColor" opacity={baseOpacity} />
                    <circle cx={x} cy={y} r={8} fill="none" stroke="currentColor" strokeWidth={0.7} opacity={baseOpacity * 0.7} />
                  </>
                ) : (
                  <circle cx={x} cy={y} r={isActive ? 5 : 3.4} fill="currentColor" opacity={baseOpacity} />
                )}
                {/* tone number, just outside the point */}
                {(() => {
                  const lx = C + Math.cos((-90 + (i / 13) * 360) * (Math.PI / 180)) * (R_POINTS + 16)
                  const ly = C + Math.sin((-90 + (i / 13) * 360) * (Math.PI / 180)) * (R_POINTS + 16)
                  return (
                    <text x={lx} y={ly + 3} textAnchor="middle" className="fill-current" style={{ fontSize: 8 }} opacity={isActive ? 0.9 : isSelected ? 0.7 : 0.3}>
                      {d.tone}
                    </text>
                  )
                })()}
              </g>
            )
          })}
        </svg>

        {/* ── KinCenterCard ─────────────────────────────────────────────── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-10">
          <span className="text-t-accent">
            <SignGlyph sign={active.signName} size={40} />
          </span>
          <p className="font-heading italic text-2xl text-noir-ivory/90 mt-1.5 leading-none">{active.kinDisplay}</p>
          <p className="font-body text-[8.5px] tracking-[0.25em] uppercase text-noir-gold/55 mt-1.5">
            {active.stage}
          </p>
          {active.position === currentPosition && (
            <p className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35 mt-1">today</p>
          )}
        </div>
      </div>

      {/* ── Selected-day detail ───────────────────────────────────────────── */}
      <div className="w-full max-w-md mt-4 text-center">
        <p className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/40">
          Day {active.position} of 13 · {active.date} · {active.kinDisplay}
        </p>
        <p className="font-heading italic text-[14px] text-noir-ivory/75 leading-[1.7] mt-2">
          {active.shortMeaning}
        </p>
        <p className="font-body text-[11px] text-noir-silver/50 leading-relaxed mt-1.5">
          {active.noiracielPrompt}
        </p>
      </div>
    </div>
  )
}
