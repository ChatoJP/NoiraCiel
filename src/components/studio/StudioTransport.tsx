'use client'

import { useRef, useState, useCallback } from 'react'
import { useStudio } from './StudioContext'

export default function StudioTransport() {
  const {
    bpm, setBpm, swing, setSwing,
    timeSignature, setTimeSignature,
    isPlaying, isRecording,
    masterVolume, setMasterVolume,
    metronome, setMetronome,
    startTransport, stopTransport,
    toggleRecording, downloadRecording, downloadWAV,
    recordedChunksRef, saveSession, loadSession, hasSavedSession,
    countIn,
  } = useStudio()

  const tapTimesRef = useRef<number[]>([])
  const [tapFlash, setTapFlash] = useState(false)
  const [countDown, setCountDown] = useState(false) // countdown-before-record
  const [counting, setCounting] = useState(false)
  const [countNum, setCountNum] = useState(0)

  function handleTap() {
    const now = performance.now()
    const taps = tapTimesRef.current
    taps.push(now)
    const recent = taps.filter(t => now - t < 3000).slice(-8)
    tapTimesRef.current = recent
    setTapFlash(true)
    setTimeout(() => setTapFlash(false), 100)
    if (recent.length >= 2) {
      const intervals = recent.slice(1).map((t, i) => t - recent[i])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      setBpm(Math.round(60000 / avg))
    }
  }

  const handleRecord = useCallback(() => {
    if (isRecording) { toggleRecording(); return }
    if (countDown && !counting) {
      setCounting(true); setCountNum(4)
      // Visual countdown
      let n = 4
      const tick = () => { n--; setCountNum(n); if (n > 0) setTimeout(tick, (60/bpm)*1000) }
      setTimeout(tick, (60/bpm)*1000)
      countIn(4, () => { toggleRecording(); setCounting(false); setCountNum(0) })
    } else {
      toggleRecording()
    }
  }, [isRecording, countDown, counting, countIn, toggleRecording, bpm])

  const BTN = (on: boolean, danger = false) =>
    `w-9 h-9 flex items-center justify-center border transition-all ${
      on ? danger
        ? 'border-red-500/60 bg-red-500/15 text-red-400 animate-pulse'
        : 'border-t-accent/70 bg-t-accent/15 text-t-accent'
      : danger
        ? 'border-noir-silver/20 text-noir-silver/40 hover:border-red-400/40 hover:text-red-400'
        : 'border-noir-silver/25 text-noir-silver/50 hover:border-t-accent/40 hover:text-t-accent'
    }`

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-b border-noir-silver/10 bg-noir-void/60 backdrop-blur-sm flex-wrap">

      {/* Play / Stop */}
      <div className="flex items-center gap-1">
        <button onClick={isPlaying ? stopTransport : startTransport} className={BTN(isPlaying)} title={isPlaying?'Stop':'Play'}>
          {isPlaying
            ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            : <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
        </button>
        {/* Record */}
        <button onClick={handleRecord} className={BTN(isRecording||counting, true)} title="Record">
          {counting
            ? <span className="font-heading text-lg leading-none">{countNum}</span>
            : <div className={`w-3 h-3 rounded-full ${isRecording?'bg-red-400':'bg-current'}`}/>}
        </button>
        {/* Countdown toggle */}
        <button onClick={()=>setCountDown(v=>!v)}
          className={`px-1.5 py-1 border font-body text-[7px] tracking-[0.1em] uppercase transition-all ${countDown?'border-amber-500/40 text-amber-400/70':'border-noir-silver/12 text-noir-silver/25 hover:border-amber-500/25'}`}
          title="Count-in before record">
          4-in
        </button>
        {/* Download */}
        <button onClick={downloadRecording} disabled={!recordedChunksRef.current?.length && !isRecording}
          className="w-9 h-9 flex items-center justify-center border border-noir-silver/15 text-noir-silver/35 hover:border-t-accent/30 hover:text-t-accent/60 transition-all disabled:opacity-25" title="Download WebM">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        </button>
        <button onClick={downloadWAV} disabled={!recordedChunksRef.current?.length}
          className="px-2 py-1 border border-noir-silver/12 text-noir-silver/25 font-body text-[7px] tracking-[0.1em] uppercase hover:border-t-accent/25 hover:text-t-accent/50 transition-all disabled:opacity-25" title="Download WAV">
          WAV
        </button>
      </div>

      <div className="w-px h-5 bg-noir-silver/12 flex-shrink-0"/>

      {/* BPM + Tap */}
      <div className="flex items-center gap-1.5">
        <span className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-silver/35">BPM</span>
        <button onClick={() => setBpm(bpm - 1)} className="w-5 h-5 text-noir-silver/35 hover:text-t-accent text-sm leading-none">−</button>
        <input type="number" min={40} max={200} value={bpm} onChange={e => setBpm(Number(e.target.value))}
          className="w-11 bg-transparent text-center font-body text-sm text-noir-ivory border-b border-noir-silver/20 focus:border-t-accent/50 outline-none tabular-nums"/>
        <button onClick={() => setBpm(bpm + 1)} className="w-5 h-5 text-noir-silver/35 hover:text-t-accent text-sm leading-none">+</button>
        <button onClick={handleTap}
          className={`px-2.5 py-1 border font-body text-[8px] tracking-[0.2em] uppercase transition-all ${tapFlash?'border-t-accent bg-t-accent/20 text-t-accent':'border-noir-silver/15 text-noir-silver/35 hover:border-t-accent/30'}`}>
          TAP
        </button>
      </div>

      <div className="w-px h-5 bg-noir-silver/12 flex-shrink-0"/>

      {/* Swing */}
      <div className="flex items-center gap-1.5">
        <span className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-silver/35">Swing</span>
        <input type="range" min={0} max={0.45} step={0.01} value={swing} onChange={e=>setSwing(Number(e.target.value))} className="w-16"
          style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${(swing/0.45)*100}%,rgba(184,197,208,0.12) ${(swing/0.45)*100}%)`}}/>
        <span className="font-body text-[9px] text-noir-silver/30 tabular-nums w-6">{Math.round((swing/0.45)*100)}%</span>
      </div>

      <div className="w-px h-5 bg-noir-silver/12 flex-shrink-0"/>

      {/* Time Signature */}
      <div className="flex items-center gap-1.5">
        <span className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35">Sig</span>
        {[3,4,5,6].map(n=>(
          <button key={n} onClick={()=>setTimeSignature(n)}
            className={`w-6 h-6 border font-body text-[9px] transition-all ${timeSignature===n?'border-t-accent/60 text-t-accent bg-t-accent/10':'border-noir-silver/12 text-noir-silver/30 hover:border-t-accent/25'}`}>
            {n}
          </button>
        ))}
        <span className="font-body text-[8px] text-noir-silver/20">/4</span>
      </div>

      <div className="w-px h-5 bg-noir-silver/12 flex-shrink-0"/>

      {/* Metronome */}
      <button onClick={()=>setMetronome(!metronome)}
        className={`flex items-center gap-1.5 px-2.5 py-1 border font-body text-[8px] tracking-[0.2em] uppercase transition-all ${metronome?'border-t-accent/60 bg-t-accent/10 text-t-accent':'border-noir-silver/15 text-noir-silver/35 hover:border-t-accent/30'}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L8 21h8L12 2zm0 4l2.5 13h-5L12 6z"/></svg>
        Click
      </button>

      {/* Volume */}
      <div className="flex items-center gap-1.5">
        <span className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-silver/35">Vol</span>
        <input type="range" min={0} max={1} step={0.01} value={masterVolume} onChange={e=>setMasterVolume(Number(e.target.value))} className="w-20"
          style={{background:`linear-gradient(to right,rgb(var(--t-accent-rgb)) ${masterVolume*100}%,rgba(184,197,208,0.12) ${masterVolume*100}%)`}}/>
        <span className="font-body text-[9px] text-noir-silver/30 tabular-nums w-7">{Math.round(masterVolume*100)}</span>
      </div>

      {/* Session */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button onClick={saveSession} className="px-2.5 py-1 border border-noir-silver/15 text-noir-silver/30 font-body text-[8px] tracking-[0.2em] uppercase hover:border-t-accent/30 hover:text-t-accent/60 transition-all">Save</button>
        {hasSavedSession&&<button onClick={loadSession} className="px-2.5 py-1 border border-t-accent/25 text-t-accent/50 font-body text-[8px] tracking-[0.2em] uppercase hover:border-t-accent/50 hover:text-t-accent transition-all">Restore</button>}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {isRecording&&<span className="font-body text-[8px] tracking-[0.3em] uppercase text-red-400 animate-pulse">● REC</span>}
        {counting&&<span className="font-body text-[8px] tracking-[0.3em] uppercase text-amber-400 animate-pulse">● {countNum}</span>}
        {isPlaying&&!isRecording&&<span className="font-body text-[8px] tracking-[0.3em] uppercase text-t-accent/50">▶</span>}
      </div>
    </div>
  )
}
