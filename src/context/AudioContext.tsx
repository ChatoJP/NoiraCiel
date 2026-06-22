'use client'

import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback, useState } from 'react'
import type { Track, AudioState } from '@/lib/types'

interface AudioContextType extends AudioState {
  play: (track: Track, playlist?: Track[]) => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (time: number) => void
  setVolume: (vol: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  setPlaylistAndPlay: (tracks: Track[], index: number) => void
  getAnalyser: () => AnalyserNode | null
  isExternalActive: boolean
  connectExternalAudio: (audioEl: HTMLAudioElement) => void
  disconnectExternalAudio: () => void
}

type AudioAction =
  | { type: 'SET_TRACK'; track: Track; playlist: Track[]; index: number }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'SET_TIME'; currentTime: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_INDEX'; index: number }

const initialState: AudioState = {
  currentTrack: null,
  playlist: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeatMode: 'none',
  isLoading: false,
}

function reducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'SET_TRACK':
      return { ...state, currentTrack: action.track, playlist: action.playlist, currentIndex: action.index, currentTime: 0, duration: 0, isLoading: true }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying }
    case 'SET_TIME':
      return { ...state, currentTime: action.currentTime }
    case 'SET_DURATION':
      return { ...state, duration: action.duration }
    case 'SET_VOLUME':
      return { ...state, volume: action.volume, isMuted: false }
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted }
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffled: !state.isShuffled }
    case 'TOGGLE_REPEAT':
      return { ...state, repeatMode: state.repeatMode === 'none' ? 'all' : state.repeatMode === 'all' ? 'one' : 'none' }
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }
    case 'SET_INDEX':
      return { ...state, currentIndex: action.index }
    default:
      return state
  }
}

// Web Audio API forces silent output on a MediaElementAudioSourceNode created
// from a cross-origin element unless the server sends CORS headers (R2's
// public bucket doesn't). Tapping the node for visualization would silently
// kill actual playback, so cross-origin sources skip the tap entirely.
function isCrossOrigin(url: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URL(url, window.location.href).origin !== window.location.origin
  } catch {
    return false
  }
}

