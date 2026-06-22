'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const OPENER = `I am CIEL. I have been listening since before you arrived.

Ask me about a chapter, a feeling, or what you are carrying right now — and I will find the right place for you to begin.`

// ── CIEL sigil: circle + horizon line + centre point ─────────────────────────
function CielMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  const r = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle */}
      <circle cx={r} cy={r} r={r - 1.5} stroke="#C4953A" strokeWidth="0.7" opacity="0.55" />
      {/* Inner circle */}
      <circle cx={r} cy={r} r={r * 0.42} stroke="#C4953A" strokeWidth="0.5" opacity="0.3" />
      {/* Horizon line */}
      <line x1={1.5} y1={r} x2={size - 1.5} y2={r} stroke="#C4953A" strokeWidth="0.6" opacity="0.7" />
      {/* Centre point */}
      <circle cx={r} cy={r} r="1.4" fill="#C4953A" opacity="0.9" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

export default function ChatWidget() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const abortRef   = useRef<AbortController | null>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: OPENER }])
    }
  }, [open, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message   = { role: 'user', content: text }
    const next               = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setStreaming(true)
    setMessages([...next, { role: 'assistant', content: '' }])

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: next }),
        signal:  ctrl.signal,
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader  = res.body.getReader()
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
  }, [input, messages, streaming])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* ── Trigger button ────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-28 right-6 z-[90] flex items-center gap-2.5 px-2 py-2 border transition-all duration-500 group ${
          open
            ? 'bg-noir-void border-noir-gold/50 text-noir-gold'
            : 'bg-noir-void/90 border-noir-silver/15 text-noir-silver/40 hover:border-noir-gold/35 hover:text-noir-gold/65'
        }`}
        aria-label="Open CIEL — NoiraCiel guide"
      >
        <div className="relative w-8 h-8 overflow-hidden rounded-full flex-shrink-0 border border-noir-gold/20">
          <Image
            src="/characters/ciel/ciel-avatar.jpg"
            alt="CIEL"
            fill
            className="object-cover object-top scale-[1.35] translate-y-[-4px]"
            sizes="32px"
          />
        </div>
        <span className="font-body text-[9px] tracking-[0.35em] uppercase pr-1">
          {open ? 'Close' : 'CIEL'}
        </span>
      </button>

      {/* ── Chat panel ────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-44 right-6 z-[89] w-[370px] max-w-[calc(100vw-3rem)] transition-all duration-400 origin-bottom-right ${
          open
            ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
            : 'opacity-0 scale-95 pointer-events-none translate-y-2'
        }`}
      >
        <div
          className="border border-noir-silver/12 bg-[#04040a]/98 backdrop-blur-xl flex flex-col"
          style={{ height: '500px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-noir-silver/8 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 overflow-hidden rounded-full flex-shrink-0 border border-noir-gold/25">
                <Image
                  src="/characters/ciel/ciel-avatar.jpg"
                  alt="CIEL"
                  fill
                  className="object-cover object-top scale-[1.35] translate-y-[-4px]"
                  sizes="36px"
                />
              </div>
              <div>
                <p className="font-heading italic text-sm text-noir-ivory/85 leading-none tracking-wide">
                  CIEL
                </p>
                <p className="font-body text-[8px] tracking-[0.3em] text-noir-gold/40 uppercase mt-0.5">
                  NoiraCiel · Presence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/ciel"
                className="font-body text-[8px] tracking-[0.2em] uppercase text-noir-silver/25 hover:text-noir-gold/50 transition-colors"
                onClick={() => setOpen(false)}
              >
                About
              </Link>
              <button
                onClick={() => { setMessages([]); setOpen(false) }}
                className="text-noir-silver/25 hover:text-noir-ivory transition-colors"
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="relative flex-shrink-0 w-5 h-5 mt-0.5 overflow-hidden rounded-full border border-noir-gold/20">
                    <Image
                      src="/characters/ciel/ciel-avatar.jpg"
                      alt="CIEL"
                      fill
                      className="object-cover object-top scale-[1.35] translate-y-[-3px]"
                      sizes="20px"
                    />
                  </div>
                )}
                <div className={`max-w-[84%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-noir-deep/50 border border-noir-silver/8 px-3 py-2">
                      <p className="font-body text-sm text-noir-silver/65 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    <p className="font-heading italic text-sm text-noir-ivory/72 leading-[1.75] whitespace-pre-wrap">
                      {msg.content}
                      {streaming && i === messages.length - 1 && (
                        <span className="inline-block w-0.5 h-[14px] bg-noir-gold/55 ml-0.5 animate-pulse align-middle" />
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-noir-silver/8 to-transparent flex-shrink-0" />

          {/* Input */}
          <div className="flex items-end gap-3 px-4 py-3.5 flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="A song, a feeling, a question…"
              rows={1}
              disabled={streaming}
              className="flex-1 bg-transparent font-heading italic text-sm text-noir-ivory/65 placeholder:text-noir-silver/18 placeholder:not-italic resize-none outline-none leading-relaxed max-h-24 disabled:opacity-40"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center border border-noir-gold/25 text-noir-gold/40 hover:border-noir-gold/60 hover:text-noir-gold disabled:opacity-15 disabled:cursor-not-allowed transition-all"
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
        </div>

        {/* Attribution */}
        <p className="text-center font-body text-[7px] tracking-[0.25em] text-noir-silver/12 uppercase mt-1.5">
          CIEL · Powered by Claude · NoiraCiel
        </p>
      </div>
    </>
  )
}
