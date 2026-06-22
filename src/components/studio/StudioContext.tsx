'use client'

import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import * as Tone from 'tone'

export interface SamplePad {
  id: number; label: string; color: string; buffer: AudioBuffer | null
  startTime: number; endTime: number; sourceTitle: string; pitch: number
}

interface StudioContextType {
  bpm: number; setBpm: (v: number) => void
  swing: number; setSwing: (v: number) => void
  timeSignature: number; setTimeSignature: (v: number) => void
  isPlaying: boolean; isRecording: boolean; currentStep: number
  masterVolume: number; setMasterVolume: (v: number) => void
  metronome: boolean; setMetronome: (v: boolean) => void
  startTransport: () => void; stopTransport: () => void
  toggleRecording: () => void
  pads: SamplePad[]
  assignPad: (index: number, pad: Omit<SamplePad, 'id'>) => void
  triggerPad: (index: number) => void
  setPadPitch: (index: number, semitones: number) => void
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>
  recordedChunksRef: React.MutableRefObject<Blob[]>
  downloadRecording: () => void
  downloadWAV: () => Promise<void>
  audioCtxRef: React.MutableRefObject<AudioContext | null>
  masterGainRef: React.MutableRefObject<GainNode | null>
  destRef: React.MutableRefObject<MediaStreamAudioDestinationNode | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  bassEqRef: React.MutableRefObject<BiquadFilterNode | null>
  midEqRef: React.MutableRefObject<BiquadFilterNode | null>
  highEqRef: React.MutableRefObject<BiquadFilterNode | null>
  compressorRef: React.MutableRefObject<DynamicsCompressorNode | null>
  toneGainRef: React.MutableRefObject<Tone.Gain | null>
  toneReverbRef: React.MutableRefObject<Tone.Reverb | null>
  tonePhaserRef: React.MutableRefObject<Tone.Phaser | null>
  toneDistRef: React.MutableRefObject<Tone.Distortion | null>
  toneWidenerRef: React.MutableRefObject<Tone.StereoWidener | null>
  countIn: (beats: number, cb: () => void) => void
  saveSession: () => void; loadSession: () => void; hasSavedSession: boolean
  patternBank: (boolean[][] | null)[]
  savePatternToBank: (slot: number, pattern: boolean[][]) => void
  loadPatternFromBank: (slot: number) => boolean[][] | null
  globalScale: string; setGlobalScale: (v: string) => void
  globalScaleRoot: string; setGlobalScaleRoot: (v: string) => void
}

const StudioContext = createContext<StudioContextType | null>(null)

const PAD_COLORS = ['#C4953A','#6B9EBE','#B0586C','#52946F','#9480C4','#C48534','#6380C4','#B09B3A']
const DEFAULT_PADS: SamplePad[] = Array.from({ length: 8 }, (_, i) => ({
  id: i, label: `PAD ${i + 1}`, color: PAD_COLORS[i],
  buffer: null, startTime: 0, endTime: 0, sourceTitle: '', pitch: 0,
}))
const SESSION_KEY = 'noiraciel-studio-session'

