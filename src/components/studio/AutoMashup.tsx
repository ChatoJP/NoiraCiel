'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStudio } from './StudioContext'

interface TrackEntry {
  title: string
  audioUrl: string
  album: string | null
  slug: string
  duration: number | null
}

interface MashupSlot {
  track: TrackEntry
  startSec: number
  durationSec: number
  layer: 'A' | 'B' | 'C'
  volume: number
}

const LAYER_COLORS = { A: '#C4953A', B: '#6B9EBE', C: '#52946F' }

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

export default function AutoMashup() {
  const { audioCtxRef, masterGainRef, bpm } = useStudio()
  const [tracks, setTracks] = useState<TrackEntry[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [slotCount, setSlotCount] = useState(8)
  const [slots, setSlots] = useState<MashupSlot[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [crossfade, setCrossfade] = useState(0.5)
  const playersRef = useRef<AudioBufferSourceNode[]>([])
  const gainNodesRef = useRef<GainNode[]>([])
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map())

  // Load tracks
  useEffect(() => {
    fetch('/api/music')
      .then(r => r.json())
      .then(data => {
        const items: TrackEntry[] = (data.tracks ?? [])
          .filter((t: TrackEntry & { audioUrl: string }) => t.audioUrl && t.duration && t.duration > 30)
          .map((t: TrackEntry & { audioUrl: string; title: string; album: string | null; slug: string; duration: number }) => ({
            title: t.title, audioUrl: t.audioUrl, album: t.album, slug: t.slug, duration: t.duration,
          }))
        setTracks(items)
        // Auto-select first 3
        setSelected(items.slice(0, 3).map(t => t.audioUrl))
      })
      .catch(() => {})
  }, [])

  const toggleTrack = (url: string) => {
    setSelected(prev => {
      if (prev.includes(url)) return prev.filter(u => u !== url)
      if (prev.length >= 4) return prev
      return [...prev, url]
    })
  }

  const barLength = (60 / bpm) * 4 // seconds per bar

  const generateMashup = useCallback(async () => {
    if (selected.length < 2) return
    setGenerating(true)
    setProgress(0)

    const selectedTracks = tracks.filter(t => selected.includes(t.audioUrl))
    const layers = (['A', 'B', 'C'] as const).slice(0, selectedTracks.length)

    const newSlots: MashupSlot[] = []
    const barsPerSlot = 4

    for (let i = 0; i < slotCount; i++) {
      const layer = layers[i % layers.length]
      const track = selectedTracks[layers.indexOf(layer)]
      const dur = track.duration ?? 240
      const clipDur = barsPerSlot * barLength
      const maxStart = Math.max(0, dur * 0.7 - clipDur)
      const startSec = randomBetween(dur * 0.05, maxStart)

      newSlots.push({
        track,
        startSec,
        durationSec: clipDur,
        layer,
        volume: layer === 'A' ? 0.75 : layer === 'B' ? 0.45 : 0.3,
      })
      setProgress(((i + 1) / slotCount) * 50)
    }

    setSlots(newSlots)
    setProgress(100)
    setGenerating(false)
  }, [selected, tracks, slotCount, barLength])

  const getBuffer = useCallback(async (url: string): Promise<AudioBuffer> => {
    const cache = bufferCacheRef.current
    if (cache.has(url)) return cache.get(url)!

    const ctx = audioCtxRef.current ?? new AudioContext()
    audioCtxRef.current = ctx

    const resp = await fetch(url)
    const arr = await resp.arrayBuffer()
    const buf = await ctx.decodeAudioData(arr)
    cache.set(url, buf)
    return buf
  }, [audioCtxRef])

  const playMashup = useCallback(async () => {
    if (!slots.length) return

    // Stop existing
    playersRef.current.forEach(p => { try { p.stop(); p.disconnect() } catch {} })
    gainNodesRef.current.forEach(g => { try { g.disconnect() } catch {} })
    playersRef.current = []
    gainNodesRef.current = []

    const ctx = audioCtxRef.current ?? new AudioContext()
    audioCtxRef.current = ctx
    if (ctx.state === 'suspended') await ctx.resume()

    setIsPlaying(true)

    // Load all unique buffers
    const uniqueUrls = [...new Set(slots.map(s => s.track.audioUrl))]
    const loadingProgress = 50
    let loaded = 0

    setProgress(0)
    await Promise.all(uniqueUrls.map(async url => {
      await getBuffer(url)
      loaded++
      setProgress(Math.round((loaded / uniqueUrls.length) * loadingProgress))
    }))

    const master = masterGainRef.current ?? ctx.destination
    let startTime = ctx.currentTime + 0.2

    const cfSec = crossfade * barLength

    // Play slots sequentially (all layers in parallel for each slot)
    const slotsByPosition: MashupSlot[][] = []
    slots.forEach((slot, i) => {
      if (!slotsByPosition[i]) slotsByPosition[i] = []
      slotsByPosition[i].push(slot)
    })

    // Group slots by position in the mashup sequence
    // A slots play sequentially; B and C overlay at same times
    const aSlots = slots.filter((_, i) => i % 3 === 0 || slots.length <= 2)

    // Build actual playback schedule
    let t = startTime
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      const buf = bufferCacheRef.current.get(slot.track.audioUrl)
      if (!buf) continue

      const source = ctx.createBufferSource()
      source.buffer = buf
      const gain = ctx.createGain()

      // Fade in
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(slot.volume, t + Math.min(cfSec, slot.durationSec * 0.3))
      // Fade out
      const endT = t + slot.durationSec
      gain.gain.setValueAtTime(slot.volume, endT - Math.min(cfSec, slot.durationSec * 0.3))
      gain.gain.linearRampToValueAtTime(0, endT)

      source.connect(gain)
      gain.connect(master as AudioNode)

      const offset = Math.min(slot.startSec, buf.duration - slot.durationSec)
      source.start(t, offset, slot.durationSec)

      playersRef.current.push(source)
      gainNodesRef.current.push(gain)

      source.onended = () => {
        if (i === slots.length - 1) setIsPlaying(false)
      }

      // Layer B and C start at same time as A but with different sources
      if (i + 1 < slots.length && slots[i + 1].layer !== 'A') {
        // These will be overlaid, don't advance time
      } else {
        t += slot.durationSec - cfSec
      }
    }

    setProgress(100)
  }, [slots, audioCtxRef, masterGainRef, crossfade, barLength, getBuffer])

  const stopMashup = useCallback(() => {
    playersRef.current.forEach(p => { try { p.stop(); p.disconnect() } catch {} })
    gainNodesRef.current.forEach(g => { try { g.disconnect() } catch {} })
    playersRef.current = []
    gainNodesRef.current = []
    setIsPlaying(false)
    setProgress(0)
  }, [])

  const shuffle = useCallback(() => {
    if (slots.length) generateMashup()
  }, [slots, generateMashup])

  return (
    <div className="space-y-5">
      {/* Track selector */}
      <div>
        <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 mb-3">
          Select 2–4 Songs to Mashup
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
          {tracks.map(t => {
            const isSelected = selected.includes(t.audioUrl)
            const layerIdx = selected.indexOf(t.audioUrl)
            const layer = (['A', 'B', 'C', 'D'] as const)[layerIdx]
            return (
              <button
                key={t.slug}
                onClick={() => toggleTrack(t.audioUrl)}
                className={`text-left px-3 py-2 border transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'border-t-accent/40 bg-t-accent/6'
                    : 'border-noir-silver/8 hover:border-noir-silver/20'
                }`}
              >
                {isSelected && (
                  <span
                    className="font-body text-[8px] font-bold w-4 flex-shrink-0"
                    style={{ color: LAYER_COLORS[layer as 'A' | 'B' | 'C'] ?? '#C4953A' }}
                  >
                    {layer}
                  </span>
                )}
                {!isSelected && <span className="w-4 flex-shrink-0 font-body text-[8px] text-noir-silver/15">○</span>}
                <div className="min-w-0">
                  <p className={`font-body text-xs truncate ${isSelected ? 'text-noir-ivory/80' : 'text-noir-silver/40'}`}>
                    {t.title}
                  </p>
                  {t.album && (
                    <p className="font-body text-[8px] text-noir-silver/25 truncate">{t.album}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        {selected.length < 2 && (
          <p className="font-body text-[9px] text-noir-silver/30 mt-2">Select at least 2 songs</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap border-t border-noir-silver/8 pt-4">
        <div className="flex items-center gap-2">
          <span className="font-body text-[9px] tracking-[0.25em] uppercase text-noir-silver/40">Slots</span>
          {[4, 6, 8, 12].map(n => (
            <button
              key={n}
              onClick={() => setSlotCount(n)}
              className={`w-8 h-7 border font-body text-[10px] transition-all ${
                slotCount === n
                  ? 'border-t-accent/50 text-t-accent bg-t-accent/8'
                  : 'border-noir-silver/12 text-noir-silver/35 hover:border-t-accent/25'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-body text-[9px] tracking-[0.25em] uppercase text-noir-silver/40">Crossfade</span>
          <input
            type="range" min={0} max={2} step={0.1}
            value={crossfade}
            onChange={e => setCrossfade(Number(e.target.value))}
            className="w-20"
            style={{ background: `linear-gradient(to right, rgb(var(--t-accent-rgb)) ${(crossfade / 2) * 100}%, rgba(184,197,208,0.15) ${(crossfade / 2) * 100}%)` }}
          />
          <span className="font-body text-[9px] text-noir-silver/30 tabular-nums">{crossfade.toFixed(1)}s</span>
        </div>

        <button
          onClick={generateMashup}
          disabled={selected.length < 2 || generating}
          className="px-5 py-2 border border-t-accent/40 bg-t-accent/8 text-t-accent font-body text-[10px] tracking-[0.25em] uppercase hover:bg-t-accent/15 transition-all disabled:opacity-30 ml-auto"
        >
          {generating ? 'Generating…' : '⟳ Generate'}
        </button>
      </div>

      {/* Progress */}
      {(generating || (progress > 0 && progress < 100)) && (
        <div className="w-full h-0.5 bg-noir-silver/10">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, background: 'rgb(var(--t-accent-rgb))' }}
          />
        </div>
      )}

      {/* Slot preview */}
      {slots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">
              Mashup sequence ({slots.length} clips · ~{(slots.reduce((a, s) => a + s.durationSec, 0) / 60).toFixed(1)} min)
            </p>
            <button
              onClick={shuffle}
              className="font-body text-[9px] tracking-[0.2em] uppercase text-noir-silver/30 hover:text-t-accent/60 transition-colors"
            >
              ⟳ Reshuffle
            </button>
          </div>

          <div className="flex gap-0.5 flex-wrap">
            {slots.map((s, i) => (
              <div
                key={i}
                className="flex-1 min-w-[60px] max-w-[100px] border px-1.5 py-2"
                style={{ borderColor: `${LAYER_COLORS[s.layer]}40`, background: `${LAYER_COLORS[s.layer]}08` }}
              >
                <div className="font-body text-[7px] tracking-wider" style={{ color: LAYER_COLORS[s.layer] }}>
                  {s.layer} · {s.durationSec.toFixed(0)}s
                </div>
                <div className="font-body text-[7px] text-noir-silver/40 truncate mt-0.5">
                  {s.track.title.slice(0, 14)}
                </div>
                <div className="font-mono text-[6px] text-noir-silver/25 mt-0.5">
                  @{Math.floor(s.startSec / 60)}:{String(Math.floor(s.startSec % 60)).padStart(2,'0')}
                </div>
              </div>
            ))}
          </div>

          {/* Play/Stop */}
          <div className="flex items-center gap-3">
            <button
              onClick={isPlaying ? stopMashup : playMashup}
              className={`flex items-center gap-2 px-6 py-2.5 border font-body text-[10px] tracking-[0.3em] uppercase transition-all ${
                isPlaying
                  ? 'border-t-accent/60 bg-t-accent/12 text-t-accent'
                  : 'border-t-accent/30 text-t-accent/70 hover:border-t-accent/50 hover:bg-t-accent/8'
              }`}
            >
              {isPlaying ? '■ Stop Mashup' : '▶ Play Mashup'}
            </button>
            <span className="font-body text-[9px] text-noir-silver/25">
              BPM {bpm} · {(barLength * 4).toFixed(1)}s per slot
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
