# Ghost Performance Engine

An invisible-band visualizer that makes each NoiraCiel song feel like a live performance with no musicians visible. The instruments appear to play themselves, synchronized with the music.

## What it is

When a song is playing, the Ghost Performance tab shows a cinematic, audio-reactive visualization tailored to the song's primary instrument. The visual style stays firmly inside the NoiraCiel universe: dark, noir, gold and blue, premium, no game-like aesthetics.

Each visualizer is named for the ghost it embodies:

| Mode | Visualizer | What it shows |
|------|------------|---------------|
| Piano | Ghost Piano | Piano keys light up with gold/blue glow |
| Guitar | Ghost Guitar | Acoustic silhouette, strings vibrate |
| Drums | Ghost Drums | Full kit: kick, snare, hi-hat, cymbals, toms |
| Bass | Ghost Bass | 4 bass strings pulse with sub-bass waves |
| Strings | Ghost Strings | Bow-stroke arcs swell with orchestral energy |
| Orchestra | Ghost Strings | Same as Strings (enhanced in Phase 2) |
| Synth | Ghost Synth | Oscilloscope + step sequencer pads |
| Choir | Ghost Choir | Abstract silhouettes, breath particles |
| Energy | Ghost Energy | Universal audio-reactive fallback |

---

## Input modes

### 1. Audio-reactive (Phase 1 — current)

Works with any MP3/WAV. The Web Audio API AnalyserNode reads the live frequency spectrum and maps energy bands to visual elements:

- **Sub-bass / Bass (20–250 Hz)** → kick hits, bass string pulse, orb size
- **Low-mids (250–500 Hz)** → snare body, low piano keys
- **Mids (500–2000 Hz)** → piano keys, string energy, choir voice
- **High-mids (2000–4000 Hz)** → hi-hat, upper strings, synth pads
- **Highs (4000–16000 Hz)** → cymbal shimmer, particles, oscilloscope
- **Transients** → cymbal crashes, particle bursts

### 2. Stem-reactive (Phase 2)

Requires separate stem files per instrument. Each stem gets its own AnalyserNode so the drum visualizer reacts only to the drum stem, not the full mix. This dramatically improves accuracy.

Add stems to the config:
```json
{
  "why": {
    "stems": {
      "piano":   "/stems/why/piano.wav",
      "strings": "/stems/why/strings.wav",
      "choir":   "/stems/why/choir.wav"
    }
  }
}
```

### 3. MIDI-reactive (Phase 2)

The most precise mode. Uses a `.mid` file to trigger exact note events — every key, string hit, or drum strike at the exact millisecond it happens in the score.

Install the MIDI parser dependency when ready:
```
npm install @tonejs/midi
```

Then add the MIDI path to the config:
```json
{ "why": { "midiPath": "/midi/why.mid" } }
```

`useMidiParser.ts` is already stubbed and ready to receive the implementation.

---

## Metadata schema

Add entries to `public/ghost-performance/config.json`:

```json
{
  "song-slug": {
    "enabled": true,
    "mode": "auto",
    "primaryInstrument": "piano",
    "secondaryInstruments": ["strings", "choir"],
    "inputPriority": ["midi", "stems", "audio"],
    "visualStyle": "noir-cinematic",
    "accentColor": "blue-gold",
    "showInstrument": true,
    "showParticles": true,
    "showWaveform": false,
    "cameraMode": "static",
    "midiPath": "/midi/song-slug.mid",
    "stems": {
      "piano":   "/stems/song-slug/piano.wav",
      "strings": "/stems/song-slug/strings.wav"
    }
  }
}
```

### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | — | Set to `false` to disable Ghost Performance for this track |
| `mode` | `'auto'` \| instrument | `'auto'` | `auto` = use `primaryInstrument`; or hardcode a specific visualizer |
| `primaryInstrument` | instrument | — | Determines which Ghost visualizer is shown |
| `secondaryInstruments` | instrument[] | — | Shown as "also present" badges in the UI |
| `inputPriority` | mode[] | `['midi','stems','audio']` | Order in which input sources are tried |
| `visualStyle` | string | `'noir-cinematic'` | Reserved for Phase 2 per-song style overrides |
| `accentColor` | string | `'blue-gold'` | Reserved for Phase 2 colour theming |
| `showParticles` | boolean | `true` | Enable/disable particle effects |
| `showWaveform` | boolean | `false` | Show waveform overlay |
| `midiPath` | string | — | URL path to the MIDI file |
| `stems` | object | — | URL paths to individual stem audio files |

---

## How to enable Ghost Performance for a song

1. Identify the song's **slug** (e.g. `why`, `the-empty-chair`)
2. Add an entry to `public/ghost-performance/config.json`
3. Set `primaryInstrument` to the main instrument
4. Rebuild / hot-reload — the tab will appear automatically

The scanner reads the config at build time (or on each request with `force-dynamic`). No code changes are needed.

---

## How to add a new instrument visualizer

1. Create `src/components/ghost-performance/GhostMyInstrument.tsx`
2. Follow the same canvas + RAF pattern as `GhostEnergy.tsx`:
   - Call `useAudioMidiSync(meta)` to get `getFrequencyData`, `getWaveformData`, `isPlaying`
   - Manage a `rafRef` and call `requestAnimationFrame` in a `draw` callback
   - Clear and redraw on each frame
   - Use the utility functions from `ghostPerformanceTypes.ts`
