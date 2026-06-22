'use client'

import { useEffect, useState, useCallback } from 'react'
import { useStudio } from './StudioContext'

export default function SamplePads() {
  const { pads, triggerPad, setPadPitch } = useStudio()
  const [flash, setFlash] = useState<number | null>(null)

  const fire = useCallback((i: number) => {
    triggerPad(i)
    setFlash(i)
    setTimeout(() => setFlash(null), 120)
  }, [triggerPad])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      const num = parseInt(e.key)
      if (num >= 1 && num <= 8) fire(num - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fire])

  return (
    <div className="space-y-4">
      <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/35">
        Keys 1–8 trigger pads · Assign samples in the Slicer tab
      </p>

      <div className="grid grid-cols-4 gap-3">
        {pads.map((pad, i) => {
          const hasBuffer = !!pad.buffer
          const isFlashing = flash === i
          return (
            <div key={i} className="flex flex-col gap-1">
              <button
                onMouseDown={() => fire(i)}
                className={`relative h-24 sm:h-28 border transition-all duration-75 flex flex-col items-center justify-center gap-1 select-none ${
                  isFlashing ? 'scale-95' : hasBuffer ? 'hover:scale-98' : 'hover:border-noir-silver/20'
                }`}
                style={{
                  borderColor: isFlashing ? pad.color : hasBuffer ? `${pad.color}55` : 'rgba(184,197,208,0.08)',
                  background: isFlashing ? `${pad.color}35` : hasBuffer ? `${pad.color}12` : 'rgba(184,197,208,0.02)',
                  boxShadow: isFlashing ? `0 0 20px ${pad.color}40` : 'none',
                }}
              >
                <span className="font-body text-[9px] tracking-[0.2em]"
                  style={{ color: isFlashing ? pad.color : hasBuffer ? `${pad.color}90` : 'rgba(184,197,208,0.2)' }}>
                  {i + 1}
                </span>
                <span className="font-heading italic text-xs text-center px-2 leading-tight"
                  style={{ color: isFlashing ? 'rgba(242,237,227,0.95)' : hasBuffer ? 'rgba(242,237,227,0.7)' : 'rgba(184,197,208,0.2)' }}>
                  {hasBuffer ? pad.label : '—'}
                </span>
                {hasBuffer && pad.sourceTitle && (
                  <span className="font-body text-[7px] text-center px-2 leading-tight opacity-50" style={{ color: pad.color }}>
                    {pad.sourceTitle.slice(0, 16)}
                  </span>
                )}
                {hasBuffer && pad.buffer && (
                  <span className="font-body text-[7px] opacity-40" style={{ color: pad.color }}>
                    {pad.buffer.duration.toFixed(1)}s
                  </span>
                )}
                {!hasBuffer && (
                  <span className="font-body text-[8px] text-noir-silver/15 mt-1">empty</span>
                )}
                {hasBuffer && (
                  <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: isFlashing ? pad.color : `${pad.color}60` }} />
                )}
              </button>

              {/* Pitch control */}
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={() => setPadPitch(i, Math.max(-12, pad.pitch - 1))}
                  disabled={!hasBuffer}
                  className="w-5 h-5 text-xs flex items-center justify-center border border-noir-silver/10 text-noir-silver/30 hover:border-t-accent/30 hover:text-t-accent/60 disabled:opacity-20 transition-all"
                >−</button>
                <span className="font-body text-[8px] tabular-nums"
                  style={{ color: pad.pitch !== 0 ? `${pad.color}cc` : 'rgba(184,197,208,0.2)' }}>
                  {pad.pitch > 0 ? `+${pad.pitch}` : pad.pitch === 0 ? '0' : pad.pitch}st
                </span>
                <button
                  onClick={() => setPadPitch(i, Math.min(12, pad.pitch + 1))}
                  disabled={!hasBuffer}
                  className="w-5 h-5 text-xs flex items-center justify-center border border-noir-silver/10 text-noir-silver/30 hover:border-t-accent/30 hover:text-t-accent/60 disabled:opacity-20 transition-all"
                >+</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-8 gap-1 mt-1">
        {pads.map((_, i) => (
          <div key={i} className="text-center font-body text-[7px] text-noir-silver/20">{i + 1}</div>
        ))}
      </div>
    </div>
  )
}
