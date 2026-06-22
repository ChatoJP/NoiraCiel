'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  authorName: string
  country: string
  message: string
  createdAt: number
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(196,149,58,0.2)',
  color: '#F2EDE3',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  padding: '0.75rem 1rem',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function CommunityPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ authorName: '', isAnonymous: false, country: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/scholarship/community')
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .finally(() => setLoading(false))
  }, [])

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/scholarship/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const base: React.CSSProperties = { background: '#080810', color: '#F2EDE3', minHeight: '100vh' }

  return (
    <div style={base}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '8rem 1.5rem 6rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '5rem', textAlign: 'center' }}>
          <div style={{ width: '1px', height: '4rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', margin: '0 auto 2.5rem' }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', opacity: 0.75, marginBottom: '1.5rem' }}>
            Community Wall
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Leave a word.
          </h1>
          <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', margin: '0 auto 1.75rem' }} />
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.8, color: 'rgba(242,237,227,0.5)', maxWidth: '560px', margin: '0 auto' }}>
            A few words of encouragement for the young people who apply, donate, or simply believe in what this project is trying to do.
            Messages are moderated before they appear.
          </p>
        </div>

        {/* Approved messages */}
        {loading && (
          <div style={{ marginBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: '1.75rem 2rem', border: '1px solid rgba(196,149,58,0.07)', background: 'rgba(196,149,58,0.015)', animation: 'pulse 1.5s ease-in-out infinite' }}>
                <div style={{ height: '1rem', background: 'rgba(242,237,227,0.06)', borderRadius: '2px', marginBottom: '0.75rem', width: `${60 + i * 10}%` }} />
                <div style={{ height: '0.8rem', background: 'rgba(242,237,227,0.04)', borderRadius: '2px', width: '40%' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '3rem', border: '1px solid rgba(196,149,58,0.08)' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontWeight: 300, fontSize: '1rem', color: 'rgba(242,237,227,0.2)' }}>
              No messages yet. Be the first to leave one.
            </p>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div style={{ marginBottom: '5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  padding: '1.75rem 2rem',
                  border: '1px solid rgba(196,149,58,0.07)',
                  background: 'rgba(196,149,58,0.015)',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  fontSize: '1rem',
                  lineHeight: 1.75,
                  color: 'rgba(242,237,227,0.7)',
                  marginBottom: '1rem',
                }}>
                  &ldquo;{msg.message}&rdquo;
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(242,237,227,0.4)', letterSpacing: '0.1em' }}>
                    {msg.authorName}
                  </span>
                  {msg.country && (
                    <>
                      <span style={{ color: 'rgba(196,149,58,0.25)' }}>·</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(242,237,227,0.25)', letterSpacing: '0.1em' }}>
                        {msg.country}
                      </span>
                    </>
                  )}
                  <span style={{ color: 'rgba(196,149,58,0.25)' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', color: 'rgba(242,237,227,0.2)' }}>
                    {new Date(msg.createdAt).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <div style={{ borderTop: '1px solid rgba(196,149,58,0.1)', paddingTop: '3rem' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.2rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.7 }}>
                Your message has been received. It will appear here after review. Thank you.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '2rem' }}>
                Leave a message
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)', marginBottom: '0.5rem' }}>
                      Name
                    </label>
                    <input
                      style={inputStyle}
                      value={form.authorName}
                      onChange={e => set('authorName', e.target.value)}
                      placeholder="Your name"
                      disabled={form.isAnonymous}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)', marginBottom: '0.5rem' }}>
                      Country *
                    </label>
                    <input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Country" required />
                  </div>
                </div>

                <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer', marginBottom: '1.25rem' }}>
                  <input type="checkbox" checked={form.isAnonymous} onChange={e => set('isAnonymous', e.target.checked)} style={{ accentColor: '#C4953A' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(242,237,227,0.4)' }}>Post anonymously</span>
                </label>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)', marginBottom: '0.5rem' }}>
                    Your message * <span style={{ fontWeight: 300, opacity: 0.5 }}>({form.message.length}/500)</span>
                  </label>
                  <textarea
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    placeholder="A word of encouragement, a thought, a wish for the young people this touches…"
                    maxLength={500}
                    required
                  />
                </div>

                {error && (
                  <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', border: '1px solid rgba(220,80,80,0.3)', background: 'rgba(220,80,80,0.05)' }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#e07070' }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: '#C4953A', color: '#080810', border: 'none', padding: '0.85rem 2.5rem',
                    fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase',
                    cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Sending…' : 'Leave Message'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