3. Add the new instrument type to `GhostInstrument` in `src/lib/types.ts`
4. Add it to `VISUALIZER_MAP` in `GhostPerformanceEngine.tsx`
5. Add it to `INSTRUMENT_LABELS` and `INSTRUMENT_ICONS` in the selector files

---

## File structure

```
src/
  lib/
    types.ts                          ← GhostPerformanceMeta + GhostInstrument types
    musicScanner.ts                   ← Reads public/ghost-performance/config.json
  components/
    SongChapterPage.tsx               ← Ghost Performance tab integration
    ghost-performance/
      ghostPerformanceTypes.ts        ← Shared types, colour constants, extractBands()
      useAudioAnalysis.ts             ← Web Audio AnalyserNode hook
      useMidiParser.ts                ← MIDI parser stub (Phase 2)
      useStemAnalysis.ts              ← Stem analysis stub (Phase 2)
      useAudioMidiSync.ts             ← Unified data source hook
      GhostPerformanceTab.tsx         ← Tab wrapper (header + engine)
      GhostPerformanceEngine.tsx      ← Visualizer selector + renderer
      GhostPerformanceSelector.tsx    ← Mode badge component
      GhostEnergy.tsx                 ← Audio-reactive fallback (full)
      GhostPiano.tsx                  ← Piano key visualizer (full)
      GhostDrums.tsx                  ← Drum kit visualizer (full)
      GhostSynth.tsx                  ← Synthesizer visualizer (partial)
      GhostGuitar.tsx                 ← Guitar string visualizer (full)
      GhostBass.tsx                   ← Bass string visualizer (full)
      GhostStrings.tsx                ← Orchestral strings visualizer (full)
      GhostChoir.tsx                  ← Choir visualizer (full)
  remotion/
    ghost-performance/
      ghostPerformanceSchema.ts       ← Remotion props types
      GhostPerformanceComposition.tsx ← Remotion composition (stub)
      renderGhostPerformance.ts       ← Offline render script (stub)

public/
  ghost-performance/
    config.json                       ← Song-by-song Ghost Performance config
```

---

## Remotion rendering plan (Phase 2)

### Concept

Each song can generate a 16:9 cinematic Ghost Performance video using the same visualizers as the web experience. Remotion reads pre-analysed audio data arrays instead of a live AnalyserNode.

### Architecture

```
Song audio (MP3/WAV)
  ↓
scripts/analyse-audio.ts
  → OfflineAudioContext (Node.js)
  → PreAnalysedFrame[] (one per frame at 30fps)
  → saved as JSON next to the audio file

Remotion composition:
  GhostPerformanceComposition.tsx
  ↓ reads analysedFrames[currentFrame]
  → GhostPiano / GhostDrums / GhostEnergy / ...
  → renders to MP4
```

### Steps to implement

1. Install `node-web-audio-api` or use `ffmpeg` + `audiowaveform` for offline analysis
2. Implement `scripts/analyse-audio.ts`:
   - Decode the audio file at the target sample rate
   - Create an `OfflineAudioContext` and step through frames at 30fps
   - For each frame: call `getByteFrequencyData` and `getFloatTimeDomainData`
   - Serialize to `PreAnalysedFrame[]`
3. In `GhostPerformanceComposition.tsx`:
   - Replace the placeholder with the correct visualizer
   - Pass `analysedFrames[frame]` as synthetic frequency/waveform data
4. Add intro (3s title card) and outro (4s NoiraCiel fade) overlays
5. Implement `renderGhostPerformance.ts` to bundle, render, and upload to R2

### Video output spec

- Resolution: 1920×1080 (16:9)
- Frame rate: 30fps
- Codec: H.264 / MP4
- Duration: full song length + intro + outro
- Audio: original song MP3 encoded at 320kbps

---

## Performance notes

- Canvas RAF loop: ~16ms per frame at 60fps — no React state updates inside the loop
- Frequency buffers are reused (Uint8Array / Float32Array shared refs, no per-frame allocation)
- Each visualizer is dynamically imported (`next/dynamic`) to keep the initial bundle lean
- `useAudioMidiSync` returns the existing AnalyserNode; multiple visualizers share one node

---

## What is missing for full MIDI / stem accuracy

| Feature | Status | Effort |
|---------|--------|--------|
| Audio-reactive fallback | ✅ Done | — |
| Ghost Piano, Drums, Guitar, Bass, Strings, Choir, Synth, Energy | ✅ Done | — |
| Per-song config (JSON) | ✅ Done | — |
| MIDI file parsing | 🔲 Phase 2 | `npm install @tonejs/midi` + implement `useMidiParser.ts` |
| Stem audio routing | 🔲 Phase 2 | Implement `useStemAnalysis.ts` |
| Remotion offline render | 🔲 Phase 2 | `scripts/analyse-audio.ts` + fill `GhostPerformanceComposition.tsx` |
| BPM detection | 🔲 Phase 2 | Beat-detection algorithm for drum timing hints |
| Camera mode (slow-pan, close-up) | 🔲 Phase 2 | Canvas transform layer |

---

## Testing locally

```bash
npm run dev
```

Navigate to any song page, e.g. `/songs/why`, and click the **Ghost Performance** tab.

Songs configured in `public/ghost-performance/config.json` will show the appropriate visualizer.
Songs not in the config will show the "not available yet" placeholder.

Start playing the track (click **Listen**) to activate the audio-reactive visualization.
