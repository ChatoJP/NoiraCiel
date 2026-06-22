'use client'

import { useEffect, useRef } from 'react'

// R04: Rain-streaked window panel — animated rain drops on glass
export default function RainWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 120, H = 180
    canvas.width  = W
    canvas.height = H

    type Drop = { x: number; y: number; speed: number; len: number; opacity: number }
    const drops: Drop[] = Array.from({ length: 40 }, () => ({
      x:       Math.random() * W,
      y:       Math.random() * H,
      speed:   1.2 + Math.random() * 2.2,
      len:     10 + Math.random() * 20,
      opacity: 0.1 + Math.random() * 0.25,
    }))

    function draw() {
      ctx.clearRect(0, 0, W, H)
      // dark glass background
      ctx.fillStyle = 'rgba(4,5,14,0.55)'
      ctx.fillRect(0, 0, W, H)

      for (const d of drops) {
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - 0.5, d.y + d.len)
        ctx.strokeStyle = `rgba(160,190,220,${d.opacity})`
        ctx.lineWidth   = 0.9
        ctx.stroke()

        d.y += d.speed
        if (d.y > H + d.len) {
          d.y = -d.len
          d.x = Math.random() * W
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        border: '1px solid rgba(160,190,220,0.12)',
        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
