/**
 * onboardingScoring.ts — turn a set of answers into a scored profile.
 *
 * Pure and deterministic. Sums dimension weights across answered options, and
 * collects the symbol affinity, Speaker mode, Mayan-layer and depth choices.
 */

import { ONBOARDING_QUESTIONS } from '@/data/onboardingQuestions'
import {
  DIMENSIONS,
  type DimensionScores,
  type OnboardingAnswers,
  type ScoredOnboarding,
} from '@/types/noiracielOnboarding'

function emptyScores(): DimensionScores {
  return Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as DimensionScores
}

export function scoreAnswers(answers: OnboardingAnswers): ScoredOnboarding {
  const dimensions = emptyScores()
  const signAffinity: string[] = []
  const physicsAffinity: string[] = []
  let speakerMode: ScoredOnboarding['speakerMode']
  let mayanLayer: ScoredOnboarding['mayanLayer'] = 'full'
  let depth: ScoredOnboarding['depth'] = 'path'

  for (const q of ONBOARDING_QUESTIONS) {
    const chosenId = answers[q.id]
    if (!chosenId) continue
    const opt = q.options.find((o) => o.id === chosenId)
    if (!opt) continue

    if (opt.dimensions) {
      for (const [dim, w] of Object.entries(opt.dimensions)) {
        dimensions[dim as keyof DimensionScores] += w ?? 0
      }
    }
    if (opt.signAffinity) signAffinity.push(opt.signAffinity)
    if (opt.physicsAffinity) physicsAffinity.push(opt.physicsAffinity)
    if (opt.speakerMode) speakerMode = opt.speakerMode
    if (opt.mayanLayer) mayanLayer = opt.mayanLayer
    if (opt.depth) depth = opt.depth
  }

  return { dimensions, signAffinity, physicsAffinity, speakerMode, mayanLayer, depth }
}

/** Dimensions sorted strongest-first, with zero scores dropped. */
export function topDimensions(scores: DimensionScores, limit = 4): string[] {
  return Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k)
}
