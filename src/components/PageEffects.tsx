'use client'

import { useEffect, useRef, useState } from 'react'
import { useAudio } from '@/context/AudioContext'

// G53: Observe section headings and add fade-in class
function useSectionFadeIn() {
  useEffect(() => {
    const els = document.querySelectorAll('h2:not(.no-fade), h3:not(.no-fade), .fade-section')
    els.forEach(el => {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.15) {
        el.classList.add('fade-section')
      }
    })
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    document.querySelectorAll('.fade-section').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// G58: Cursor afterglow on click-drag
function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = glowRef.current
    if (!el) return
    let dragging = false

    const onMouseDown = (e: MouseEvent) => {
      dragging = true
      flash(e.clientX, e.clientY)
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return
      flash(e.clientX, e.clientY)
    }
    const onMouseUp = () => { dragging = false }

    function flash(x: number, y: number) {
      if (!el) return
      el.style.left = `${x - 12}px`
      el.style.top = `${y - 12}px`
      el.style.opacity = '1'
      el.style.transform = 'scale(1)'
      clearTimeout((el as HTMLElement & { _t?: ReturnType<typeof setTimeout> })._t)
      ;(el as HTMLElement & { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
        el.style.opacity = '0'
        el.style.transform = 'scale(2)'
      }, 80)
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,149,58,0.7) 0%, rgba(196,149,58,0) 70%)',
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: 0,
        transform: 'scale(1)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        mixBlendMode: 'screen',
      }}
    />
  )
}

// G59: Inactivity starfield after 5 minutes
function InactivityStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const animRef = useRef<number>()

  useEffect(() => {
    const reset = () => {
      setActive(false)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setActive(true), 5 * 60 * 1000)
    }
    reset()
    const events = ['mousemove', 'keydown', 'click', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    return () => {
      clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random(),
    }))

    function draw() {
      if (!canvas || !ctx || !active) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const s of stars) {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(196,149,58,${s.a * 0.6})`
        ctx.fill()
        s.x += s.vx
        s.y += s.vy
        if (s.x < 0) s.x = canvas.width
        if (s.x > canvas.width) s.x = 0
        if (s.y < 0) s.y = canvas.height
        if (s.y > canvas.height) s.y = 0
        s.a = 0.4 + 0.6 * Math.sin(Date.now() / 2000 + s.x)
      }
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9990,
        opacity: 0.7,
      }}
    />
  )
}

// G62: Typing "noira" triggers gold particle burst
function NoiraEasterEgg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bufferRef = useRef('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      bufferRef.current = (bufferRef.current + e.key).slice(-5)
      if (bufferRef.current.toLowerCase() === 'noira') {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        canvas.style.display = 'block'
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        const particles = Array.from({ length: 200 }, () => ({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.5) * 18,
          r: Math.random() * 3 + 1,
          a: 1,
        }))
        const start = performance.now()
        const dur = 800
        function draw(now: number) {
          if (!ctx || !canvas) return
          const elapsed = now - start
          if (elapsed > dur) { canvas.style.display = 'none'; return }
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          const t = elapsed / dur
          for (const p of particles) {
            p.x += p.vx
            p.y += p.vy
            p.a = 1 - t
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(196,149,58,${p.a})`
            ctx.fill()
          }
          requestAnimationFrame(draw)
        }
        requestAnimationFrame(draw)
        bufferRef.current = ''
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        display: 'none',
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99990,
      }}
    />
  )
}

// G79: Ambient audio toggle (rain / fireplace / night wind)
type AmbientMode = 'off' | 'rain' | 'fireplace' | 'wind'

