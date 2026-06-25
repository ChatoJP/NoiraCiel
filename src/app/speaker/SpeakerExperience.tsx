'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import SignGlyph from './SignGlyph'
import KinCard from './KinCard'
import WaveCompass from './WaveCompass'
import { loadProfile } from '@/lib/onboardingStorage'
import type { UserProfile } from '@/types/noiracielOnboarding'

// ── Types passed down from the server page ───────────────────────────────────
interface GlyphView {
  gregorianDate: string
  longCount: string
  haab: string
  tzolkin: string
  signName: string
  signMeaning: string
  signKeywords: string[]
  toneNumber: number
  toneName: string
  lordGlyph: string
  lordTheme: string
  trecena: string
  guidance: string
  reflectionQuestion: string
}

interface RecommendationView {
  albumTitle: string
  albumHref: string
  albumWorld: string
  trackTitle: string | null
  trackHref: string | null
  bookTitle: string | null
}

interface WaveDayView {
  position: number
  date: string
  tone: number
  signName: string
  kinDisplay: string
  shortMeaning: string
  stage: string
  noiracielPrompt: string
}

interface WaveView {
  name: string
  anchorSign: string
  startDate: string
  endDate: string
  currentPosition: number
  theme: string
  noiracielInterpretation: string
  albumTitle: string | null
  albumHref: string | null
  bookTitle: string | null
  creativeAction: string
  days: WaveDayView[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const OPENER = `I am the NoiraCiel Speaker.

I can guide you through NoiraCiel — its songs, books, albums, moods, and the glyph of the day. Ask me what today means, what to listen to, or what you are carrying right now.`

const STARTERS = [
  'What should I listen to today?',
  'Show me the 13-day wave.',
  'Where am I in the current wave?',
  'Read today’s glyph.',
  'Give me a song for each of the 13 days.',
  'Guide me through NoiraCiel.',
  'I feel restless. What should I hear?',
  'Give me a symbolic reading for today.',
]

// ── A glyph-inspired sigil: concentric rings, horizon, tone-dots ─────────────
function GlyphSigil({ tone, size = 120 }: { tone: number; size?: number }) {
  const c = size / 2
  const dots = Array.from({ length: Math.min(tone, 13) })
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="opacity-90"
    >
      <circle cx={c} cy={c} r={c - 2} stroke="rgb(var(--t-accent-rgb))" strokeWidth="0.6" opacity="0.4" />
      <circle cx={c} cy={c} r={c * 0.66} stroke="rgb(var(--t-accent-rgb))" strokeWidth="0.5" opacity="0.28" />
      <circle cx={c} cy={c} r={c * 0.34} stroke="rgb(var(--t-accent-rgb))" strokeWidth="0.5" opacity="0.5" />
      <line x1={6} y1={c} x2={size - 6} y2={c} stroke="rgb(var(--t-accent-rgb))" strokeWidth="0.5" opacity="0.45" />
      <line x1={c} y1={6} x2={c} y2={size - 6} stroke="rgb(var(--t-accent-rgb))" strokeWidth="0.3" opacity="0.18" />
      <circle cx={c} cy={c} r="2.2" fill="rgb(var(--t-accent-rgb))" opacity="0.9" />
      {/* tone dots around the ring */}
      {dots.map((_, i) => {
        const angle = (i / 13) * Math.PI * 2 - Math.PI / 2
        const r = c - 2
        return (
          <circle
            key={i}
            cx={c + Math.cos(angle) * r}
            cy={c + Math.sin(angle) * r}
            r="1.8"
            fill="rgb(var(--t-accent-rgb))"
            opacity="0.85"
          />
        )
      })}
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

function SpeakerIcon({ muted }: { muted?: boolean }) {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M11 5L6 9H2v6h4l5 4V5z" />
      {muted ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M23 9l-6 6M17 9l6 6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14" />
      )}
    </svg>
  )
}

export default function SpeakerExperience({
  glyph,
  recommendation,
  wave,
}: {
  glyph: GlyphView
  recommendation: RecommendationView | null
  wave: WaveView
}) {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: OPENER }])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [autoRead, setAutoRead] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null)
  const [waveExpanded, setWaveExpanded] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setTtsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  // Load the onboarding profile and personalise the opener for returning listeners.
  useEffect(() => {
    const p = loadProfile()
    if (!p) return
    setProfile(p)
    setMessages((prev) => {
      // only replace the default opener, never an active conversation
      if (prev.length !== 1 || prev[0].role !== 'assistant' || prev[0].content !== OPENER) return prev
      return [
        {
          role: 'assistant',
          content: `Welcome back, ${p.pathName}.\n\nToday's glyph speaks differently to someone who listens the way you do. Ask me what today means, what to hear, or where you are in the current wave — and I will read it through your path.`,
        },
      ]
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  // ── Browser text-to-speech (optional voice mode) ───────────────────────────
  const speak = useCallback(
    (text: string, idx: number) => {
      if (!ttsSupported) return
      const synth = window.speechSynthesis
      synth.cancel()
      if (speakingIdx === idx) {
        setSpeakingIdx(null)
        return
      }
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 0.92
      utter.pitch = 0.95
      // Prefer a calm English voice if one is available.
      const voices = synth.getVoices()
      const preferred = voices.find((v) => /en-GB|en_GB|Daniel|Serena|Arthur/i.test(`${v.lang} ${v.name}`))
      if (preferred) utter.voice = preferred
      utter.onend = () => setSpeakingIdx((cur) => (cur === idx ? null : cur))
      setSpeakingIdx(idx)
      synth.speak(utter)
    },
    [ttsSupported, speakingIdx],
  )

  useEffect(() => {
    // Stop any speech when leaving the page.
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const send = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim()
      if (!text || streaming) return

      const next: Message[] = [...messages, { role: 'user', content: text }]
      setMessages(next)
      setInput('')
      setStreaming(true)
      setMessages([...next, { role: 'assistant', content: '' }])

      const ctrl = new AbortController()
      abortRef.current = ctrl

      try {
        const res = await fetch('/api/noiraciel-speaker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: next, profile: profile ?? undefined }),
          signal: ctrl.signal,
        })
        if (!res.ok || !res.body) throw new Error('Stream failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acc = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          acc += decoder.decode(value, { stream: true })
          const snapshot = acc
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: snapshot }
            return updated
          })
        }
        if (autoRead && acc.trim()) {
          // index of the just-completed assistant message
          speak(acc, next.length)
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: 'Something went quiet. Try again in a moment.',
            }
            return updated
          })
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [input, messages, streaming, autoRead, speak, profile],
  )

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Ask the Speaker to read the current wave, scrolling the chat into view.
  const askAboutWave = useCallback(() => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    send(`Read the current 13-day wave for me — ${wave.name}. Where does today (day ${wave.currentPosition} of 13) sit inside it, and what should I listen to for this wave?`)
  }, [send, wave.name, wave.currentPosition])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full blur-[120px] opacity-[0.18] bg-[radial-gradient(circle,rgb(var(--t-accent-rgb)),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[40vh] rounded-full blur-[120px] opacity-[0.12] bg-[radial-gradient(circle,rgb(var(--t-bg-tint-rgb)),transparent_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-16">
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <header className="text-center mb-12 animate-fade-up">
          <p className="font-body text-[10px] tracking-[0.45em] uppercase text-noir-gold/55 mb-5">
            The NoiraCiel Speaker
          </p>
          <h1 className="font-heading italic text-4xl sm:text-5xl text-noir-ivory/90 leading-tight">
            Speak with NoiraCiel.
          </h1>
          <p className="font-body text-sm text-noir-silver/55 mt-4 max-w-xl mx-auto leading-relaxed">
            A private voice for music, books, emotion, and symbolic time.
          </p>
        </header>

        {/* ── Current 13-Day Wave ──────────────────────────────────────── */}
        <section className="mb-8 border border-noir-silver/10 bg-noir-void/60 backdrop-blur-sm animate-fade-up">
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-3 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="text-t-accent">
                <SignGlyph sign={wave.anchorSign} size={42} />
              </span>
              <div>
                <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45">
                  Current 13-Day Wave
                </p>
                <p className="font-heading italic text-xl text-noir-ivory/85 leading-tight mt-0.5">
                  {wave.name}
                </p>
                <p className="font-body text-[10px] text-noir-silver/40 mt-1">
                  {wave.startDate} → {wave.endDate} · Day {wave.currentPosition} of 13 · anchor {wave.anchorSign}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWaveExpanded((v) => !v)}
                className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/45 border border-noir-silver/12 px-3 py-1.5 hover:border-noir-gold/40 hover:text-noir-gold/80 transition-colors"
              >
                {waveExpanded ? 'Hide the wave' : 'Read the full wave'}
              </button>
              <button
                onClick={() => askAboutWave()}
                className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-gold/70 border border-noir-gold/30 px-3 py-1.5 hover:border-noir-gold/60 hover:text-noir-gold transition-colors disabled:opacity-30"
                disabled={streaming}
              >
                Ask the Speaker
              </button>
            </div>
          </div>

          {/* The wave compass */}
          <div className="px-5 sm:px-6 pb-6 pt-2">
            <WaveCompass days={wave.days} currentPosition={wave.currentPosition} />
            <p className="font-body text-[8px] leading-relaxed text-noir-silver/25 text-center mt-5 max-w-md mx-auto">
              This is a symbolic and artistic interpretation inspired by Mesoamerican
              calendrical cycles. It is not a prediction, scientific claim, or spiritual authority.
            </p>
          </div>

          {/* Expanded: the full 13-day arc */}
          {waveExpanded && (
            <div className="px-5 sm:px-6 pb-5 border-t border-noir-silver/8 pt-4 animate-fade-in">
              <p className="font-heading italic text-[13px] text-noir-ivory/70 leading-[1.7] mb-1">
                {wave.theme}
              </p>
              <p className="font-body text-[11px] text-noir-silver/45 leading-relaxed mb-4">
                {wave.noiracielInterpretation}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
                {wave.days.map((d) => (
                  <KinCard
                    key={d.position}
                    variant="mini"
                    active={d.position === wave.currentPosition}
                    data={{
                      kinDisplay: d.kinDisplay,
                      tone: d.tone,
                      signName: d.signName,
                      position: d.position,
                      shortMeaning: d.shortMeaning,
                    }}
                  />
                ))}
              </div>
              {wave.albumTitle && wave.albumHref && (
                <p className="font-body text-[11px] text-noir-silver/45 mt-4">
                  This wave:{' '}
                  <Link href={wave.albumHref} className="text-noir-ivory/75 hover:text-noir-gold transition-colors">
                    {wave.albumTitle}
                  </Link>
                  {wave.bookTitle && <> · to read: <span className="text-noir-silver/65">{wave.bookTitle}</span></>}
                </p>
              )}
              <p className="font-body text-[9px] leading-relaxed text-noir-silver/25 mt-4">
                The 13-day wave is a symbolic and artistic interpretation inspired by
                Mesoamerican calendrical cycles. It is not a prediction, scientific
                claim, or spiritual authority.
              </p>
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-start">
          {/* ── Left panel: Today's Glyph ───────────────────────────── */}
          <aside className="lg:sticky lg:top-24 space-y-4 animate-fade-up">
            <div className="border border-noir-silver/10 bg-noir-void/70 backdrop-blur-sm">
              <div className="flex flex-col items-center px-5 pt-6 pb-4 border-b border-noir-silver/8">
                {/* Tone ring with the per-sign glyph at its centre */}
                <div className="relative flex items-center justify-center text-t-accent">
                  <GlyphSigil tone={glyph.toneNumber} />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <SignGlyph sign={glyph.signName} size={46} />
                  </span>
                </div>
                <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 mt-4">
                  Today’s Glyph
                </p>
                <p className="font-heading italic text-2xl text-noir-ivory/85 mt-1">
                  {glyph.tzolkin}
                </p>
                <p className="font-body text-[11px] text-noir-silver/45 mt-1">
                  Tone {glyph.toneNumber} · {glyph.toneName} · {glyph.signName}
                </p>
                <p className="font-body text-[10px] text-noir-silver/35 mt-1.5">
                  {glyph.trecena} · {glyph.lordGlyph}
                </p>
              </div>

              <div className="px-5 py-4 space-y-3">
                <p className="font-heading italic text-[13px] text-noir-ivory/70 leading-[1.7]">
                  {glyph.guidance}
                </p>
                <p className="font-body text-[11px] text-noir-silver/50 leading-relaxed border-l border-noir-gold/25 pl-3">
                  {glyph.reflectionQuestion}
                </p>
              </div>

              {/* Calendar detail */}
              <div className="px-5 py-3 border-t border-noir-silver/8 grid grid-cols-3 gap-2 text-center">
                <Detail label="Long Count" value={glyph.longCount} />
                <Detail label="Haab’" value={glyph.haab} />
                <Detail label="Night" value={glyph.lordGlyph} />
              </div>
            </div>

            {/* Recommended for today */}
            {recommendation && (
              <div className="border border-noir-silver/10 bg-noir-void/70 backdrop-blur-sm px-5 py-4">
                <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 mb-3">
                  For Today
                </p>
                <Link
                  href={recommendation.albumHref}
                  className="block group"
                >
                  <p className="font-heading italic text-sm text-noir-ivory/80 group-hover:text-noir-gold transition-colors">
                    {recommendation.albumTitle}
                  </p>
                  <p className="font-body text-[10px] text-noir-silver/40 mt-0.5">
                    {recommendation.albumWorld}
                  </p>
                </Link>
                {recommendation.bookTitle && (
                  <p className="font-body text-[11px] text-noir-silver/45 mt-3 leading-relaxed">
                    To read: <span className="text-noir-silver/65">{recommendation.bookTitle}</span>
                  </p>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <p className="font-body text-[9px] leading-relaxed text-noir-silver/25 px-1">
              The Daily Glyph is a symbolic and artistic interpretation inspired by
              Mayan calendrical traditions. It is not a scientific prediction,
              spiritual authority, or historical claim.
            </p>
          </aside>

          {/* ── Main panel: conversation ────────────────────────────── */}
          <section ref={chatRef} className="flex flex-col min-h-[60vh] border border-noir-silver/10 bg-[#04040a]/85 backdrop-blur-md animate-fade-up scroll-mt-24">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-noir-silver/8 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-noir-gold/70 animate-pulse-gold" />
                <p className="font-body text-[9px] tracking-[0.35em] uppercase text-noir-silver/45">
                  NoiraCiel · Speaker
                </p>
              </div>
              {ttsSupported && (
                <button
                  onClick={() => setAutoRead((v) => !v)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 border text-[9px] tracking-[0.2em] uppercase transition-colors ${
                    autoRead
                      ? 'border-noir-gold/45 text-noir-gold/80'
                      : 'border-noir-silver/12 text-noir-silver/35 hover:text-noir-silver/60'
                  }`}
                  aria-pressed={autoRead}
                >
                  <SpeakerIcon muted={!autoRead} />
                  Auto-read
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-7 max-h-[58vh]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                    {msg.role === 'user' ? (
                      <div className="bg-noir-deep/40 border border-noir-silver/8 px-4 py-2.5">
                        <p className="font-body text-sm text-noir-silver/70 leading-relaxed">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="group">
                        <p className="font-heading italic text-[15px] sm:text-base text-noir-ivory/75 leading-[1.85] whitespace-pre-wrap">
                          {msg.content}
                          {streaming && i === messages.length - 1 && (
                            <span className="inline-block w-0.5 h-[15px] bg-noir-gold/60 ml-0.5 animate-pulse align-middle" />
                          )}
                        </p>
                        {ttsSupported && msg.content && !(streaming && i === messages.length - 1) && (
                          <button
                            onClick={() => speak(msg.content, i)}
                            className="mt-2 inline-flex items-center gap-1.5 text-[9px] tracking-[0.2em] uppercase text-noir-silver/25 hover:text-noir-gold/60 transition-colors"
                          >
                            <SpeakerIcon muted={speakingIdx === i} />
                            {speakingIdx === i ? 'Stop' : 'Speak'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Starter prompts (only before the first exchange) */}
            {messages.length <= 1 && (
              <div className="px-5 sm:px-7 pb-4 flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="font-body text-[11px] text-noir-silver/50 border border-noir-silver/12 px-3 py-1.5 hover:border-noir-gold/40 hover:text-noir-gold/80 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-noir-silver/8 to-transparent flex-shrink-0" />

            {/* Input */}
            <div className="flex items-end gap-3 px-5 sm:px-7 py-4 flex-shrink-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="A song, a feeling, a question…"
                rows={1}
                disabled={streaming}
                className="flex-1 bg-transparent font-heading italic text-[15px] text-noir-ivory/70 placeholder:text-noir-silver/20 placeholder:not-italic resize-none outline-none leading-relaxed max-h-28 disabled:opacity-40"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center border border-noir-gold/25 text-noir-gold/45 hover:border-noir-gold/60 hover:text-noir-gold disabled:opacity-15 disabled:cursor-not-allowed transition-all"
                aria-label="Send"
              >
                <SendIcon />
              </button>
            </div>
          </section>
        </div>

        <p className="text-center font-body text-[8px] tracking-[0.3em] text-noir-silver/15 uppercase mt-8">
          NoiraCiel Speaker · The art is human · The scale is automated
        </p>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-[8px] tracking-[0.2em] uppercase text-noir-silver/30">{label}</p>
      <p className="font-body text-[11px] text-noir-silver/60 mt-0.5 tabular-nums">{value}</p>
    </div>
  )
}
