'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useStudio } from './StudioContext'

interface TrackEntry {
  title: string
  audioUrl: string
  album: string | null
  slug: string
}

export default function SampleSlicer() {
  const { audioCtxRef, masterGainRef, assignPad, pads } = useStudio()
  const waveformRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<InstanceType<typeof import('wavesurfer.js').default> | null>(null)
  const regionsRef = useRef<InstanceType<typeof import('wavesurfer.js/dist/plugins/regions.esm.js').default> | null>(null)

  const [tracks, setTracks] = useState<TrackEntry[]>([])
  const [selectedUrl, setSelectedUrl] = useState('')
  const [selectedTitle, setSelectedTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null)
  const [targetPad, setTargetPad] = useState(0)
  const [assigning, setAssigning] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Load track list
  useEffect(() => {
    fetch('/api/music')
      .then(r => r.json())
      .then(data => {
        const items: TrackEntry[] = (data.tracks ?? [])
          .filter((t: TrackEntry & { audioUrl: string }) => t.audioUrl)
          .map((t: TrackEntry & { audioUrl: string; title: string; album: string | null; slug: string }) => ({
            title: t.title,
            audioUrl: t.audioUrl,
            album: t.album,
            slug: t.slug,
          }))
        setTracks(items)
        if (items[0]) {
          setSelectedUrl(items[0].audioUrl)
          setSelectedTitle(items[0].title)
        }
      })
      .catch(() => {})
  }, [])

  // Init WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return
    let mounted = true

    async function initWS() {
      const WaveSurfer = (await import('wavesurfer.js')).default
      const RegionsPlugin = (await import('wavesurfer.js/dist/plugins/regions.esm.js')).default

      if (!mounted || !waveformRef.current) return

      // Destroy previous instance
      if (wsRef.current) {
        wsRef.current.destroy()
        wsRef.current = null
      }

      const regions = RegionsPlugin.create()
      regionsRef.current = regions

      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgba(184,197,208,0.25)',
        progressColor: 'rgb(var(--t-accent-rgb, 196,149,58))',
        cursorColor: 'rgba(196,149,58,0.6)',
        cursorWidth: 1,
        height: 100,
        normalize: true,
        plugins: [regions],
      })

      ws.on('ready', () => {
        if (!mounted) return
        // Create a default region covering first 4 seconds
        const dur = ws.getDuration()
        regions.addRegion({
          start: 0,
          end: Math.min(4, dur),
          color: 'rgba(196,149,58,0.12)',
          drag: true,
          resize: true,
        })
      })

      ws.on('play', () => setIsPlaying(true))
      ws.on('pause', () => setIsPlaying(false))
      ws.on('finish', () => setIsPlaying(false))

      regions.on('region-updated', (r: { start: number; end: number }) => {
        setRegion({ start: r.start, end: r.end })
      })

      regions.on('region-created', (r: { start: number; end: number }) => {
        setRegion({ start: r.start, end: r.end })
      })

      wsRef.current = ws
    }

    initWS()
    return () => {
      mounted = false
      wsRef.current?.destroy()
      wsRef.current = null
    }
  }, [])

  // Load song into WaveSurfer
  const loadSong = useCallback(async (url: string, title: string) => {
    if (!wsRef.current) return
    setLoading(true)
    setRegion(null)
    setIsPlaying(false)
    try {
      await wsRef.current.load(url)
    } catch {}
    setLoading(false)
    setSelectedTitle(title)
  }, [])

  useEffect(() => {
    if (selectedUrl) loadSong(selectedUrl, selectedTitle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUrl])

  const playRegion = useCallback(() => {
    const ws = wsRef.current
    const reg = regionsRef.current
    if (!ws || !reg) return
    const allRegions = reg.getRegions()
    if (allRegions.length > 0) {
      allRegions[0].play()
    } else {
      ws.play()
    }
  }, [])

  const stopPlayback = useCallback(() => {
    wsRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const reverseRegion = useCallback(async () => {
    if (!region || !selectedUrl) return
    setAssigning(true)
    try {
      const ctx = audioCtxRef.current ?? new AudioContext()
      audioCtxRef.current = ctx
      const resp = await fetch(selectedUrl)
      const arrayBuf = await resp.arrayBuffer()
      const audioBuf = await ctx.decodeAudioData(arrayBuf)
      const sr = audioBuf.sampleRate
      const startSample = Math.floor(region.start * sr)
      const endSample = Math.min(Math.floor(region.end * sr), audioBuf.length)
      const length = endSample - startSample
      const reversed = ctx.createBuffer(audioBuf.numberOfChannels, length, sr)
      for (let ch = 0; ch < audioBuf.numberOfChannels; ch++) {
        const src = audioBuf.getChannelData(ch).slice(startSample, endSample)
        const dst = reversed.getChannelData(ch)
        for (let i = 0; i < length; i++) dst[i] = src[length - 1 - i]
      }
      assignPad(targetPad, {
        label: `Rev ${selectedTitle.slice(0, 9)}`,
        color: pads[targetPad].color,
        buffer: reversed,
        startTime: 0,
        endTime: reversed.duration,
        sourceTitle: selectedTitle,
        pitch: pads[targetPad].pitch ?? 0,
      })
    } catch (e) { console.error('Reverse error:', e) }
    setAssigning(false)
  }, [region, selectedUrl, selectedTitle, targetPad, audioCtxRef, assignPad, pads])

  const normalizeRegion = useCallback(async () => {
    if (!region || !selectedUrl) return
    setAssigning(true)
    try {
      const ctx = audioCtxRef.current ?? new AudioContext()
      audioCtxRef.current = ctx
      const resp = await fetch(selectedUrl)
      const arrayBuf = await resp.arrayBuffer()
      const audioBuf = await ctx.decodeAudioData(arrayBuf)
      const sr = audioBuf.sampleRate
      const startSample = Math.floor(region.start * sr)
      const endSample = Math.min(Math.floor(region.end * sr), audioBuf.length)
      const length = endSample - startSample
      const sliced = ctx.createBuffer(audioBuf.numberOfChannels, length, sr)
      let peak = 0
      for (let ch = 0; ch < audioBuf.numberOfChannels; ch++) {
        const data = audioBuf.getChannelData(ch).slice(startSample, endSample)
        for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]))
      }
      const gain = peak > 0 ? 0.97 / peak : 1
      for (let ch = 0; ch < audioBuf.numberOfChannels; ch++) {
        const data = audioBuf.getChannelData(ch).slice(startSample, endSample)
        const dst = sliced.getChannelData(ch)
        for (let i = 0; i < length; i++) dst[i] = data[i] * gain
      }
      assignPad(targetPad, {
        label: `Norm ${selectedTitle.slice(0, 8)}`,
        color: pads[targetPad].color,
        buffer: sliced,
        startTime: 0,
        endTime: sliced.duration,
        sourceTitle: selectedTitle,
        pitch: pads[targetPad].pitch ?? 0,
      })
    } catch (e) { console.error('Normalize error:', e) }
    setAssigning(false)
  }, [region, selectedUrl, selectedTitle, targetPad, audioCtxRef, assignPad, pads])

  const assignToPad = useCallback(async () => {
    if (!region || !selectedUrl) return
    setAssigning(true)
    try {
      // Fetch audio and decode
      const ctx = audioCtxRef.current ?? new AudioContext()
      audioCtxRef.current = ctx
      const resp = await fetch(selectedUrl)
      const arrayBuf = await resp.arrayBuffer()
      const audioBuf = await ctx.decodeAudioData(arrayBuf)

      // Slice the buffer to the region
      const sr = audioBuf.sampleRate
      const startSample = Math.floor(region.start * sr)
      const endSample = Math.min(Math.floor(region.end * sr), audioBuf.length)
      const length = endSample - startSample
      const sliced = ctx.createBuffer(audioBuf.numberOfChannels, length, sr)
      for (let ch = 0; ch < audioBuf.numberOfChannels; ch++) {
        const data = audioBuf.getChannelData(ch).slice(startSample, endSample)
        sliced.copyToChannel(data, ch)
      }

      assignPad(targetPad, {
        label: selectedTitle.slice(0, 12),
        color: pads[targetPad].color,
        buffer: sliced,
        startTime: 0,
        endTime: sliced.duration,
        sourceTitle: selectedTitle,
        pitch: pads[targetPad].pitch ?? 0,
      })
    } catch (e) {
      console.error('Assign pad error:', e)
    }
    setAssigning(false)
  }, [region, selectedUrl, selectedTitle, targetPad, audioCtxRef, assignPad, pads])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = (s % 60).toFixed(2)
    return `${m}:${sec.padStart(5, '0')}`
  }

  return (
    <div className="space-y-5">
      {/* Song selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Song</span>
        <select
          className="flex-1 min-w-0 bg-noir-deep border border-noir-silver/15 text-noir-ivory/80 font-body text-xs px-3 py-1.5 focus:outline-none focus:border-t-accent/40"
          value={selectedUrl}
          onChange={e => {
            const t = tracks.find(tr => tr.audioUrl === e.target.value)
            if (t) {
              setSelectedUrl(t.audioUrl)
              setSelectedTitle(t.title)
            }
          }}
        >
          {tracks.map(t => (
            <option key={t.slug} value={t.audioUrl}>
              {t.album ? `[${t.album.split(' ').slice(0,2).join(' ')}] ` : ''}{t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Waveform */}
      <div className="relative border border-noir-silver/10 bg-noir-deep/50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-noir-void/60">
            <span className="font-body text-[10px] tracking-[0.3em] uppercase text-t-accent/60 animate-pulse">Loading waveform…</span>
          </div>
        )}
        <div ref={waveformRef} className="px-2 pt-2" />
        <p className="font-body text-[8px] text-noir-silver/25 px-3 py-1">
          Drag the highlighted region to select your sample
        </p>
      </div>

      {/* Region info + controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {region && (
          <div className="flex items-center gap-3">
            <span className="font-body text-[9px] tracking-[0.25em] uppercase text-noir-silver/35">Selection</span>
            <span className="font-mono text-xs text-t-accent/70">
              {formatTime(region.start)} → {formatTime(region.end)}
            </span>
            <span className="font-body text-[9px] text-noir-silver/30">
              ({(region.end - region.start).toFixed(2)}s)
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={isPlaying ? stopPlayback : playRegion}
            className={`flex items-center gap-2 px-4 py-1.5 border font-body text-[10px] tracking-[0.2em] uppercase transition-all ${
              isPlaying
                ? 'border-t-accent/50 bg-t-accent/10 text-t-accent'
                : 'border-noir-silver/20 text-noir-silver/50 hover:border-t-accent/30 hover:text-t-accent/70'
            }`}
          >
            {isPlaying ? '■ Stop' : '▶ Preview'}
          </button>
        </div>
      </div>

      {/* Assign to pad */}
      <div className="border border-noir-silver/10 p-4 space-y-3">
        <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40">Assign Sample to Pad</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="grid grid-cols-8 gap-1.5 flex-1">
            {pads.map((p, i) => (
              <button
                key={i}
                onClick={() => setTargetPad(i)}
                className={`h-10 border font-body text-[8px] tracking-[0.1em] transition-all ${
                  targetPad === i
                    ? 'border-white/40 text-white'
                    : 'border-noir-silver/15 text-noir-silver/30 hover:border-noir-silver/30'
                }`}
                style={targetPad === i ? { background: `${p.color}30`, borderColor: p.color } : {}}
              >
                {i + 1}
                {p.buffer && <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ background: p.color }} />}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={assignToPad}
              disabled={!region || assigning}
              className="px-5 py-2 border border-t-accent/40 bg-t-accent/8 text-t-accent font-body text-[10px] tracking-[0.25em] uppercase hover:bg-t-accent/15 transition-all disabled:opacity-30"
            >
              {assigning ? 'Slicing…' : `→ PAD ${targetPad + 1}`}
            </button>
            <div className="flex gap-1.5">
              <button
                onClick={reverseRegion}
                disabled={!region || assigning}
                className="flex-1 px-2 py-1.5 border border-noir-silver/20 text-noir-silver/50 font-body text-[9px] tracking-[0.15em] uppercase hover:border-t-accent/30 hover:text-t-accent/70 transition-all disabled:opacity-25"
                title="Reverse selection → pad"
              >
                ↺ Reverse
              </button>
              <button
                onClick={normalizeRegion}
                disabled={!region || assigning}
                className="flex-1 px-2 py-1.5 border border-noir-silver/20 text-noir-silver/50 font-body text-[9px] tracking-[0.15em] uppercase hover:border-t-accent/30 hover:text-t-accent/70 transition-all disabled:opacity-25"
                title="Normalize selection → pad"
              >
                ⊜ Normalize
              </button>
            </div>
          </div>
        </div>
        {pads[targetPad].buffer && (
          <p className="font-body text-[9px] text-t-accent/50">
            PAD {targetPad + 1} loaded: "{pads[targetPad].sourceTitle}"
          </p>
        )}
      </div>
    </div>
  )
}
