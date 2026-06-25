'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SignGlyph from '@/app/speaker/SignGlyph'
import { loadProfile, clearProfile } from '@/lib/onboardingStorage'
import type { Depth, SpeakerMode } from '@/types/noiracielOnboarding'

interface PathView {
  pathId: string
  pathName: string
  description: string
  emotionalWorld: string
  albumTitle: string
  albumHref: string
  albumWorld: string
  songTitle: string | null
  songHref: string | null
  bookTitle: string | null
  bookHref: string
  roomId: string
  roomName: string
  speakerMode: SpeakerMode
  glyphAffinity: string[]
  physicsAffinity: string[]
  fieldConnection: string
  dailyGlyphConnection: string
  waveConnection: string
  reflectionQuestion: string
  firstAction: string
}

export default function PathResultView({ view }: { view: PathView }) {
  // Personal overrides saved at onboarding (depth highlights the primary CTA;
  // speaker mode may differ from the path default).
  const [depth, setDepth] = useState<Depth | null>(null)
  const [speakerMode, setSpeakerMode] = useState<SpeakerMode>(view.speakerMode)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    const p = loadProfile()
    if (p && p.pathId === view.pathId) {
      setDepth(p.depth)
      setSpeakerMode(p.speakerMode)
      setHasProfile(true)
    }
  }, [view.pathId])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-8%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full blur-[130px] opacity-[0.18] bg-[radial-gradient(circle,rgb(var(--t-accent-rgb)),transparent_70%)]" />
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-28 pb-20">
        {/* Header */}
        <header className="text-center animate-fade-up">
          <p className="font-body text-[10px] tracking-[0.45em] uppercase text-noir-gold/55 mb-5">
            Your NoiraCiel Path
          </p>
          <div className="flex justify-center gap-3 mb-5 text-t-accent">
            {view.glyphAffinity.slice(0, 3).map((s) => (
              <SignGlyph key={s} sign={s} size={34} />
            ))}
          </div>
          <h1 className="font-heading italic text-4xl sm:text-5xl text-noir-ivory/90 leading-tight">
            {view.pathName}
          </h1>
          <p className="font-body text-sm text-noir-silver/60 mt-5 max-w-xl mx-auto leading-relaxed">
            {view.description}
          </p>
        </header>

        {/* Fields */}
        <div className="mt-12 space-y-px">
          <Field label="Emotional world" value={view.emotionalWorld} />
          <Field
            label="Recommended album"
            value={view.albumTitle}
            sub={view.albumWorld}
            href={view.albumHref}
          />
          {view.songTitle && (
            <Field label="First song" value={view.songTitle} href={view.songHref ?? undefined} />
          )}
          {view.bookTitle && (
            <Field label="First chapter" value={view.bookTitle} href={view.bookHref} />
          )}
          <Field label="Recommended room" value={view.roomName} href={`/rooms/${view.roomId}`} />
          <Field label="Speaker mode" value={speakerMode} />
          <Field label="Glyph affinity" value={view.glyphAffinity.join(' · ')} />
          <Field label="Field affinity" value={view.physicsAffinity.join(' · ')} href="/field" />
          <Field label="The NoiraCiel Field" value={view.fieldConnection} />
          <Field label="Today’s Daily Glyph" value={view.dailyGlyphConnection} />
          <Field label="Current 13-day wave" value={view.waveConnection} />
        </div>

        {/* Reflection + action */}
        <div className="mt-10 border border-noir-silver/10 bg-noir-void/60 backdrop-blur-sm px-6 py-6">
          <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 mb-3">
            First reflection
          </p>
          <p className="font-heading italic text-lg text-noir-ivory/80 leading-relaxed">
            {view.reflectionQuestion}
          </p>
          <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 mt-6 mb-2">
            First action
          </p>
          <p className="font-body text-sm text-noir-silver/60 leading-relaxed">{view.firstAction}</p>
        </div>

        {/* CTAs */}
        <div className="mt-10 grid sm:grid-cols-3 gap-3">
          <Cta href={`/rooms/${view.roomId}`} primary={depth === 'album' || depth === 'song' || depth === 'chapter'}>
            Enter your room
          </Cta>
          <Cta href="/speaker" primary={depth === 'path' || depth == null}>
            Speak with NoiraCiel
          </Cta>
          <Cta href="/speaker" primary={depth === 'journey'}>
            Start your 13-day journey
          </Cta>
        </div>

        {/* Quick links to the chosen depth + retake */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {view.songHref && (
            <Link href={view.songHref} className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/35 hover:text-noir-gold/60 transition-colors">
              Listen to “{view.songTitle}”
            </Link>
          )}
          <Link href={view.albumHref} className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/35 hover:text-noir-gold/60 transition-colors">
            Open the album
          </Link>
          <button
            onClick={() => { clearProfile(); window.location.href = '/enter' }}
            className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/35 hover:text-noir-gold/60 transition-colors"
          >
            Retake onboarding
          </button>
        </div>

        {!hasProfile && (
          <p className="text-center font-body text-[10px] text-noir-silver/30 mt-8">
            This is the {view.pathName} path.{' '}
            <Link href="/enter" className="text-noir-gold/60 hover:text-noir-gold">Take the onboarding</Link>{' '}
            to make it yours.
          </p>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-5 px-1 py-3.5 border-b border-noir-silver/8">
      <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/35 sm:w-44 flex-shrink-0">
        {label}
      </p>
      <div>
        <p className={`font-heading italic text-[15px] ${href ? 'text-noir-ivory/85 group-hover:text-noir-gold transition-colors' : 'text-noir-ivory/75'}`}>
          {value}
        </p>
        {sub && <p className="font-body text-[11px] text-noir-silver/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link href={href} className="group block">{body}</Link> : body
}

function Cta({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`text-center px-5 py-3.5 font-body text-[10px] tracking-[0.25em] uppercase transition-all border ${
        primary
          ? 'border-noir-gold/55 text-noir-gold bg-noir-gold/5 hover:bg-noir-gold/10'
          : 'border-noir-silver/15 text-noir-silver/55 hover:border-noir-gold/40 hover:text-noir-gold/80'
      }`}
    >
      {children}
    </Link>
  )
}