function useAmbientNoise() {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<AudioNode[]>([])

  const stop = () => {
    nodesRef.current.forEach(n => { try { (n as AudioBufferSourceNode).stop?.() } catch { } })
    nodesRef.current = []
    ctxRef.current?.close()
    ctxRef.current = null
  }

  const start = (mode: Exclude<AmbientMode, 'off'>) => {
    stop()
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const bufSize = ctx.sampleRate * 3
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    // Brown noise base
    let last = 0
    for (let i = 0; i < bufSize; i++) {
      const w = (Math.random() * 2 - 1) * 0.02
      last = (last + w) * 0.998
      data[i] = Math.max(-1, Math.min(1, last * 3.5))
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true

    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    if (mode === 'rain') {
      filter.type = 'highpass'
      filter.frequency.value = 400
      gain.gain.value = 0.5
    } else if (mode === 'fireplace') {
      filter.type = 'lowpass'
      filter.frequency.value = 800
      gain.gain.value = 0.35
    } else { // wind
      filter.type = 'bandpass'
      filter.frequency.value = 200
      filter.Q.value = 0.5
      gain.gain.value = 0.4
    }

    src.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    src.start()
    nodesRef.current = [src, filter, gain]
  }

  useEffect(() => () => stop(), [])
  return { start, stop }
}

const AMBIENT_MODES: AmbientMode[] = ['off', 'rain', 'fireplace', 'wind']
const AMBIENT_ICONS: Record<AmbientMode, string> = { off: '◎', rain: '⋮', fireplace: '△', wind: '~' }

function AmbientToggle() {
  const [mode, setMode] = useState<AmbientMode>('off')
  const { start, stop } = useAmbientNoise()

  const cycle = () => {
    const next = AMBIENT_MODES[(AMBIENT_MODES.indexOf(mode) + 1) % AMBIENT_MODES.length]
    setMode(next)
    if (next === 'off') stop()
    else start(next)
  }

  return (
    <button
      onClick={cycle}
      title={`Ambient: ${mode}`}
      aria-label={`Ambient sound: ${mode}`}
      style={{
        position: 'fixed',
        bottom: '126px',
        right: '16px',
        zIndex: 9998,
        background: 'rgba(8,8,16,0.85)',
        border: `1px solid ${mode !== 'off' ? 'rgba(196,149,58,0.4)' : 'rgba(184,197,208,0.12)'}`,
        color: mode !== 'off' ? 'rgba(196,149,58,0.8)' : 'rgba(184,197,208,0.3)',
        width: '30px',
        height: '30px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        backdropFilter: 'blur(4px)',
      }}
    >
      {AMBIENT_ICONS[mode]}
    </button>
  )
}

// G60: Film grain toggle button
function FilmGrainToggle() {
  const [grain, setGrain] = useState(false)

  const toggle = () => {
    const next = !grain
    setGrain(next)
    document.body.classList.toggle('film-grain', next)
  }

  return (
    <button
      onClick={toggle}
      title={grain ? 'Disable film grain' : 'Enable film grain'}
      aria-label="Toggle film grain effect"
      style={{
        position: 'fixed',
        bottom: '90px',
        right: '16px',
        zIndex: 9998,
        background: 'rgba(8,8,16,0.85)',
        border: `1px solid ${grain ? 'rgba(196,149,58,0.4)' : 'rgba(184,197,208,0.12)'}`,
        color: grain ? 'rgba(196,149,58,0.8)' : 'rgba(184,197,208,0.3)',
        width: '30px',
        height: '30px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        backdropFilter: 'blur(4px)',
      }}
    >
      ◫
    </button>
  )
}

// G90: Beat-sync strobe — 1px gold line flashes at kick events
function BeatStrobe() {
  const { isPlaying, getAnalyser } = useAudio()
  const lineRef = useRef<HTMLDivElement>(null)
  const prevKickRef = useRef(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    if (!isPlaying) return
    const analyser = getAnalyser()
    if (!analyser) return
    analyser.fftSize = 256
    const buf = new Uint8Array(analyser.frequencyBinCount)

    function tick() {
      analyser!.getByteFrequencyData(buf)
      // Kick energy is in the 60–150 Hz range — bins 1-4 at 44.1kHz/256 FFT
      const kick = (buf[1] + buf[2] + buf[3] + buf[4]) / 4
      const el = lineRef.current
      if (el && kick > 160 && Date.now() - prevKickRef.current > 120) {
        prevKickRef.current = Date.now()
        el.style.opacity = '1'
        setTimeout(() => { if (el) el.style.opacity = '0' }, 60)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isPlaying, getAnalyser])

  return (
    <div
      ref={lineRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(196,149,58,0.9) 20%, rgba(196,149,58,0.9) 80%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 99995,
        opacity: 0,
        transition: 'opacity 0.06s ease',
        boxShadow: '0 0 6px rgba(196,149,58,0.8)',
      }}
    />
  )
}

// G80: Night mode intensifier
function NightModeIntensifier() {
  const [deep, setDeep] = useState(false)

  const toggle = () => {
    const next = !deep
    setDeep(next)
    document.body.classList.toggle('deep-void', next)
  }

  return (
    <button
      onClick={toggle}
      title={deep ? 'Restore brightness' : 'Deepen night mode'}
      aria-label="Toggle deep void mode"
      style={{
        position: 'fixed',
        bottom: '162px',
        right: '16px',
        zIndex: 9998,
        background: 'rgba(8,8,16,0.85)',
        border: `1px solid ${deep ? 'rgba(196,149,58,0.4)' : 'rgba(184,197,208,0.12)'}`,
        color: deep ? 'rgba(196,149,58,0.8)' : 'rgba(184,197,208,0.3)',
        width: '30px',
        height: '30px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        backdropFilter: 'blur(4px)',
      }}
    >
      ◐
    </button>
  )
}

export default function PageEffects() {
  useSectionFadeIn()
  return (
    <>
      <CursorGlow />
      <InactivityStarfield />
      <FilmGrainToggle />
      <AmbientToggle />
      <NightModeIntensifier />
      <BeatStrobe />
      <NoiraEasterEgg />
    </>
  )
}
