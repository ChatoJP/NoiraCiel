'use client'

import { useState, useEffect } from 'react'

interface Letter {
  id: string
  authorName: string
  authorAge: number
  country: string
  letter: string
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

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ authorName: '', authorAge: '', country: '', isAnonymous: false, letter: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch('/api/scholarship/letters')
      .then(r => r.json())
      .then(d => setLetters(d.letters ?? []))
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
      const res = await fetch('/api/scholarship/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, authorAge: Number(form.authorAge) }),
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
            Letter to the Future
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Write to someone who is not yet born.
          </h1>
          <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', margin: '0 auto 1.75rem' }} />
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.8, color: 'rgba(242,237,227,0.5)', maxWidth: '580px', margin: '0 auto' }}>
            A living archive of letters from people who believe the future can be different.
            Write to a child who will be born in ten years. Write to a young artist who has not
            yet picked up their instrument. Write to the person you once were, or the person
            you hope someone else will become.
          </p>
        </div>

        {/* Letters archive */}
        {loading && (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'rgba(242,237,227,0.2)', marginBottom: '4rem' }}>
            Loading archive…
          </p>
        )}

        {!loading && letters.length === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '3rem', border: '1px solid rgba(196,149,58,0.08)' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontWeight: 300, fontSize: '1rem', color: 'rgba(242,237,227,0.2)' }}>
              The archive is waiting for its first letter.
            </p>
          </div>
        )}

        {!loading && letters.length > 0 && (
          <div style={{ marginBottom: '5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {letters.map(ltr => {
              const isOpen = expanded === ltr.id
              const raw200 = ltr.letter.slice(0, 200)
              const lastSpace = raw200.lastIndexOf(' ')
              const preview = ltr.letter.length > 200
                ? (lastSpace > 120 ? raw200.slice(0, lastSpace) : raw200) + '…'
                : ltr.letter
              return (
                <div
                  key={ltr.id}
                  style={{
                    padding: '2rem',
                    border: '1px solid rgba(196,149,58,0.07)',
                    background: isOpen ? 'rgba(196,149,58,0.025)' : 'transparent',
                    cursor: ltr.letter.length > 200 ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => ltr.letter.length > 200 && setExpanded(isOpen ? null : ltr.id)}
                >
                  <p style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    lineHeight: 1.8,
                    color: 'rgba(242,237,227,0.68)',
                    marginBottom: '1.25rem',
                    whiteSpace: 'pre-line',
                  }}>
                    {isOpen ? ltr.letter : preview}
                  </p>
                  {ltr.letter.length > 200 && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.4)', marginBottom: '1rem' }}>
                      {isOpen ? 'Read less' : 'Read full letter'}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(242,237,227,0.35)', letterSpacing: '0.08em' }}>
                      {ltr.authorName}
                    </span>
                    {ltr.country && (
                      <>
                        <span style={{ color: 'rgba(196,149,58,0.2)' }}>·</span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(242,237,227,0.25)' }}>
                          {ltr.country}
                        </span>
                      </>
                    )}
                    <span style={{ color: 'rgba(196,149,58,0.2)' }}>·</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', color: 'rgba(242,237,227,0.18)' }}>
                      {new Date(ltr.createdAt).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Write form */}
        <div style={{ borderTop: '1px solid rgba(196,149,58,0.1)', paddingTop: '3rem' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.2rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.7 }}>
                Your letter has been added to the archive. It will appear here after review. Thank you.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '2rem' }}>
                Write a letter
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)', marginBottom: '0.5rem' }}>
                      Name
                    </label>
                    <input style={inputStyle} value={form.authorName} onChange={e => set('authorName', e.target.value)} placeholder="Your name" disabled={form.isAnonymous} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)', marginBottom: '0.5rem' }}>
                      Age *
                    </label>
                    <input style={inputStyle} type="number" min={5} max={100} value={form.authorAge} onChange={e => set('authorAge', e.target.value)} placeholder="Your age" required />
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
                    Your letter * <span style={{ fontWeight: 300, opacity: 0.5 }}>({form.letter.length}/3000)</span>
                  </label>
                  <textarea
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '200px' }}
                    value={form.letter}
                    onChange={e => set('letter', e.target.value)}
                    placeholder="Dear child, dear artist, dear dreamer…"
                    maxLength={3000}
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
                  {submitting ? 'Sending…' : 'Add to the Archive'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
