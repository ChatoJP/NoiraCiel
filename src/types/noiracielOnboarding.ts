/**
 * noiracielOnboarding.ts — types for the NoiraCiel onboarding ("/enter").
 *
 * The onboarding is an emotional placement, not a quiz: a few symbolic questions
 * map the listener onto a NoiraCiel Path, a Speaker mode, a glyph affinity, and a
 * relationship to today's glyph and the current 13-day wave.
 */

// The emotional dimensions answers are scored against.
export type Dimension =
  | 'silence'
  | 'fire'
  | 'ocean'
  | 'movement'
  | 'grief'
  | 'courage'
  | 'beauty'
  | 'shadow'
  | 'transformation'
  | 'intimacy'
  | 'intensity'
  | 'ritual'
  | 'intellect'
  | 'community'

export const DIMENSIONS: Dimension[] = [
  'silence', 'fire', 'ocean', 'movement', 'grief', 'courage', 'beauty',
  'shadow', 'transformation', 'intimacy', 'intensity', 'ritual', 'intellect', 'community',
]

export type DimensionScores = Record<Dimension, number>

// The Speaker's voice register, selectable in onboarding (or inherited from path).
export type SpeakerMode =
  | 'Private Curator'
  | 'Nocturnal Librarian'
  | 'Calm Companion'
  | 'Ritual Narrator'
  | 'Music Guide'
  | 'Poetic Analyst'
  | 'The Physicist-Poet'

export type MayanLayer = 'full' | 'light' | 'off'
export type Depth = 'song' | 'album' | 'chapter' | 'path' | 'journey'

export type QuestionKind = 'dimension' | 'symbol' | 'speaker' | 'mayan' | 'depth' | 'physics'

export interface OnboardingOption {
  id: string
  label: string
  /** Dimension weights this option contributes. */
  dimensions?: Partial<Record<Dimension, number>>
  /** A Tzolk'in sign name this option leans toward (for glyph affinity). */
  signAffinity?: string
  /** A physics concept id this option leans toward (for Field affinity). */
  physicsAffinity?: string
  /** Set when this option chooses a Speaker mode / Mayan layer / depth. */
  speakerMode?: SpeakerMode
  mayanLayer?: MayanLayer
  depth?: Depth
}

export interface OnboardingQuestion {
  id: string
  prompt: string
  subtitle?: string
  kind: QuestionKind
  options: OnboardingOption[]
}

export type OnboardingAnswers = Record<string, string> // questionId → optionId

/** A NoiraCiel Path — the door the listener is placed inside. */
export interface NoiraCielPath {
  id: string
  name: string
  description: string
  emotionalWorld: string
  /** Dimension profile this path resonates with (for scoring). */
  dimensions: Partial<Record<Dimension, number>>
  /** Real album ids (see src/data/noiracielKnowledge), most-representative first. */
  albumIds: string[]
  roomId: string
  roomName: string
  speakerMode: SpeakerMode
  /** Tzolk'in sign names this path is drawn to. */
  glyphAffinity: string[]
  /** Physics concept ids this path resonates with (The NoiraCiel Field). */
  physicsAffinity: string[]
  dailyRitual: string
  /** How this path tends to move through a 13-day wave. */
  waveStyle: string
}

/** The result of scoring a set of answers (before binding to live content). */
export interface ScoredOnboarding {
  dimensions: DimensionScores
  signAffinity: string[]
  physicsAffinity: string[]
  speakerMode?: SpeakerMode
  mayanLayer: MayanLayer
  depth: Depth
}

/** The profile persisted to localStorage (and, later, to an account). */
export interface UserProfile {
  version: 1
  createdAt: string
  answers: OnboardingAnswers
  pathId: string
  pathName: string
  speakerMode: SpeakerMode
  glyphAffinity: string[]
  physicsAffinity: string[]
  mayanLayer: MayanLayer
  depth: Depth
  dimensions: DimensionScores
}

/** A fully-resolved path result, bound to real content + today's symbolic time. */
export interface PathResult {
  path: NoiraCielPath
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
