'use client'

import { useState } from 'react'
import Link from 'next/link'

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '0.55rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: 'rgba(196,149,58,0.6)',
  marginBottom: '0.5rem',
}

const CATEGORIES = [
  { value: 'music', label: 'Music' },
  { value: 'visual_art', label: 'Visual Art' },
  { value: 'writing', label: 'Writing & Poetry' },
  { value: 'film', label: 'Film & Video' },
  { value: 'photography', label: 'Photography' },
  { value: 'dance', label: 'Dance & Movement' },
  { value: 'other', label: 'Other' },
]

export default function OpenCallPage() {
  const [form, setForm] = useState({
    submitterName: '',
    age: '',
    country: '',
    email: '',
    title: '',
    description: '',
    category: '',
    workUrl: '',
    statement: '',
    privacyConsent: false,
    allowPublicDisplay: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/scholarship/open-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
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

  if (done) {
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '520px' }}>
          <div style={{ width: '1px', height: '4rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', margin: '0 auto 2.5rem' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Your work has been received.
          </h1>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
            Thank you for sharing your creativity with us. Submissions are reviewed carefully and
            selected works will appear in the Invisible Gallery.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/scholarship/gallery" style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C4953A', textDecoration: 'none' }}>
              View the Gallery →
            </Link>
            <Link href="/scholarship" style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.35)', textDecoration: 'none' }}>
              ← Back to scholarship
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={base}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '8rem 1.5rem 6rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ width: '1px', height: '4rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', marginBottom: '2.5rem' }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', opacity: 0.75, marginBottom: '1.5rem' }}>
            Open Call · 2026
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Submit Your Work
          </h1>
          <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', marginBottom: '1.75rem' }} />
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.8, color: 'rgba(242,237,227,0.55)' }}>
            The Invisible Gallery is a space for young creators from low-income backgrounds.
            If you are between 5 and 30 years old, and art, music, writing, film, dance or any creative form
            is part of how you understand the world — we want to see your work.
          </p>
          <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', border: '1px solid rgba(196,149,58,0.12)', background: 'rgba(196,149,58,0.03)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', lineHeight: 1.7, color: 'rgba(242,237,227,0.45)' }}>
              Selected submissions will be featured in the Invisible Gallery on this site, with full credit to the creator.
              Featuring your work does not transfer ownership. We will never use your work commercially without separate written agreement.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Name + Age + Country */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Your name *</label>
              <input style={inputStyle} value={form.submitterName} onChange={e => set('submitterName', e.target.value)} placeholder="Full name" required />
            </div>
            <div>
              <label style={labelStyle}>Your age *</label>
              <input style={inputStyle} type="number" min={5} max={30} value={form.age} onChange={e => set('age', e.target.value)} placeholder="Age" required />
            </div>
            <div>
              <label style={labelStyle}>Country *</label>
              <input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Country" required />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Email address *</label>
            <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Category *</label>
            <select
              style={{ ...inputStyle, appearance: 'none' }}
              value={form.category}
              onChange={e => set('category', e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Title of your work *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="The title or name of your piece" required />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Describe your work *</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="A short description of what this piece is, how you made it, what it means to you."
              required
            />
          </div>

          {/* Work URL */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Link to your work *</label>
            <input
              style={inputStyle}
              value={form.workUrl}
              onChange={e => set('workUrl', e.target.value)}
              placeholder="YouTube, SoundCloud, Instagram, personal site, Google Drive…"
              required
            />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(242,237,227,0.25)', marginTop: '0.4rem' }}>
              Share a link where we can experience your work. Any public or shareable URL.
            </p>
          </div>

          {/* Statement */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Artist statement *</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
              value={form.statement}
              onChange={e => set('statement', e.target.value)}
              placeholder="Tell us about yourself. What drives your creativity? What do you hope your work communicates? What does art mean in your life?"
              required
            />
          </div>

          {/* Consent checkboxes */}
          <div style={{ marginBottom: '2rem', padding: '1.25rem', border: '1px solid rgba(196,149,58,0.1)', background: 'rgba(196,149,58,0.02)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', lineHeight: 1.75, color: 'rgba(242,237,227,0.4)', marginBottom: '1rem' }}>
              Your submission data is stored securely. Your email is used only to follow up about your submission and will never be shared.
            </p>
            <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '0.75rem' }}>
              <input type="checkbox" checked={form.allowPublicDisplay} onChange={e => set('allowPublicDisplay', e.target.checked)} style={{ marginTop: '2px', accentColor: '#C4953A', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(242,237,227,0.6)', lineHeight: 1.6 }}>
                I allow my name and work to be displayed publicly in the Invisible Gallery if selected.
              </span>
            </label>
            <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.privacyConsent} onChange={e => set('privacyConsent', e.target.checked)} style={{ marginTop: '2px', accentColor: '#C4953A', flexShrink: 0 }} required />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(242,237,227,0.6)', lineHeight: 1.6 }}>
                I consent to NoiraCiel storing my submission data for review purposes. *
              </span>
            </label>
          </div>

          {error && (
            <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', border: '1px solid rgba(220,80,80,0.3)', background: 'rgba(220,80,80,0.05)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#e07070' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', background: '#C4953A', color: '#080810', border: 'none', padding: '1rem',
              fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, transition: 'opacity 0.2s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Work'}
          </button>
        </form>
      </div>
    </div>
  )
}
