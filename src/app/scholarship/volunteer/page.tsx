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

export default function VolunteerPage() {
  const [form, setForm] = useState({
    type: 'volunteer' as 'mentor' | 'volunteer' | 'both',
    name: '',
    email: '',
    country: '',
    city: '',
    bio: '',
    skills: '',
    availability: '',
    linkedIn: '',
    instagram: '',
    privacyConsent: false,
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
      const res = await fetch('/api/scholarship/volunteer', {
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

  if (done) {
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '500px' }}>
          <div style={{ width: '1px', height: '4rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', margin: '0 auto 2.5rem' }} />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Thank you for offering your time.
          </h1>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
            We have received your expression of interest and will be in touch as the Mentorship Circle grows.
            Your contribution of time and knowledge matters enormously.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/scholarship" style={{
              fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.25em',
              textTransform: 'uppercase', color: '#080810', background: '#C4953A',
              textDecoration: 'none', padding: '0.75rem 2rem', display: 'inline-block',
            }}>
              Return to the Scholarship →
            </Link>
            <Link href="/" style={{
              fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', textDecoration: 'none',
            }}>
              Back to NoiraCiel
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
            Mentorship Circle
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(1.8rem, 5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Volunteer or Mentor
          </h1>
          <div style={{ width: '2rem', height: '1px', background: 'rgba(196,149,58,0.4)', marginBottom: '1.75rem' }} />
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.8, color: 'rgba(242,237,227,0.55)' }}>
            Offer your experience, perspective, or craft. We are building a circle of people who can guide,
            encourage and walk alongside young people as they find their path.
            Whether you have a few hours or a long-term commitment, there is a place for you here.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Type */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={labelStyle}>I would like to</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {(['volunteer', 'mentor', 'both'] as const).map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={form.type === t}
                    onChange={() => set('type', t)}
                    style={{ accentColor: '#C4953A' }}
                  />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(242,237,227,0.75)' }}>
                    {t === 'volunteer' ? 'Volunteer (events, logistics, outreach)' : t === 'mentor' ? 'Mentor (one-on-one guidance)' : 'Both'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Name + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Full name *</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required />
            </div>
            <div>
              <label style={labelStyle}>Email address *</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
            </div>
          </div>

          {/* Country + City */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Country *</label>
              <input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Country" required />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City (optional)" />
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>About you *</span>
              <span style={{ fontWeight: 300, opacity: 0.45 }}>{form.bio.length}/500</span>
            </label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Tell us a little about yourself — your background, what you do, what draws you to this project."
              maxLength={500}
              required
            />
          </div>

          {/* Skills */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Skills and what you can offer *</span>
              <span style={{ fontWeight: 300, opacity: 0.45 }}>{form.skills.length}/300</span>
            </label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
              value={form.skills}
              onChange={e => set('skills', e.target.value)}
              placeholder="Music production, graphic design, teaching, writing, career guidance, languages…"
              maxLength={300}
              required
            />
          </div>

          {/* Availability */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Availability</label>
            <input
              style={inputStyle}
              value={form.availability}
              onChange={e => set('availability', e.target.value)}
              placeholder="e.g. 2–3 hours per month, flexible, evenings only…"
            />
          </div>

          {/* Social */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div>
              <label style={labelStyle}>LinkedIn (optional)</label>
              <input style={inputStyle} value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} placeholder="linkedin.com/in/yourname" />
            </div>
            <div>
              <label style={labelStyle}>Instagram (optional)</label>
              <input style={inputStyle} value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@handle" />
            </div>
          </div>

          {/* Privacy */}
          <div style={{ marginBottom: '2rem', padding: '1.25rem', border: '1px solid rgba(196,149,58,0.1)', background: 'rgba(196,149,58,0.02)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', lineHeight: 1.75, color: 'rgba(242,237,227,0.4)', marginBottom: '1rem' }}>
              Your information will be stored securely and used only to match you with volunteer opportunities and contact you about this program.
              We will never share your data with third parties without your explicit consent.
            </p>
            <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.privacyConsent}
                onChange={e => set('privacyConsent', e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#C4953A', flexShrink: 0 }}
              />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(242,237,227,0.6)', lineHeight: 1.6 }}>
                I consent to NoiraCiel storing and using my information for the purposes described above. *
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
              width: '100%', background: '#C4953A', color: '#080810',
              border: 'none', padding: '1rem',
              fontFamily: 'var(--font-body)', fontSize: '0.65rem',
              letterSpacing: '0.28em', textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {submitting ? 'Sending…' : 'Submit Expression of Interest'}
          </button>
        </form>
      </div>
    </div>
  )
}
