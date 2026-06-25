'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ONBOARDING_QUESTIONS } from '@/data/onboardingQuestions'
import { scoreAnswers } from '@/lib/onboardingScoring'
import { scoreToPath } from '@/lib/noiracielPaths'
import { saveProfile } from '@/lib/onboardingStorage'
import type { OnboardingAnswers, UserProfile } from '@/types/noiracielOnboarding'

// step -1 = intro; 0..n-1 = questions
export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(-1)
  const [answers, setAnswers] = useState<OnboardingAnswers>({})
  const [leaving, setLeaving] = useState(false)

  const total = ONBOARDING_QUESTIONS.length

  const finish = useCallback(
    (finalAnswers: OnboardingAnswers) => {
      const scored = scoreAnswers(finalAnswers)
      const path = scoreToPath(scored.dimensions)
      const profile: UserProfile = {
        version: 1,
        createdAt: new Date().toISOString(),
        answers: finalAnswers,
        pathId: path.id,
        pathName: path.name,
        speakerMode: scored.speakerMode ?? path.speakerMode,
        glyphAffinity: scored.signAffinity.length ? scored.signAffinity : path.glyphAffinity,
        physicsAffinity: scored.physicsAffinity.length ? scored.physicsAffinity : path.physicsAffinity,
        mayanLayer: scored.mayanLayer,
        depth: scored.depth,
        dimensions: scored.dimensions,
      }
      saveProfile(profile)
      router.push(`/path/${path.id}`)
    },
    [router],
  )

  const choose = useCallback(
    (optionId: string) => {
      const q = ONBOARDING_QUESTIONS[step]
      const next = { ...answers, [q.id]: optionId }
      setAnswers(next)
      // brief transition out, then advance
      setLeaving(true)
      setTimeout(() => {
        if (step + 1 >= total) {
          finish(next)
        } else {
          setStep(step + 1)
          setLeaving(false)
        }
      }, 260)
    },
    [answers, step, total, finish],
  )

  const back = useCallback(() => {
    if (step <= 0) { setStep(-1); return }
    setStep(step - 1)
  }, [step])

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <Screen>
        <div className="text-center max-w-xl mx-auto animate-fade-up">
          <p className="font-body text-[10px] tracking-[0.45em] uppercase text-noir-gold/55 mb-6">
            Enter NoiraCiel
          </p>
          <h1 className="font-heading italic text-3xl sm:text-4xl text-noir-ivory/90 leading-tight">
            Before NoiraCiel speaks to you, it must know how you listen.
          </h1>
          <p className="font-body text-sm text-noir-silver/55 mt-6 leading-relaxed">
            Answer a few questions. NoiraCiel will open the room that belongs to your current state.
          </p>
          <button
            onClick={() => setStep(0)}
            className="mt-10 px-8 py-3 border border-noir-gold/35 text-noir-gold/80 font-body text-[11px] tracking-[0.3em] uppercase hover:border-noir-gold/70 hover:text-noir-gold transition-all"
          >
            Begin
          </button>
          <p className="font-body text-[9px] tracking-[0.2em] uppercase text-noir-silver/20 mt-6">
            Nine questions · about a minute · no account needed
          </p>
        </div>
      </Screen>
    )
  }

  // ── A question ──────────────────────────────────────────────────────────────
  const q = ONBOARDING_QUESTIONS[step]
  return (
    <Screen>
      {/* progress */}
      <div className="absolute top-0 left-0 right-0 h-px bg-noir-silver/8">
        <div
          className="h-full bg-noir-gold/50 transition-all duration-500"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      <div className={`w-full max-w-2xl mx-auto transition-all duration-300 ${leaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        <p className="font-body text-[9px] tracking-[0.35em] uppercase text-noir-gold/40 text-center mb-5">
          {step + 1} / {total}
        </p>
        <h2 className="font-heading italic text-2xl sm:text-3xl text-noir-ivory/88 text-center leading-snug">
          {q.prompt}
        </h2>
        {q.subtitle && (
          <p className="font-body text-[12px] text-noir-silver/45 text-center mt-3">{q.subtitle}</p>
        )}

        <div className={`mt-9 grid gap-2.5 ${q.kind === 'symbol' ? 'grid-cols-3 sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {q.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => choose(opt.id)}
              className={`group border border-noir-silver/12 bg-noir-void/50 hover:border-noir-gold/45 hover:bg-noir-gold/5 transition-all text-left ${
                q.kind === 'symbol' ? 'px-3 py-5 text-center' : 'px-5 py-4'
              }`}
            >
              <span
                className={`font-heading italic text-noir-ivory/75 group-hover:text-noir-gold transition-colors ${
                  q.kind === 'symbol' ? 'text-base' : 'text-[15px]'
                }`}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={back}
            className="font-body text-[10px] tracking-[0.25em] uppercase text-noir-silver/30 hover:text-noir-silver/60 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 sm:px-8 py-24 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[70vw] h-[55vh] rounded-full blur-[130px] opacity-[0.16] bg-[radial-gradient(circle,rgb(var(--t-accent-rgb)),transparent_70%)]" />
      </div>
      {children}
    </div>
  )
}
