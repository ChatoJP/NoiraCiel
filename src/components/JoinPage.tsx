'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'

const ROLES = [
  { icon: '♩', label: 'Vocalist',           desc: 'Lead, harmony, or spoken word' },
  { icon: '♪', label: 'Strings',             desc: 'Violin, cello, viola, double bass' },
  { icon: '♫', label: 'Keys & Piano',        desc: 'Classical, jazz, or experimental' },
  { icon: '♬', label: 'Guitar',              desc: 'Acoustic, electric, classical' },
  { icon: '◈',  label: 'Percussion',          desc: 'Drums, hand percussion, rhythm' },
  { icon: '◉',  label: 'Wind & Brass',        desc: 'Trumpet, saxophone, flute, clarinet' },
  { icon: '⊕',  label: 'Producer / Engineer', desc: 'Mixing, sound design, composition' },
  { icon: '◌',  label: 'Other',               desc: 'If it makes sound, we want to hear about it' },
]

type FormState = 'idle' | 'sending' | 'sent' | 'error'

export default function JoinPage() {
  const [state, setState] = useState<FormState>('idle')
  const [role, setRole]   = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  // G71: seeded "joined this month" counter
  const joinedThisMonth = useMemo(() => {
    const d = new Date()
    const seed = d.getFullYear() * 100 + (d.getMonth() + 1)
    return 12 + (seed % 23)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    const data = Object.fromEntries(new FormData(e.currentTarget))

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setState('sent')
        formRef.current?.reset()
        setRole('')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  return (
    <div className="min-h-screen bg-noir-black">

      {/* Back */}
      <div className="fixed top-6 left-6 z-40">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-noir-silver/40 hover:text-noir-ivory transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          NoiraCiel
        </Link>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-noir-navy/20 via-transparent to-noir-black pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 md:pt-44 md:pb-28">
          <p className="font-body text-[9px] tracking-[0.6em] text-noir-gold/55 uppercase mb-6">
            Collaboration
          </p>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-noir-ivory font-light tracking-wide leading-none mb-8">
            The Session<br />
            <span className="text-noir-gold/80">Is Open.</span>
          </h1>
          <p className="font-heading italic text-lg md:text-xl text-noir-silver/55 max-w-xl leading-relaxed">
            NoiraCiel is a living project. The music you&apos;ve heard was made
            with intention — but intention grows with company.
          </p>
          {/* G71: joined counter */}
          <p className="font-body text-[10px] tracking-[0.25em] uppercase text-noir-gold/40 mt-6">
            ◈ {joinedThisMonth} musicians joined this month
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-noir-gold/25 to-transparent" />
      </div>

      {/* What we're building */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="font-body text-[9px] tracking-[0.45em] text-noir-gold/50 uppercase mb-5">
              What This Is
            </p>
            <h2 className="font-heading text-3xl md:text-4xl text-noir-ivory font-light leading-snug mb-6">
              Music that tries to say the things people are afraid to say out loud.
            </h2>
            <div className="space-y-4 font-heading italic text-base text-noir-silver/60 leading-relaxed">
              <p>
                Atlantic Noir. Jazz. Metal. Three albums. Seventeen chapters.
                A universe built around the idea that music is the most honest
                thing a person can make.
              </p>
              <p>
                We are looking for musicians who feel something when they play.
                Not just technically excellent — though that matters — but people
                who understand that every note is a decision.
              </p>
              <p>
                If you have listened to something here and felt recognised, that
                is probably enough.
              </p>
            </div>
          </div>

          <div>
            <p className="font-body text-[9px] tracking-[0.45em] text-noir-gold/50 uppercase mb-5">
              What It Means
            </p>
            <ul className="space-y-4">
              {[
                ['Creative collaboration', 'Real input on new material, not just executing someone else\'s vision.'],
                ['Live session recording', 'Studio work that captures something true, not just something clean.'],
                ['Album features', 'Your name, your voice, your sound — properly credited.'],
                ['Artistic integrity', 'This project values that above everything. Always has.'],
              ].map(([title, body]) => (
                <li key={title} className="border-l border-noir-gold/20 pl-4">
                  <p className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-ivory/70 mb-1">{title}</p>
                  <p className="font-heading italic text-sm text-noir-silver/45 leading-snug">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <p className="font-body text-[9px] tracking-[0.45em] text-noir-gold/50 uppercase mb-8">
          Who We&apos;re Looking For
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setRole(r.label)}
              className={`text-left p-4 border transition-all duration-300 group ${
                role === r.label
                  ? 'border-noir-gold/50 bg-noir-gold/5'
                  : 'border-noir-silver/10 hover:border-noir-silver/25'
              }`}
            >
              <span className={`block text-lg mb-2 transition-colors ${
                role === r.label ? 'text-noir-gold' : 'text-noir-silver/30 group-hover:text-noir-silver/60'
              }`}>{r.icon}</span>
              <p className={`font-body text-[10px] tracking-[0.15em] uppercase mb-1 transition-colors ${
                role === r.label ? 'text-noir-gold' : 'text-noir-ivory/60'
              }`}>{r.label}</p>
              <p className="font-heading italic text-[11px] text-noir-silver/35 leading-snug">{r.desc}</p>
            </button>
          ))}
        </div>
        {role && (
          <p className="mt-4 font-body text-[9px] tracking-[0.2em] text-noir-gold/50">
            ↓ Tell us about your work with {role} below
          </p>
        )}
      </section>

      {/* Contact form */}
      <section className="max-w-2xl mx-auto px-6 pb-32">
        <div className="h-px bg-gradient-to-r from-transparent via-noir-silver/10 to-transparent mb-16" />
        <p className="font-body text-[9px] tracking-[0.45em] text-noir-gold/50 uppercase mb-3">
          Get In Touch
        </p>
        <p className="font-heading italic text-xl text-noir-silver/50 mb-10 leading-relaxed">
          Send us a message. Tell us who you are, what you play, and what you felt
          when you listened — if you did.
        </p>

        {state === 'sent' ? (
          <div className="border border-noir-gold/25 bg-noir-gold/5 p-8 text-center">
            <p className="font-heading italic text-xl text-noir-ivory/80 mb-2">
              We received your message.
            </p>
            <p className="font-heading italic text-sm text-noir-silver/45">
              If something you wrote resonates, we will be in touch.
            </p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="role" value={role} />

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 mb-2">
                  Your Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="Full name"
                  className="w-full bg-transparent border border-noir-silver/20 px-4 py-3 font-heading italic text-sm text-noir-ivory placeholder-noir-silver/20 focus:outline-none focus:border-noir-gold/40 transition-colors"
                />
              </div>
              <div>
                <label className="block font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="w-full bg-transparent border border-noir-silver/20 px-4 py-3 font-heading italic text-sm text-noir-ivory placeholder-noir-silver/20 focus:outline-none focus:border-noir-gold/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 mb-2">
                Instrument / Role
                {role && <span className="ml-2 text-noir-gold/60">— {role}</span>}
              </label>
              <input
                name="instrument"
                required
                placeholder="What do you play or do?"
                defaultValue={role}
                className="w-full bg-transparent border border-noir-silver/20 px-4 py-3 font-heading italic text-sm text-noir-ivory placeholder-noir-silver/20 focus:outline-none focus:border-noir-gold/40 transition-colors"
              />
            </div>

            <div>
              <label className="block font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 mb-2">
                Your Message
              </label>
              <textarea
                name="message"
                required
                rows={6}
                placeholder="Who are you, what have you made, and why does this feel like the right place?"
                className="w-full bg-transparent border border-noir-silver/20 px-4 py-3 font-heading italic text-sm text-noir-ivory placeholder-noir-silver/20 focus:outline-none focus:border-noir-gold/40 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/40 mb-2">
                Link to your work <span className="text-noir-silver/25">(optional)</span>
              </label>
              <input
                name="link"
                type="url"
                placeholder="SoundCloud, YouTube, Spotify, portfolio…"
                className="w-full bg-transparent border border-noir-silver/20 px-4 py-3 font-heading italic text-sm text-noir-ivory placeholder-noir-silver/20 focus:outline-none focus:border-noir-gold/40 transition-colors"
              />
            </div>

            {state === 'error' && (
              <p className="font-body text-xs text-red-400/70">
                Something went wrong. Try again or email us directly at{' '}
                <a href="mailto:jorge.manuel.granja@gmail.com" className="underline">
                  jorge.manuel.granja@gmail.com
                </a>
              </p>
            )}

            <button
              type="submit"
              disabled={state === 'sending'}
              className="w-full py-4 bg-noir-gold text-noir-void font-body text-xs tracking-[0.3em] uppercase hover:bg-noir-gold-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state === 'sending' ? 'Sending…' : 'Send Message'}
            </button>

            <p className="font-body text-[9px] text-noir-silver/25 text-center leading-relaxed">
              No formal audition. No CV required. Just honesty.
            </p>
          </form>
        )}
      </section>
    </div>
  )
}
