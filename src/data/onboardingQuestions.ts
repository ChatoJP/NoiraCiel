/**
 * onboardingQuestions.ts — the symbolic questions for "/enter".
 *
 * Nine questions, one screen each. Most score emotional dimensions; one chooses
 * a symbol (also a glyph affinity); the last three set the Speaker mode, the
 * Mayan-layer preference, and how deep the listener wants to go.
 *
 * Poetic but clear. No quiz language, no spiritual cliché.
 */

import type { OnboardingQuestion } from '@/types/noiracielOnboarding'

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'q1',
    prompt: 'What brings you here tonight?',
    kind: 'dimension',
    options: [
      { id: 'silence', label: 'I need silence', dimensions: { silence: 3, intimacy: 1 } },
      { id: 'fire', label: 'I need fire', dimensions: { fire: 3, intensity: 1 } },
      { id: 'beauty', label: 'I need beauty', dimensions: { beauty: 3 } },
      { id: 'courage', label: 'I need courage', dimensions: { courage: 3 } },
      { id: 'disappear', label: 'I need to disappear for a while', dimensions: { shadow: 3, silence: 1 } },
      { id: 'understand', label: 'I want to understand NoiraCiel', dimensions: { intellect: 3 } },
    ],
  },
  {
    id: 'q2',
    prompt: 'Which sound would you enter first?',
    kind: 'dimension',
    options: [
      { id: 'piano', label: 'A piano in a dark room', dimensions: { silence: 2, intimacy: 2, beauty: 1 } },
      { id: 'voice-ocean', label: 'A voice over the ocean', dimensions: { ocean: 3, grief: 1 } },
      { id: 'bassline', label: 'A bassline under city lights', dimensions: { movement: 3, beauty: 1 } },
      { id: 'choir', label: 'A choir in the distance', dimensions: { ritual: 2, beauty: 1, transformation: 1 } },
      { id: 'guitar', label: 'A distorted guitar breaking open', dimensions: { intensity: 3, courage: 1 } },
      { id: 'drums', label: 'A drum circle before dawn', dimensions: { fire: 3, community: 2 } },
    ],
  },
  {
    id: 'q3',
    prompt: 'What kind of truth do you need today?',
    kind: 'dimension',
    options: [
      { id: 'gentle', label: 'Something gentle', dimensions: { intimacy: 3, beauty: 1 } },
      { id: 'brutal', label: 'Something brutal', dimensions: { intensity: 3, courage: 1 } },
      { id: 'elegant', label: 'Something elegant', dimensions: { beauty: 3 } },
      { id: 'strange', label: 'Something strange', dimensions: { shadow: 2, transformation: 1, intellect: 1 } },
      { id: 'ancient', label: 'Something ancient', dimensions: { ritual: 3 } },
      { id: 'move', label: 'Something that makes me move', dimensions: { movement: 3, fire: 1 } },
    ],
  },
  {
    id: 'q4',
    prompt: 'Where are you emotionally?',
    kind: 'dimension',
    options: [
      { id: 'restless', label: 'Restless', dimensions: { movement: 2, intensity: 1 } },
      { id: 'heavy', label: 'Heavy', dimensions: { grief: 3 } },
      { id: 'curious', label: 'Curious', dimensions: { intellect: 3 } },
      { id: 'broken-open', label: 'Broken open', dimensions: { grief: 2, transformation: 2 } },
      { id: 'focused', label: 'Focused', dimensions: { intellect: 2, courage: 1 } },
      { id: 'transition', label: 'In transition', dimensions: { transformation: 3 } },
      { id: 'build', label: 'Ready to build', dimensions: { courage: 2, intensity: 1 } },
    ],
  },
  {
    id: 'q5',
    prompt: 'Choose a symbol.',
    subtitle: 'Do not think. Choose the one your eye returns to.',
    kind: 'symbol',
    options: [
      { id: 'mirror', label: 'Mirror', signAffinity: 'Etznab', dimensions: { intellect: 2, shadow: 1 } },
      { id: 'storm', label: 'Storm', signAffinity: 'Cauac', dimensions: { intensity: 2, transformation: 1 } },
      { id: 'sun', label: 'Sun', signAffinity: 'Ahau', dimensions: { beauty: 2, courage: 1 } },
      { id: 'night', label: 'Night', signAffinity: 'Akbal', dimensions: { silence: 2, shadow: 1 } },
      { id: 'seed', label: 'Seed', signAffinity: 'Kan', dimensions: { transformation: 2, intimacy: 1 } },
      { id: 'jaguar', label: 'Jaguar', signAffinity: 'Ix', dimensions: { courage: 2, fire: 1 } },
      { id: 'ocean', label: 'Ocean', signAffinity: 'Muluc', dimensions: { ocean: 3 } },
      { id: 'fire', label: 'Fire', signAffinity: 'Chicchan', dimensions: { fire: 3 } },
      { id: 'door', label: 'Door', signAffinity: 'Ben', dimensions: { ritual: 2, intellect: 1 } },
    ],
  },
  {
    id: 'q6',
    prompt: 'What do you want from music?',
    kind: 'dimension',
    options: [
      { id: 'heal', label: 'To heal', dimensions: { grief: 2, intimacy: 1, beauty: 1 } },
      { id: 'remember', label: 'To remember', dimensions: { ocean: 2, grief: 1 } },
      { id: 'forget', label: 'To forget', dimensions: { shadow: 2, movement: 1 } },
      { id: 'move', label: 'To move', dimensions: { movement: 3, fire: 1 } },
      { id: 'understand-self', label: 'To understand myself', dimensions: { intellect: 3 } },
      { id: 'less-alone', label: 'To feel less alone', dimensions: { intimacy: 2, community: 2 } },
      { id: 'stronger', label: 'To become stronger', dimensions: { courage: 3 } },
    ],
  },
  {
    id: 'q7',
    prompt: 'How should the Speaker talk to you?',
    kind: 'speaker',
    options: [
      { id: 'curator', label: 'Like a private curator', speakerMode: 'Private Curator' },
      { id: 'librarian', label: 'Like a nocturnal librarian', speakerMode: 'Nocturnal Librarian' },
      { id: 'friend', label: 'Like a calm friend', speakerMode: 'Calm Companion' },
      { id: 'ritual', label: 'Like a ritual narrator', speakerMode: 'Ritual Narrator' },
      { id: 'guide', label: 'Like a music guide', speakerMode: 'Music Guide' },
      { id: 'analyst', label: 'Like a poetic analyst', speakerMode: 'Poetic Analyst' },
      { id: 'physicist', label: 'Like a physicist-poet', speakerMode: 'The Physicist-Poet' },
    ],
  },
  {
    id: 'q10',
    prompt: 'Which physics image feels closest to you today?',
    subtitle: 'The NoiraCiel Field — physics as metaphor, never as proof.',
    kind: 'physics',
    options: [
      { id: 'wave-before-break', label: 'A wave before it breaks', physicsAffinity: 'superposition' },
      { id: 'two-particles', label: 'Two particles still connected', physicsAffinity: 'entanglement' },
      { id: 'door-through-matter', label: 'A door through impossible matter', physicsAffinity: 'tunnelling' },
      { id: 'light-crossing-dark', label: 'Light crossing darkness', physicsAffinity: 'light' },
      { id: 'invisible-field', label: 'A field no one can see', physicsAffinity: 'fields' },
      { id: 'system-disorder', label: 'A system becoming disorder', physicsAffinity: 'entropy' },
      { id: 'state-before-choice', label: 'A state before choice', physicsAffinity: 'collapse' },
    ],
  },
  {
    id: 'q8',
    prompt: 'Do you want today’s symbolic time included?',
    subtitle: 'The Daily Glyph and the current 13-day wave.',
    kind: 'mayan',
    options: [
      { id: 'full', label: 'Yes — include today’s glyph and the 13-day wave', mayanLayer: 'full' },
      { id: 'light', label: 'Only lightly', mayanLayer: 'light' },
      { id: 'off', label: 'Not now', mayanLayer: 'off' },
    ],
  },
  {
    id: 'q9',
    prompt: 'How deep do you want to go?',
    kind: 'depth',
    options: [
      { id: 'song', label: 'One song', depth: 'song' },
      { id: 'album', label: 'One album', depth: 'album' },
      { id: 'chapter', label: 'One chapter', depth: 'chapter' },
      { id: 'path', label: 'A full path', depth: 'path' },
      { id: 'journey', label: 'A 13-day journey', depth: 'journey' },
    ],
  },
]
