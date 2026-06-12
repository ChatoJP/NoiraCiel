'use client'

import { useState } from 'react'

const contactTypes = [
  { value: 'booking', label: 'Booking' },
  { value: 'press', label: 'Press & Media' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'other', label: 'Other' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', type: 'booking', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', type: 'booking', subject: '', message: '' })
      } else {
        throw new Error('Failed')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again or email directly.')
    }
  }

  return (
    <section id="contact" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Left */}
          <div>
            <p className="font-body text-xs tracking-[0.35em] text-noir-gold/60 uppercase mb-4">Reach Out</p>
            <h2 className="font-heading text-5xl md:text-6xl text-noir-ivory font-light tracking-wide mb-8">
              Contact
            </h2>
            <p className="font-body text-sm text-noir-silver/60 leading-relaxed mb-12">
              For booking, press, and creative collaborations. We believe in honest communication — no intermediaries, no templates.
            </p>

            <div className="space-y-8">
              {contactTypes.slice(0, 3).map((type) => (
                <div key={type.value} className="flex items-start gap-4">
                  <div className="w-px h-full bg-noir-gold/20 self-stretch mt-1" />
                  <div>
                    <p className="font-heading text-base text-noir-ivory mb-1">{type.label}</p>
                    <p className="font-body text-xs text-noir-silver/50">
                      {type.value === 'booking' && 'Live performances, festivals, private events, and residencies.'}
                      {type.value === 'press' && 'Interviews, features, editorial coverage, and licensing enquiries.'}
                      {type.value === 'collaboration' && 'Creative partnerships, sync licensing, and artistic projects.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div>
            {status === 'success' ? (
              <div className="border border-noir-silver/10 p-12 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full border border-noir-gold/40 flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-noir-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-heading italic text-xl text-noir-ivory/80 mb-3">Message received.</p>
                <p className="font-body text-sm text-noir-silver/50">We will be in touch from the dark side of the sea.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-8 font-body text-xs tracking-[0.2em] uppercase text-noir-gold/60 hover:text-noir-gold border-b border-noir-gold/20 pb-0.5 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type selector */}
                <div className="flex gap-2 flex-wrap">
                  {contactTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => update('type', type.value)}
                      className={`px-4 py-2 font-body text-xs tracking-[0.15em] uppercase transition-all border ${
                        form.type === type.value
                          ? 'border-noir-gold/60 bg-noir-gold/10 text-noir-gold'
                          : 'border-noir-silver/15 text-noir-silver/50 hover:border-noir-silver/30'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <input
                      type="text"
                      placeholder="Your name"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className="w-full px-4 py-3 bg-noir-deep/60 border border-noir-silver/15 text-noir-ivory font-body text-sm placeholder-noir-silver/30 focus:outline-none focus:border-noir-gold/40 transition-colors"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="w-full px-4 py-3 bg-noir-deep/60 border border-noir-silver/15 text-noir-ivory font-body text-sm placeholder-noir-silver/30 focus:outline-none focus:border-noir-gold/40 transition-colors"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  className="w-full px-4 py-3 bg-noir-deep/60 border border-noir-silver/15 text-noir-ivory font-body text-sm placeholder-noir-silver/30 focus:outline-none focus:border-noir-gold/40 transition-colors"
                />

                <textarea
                  placeholder="Your message..."
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  className="w-full px-4 py-3 bg-noir-deep/60 border border-noir-silver/15 text-noir-ivory font-body text-sm placeholder-noir-silver/30 focus:outline-none focus:border-noir-gold/40 transition-colors resize-none"
                />

                {status === 'error' && (
                  <p className="font-body text-xs text-red-400/70">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-4 bg-noir-gold/10 border border-noir-gold/50 text-noir-gold font-body text-xs tracking-[0.2em] uppercase hover:bg-noir-gold hover:text-noir-void transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
