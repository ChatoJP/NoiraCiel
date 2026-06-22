'use client'

import { useEffect, useRef } from 'react'

// R02: Procedural smoke wisps rising from the bottom of the ambience
export default function SmokeCanvas({ width = 600, height = 300 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const N = 18
    type Wisp = { x: number; y: number; vy: number; age: number; life: number; r: number; phase: number; drift: number }
    const wisps: Wisp[] = Array.from({ length: N }, (_, i) => ({
      x:     (i / N) * width + Math.random() * 40 - 20,
      y:     height + Math.random() * 30,
      vy:    0.18 + Math.random() * 0.22,
      age:   Math.random() * 160,
      life:  140 + Math.random() * 80,
      r:     18 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.6,
    }))

    function reset(w: Wisp, i: number) {
      w.x     = (i / N) * width + Math.random() * 60 - 30
      w.y     = height + 10
      w.age   = 0
      w.life  = 140 + Math.random() * 80
      w.r     = 18 + Math.random() * 22
      w.phase = Math.random() * Math.PI * 2
      w.drift = (Math.random() - 0.5) * 0.6
    }

    let t = 0
    function draw() {
      ctx.clearRect(0, 0, width, height)
      t += 0.012
      for (let i = 0; i < N; i++) {
        const w = wisps[i]
        w.age += 1
        w.y   -= w.vy
        w.x   += Math.sin(t + w.phase) * w.drift
        if (w.age > w.life) reset(w, i)

        const progress = w.age / w.life
        const alpha    = Math.sin(progress * Math.PI) * 0.07
        const radius   = w.r * (0.5 + progress * 1.2)

        const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, radius)
        grad.addColorStop(0,   `rgba(180,185,200,${alpha})`)
        grad.addColorStop(0.6, `rgba(160,168,188,${alpha * 0.5})`)
        grad.addColorStop(1,   `rgba(140,150,175,0)`)

        ctx.beginPath()
        ctx.arc(w.x, w.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-hidden
      style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', pointerEvents: 'none', opacity: 0.65 }}
    />
  )
}
