'use client'
import { useState, useRef, useCallback } from 'react'

const MODELS = [
  { id: 'V4_5', label: 'Suno v4.5' },
  { id: 'V4_5PLUS', label: 'Suno v4.5+' },
  { id: 'V5', label: 'Suno v5' },
  { id: 'V5_5', label: 'Suno v5.5' },
  { id: 'V4', label: 'Suno v4' },
  { id: 'V3_5', label: 'Suno v3.5' },
]

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic',
  'Ambient', 'Folk', 'Country', 'Reggae', 'Metal', 'Punk', 'Soul',
  'Funk', 'Lo-fi', 'Cinematic', 'Gospel', 'Blues', 'Synthwave',
]

const MOODS = [
  'Uplifting', 'Melancholic', 'Epic', 'Chill', 'Romantic', 'Intense',
  'Peaceful', 'Dark', 'Playful', 'Nostalgic', 'Ethereal', 'Energetic',
]

type Track = {
  id: string | number
  title: string
  tags: string
  audioUrl: string
  coverUrl: string
  duration: number | null
}

type GenStatus = 'idle' | 'generating' | 'polling' | 'done' | 'error'

function fmtDur(sec: number | null) {
  if (!sec) return ''
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

function TrackCard({ track, idx }: { track: Track; idx: number }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else { el.play(); setPlaying(true) }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Cover art */}
        <div className="relative flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-black/40">
          {track.coverUrl
            ? <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">♪</div>
          }
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <button onClick={toggle} className="text-white text-xl">
              {playing ? '⏸' : '▶'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{track.title || `Track ${idx + 1}`}</div>
          <div className="text-xs text-white/40 truncate mt-0.5">{track.tags}</div>
          {track.duration && <div className="text-xs text-white/30 mt-1">{fmtDur(track.duration)}</div>}
        </div>

        {/* Download */}
        {track.audioUrl && (
          <a
            href={track.audioUrl}
            download={`track-${idx + 1}.mp3`}
            target="_blank"
            rel="noreferrer"
            className="self-center flex-shrink-0 px-2 py-1 rounded text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
          >
            ↓
          </a>
        )}
      </div>

      {/* Playbar */}
      <audio
        ref={audioRef}
        src={track.audioUrl}
        onEnded={() => setPlaying(false)}
        className="w-full h-8 px-3 pb-2"
        controls
        style={{ colorScheme: 'dark' }}
      />
    </div>
  )
}

