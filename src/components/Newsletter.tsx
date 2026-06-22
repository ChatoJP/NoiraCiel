'use client'

import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    // TODO: Integrate with Mailchimp, Resend, ConvertKit, etc.
    await new Promise((r) => setTimeout(r, 1200))
    setStatus('success')
    setEmail('')
  }

  return (
    <section id="newsletter" className="py-32 px-6 relative overflow-hidden">
      {/* Atmospheric background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(13,27,42,0.8) 0%, transparent 70%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-noir-navy/10 to-transparent pointer-events-none" />

      <div className="max-w-2xl mx-auto text-center relative">
        {/* Decorative element */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="w-20 h-px bg-gradient-to-r from-transparent to-noir-gold/50" />
          <span className="text-noir-gold/50 text-lg">~</span>
          <div className="w-20 h-px bg-gradient-to-l from-transparent to-noir-gold/50" />
        </div>

        <p className="font-body text-xs tracking-[0.35em] text-noir-gold/70 uppercase mb-6">Stay Close</p>
        <h2 className="font-heading text-4xl md:text-5xl text-noir-ivory font-light tracking-wide leading-tight mb-6">
          Receive letters<br />
          <em className="text-gradient-gold not-italic">from the dark sea.</em>
        </h2>
        <p className="font-body text-sm text-noir-silver/65 mb-12 leading-relaxed max-w-md mx-auto">
          New music, visuals, tour dates, and words from the edge of the Atlantic. No noise. Only what matters.
        </p>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 rounded-full border border-noir-gold/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-noir-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-heading italic text-xl text-noir-ivory/80">You are now in the water.</p>
            <p className="font-body text-sm text-noir-silver/50">Check your inbox for a confirmation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-5 py-3.5 bg-noir-deep/60 border border-noir-silver/20 text-noir-ivory font-body text-sm placeholder-noir-silver/30 focus:outline-none focus:border-noir-gold/50 focus:shadow-[0_0_0_1px_rgba(196,149,58,0.15)] transition-all"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-3.5 bg-noir-gold/10 border border-noir-gold/50 text-noir-gold font-body text-xs tracking-[0.2em] uppercase hover:bg-noir-gold hover:text-noir-void hover:shadow-[0_0_20px_rgba(196,149,58,0.15)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
              ) : 'Subscribe'}
            </button>
          </form>
        )}

        <p className="font-body text-[10px] text-noir-silver/35 mt-6 tracking-wide">
          No spam. Unsubscribe at any time.
        </p>
      </div>
    </section>
  )
}
