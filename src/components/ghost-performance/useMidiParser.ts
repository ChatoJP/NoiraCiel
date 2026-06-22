'use client'

// Phase 2 — MIDI-reactive mode.
//
// Install @tonejs/midi to activate:
//   npm install @tonejs/midi
//
// This hook will load a .mid file, parse it into note-on/note-off events,
// and expose a getActiveNotes(currentTimeSec) function that returns the set
// of MIDI note numbers currently active at the playback cursor position.
// Each instrument visualizer can then use note numbers to drive exact key/string/pad lighting.

export interface MidiNote {
  midi:     number   // MIDI note number (0–127)
  name:     string   // e.g. "C4"
  time:     number   // onset in seconds
  duration: number   // note length in seconds
  velocity: number   // 0–1
  channel:  number
}

export interface MidiTrackData {
  name: string
  notes: MidiNote[]
}

export interface UseMidiParserReturn {
  tracks:         MidiTrackData[]
  isLoaded:       boolean
  error:          string | null
  getActiveNotes: (timeSec: number) => MidiNote[]
}

export function useMidiParser(_midiPath: string | undefined): UseMidiParserReturn {
  // Stub — returns empty data until @tonejs/midi is installed and this is implemented.
  return {
    tracks: [],
    isLoaded: false,
    error: null,
    getActiveNotes: () => [],
  }
}
