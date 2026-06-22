'use client'

import { useState } from 'react'

const TRACKS = [
  { slug: 'why', title: 'Why', album: 'The Life Lessons I Hope You Learn', duration: '5:14' },
  { slug: 'who-wins-if-i-win', title: 'Who Wins If I Win', album: 'The Life Lessons I Hope You Learn', duration: '4:42' },
  { slug: 'the-roots-we-cannot-see', title: 'The Roots We Cannot See', album: 'The Life Lessons I Hope You Learn', duration: '6:01' },
  { slug: 'if-we-cant-say-the-hard-truths', title: "If We Can't Say the Hard Truths", album: 'The Life Lessons I Hope You Learn', duration: '4:28' },
  { slug: 'still-worth-it', title: 'Still Worth It', album: 'The Life Lessons I Hope You Learn', duration: '5:33' },
  { slug: 'side-by-side', title: 'Side by Side', album: 'The Life Lessons I Hope You Learn', duration: '4:55' },
  { slug: 'as-long-as-youre-okay', title: "As Long as You're Okay", album: 'The Life Lessons I Hope You Learn', duration: '5:02' },
  { slug: 'it-was-already-there', title: 'It Was Already There', album: 'The Life Lessons I Hope You Learn', duration: '4:18' },
  { slug: 'always-in-your-corner', title: 'Always in Your Corner', album: 'The Life Lessons I Hope You Learn', duration: '5:47' },
  { slug: 'the-house-we-couldnt-leave', title: "The House We Couldn't Leave", album: 'The Life Lessons I Hope You Learn', duration: '4:39' },
  { slug: 'i-never-knew-any-other-way', title: 'I Never Knew Any Other Way', album: 'The Life Lessons I Hope You Learn', duration: '5:15' },
  { slug: 'leave-a-light-on', title: 'Leave a Light On', album: 'The Life Lessons I Hope You Learn', duration: '4:51' },
  { slug: 'the-empty-chair', title: 'The Empty Chair', album: 'The Life Lessons I Hope You Learn', duration: '6:22' },
  { slug: 'good-things-grow-slow', title: 'Good Things Grow Slow', album: 'The Life Lessons I Hope You Learn', duration: '5:08' },
  { slug: 'maybe-i-was-wrong', title: 'Maybe I Was Wrong', album: 'The Life Lessons I Hope You Learn', duration: '4:44' },
  { slug: 'borrowed-time', title: 'Borrowed Time', album: 'The Life Lessons I Hope You Learn', duration: '5:36' },
  { slug: 'free-men-tell-the-truth', title: 'Free Men Tell the Truth', album: 'The Life Lessons I Hope You Learn', duration: '6:03' },
]

const PRESETS = ['0', '5', '10', '15', '20']

export default function DownloadPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [amount, setAmount] = useState('10')
  const [format, setFormat] = useState<'flac' | 'wav' | 'mp3'>('flac')
  const [submitted, setSubmitted] = useState(false)

  const toggleAll = () => {
    if (selected.size === TRACKS.length) setSelected(new Set())
    else setSelected(new Set(TRACKS.map(t => t.slug)))
  }

  const toggle = (slug: string) => {
    const next = new Set(selected)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    setSelected(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selected.size === 0) return
    const tracks = TRACKS.filter(t => selected.has(t.slug)).map(t => t.title).join(', ')
    const body = `Hi,\n\nI'd like to download the following tracks in ${format.toUpperCase()} format:\n${tracks}\n\nMy suggested contribution: €${amount}\n\nThank you.`
    window.location.href = `mailto:hello@noiraciel.com?subject=Download Request — NoiraCiel&body=${encodeURIComponent(body)}`
    setSubmitted(true)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080810', paddingTop: '8rem', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '4rem' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '1rem' }}>
            Download
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 300, color: 'rgba(242,237,227,0.92)', lineHeight: 1.05, marginBottom: '1.25rem' }}>
            Take the music with you.
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'rgba(200,196,190,0.5)', lineHeight: 1.7, maxWidth: '50ch' }}>
            Pay what you feel is right — or nothing at all. High-quality FLAC, WAV or MP3.
            Your generosity funds the next album.
          </p>
        </div>

        {submitted ? (
          <div style={{ padding: '3rem', border: '1px solid rgba(196,149,58,0.2)', background: 'rgba(196,149,58,0.03)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontStyle: 'italic', color: 'rgba(242,237,227,0.75)', marginBottom: '1rem' }}>
              Thank you.
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(200,196,190,0.45)' }}>
              Your request has been sent. We'll reply with the download link within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Format selector */}
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.4)', marginBottom: '1rem' }}>
                Format
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {(['flac', 'wav', 'mp3'] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFormat(f)}
                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.5rem 1.25rem', border: format === f ? '1px solid rgba(196,149,58,0.7)' : '1px solid rgba(255,255,255,0.1)', color: format === f ? '#C4953A' : 'rgba(200,196,190,0.4)', background: format === f ? 'rgba(196,149,58,0.06)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Track list */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.4)' }}>
                  Select tracks ({selected.size} selected)
                </p>
                <button type="button" onClick={toggleAll}
                  style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {selected.size === TRACKS.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                {TRACKS.map((track, i) => (
                  <label key={track.slug}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', borderBottom: i < TRACKS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', background: selected.has(track.slug) ? 'rgba(196,149,58,0.04)' : 'transparent', transition: 'background 0.15s' }}>
                    <input type="checkbox" checked={selected.has(track.slug)} onChange={() => toggle(track.slug)}
                      style={{ accentColor: '#C4953A', width: '14px', height: '14px', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1rem', color: 'rgba(242,237,227,0.8)', flex: 1 }}>{track.title}</span>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', color: 'rgba(200,196,190,0.3)' }}>{track.duration}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pay what you want */}
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.4)', marginBottom: '1rem' }}>
                Your contribution (€)
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {PRESETS.map(p => (
                  <button key={p} type="button" onClick={() => setAmount(p)}
                    style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', padding: '0.4rem 0.9rem', border: amount === p ? '1px solid rgba(196,149,58,0.7)' : '1px solid rgba(255,255,255,0.1)', color: amount === p ? '#C4953A' : 'rgba(200,196,190,0.4)', background: amount === p ? 'rgba(196,149,58,0.06)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {p === '0' ? 'Free' : `€${p}`}
                  </button>
                ))}
              </div>
              <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Or enter your own amount"
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: 'rgba(242,237,227,0.8)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.65rem 1rem', width: '100%', outline: 'none' }} />
            </div>

            {/* Submit */}
            <button type="submit" disabled={selected.size === 0}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 2rem', background: selected.size > 0 ? '#C4953A' : 'rgba(196,149,58,0.15)', color: selected.size > 0 ? '#080810' : 'rgba(196,149,58,0.3)', border: 'none', cursor: selected.size > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s', width: '100%' }}>
              {selected.size === 0 ? 'Select at least one track' : `Request Download${amount && parseInt(amount) > 0 ? ` — €${amount} contribution` : ' — Free'}`}
            </button>

            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(200,196,190,0.3)', marginTop: '1rem', textAlign: 'center', lineHeight: 1.6 }}>
              We&apos;ll send you a personal download link within 24 hours.<br />
              No account required.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