function audioBufferToWAV(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels
  const numSamples = buffer.length
  const sampleRate = buffer.sampleRate
  const bps = 2
  const dataSize = numSamples * numCh * bps
  const wavBuf = new ArrayBuffer(44 + dataSize)
  const view = new DataView(wavBuf)
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
  ws(0,'RIFF'); view.setUint32(4,36+dataSize,true); ws(8,'WAVE'); ws(12,'fmt ')
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,numCh,true)
  view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*numCh*bps,true)
  view.setUint16(32,numCh*bps,true); view.setUint16(34,16,true)
  ws(36,'data'); view.setUint32(40,dataSize,true)
  let off = 44
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      off += 2
    }
  }
  return new Blob([wavBuf], { type: 'audio/wav' })
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [bpm, setBpmState] = useState(90)
  const [swing, setSwingState] = useState(0)
  const [timeSignature, setTimeSigState] = useState(4)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [masterVolume, setMasterVolumeState] = useState(0.8)
  const [metronome, setMetronomeState] = useState(false)
  const [pads, setPads] = useState<SamplePad[]>(DEFAULT_PADS)
  const [hasSavedSession, setHasSavedSession] = useState(false)
  const [patternBank, setPatternBank] = useState<(boolean[][] | null)[]>([null, null, null, null])
  const [globalScale, setGlobalScaleS] = useState('Off')
  const [globalScaleRoot, setGlobalScaleRootS] = useState('C')

  const stepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepRef = useRef(-1)
  const bpmRef = useRef(90)
  const swingRef = useRef(0)
  const metronomeRef = useRef(false)
  const isPlayingRef = useRef(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bassEqRef = useRef<BiquadFilterNode | null>(null)
  const midEqRef = useRef<BiquadFilterNode | null>(null)
  const highEqRef = useRef<BiquadFilterNode | null>(null)
  const compressorRef = useRef<DynamicsCompressorNode | null>(null)
  const metronomeGainRef = useRef<GainNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Tone.js master chain refs
  const toneGainRef = useRef<Tone.Gain | null>(null)
  const toneReverbRef = useRef<Tone.Reverb | null>(null)
  const tonePhaserRef = useRef<Tone.Phaser | null>(null)
  const toneDistRef = useRef<Tone.Distortion | null>(null)
  const toneWidenerRef = useRef<Tone.StereoWidener | null>(null)

  // Initialize Tone.js effects chain on mount
  useEffect(() => {
    const g = new Tone.Gain(1)
    const rev = new Tone.Reverb({ decay: 2, wet: 0 })
    const ph = new Tone.Phaser({ frequency: 0.5, octaves: 3, wet: 0 })
    const dist = new Tone.Distortion({ distortion: 0.4, wet: 0 })
    const wide = new Tone.StereoWidener(0.5)
    g.chain(rev, ph, dist, wide, Tone.getDestination())
    toneGainRef.current = g
    toneReverbRef.current = rev
    tonePhaserRef.current = ph
    toneDistRef.current = dist
    toneWidenerRef.current = wide
    setHasSavedSession(!!localStorage.getItem(SESSION_KEY))
    return () => { try { g.dispose(); rev.dispose(); ph.dispose(); dist.dispose(); wide.dispose() } catch {} }
  }, [])

  function getAudioCtx() {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx

      const gain = ctx.createGain()
      gain.gain.value = masterGainRef.current?.gain.value ?? 0.8
      masterGainRef.current = gain

      const bassEq = ctx.createBiquadFilter()
      bassEq.type = 'lowshelf'; bassEq.frequency.value = 100; bassEq.gain.value = 0
      bassEqRef.current = bassEq

      const midEq = ctx.createBiquadFilter()
      midEq.type = 'peaking'; midEq.frequency.value = 1000; midEq.Q.value = 1; midEq.gain.value = 0
      midEqRef.current = midEq

      const highEq = ctx.createBiquadFilter()
      highEq.type = 'highshelf'; highEq.frequency.value = 8000; highEq.gain.value = 0
      highEqRef.current = highEq

      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -24; comp.ratio.value = 4
      comp.attack.value = 0.003; comp.release.value = 0.25
      compressorRef.current = comp

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyserRef.current = analyser

      // Chain: gain → bassEQ → midEQ → highEQ → comp → analyser → destination
      gain.connect(bassEq)
      bassEq.connect(midEq)
      midEq.connect(highEq)
      highEq.connect(comp)
      comp.connect(analyser)
      analyser.connect(ctx.destination)

      const dest = ctx.createMediaStreamDestination()
      gain.connect(dest)
      destRef.current = dest

      const mGain = ctx.createGain()
      mGain.gain.value = 0.4
      mGain.connect(ctx.destination)
      metronomeGainRef.current = mGain
    }
    return audioCtxRef.current
  }

  function clickMetronome(ctx: AudioContext, isBeat: boolean) {
    if (!metronomeRef.current || !metronomeGainRef.current) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.frequency.value = isBeat ? 1200 : 800
    g.gain.setValueAtTime(0.5, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
    osc.connect(g); g.connect(metronomeGainRef.current)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06)
  }

  function scheduleStep() {
    if (!isPlayingRef.current) return
    const ctx = audioCtxRef.current
    const next = (stepRef.current + 1) % 16
    const baseDur = (60 / bpmRef.current / 4) * 1000
    const sw = swingRef.current
    const isOdd = next % 2 === 1
    const delay = isOdd ? baseDur * (1 + sw) : baseDur * Math.max(0.01, 1 - sw)
    stepTimeoutRef.current = setTimeout(() => {
      if (!isPlayingRef.current) return
      stepRef.current = next
      setCurrentStep(next)
      if (ctx && next % 4 === 0) clickMetronome(ctx, next === 0)
      scheduleStep()
    }, delay)
  }

  const startTransport = useCallback(() => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
    stepRef.current = -1; isPlayingRef.current = true
    setCurrentStep(-1); setIsPlaying(true)
    scheduleStep()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopTransport = useCallback(() => {
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
    isPlayingRef.current = false; stepRef.current = -1
    setCurrentStep(-1); setIsPlaying(false)
  }, [])

  useEffect(() => {
    bpmRef.current = bpm; swingRef.current = swing
    if (isPlayingRef.current) {
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current)
      scheduleStep()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, swing])

  const setBpm = useCallback((v: number) => setBpmState(Math.min(200, Math.max(40, v))), [])
  const setSwing = useCallback((v: number) => setSwingState(v), [])
  const setTimeSignature = useCallback((v: number) => setTimeSigState(v), [])
  const setMetronome = useCallback((v: boolean) => { metronomeRef.current = v; setMetronomeState(v) }, [])
  const setMasterVolume = useCallback((v: number) => {
    setMasterVolumeState(v)
    if (masterGainRef.current) masterGainRef.current.gain.value = v
  }, [])

  const countIn = useCallback((beats: number, cb: () => void) => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const interval = (60 / bpmRef.current) * 1000
    let remaining = beats
    const tick = () => {
      clickMetronome(ctx, remaining % 4 === 0)
      remaining--
      if (remaining <= 0) setTimeout(cb, interval)
      else setTimeout(tick, interval)
    }
    // Force metronome on temporarily
    const prevMet = metronomeRef.current
    metronomeRef.current = true
    tick()
    setTimeout(() => { metronomeRef.current = prevMet }, interval * beats + 200)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop(); setIsRecording(false)
    } else {
      const ctx = getAudioCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const mr = new MediaRecorder(destRef.current!.stream)
      recordedChunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
      mr.start(); mediaRecorderRef.current = mr; setIsRecording(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording])

  const downloadRecording = useCallback(() => {
    const chunks = recordedChunksRef.current
    if (!chunks.length) return
    const blob = new Blob(chunks, { type: 'audio/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `noiraciel-studio-${Date.now()}.webm`; a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadWAV = useCallback(async () => {
    const chunks = recordedChunksRef.current
    if (!chunks.length) return
    try {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      const arrayBuf = await blob.arrayBuffer()
      const tmpCtx = new AudioContext()
      const decoded = await tmpCtx.decodeAudioData(arrayBuf)
      await tmpCtx.close()
      const wav = audioBufferToWAV(decoded)
      const url = URL.createObjectURL(wav)
      const a = document.createElement('a')
      a.href = url; a.download = `noiraciel-studio-${Date.now()}.wav`; a.click()
      URL.revokeObjectURL(url)
    } catch { downloadRecording() }
  }, [downloadRecording])

  const assignPad = useCallback((index: number, pad: Omit<SamplePad, 'id'>) => {
    setPads(prev => prev.map((p, i) => i === index ? { ...pad, id: i } : p))
  }, [])

  const setPadPitch = useCallback((index: number, semitones: number) => {
    setPads(prev => prev.map((p, i) => i === index ? { ...p, pitch: semitones } : p))
  }, [])

  const triggerPad = useCallback((index: number) => {
    const pad = pads[index]
    if (!pad.buffer) return
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const source = ctx.createBufferSource()
    source.buffer = pad.buffer
    source.playbackRate.value = Math.pow(2, pad.pitch / 12)
    const gain = ctx.createGain()
    gain.gain.value = 0.9
    source.connect(gain)
    gain.connect(masterGainRef.current ?? ctx.destination)
    const offset = pad.startTime
    const duration = pad.endTime - pad.startTime
    source.start(0, offset, duration > 0 ? duration : undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pads])

  const saveSession = useCallback(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ bpm, swing, metronome, masterVolume, timeSignature }))
    setHasSavedSession(true)
  }, [bpm, swing, metronome, masterVolume, timeSignature])

  const loadSession = useCallback(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.bpm) { setBpmState(data.bpm); bpmRef.current = data.bpm }
      if (data.swing != null) { setSwingState(data.swing); swingRef.current = data.swing }
      if (data.metronome != null) { setMetronomeState(data.metronome); metronomeRef.current = data.metronome }
      if (data.masterVolume != null) setMasterVolumeState(data.masterVolume)
      if (data.timeSignature != null) setTimeSigState(data.timeSignature)
    } catch {}
  }, [])

  const setGlobalScale = useCallback((v: string) => setGlobalScaleS(v), [])
  const setGlobalScaleRoot = useCallback((v: string) => setGlobalScaleRootS(v), [])

  const savePatternToBank = useCallback((slot: number, pattern: boolean[][]) => {
    setPatternBank(prev => { const next = [...prev]; next[slot] = pattern.map(r => [...r]); return next })
  }, [])

  const loadPatternFromBank = useCallback((slot: number) => {
    return patternBank[slot] ? patternBank[slot]!.map(r => [...r]) : null
  }, [patternBank])

  return (
    <StudioContext.Provider value={{
      bpm, setBpm, swing, setSwing, timeSignature, setTimeSignature,
      isPlaying, isRecording, currentStep,
      masterVolume, setMasterVolume, metronome, setMetronome,
      startTransport, stopTransport, toggleRecording,
      pads, assignPad, triggerPad, setPadPitch,
      mediaRecorderRef, recordedChunksRef, downloadRecording, downloadWAV,
      audioCtxRef, masterGainRef, destRef, analyserRef,
      bassEqRef, midEqRef, highEqRef, compressorRef,
      toneGainRef, toneReverbRef, tonePhaserRef, toneDistRef, toneWidenerRef,
      countIn, saveSession, loadSession, hasSavedSession,
      patternBank, savePatternToBank, loadPatternFromBank,
      globalScale, setGlobalScale, globalScaleRoot, setGlobalScaleRoot,
    }}>
      {children}
    </StudioContext.Provider>
  )
}

export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be inside StudioProvider')
  return ctx
}
