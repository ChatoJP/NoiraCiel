/**
 * noiracielPaths.ts — the six NoiraCiel Paths and the scoring that selects one.
 *
 * CLIENT-SAFE: this module deliberately has no server-only dependencies (no fs,
 * no music catalogue) so the onboarding flow can score answers in the browser.
 * Content binding (real albums/songs/books) and Speaker personalization live in
 * the server-only companion src/lib/noiracielPathEngine.ts.
 */

import {
  DIMENSIONS,
  type DimensionScores,
  type NoiraCielPath,
} from '@/types/noiracielOnboarding'

export const PATHS: NoiraCielPath[] = [
  {
    id: 'atlantic-witness',
    name: 'The Atlantic Witness',
    description:
      'You listen from the shoreline of yourself — patient, attentive to what the tide leaves behind. You do not need noise to feel; you need room.',
    emotionalWorld: 'Silence, depth, restraint, memory, oceanic transformation.',
    dimensions: { silence: 3, ocean: 3, grief: 2, intimacy: 2, beauty: 1, transformation: 1, intellect: 1 },
    albumIds: ['still-we-sail', 'salt-cathedral', 'the-memory-atlas'],
    roomId: 'atlantic-noir',
    roomName: 'Atlantic Noir Room',
    speakerMode: 'Nocturnal Librarian',
    glyphAffinity: ['Imix', 'Akbal', 'Muluc', 'Cib'],
    dailyRitual: 'Listen once, in the dark, without doing anything else.',
    waveStyle: 'enters the wave through reflection rather than force',
  },
  {
    id: 'velvet-runner',
    name: 'The Velvet Runner',
    description:
      'You move through the night like it owes you something beautiful. Desire, elegance, motion — you find yourself in the space between two streetlights.',
    emotionalWorld: 'City, movement, desire, elegance, nocturnal momentum.',
    dimensions: { movement: 3, beauty: 3, intimacy: 2, intensity: 1, community: 1, ritual: 1 },
    albumIds: ['the-velvet-machine', 'neon-saints'],
    roomId: 'the-velvet-room',
    roomName: 'The Velvet Room',
    speakerMode: 'Private Curator',
    glyphAffinity: ['Lamat', 'Chicchan', 'Ahau'],
    dailyRitual: 'Walk somewhere with one track in your ears and let the city score it.',
    waveStyle: 'rides the wave forward, trusting momentum over caution',
  },
  {
    id: 'storm-builder',
    name: 'The Storm Builder',
    description:
      'You do not flinch from weather. Pressure makes you, it does not break you. You came for the thing that burns clean.',
    emotionalWorld: 'Courage, pressure, transformation, sacred intensity.',
    dimensions: { courage: 3, intensity: 3, transformation: 3, fire: 2, ritual: 1 },
    albumIds: ['whats-youre-made-of', 'blind-angel', 'metal'],
    roomId: 'ghost-performance',
    roomName: 'Ghost Performance Room',
    speakerMode: 'Ritual Narrator',
    glyphAffinity: ['Cauac', 'Ix', 'Chicchan'],
    dailyRitual: 'Play the heaviest thing here once, all the way through, and let it move something.',
    waveStyle: 'treats the wave as a forge — pressure shaping form across the thirteen days',
  },
  {
    id: 'mirror-reader',
    name: 'The Mirror Reader',
    description:
      'You read everything, including yourself. Truth over comfort, language over noise. You came to understand, not to be entertained.',
    emotionalWorld: 'Introspection, truth, language, restrained analysis.',
    dimensions: { intellect: 3, shadow: 2, silence: 2, beauty: 1, intimacy: 1, transformation: 1 },
    albumIds: ['main', 'glass-animal', 'the-memory-atlas'],
    roomId: 'after-midnight',
    roomName: 'After Midnight Room',
    speakerMode: 'Poetic Analyst',
    glyphAffinity: ['Etznab', 'Men', 'Cib'],
    dailyRitual: 'Read one chapter slowly, then sit with the last line.',
    waveStyle: 'studies the wave — watching the arc as a story it can learn from',
  },
  {
    id: 'fire-dancer',
    name: 'The Fire Dancer',
    description:
      'Your body knows before your mind agrees. Rhythm is your language and movement is your prayer. You came to be set loose.',
    emotionalWorld: 'Body, rhythm, liberation, communal heat.',
    dimensions: { fire: 3, movement: 3, community: 2, ritual: 2, intensity: 1 },
    albumIds: ['world-musics', 'funk-my-way-in', 'reggae-sessions'],
    roomId: 'world-sounds',
    roomName: 'World Sounds Room',
    speakerMode: 'Music Guide',
    glyphAffinity: ['Chuen', 'Caban', 'Manik'],
    dailyRitual: 'Move to one track without watching yourself.',
    waveStyle: 'dances the wave — following its pulse rather than its plan',
  },
  {
    id: 'broken-star',
    name: 'The Broken Star',
    description:
      'You carry beauty that also aches, and you do not apologise for either. You came to be met, not fixed.',
    emotionalWorld: 'Grief, beauty, healing, emotional depth.',
    dimensions: { grief: 3, beauty: 3, intimacy: 2, transformation: 2, ocean: 1 },
    albumIds: ['jazz-sessions', 'black-sun-gospel', 'glass-animal'],
    roomId: 'jazz-night',
    roomName: 'Jazz Night Room',
    speakerMode: 'Calm Companion',
    glyphAffinity: ['Cimi', 'Muluc', 'Oc', 'Cib'],
    dailyRitual: 'Let one slow song play to the end without skipping.',
    waveStyle: 'lets the wave hold it — moving through grief toward its proper place',
  },
]

// First reflection per path (a single open question to sit with).
export const PATH_REFLECTIONS: Record<string, string> = {
  'atlantic-witness': 'What part of you is asking for silence because it is tired of performing strength?',
  'velvet-runner': 'What are you chasing tonight — and what would it feel like to let it catch you instead?',
  'storm-builder': 'What pressure are you treating as an enemy when it is actually shaping you?',
  'mirror-reader': 'What is the one true sentence you keep editing out of your own story?',
  'fire-dancer': 'Where is your body asking to lead, while your mind keeps insisting on the map?',
  'broken-star': 'What grief have you not yet let arrive with dignity?',
}

export function getPathById(id: string): NoiraCielPath | undefined {
  return PATHS.find((p) => p.id === id)
}

/** Resonance between a dimension vector and a path (weighted dot product). */
function resonance(scores: DimensionScores, path: NoiraCielPath): number {
  let total = 0
  for (const d of DIMENSIONS) {
    total += (scores[d] ?? 0) * (path.dimensions[d] ?? 0)
  }
  return total
}

/** Choose the strongest-resonating path. Falls back to the first path. */
export function scoreToPath(scores: DimensionScores): NoiraCielPath {
  let best = PATHS[0]
  let bestScore = -1
  for (const p of PATHS) {
    const r = resonance(scores, p)
    if (r > bestScore) {
      best = p
      bestScore = r
    }
  }
  return best
}
