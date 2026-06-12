'use client'

import { useEffect, useRef } from 'react'

export default function AmbientCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const pos     = useRef({ x: -300, y: -300 })
  const ring    = useRef({ x: -300, y: -300 })
  const raf     = useRef<number>(0)

  useEffect(() => {
    // Don't run on touch devices
    if (!window.matchMedia('(pointer: fine)').matches) return

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }

      // Use event delegation — check if hovering an interactive element
      const el = e.target as Element
      const isInteractive = el.closest('a, button, [role="button"], input, textarea, select, label') !== null
      if (isInteractive) {
        ringRef.current?.classList.add('cursor-hover')
      } else {
        ringRef.current?.classList.remove('cursor-hover')
      }
    }

    const onLeave = () => {
      pos.current = { x: -300, y: -300 }
    }

    const tick = () => {
      const dot = dotRef.current
      const ringEl = ringRef.current
      if (dot) {
        dot.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`
      }
      if (ringEl) {
        ring.current.x += (pos.current.x - ring.current.x) * 0.1
        ring.current.y += (pos.current.y - ring.current.y) * 0.1
        ringEl.style.transform = `translate(${ring.current.x - 20}px, ${ring.current.y - 20}px)`
      }
      raf.current = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="fixed top-0 left-0 pointer-events-none z-[9999] w-2 h-2 rounded-full bg-noir-gold"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="fixed top-0 left-0 pointer-events-none z-[9998] w-10 h-10 rounded-full border border-noir-gold/35"
        style={{ willChange: 'transform', transition: 'border-color 0.2s, width 0.2s, height 0.2s' }}
      />
      <style>{`
        @media (pointer: fine) { body * { cursor: none !important; } }
        .cursor-hover { border-color: rgba(196,149,58,0.75) !important; width: 52px !important; height: 52px !important; margin: -6px 0 0 -6px; }
      `}</style>
    </>
  )
}
