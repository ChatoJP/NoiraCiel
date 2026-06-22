'use client'

import { useEffect, useRef, useState } from 'react'

// R01: Bar noise ambient audio — crowd murmur, ice clinks, laughter (Web Audio)
export default function BarNoiseAmbience() {
  const [active, setActive] = useState(false)
  const ctxRef    = useRef<AudioContext | null>(null)
  const gainRef   = useRef<GainNode | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildCrowdNoise(ctx: AudioContext): AudioBufferSourceNode {
    const bufLen = ctx.sampleRate * 4
    const buf    = ctx.createBuffer(2, bufLen, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch)
      let b0 = 0, b1 = 0, b2 = 0
      for (let i = 0; i < bufLen; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        data[i] = (b0 + b1 + b2 + white * 0.0168980) * 0.11
      }
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop   = true
    return src
  }

  function scheduleIceClink(ctx: AudioContext, master: GainNode) {
    const delay = (3 + Math.random() * 10) * 1000
    timerRef.current = setTimeout(() => {
      if (!ctxRef.current) return
      const osc  = ctx.createOscillator()
      const env  = ctx.createGain()
      osc.type      = 'sine'
      osc.frequency.value = 3800 + Math.random() * 600
      env.gain.setValueAtTime(0.08, ctx.currentTime)
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
      osc.connect(env)
      env.connect(master)
      osc.start()
      osc.stop(ctx.currentTime + 0.14)
      scheduleIceClink(ctx, master)
    }, delay)
  }

  useEffect(() => {
    if (!active) {
      gainRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.3)
      if (timerRef.current) clearTimeout(timerRef.current)
      setTimeout(() => {
        sourceRef.current?.stop()
        ctxRef.current?.close()
        ctxRef.current = null
        sourceRef.current = null
      }, 500)
      return
    }

    const ctx   = new AudioContext()
    const gain  = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.5)
    gain.connect(ctx.destination)

    const src = buildCrowdNoise(ctx)
    src.connect(gain)
    src.start()

    ctxRef.current    = ctx
    gainRef.current   = gain
    sourceRef.current = src

    scheduleIceClink(ctx, gain)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      src.stop()
      ctx.close()
      ctxRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <button
      onClick={() => setActive(v => !v)}
      title={active ? 'Mute bar noise' : 'Enable bar noise'}
      style={{
        position: 'absolute',
        bottom: '0.75rem',
        right: '0.75rem',
        zIndex: 10,
        background: active ? 'rgba(196,149,58,0.18)' : 'rgba(6,8,15,0.55)',
        border: `1px solid ${active ? 'rgba(196,149,58,0.45)' : 'rgba(184,197,208,0.15)'}`,
        color: active ? 'rgba(196,149,58,0.9)' : 'rgba(184,197,208,0.45)',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        padding: '0.3rem 0.65rem',
        cursor: 'pointer',
        backdropFilter: 'blur(6px)',
        transition: 'all 0.3s',
      }}
    >
      {active ? '◈ bar noise on' : '◇ bar noise'}
    </button>
  )
}