const AudioCtx = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [isExternalActive, setIsExternalActive] = useState(false)
  const audioRef          = useRef<HTMLAudioElement | null>(null)
  const shuffledIndices   = useRef<number[]>([])
  const webAudioCtxRef    = useRef<AudioContext | null>(null)
  const analyserRef       = useRef<AnalyserNode | null>(null)
  const externalSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const externalElRef     = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio()
    audio.volume = state.volume
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => {
      dispatch({ type: 'SET_TIME', currentTime: audio.currentTime })
    })
    audio.addEventListener('durationchange', () => {
      dispatch({ type: 'SET_DURATION', duration: audio.duration })
    })
    audio.addEventListener('canplay', () => {
      dispatch({ type: 'SET_LOADING', isLoading: false })
    })
    audio.addEventListener('ended', () => {
      dispatch({ type: 'SET_PLAYING', isPlaying: false })
    })
    audio.addEventListener('waiting', () => {
      dispatch({ type: 'SET_LOADING', isLoading: true })
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = state.isMuted ? 0 : state.volume
  }, [state.volume, state.isMuted])

  const play = useCallback((track: Track, playlist?: Track[]) => {
    const pl = playlist || state.playlist
    const idx = pl.findIndex((t) => t.id === track.id)
    dispatch({ type: 'SET_TRACK', track, playlist: pl, index: Math.max(idx, 0) })

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl
      audioRef.current.load()
      audioRef.current.play().then(() => {
        dispatch({ type: 'SET_PLAYING', isPlaying: true })
      }).catch(console.error)
    }
  }, [state.playlist])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    dispatch({ type: 'SET_PLAYING', isPlaying: false })
  }, [])

  const toggle = useCallback(() => {
    if (!audioRef.current || !state.currentTrack) return
    if (state.isPlaying) {
      pause()
    } else {
      audioRef.current.play().then(() => {
        dispatch({ type: 'SET_PLAYING', isPlaying: true })
      }).catch(console.error)
    }
  }, [state.isPlaying, state.currentTrack, pause])

  const getNextIndex = useCallback((current: number, playlist: Track[]) => {
    if (state.repeatMode === 'one') return current
    if (state.isShuffled) {
      const next = Math.floor(Math.random() * playlist.length)
      return next === current ? (next + 1) % playlist.length : next
    }
    if (current + 1 >= playlist.length) {
      return state.repeatMode === 'all' ? 0 : -1
    }
    return current + 1
  }, [state.repeatMode, state.isShuffled])

  const next = useCallback(() => {
    const nextIdx = getNextIndex(state.currentIndex, state.playlist)
    if (nextIdx >= 0 && nextIdx < state.playlist.length) {
      play(state.playlist[nextIdx], state.playlist)
    }
  }, [state.currentIndex, state.playlist, getNextIndex, play])

  const prev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      return
    }
    const prevIdx = state.currentIndex > 0 ? state.currentIndex - 1 : state.playlist.length - 1
    if (state.playlist[prevIdx]) {
      play(state.playlist[prevIdx], state.playlist)
    }
  }, [state.currentIndex, state.playlist, play])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      dispatch({ type: 'SET_TIME', currentTime: time })
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    dispatch({ type: 'SET_VOLUME', volume: vol })
  }, [])

  const toggleMute = useCallback(() => dispatch({ type: 'TOGGLE_MUTE' }), [])
  const toggleShuffle = useCallback(() => dispatch({ type: 'TOGGLE_SHUFFLE' }), [])
  const toggleRepeat = useCallback(() => dispatch({ type: 'TOGGLE_REPEAT' }), [])

  // Lazy Web Audio API analyser — call after user gesture
  const getAnalyser = useCallback((): AnalyserNode | null => {
    if (typeof window === 'undefined' || !audioRef.current) return null
    if (analyserRef.current) return analyserRef.current
    if (isCrossOrigin(audioRef.current.src)) return null
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const source = ctx.createMediaElementSource(audioRef.current)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.82
      source.connect(analyser)
      analyser.connect(ctx.destination)
      webAudioCtxRef.current = ctx
      analyserRef.current = analyser
      return analyser
    } catch { return null }
  }, [])

  const setPlaylistAndPlay = useCallback((tracks: Track[], index: number) => {
    play(tracks[index], tracks)
  }, [play])

  // Allow external audio elements (e.g. SyncedLyricsPlayer) to feed the shared analyser.
  // Ghost Performance will then animate in response to the lyrics player's audio.
  const connectExternalAudio = useCallback((audioEl: HTMLAudioElement) => {
    if (typeof window === 'undefined') return
    if (isCrossOrigin(audioEl.src)) { setIsExternalActive(true); return }
    try {
      // Reuse existing connection for the same element
      if (externalElRef.current === audioEl && externalSourceRef.current) {
        setIsExternalActive(true)
        return
      }
      let ctx = webAudioCtxRef.current
      if (!ctx) {
        ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        webAudioCtxRef.current = ctx
      }
      if (ctx.state === 'suspended') ctx.resume()
      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.82
        analyserRef.current = analyser
        analyser.connect(ctx.destination)
      }
      const source = ctx.createMediaElementSource(audioEl)
      source.connect(analyserRef.current)
      externalSourceRef.current = source
      externalElRef.current = audioEl
      setIsExternalActive(true)
    } catch {
      setIsExternalActive(true)
    }
  }, [])

  const disconnectExternalAudio = useCallback(() => {
    setIsExternalActive(false)
  }, [])

  // Auto-advance to next track when current ends
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      const nextIdx = getNextIndex(state.currentIndex, state.playlist)
      if (nextIdx >= 0 && nextIdx < state.playlist.length) {
        play(state.playlist[nextIdx], state.playlist)
      }
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [state.currentIndex, state.playlist, getNextIndex, play])

  return (
    <AudioCtx.Provider value={{
      ...state,
      play, pause, toggle, next, prev, seek,
      setVolume, toggleMute, toggleShuffle, toggleRepeat, setPlaylistAndPlay,
      getAnalyser,
      isExternalActive,
      connectExternalAudio,
      disconnectExternalAudio,
    }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
