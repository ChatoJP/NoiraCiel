'use client'
import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop || document.body.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[999] bg-transparent pointer-events-none">
      <div
        className="h-full transition-none"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, rgba(196,149,58,0.5) 0%, rgba(212,168,75,0.9) 60%, rgba(196,149,58,0.7) 100%)',
          boxShadow: '0 0 6px rgba(196,149,58,0.4)',
        }}
      />
    </div>
  )
}
