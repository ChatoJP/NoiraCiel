'use client'

import { useState, useEffect } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FanMessage {
  id: string
  name: string
  message: string
  submittedAt: string
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MessageCard({ entry }: { entry: FanMessage }) {
  return (
    <div className="border-l-2 border-gold/25 pl-4 py-1">
      <p className="font-heading italic text-base text-noir-ivory/85 leading-relaxed">
        {entry.message}
      </p>
      <p className="mt-1.5 font-body text-xs text-gold/50 tracking-wide">
        — {entry.name}
      </p>
    </div>
  )
}

interface SubmitFormProps {
  slug: string
  onSuccess: () => void
}

function SubmitForm({ slug, onSuccess }: SubmitFormProps) {
  const [name, setName]       = useState('')
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const charLeft = 200 - message.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim())              { setError('Please enter your name.');               return }
    if (!message.trim())           { setError('Please write a message.');               return }
    if (message.trim().length < 10){ setError('Message must be at least 10 characters.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/fan-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name: name.trim(), message: message.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong.')
        return
      }
      onSuccess()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {/* Name */}
      <div>
        <label className="block font-body text-[10px] tracking-[0.3em] text-gold/50 uppercase mb-1.5">
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 40))}
          maxLength={40}
          placeholder="Maria"
          className="w-full bg-noir-void/60 border border-noir-silver/15 focus:border-gold/40 outline-none px-3 py-2 font-body text-sm text-noir-ivory placeholder:text-noir-silver/25 transition-colors duration-200"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block font-body text-[10px] tracking-[0.3em] text-gold/50 uppercase mb-1.5">
          What does this song mean to you?
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          maxLength={200}
          rows={4}
          placeholder="This song found me when…"
          className="w-full bg-noir-void/60 border border-noir-silver/15 focus:border-gold/40 outline-none px-3 py-2 font-body text-sm text-noir-ivory placeholder:text-noir-silver/25 transition-colors duration-200 resize-none"
        />
        <p className={`mt-1 font-body text-[10px] text-right ${charLeft < 20 ? 'text-gold/60' : 'text-noir-silver/25'}`}>
          {charLeft} remaining
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="font-body text-xs text-red-400/80">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="font-body text-[10px] tracking-[0.25em] uppercase px-5 py-2.5 bg-gold/10 border border-gold/30 text-gold/80 hover:bg-gold/20 hover:text-gold hover:border-gold/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? 'Sending…' : 'Submit'}
      </button>
    </form>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function FanWall({ slug }: { slug: string }) {
  const [messages, setMessages]   = useState<FanMessage[]>([])
  const [loading, setLoading]     = useState(true)
  const [formOpen, setFormOpen]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(`/api/fan-wall?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.approved ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [slug])

  function handleSuccess() {
    setSubmitted(true)
    setFormOpen(false)
  }

  return (
    <div>
      {/* Section label */}
      <p className="font-body text-[10px] tracking-[0.35em] text-gold/50 uppercase mb-6">
        What this song means to you
      </p>

      {/* Message list */}
      {loading ? (
        <p className="font-body text-xs text-noir-silver/25 italic">Loading…</p>
      ) : messages.length > 0 ? (
        <div className="space-y-6">
          {messages.map((entry) => (
            <MessageCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className="font-heading italic text-sm text-noir-silver/30 leading-relaxed">
          Be the first to share what this song means to you.
        </p>
      )}

      {/* Submission area */}
      <div className="mt-8">
        {submitted ? (
          <p className="font-body text-xs tracking-wide text-gold/50 italic">
            Thank you — your message is waiting for approval.
          </p>
        ) : formOpen ? (
          <SubmitForm slug={slug} onSuccess={handleSuccess} />
        ) : (
          <button
            onClick={() => setFormOpen(true)}
            className="font-body text-[10px] tracking-[0.2em] text-gold/40 uppercase hover:text-gold/70 transition-colors duration-200"
          >
            Share what this means to you →
          </button>
        )}
      </div>
    </div>
  )
}
