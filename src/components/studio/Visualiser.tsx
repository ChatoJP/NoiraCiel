'use client'

import { useEffect, useRef, useState } from 'react'
import { useStudio } from './StudioContext'

type VisMode = 'bars' | 'wave' | 'circle'

export default function Visualiser() {
  const { analyserRef, isPlaying, isRecording } = useStudio()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [mode, setMode] = useState<VisMode>('bars')
  const modeRef = useRef<VisMode>('bars')

  useEffect(() => { modeRef.current = mode }, [mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--t-accent-rgb').trim() || '196,149,58'

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      const analyser = analyserRef.current
      const W = canvas!.width
      const H = canvas!.height

      ctx2d!.clearRect(0, 0, W, H)

      if (!analyser) {
        // idle state — draw flat line
        ctx2d!.strokeStyle = `rgba(${accentColor},0.15)`
        ctx2d!.lineWidth = 1
        ctx2d!.beginPath()
        ctx2d!.moveTo(0, H / 2)
        ctx2d!.lineTo(W, H / 2)
        ctx2d!.stroke()
        return
      }

      const m = modeRef.current

      if (m === 'bars') {
        const bufLen = analyser.frequencyBinCount
        const dataArr = new Uint8Array(bufLen)
        analyser.getByteFrequencyData(dataArr)
        const barCount = Math.min(80, bufLen)
        const barW = W / barCount - 1

        for (let i = 0; i < barCount; i++) {
          const val = dataArr[Math.floor(i * bufLen / barCount)] / 255
          const h = val * H * 0.9
          const alpha = 0.3 + val * 0.7
          ctx2d!.fillStyle = `rgba(${accentColor},${alpha})`
          ctx2d!.fillRect(i * (barW + 1), H - h, barW, h)
          // mirror top
          ctx2d!.fillStyle = `rgba(${accentColor},${alpha * 0.2})`
          ctx2d!.fillRect(i * (barW + 1), 0, barW, h * 0.3)
        }
      } else if (m === 'wave') {
        const bufLen = analyser.fftSize
        const dataArr = new Uint8Array(bufLen)
        analyser.getByteTimeDomainData(dataArr)
        ctx2d!.strokeStyle = `rgba(${accentColor},0.8)`
        ctx2d!.lineWidth = 1.5
        ctx2d!.beginPath()
        const sliceW = W / bufLen
        let x = 0
        for (let i = 0; i < bufLen; i++) {
          const v = dataArr[i] / 128 - 1
          const y = (v * H * 0.45) + H / 2
          i === 0 ? ctx2d!.moveTo(x, y) : ctx2d!.lineTo(x, y)
          x += sliceW
        }
        ctx2d!.stroke()
        // glow
        ctx2d!.strokeStyle = `rgba(${accentColor},0.15)`
        ctx2d!.lineWidth = 4
        ctx2d!.stroke()
      } else if (m === 'circle') {
        const bufLen = analyser.frequencyBinCount
        const dataArr = new Uint8Array(bufLen)
        analyser.getByteFrequencyData(dataArr)
        const cx = W / 2, cy = H / 2
        const radius = Math.min(W, H) * 0.28
        ctx2d!.strokeStyle = `rgba(${accentColor},0.6)`
        ctx2d!.lineWidth = 1.5
        ctx2d!.beginPath()
        const count = Math.min(128, bufLen)
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2
          const val = dataArr[i] / 255
          const r = radius + val * radius * 0.8
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          i === 0 ? ctx2d!.moveTo(x, y) : ctx2d!.lineTo(x, y)
        }
        ctx2d!.closePath()
        ctx2d!.stroke()
        ctx2d!.fillStyle = `rgba(${accentColor},0.04)`
        ctx2d!.fill()
        // inner ring
        ctx2d!.beginPath()
        ctx2d!.arc(cx, cy, radius * 0.4, 0, Math.PI * 2)
        ctx2d!.strokeStyle = `rgba(${accentColor},0.12)`
        ctx2d!.lineWidth = 1
        ctx2d!.stroke()
      }
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative border-b border-noir-silver/8">
      <canvas
        ref={canvasRef}
        width={1200}
        height={72}
        className="w-full"
        style={{ height: 72, display: 'block' }}
      />
      {/* Mode switcher */}
      <div className="absolute top-2 right-2 flex gap-1">
        {(['bars', 'wave', 'circle'] as VisMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2 py-0.5 font-body text-[7px] tracking-[0.2em] uppercase border transition-all ${
              mode === m
                ? 'border-t-accent/50 text-t-accent bg-t-accent/10'
                : 'border-noir-silver/10 text-noir-silver/25 hover:border-noir-silver/25'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      {/* Status dot */}
      {(isPlaying || isRecording) && (
        <div
          className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full"
          style={{ background: isRecording ? '#f87171' : 'rgb(var(--t-accent-rgb))', opacity: 0.8 }}
        />
      )}
    </div>
  )
}
