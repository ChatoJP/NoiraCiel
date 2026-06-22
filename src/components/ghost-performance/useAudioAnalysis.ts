'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useAudio } from '@/context/AudioContext'

export function useAudioAnalysis() {
  const { isPlaying, isExternalActive, getAnalyser } = useAudio()
  const analyserRef   = useRef<AnalyserNode | null>(null)
  const freqBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const waveBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const isActiveRef   = useRef(false)

  const isAnyActive = isPlaying || isExternalActive

  // Lazily initialise the Web Audio analyser on the first play gesture
  // (from either the global player or an external audio element like SyncedLyricsPlayer).
  useEffect(() => {
    if (!isAnyActive) return
    if (analyserRef.current) return
    const a = getAnalyser()
    if (!a) return
    analyserRef.current = a
    freqBufferRef.current = new Uint8Array(a.frequencyBinCount) as Uint8Array<ArrayBuffer>
    waveBufferRef.current = new Float32Array(a.frequencyBinCount) as Float32Array<ArrayBuffer>
    isActiveRef.current   = true
  }, [isAnyActive, getAnalyser])

  const getFrequencyData = useCallback((): Uint8Array<ArrayBuffer> | null => {
    const a   = analyserRef.current
    const buf = freqBufferRef.current
    if (!a || !buf) return null
    a.getByteFrequencyData(buf)
    return buf
  }, [])

  const getWaveformData = useCallback((): Float32Array<ArrayBuffer> | null => {
    const a   = analyserRef.current
    const buf = waveBufferRef.current
    if (!a || !buf) return null
    a.getFloatTimeDomainData(buf)
    return buf
  }, [])

  return {
    getFrequencyData,
    getWaveformData,
    isActive: isActiveRef,
    isPlaying: isAnyActive,
  }
}