export default function AIComposer() {
  const [model, setModel] = useState('V4_5')
  const [prompt, setPrompt] = useState('')
  const [genre, setGenre] = useState('')
  const [mood, setMood] = useState('')
  const [customGenre, setCustomGenre] = useState('')
  const [instrumental, setInstrumental] = useState(true)
  const [lyrics, setLyrics] = useState('')

  const [status, setStatus] = useState<GenStatus>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [pollStatus, setPollStatus] = useState('')

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const startPolling = useCallback((taskId: string) => {
    setStatus('polling')
    const MAX = 120 // 2 min
    let ticks = 0

    pollRef.current = setInterval(async () => {
      ticks++
      if (ticks > MAX) {
        stopPolling()
        setStatus('error')
        setErrMsg('Generation timed out. Please try again.')
        return
      }

      try {
        const res = await fetch(`/api/ai-music?taskId=${taskId}`)
        const json = await res.json()

        setPollStatus(json.status ?? '')

        if (json.failed) {
          stopPolling()
          setStatus('error')
          setErrMsg(json.errorMessage ?? 'Generation failed')
          return
        }

        if (json.ready && json.tracks?.length) {
          stopPolling()
          setTracks(json.tracks)
          setStatus('done')
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 3000)
  }, [stopPolling])

  const generate = async () => {
    if (!prompt.trim() && !genre && !mood && !customGenre) return
    stopPolling()
    setStatus('generating')
    setErrMsg('')
    setTracks([])
    setPollStatus('')

    const styleparts = [customGenre || genre, mood].filter(Boolean).join(', ')

    try {
      const res = await fetch('/api/ai-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: styleparts,
          model,
          instrumental,
          lyrics: instrumental ? '' : lyrics,
          customMode: false,
        }),
      })
      const json = await res.json()
      if (json.error) { setStatus('error'); setErrMsg(json.error); return }
      startPolling(json.taskId)
    } catch (e) {
      setStatus('error')
      setErrMsg(String(e))
    }
  }

  const canGenerate = (prompt.trim() || genre || mood || customGenre) && status !== 'generating' && status !== 'polling'

  return (
    <div className="flex flex-col gap-5 p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">AI Music Generator</h2>
          <p className="text-xs text-white/40">Powered by Suno via KIE.AI</p>
        </div>
        {/* Model selector */}
        <select
          value={model}
          onChange={e => setModel(e.target.value)}
          className="text-xs bg-white/5 border border-white/10 text-white/70 rounded px-2 py-1"
        >
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Description</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the music you want to create... e.g. 'A melancholic piano ballad about lost love, with strings swelling in the chorus'"
          rows={3}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Genre row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/50 mb-1">Genre</label>
          <select
            value={genre}
            onChange={e => setGenre(e.target.value)}
            className="w-full bg-black/30 border border-white/10 text-sm text-white/80 rounded-lg px-3 py-2 focus:outline-none focus:border-white/30"
          >
            <option value="">— any —</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Mood</label>
          <select
            value={mood}
            onChange={e => setMood(e.target.value)}
            className="w-full bg-black/30 border border-white/10 text-sm text-white/80 rounded-lg px-3 py-2 focus:outline-none focus:border-white/30"
          >
            <option value="">— any —</option>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Custom style tags */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Custom style tags <span className="text-white/25">(overrides Genre above)</span></label>
        <input
          value={customGenre}
          onChange={e => setCustomGenre(e.target.value)}
          placeholder="e.g. indie folk, fingerpicking guitar, warm vocals"
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Instrumental toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setInstrumental(!instrumental)}
          className={`relative w-10 h-5 rounded-full transition-colors ${instrumental ? 'bg-[rgb(var(--t-accent-rgb,196,149,58))]' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${instrumental ? 'translate-x-5' : ''}`} />
        </button>
        <span className="text-sm text-white/70">Instrumental</span>
      </div>

      {/* Lyrics (non-instrumental) */}
      {!instrumental && (
        <div>
          <label className="block text-xs text-white/50 mb-1">Lyrics <span className="text-white/25">(optional)</span></label>
          <textarea
            value={lyrics}
            onChange={e => setLyrics(e.target.value)}
            placeholder="Paste your lyrics here, or leave blank to let Suno write them..."
            rows={4}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-white/30"
          />
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={!canGenerate}
        className={`w-full py-3 rounded-lg text-sm font-medium transition-all
          ${canGenerate
            ? 'bg-[rgb(var(--t-accent-rgb,196,149,58))] text-black hover:brightness-110'
            : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
      >
        {status === 'generating' ? 'Submitting...' :
         status === 'polling' ? `Generating… ${pollStatus}` :
         'Generate Music'}
      </button>

      {/* Error */}
      {status === 'error' && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          {errMsg}
        </div>
      )}

      {/* Polling spinner */}
      {status === 'polling' && tracks.length === 0 && (
        <div className="text-center py-6">
          <div className="inline-block w-8 h-8 rounded-full border-2 border-white/10 border-t-[rgb(var(--t-accent-rgb,196,149,58))] animate-spin mb-3" />
          <p className="text-xs text-white/40">Suno is composing your music…<br />This usually takes 30–90 seconds.</p>
          <p className="text-xs text-white/20 mt-1">{pollStatus}</p>
        </div>
      )}

      {/* Results */}
      {tracks.length > 0 && (
        <div>
          <div className="text-xs text-white/40 mb-2">Generated {tracks.length} variants</div>
          <div className="flex flex-col gap-3">
            {tracks.map((t, i) => <TrackCard key={t.id ?? i} track={t} idx={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}
