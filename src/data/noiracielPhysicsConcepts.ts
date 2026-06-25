/**
 * noiracielPhysicsConcepts.ts — "The NoiraCiel Field".
 *
 * Real physics/quantum concepts used as POETIC ARCHITECTURE — metaphor, structure
 * and language — never as proof of anything spiritual. Each concept carries a
 * humble, accurate scientific anchor and a clearly-marked artistic translation.
 *
 * Guiding principle: "NoiraCiel uses physics as poetic architecture, not as false
 * certainty." Nothing here claims physics validates emotion, manifestation,
 * destiny, healing, or consciousness magic.
 */

import type { DailyGlyph } from '@/data/mayanInterpretations'

export interface PhysicsConcept {
  id: string
  name: string
  /** Accurate, simple, humble statement of the real physics. */
  scientificAnchor: string
  /** Clearly-metaphorical NoiraCiel reading. */
  noiracielTranslation: string
  emotionalThemes: string[]
  relatedMoods: string[]
  relatedAlbums: string[]      // album ids (see noiracielKnowledge)
  relatedSongs: string[]       // song slugs (sparse; TODO: enrich from catalogue)
  relatedBookChapters: string[]
  relatedGlyphs: string[]      // Tzolk'in sign names
  visualLanguage: string
  speakerPromptAddition: string
}

export const PHYSICS_CONCEPTS: PhysicsConcept[] = [
  {
    id: 'superposition',
    name: 'Superposition',
    scientificAnchor:
      'Before measurement, a quantum system can be described as a combination of several possible states at once, with a probability attached to each.',
    noiracielTranslation:
      'NoiraCiel interprets superposition as the state before decision — when you are still many possible selves, and a song holds all of them at once, before life collapses you into a single answer.',
    emotionalThemes: ['possibility', 'indecision', 'becoming', 'openness'],
    relatedMoods: ['searching', 'fragile', 'weightless', 'drifting'],
    relatedAlbums: ['glass-animal', 'the-sacred-drift'],
    relatedSongs: [],
    relatedBookChapters: ['NoiraCiel: The World With Many Doors'],
    relatedGlyphs: ['Kan', 'Akbal'],
    visualLanguage: 'overlapping translucent wave-states, a single point not yet chosen',
    speakerPromptAddition:
      'Superposition: scientifically, many possible states before measurement; poetically, the held breath before a choice.',
  },
  {
    id: 'entanglement',
    name: 'Entanglement',
    scientificAnchor:
      'Two particles can share a joint state such that measuring one instantly tells you about the other — yet this transmits no usable signal and breaks no causality.',
    noiracielTranslation:
      'NoiraCiel interprets entanglement as the connection you feel before you can explain it — two people, or a person and a song, whose states are written together even across distance.',
    emotionalThemes: ['connection', 'distance', 'belonging', 'fidelity'],
    relatedMoods: ['love', 'loneliness', 'saudade', 'intimacy'],
    relatedAlbums: ['jazz-sessions', 'still-we-sail'],
    relatedSongs: [],
    relatedBookChapters: ['The Country of Saudade'],
    relatedGlyphs: ['Oc', 'Muluc'],
    visualLanguage: 'two distant points joined by one thin, taut gold line',
    speakerPromptAddition:
      'Entanglement: scientifically, a shared state revealed at a distance (no signal sent); poetically, the invisible thread between two things.',
  },
  {
    id: 'uncertainty',
    name: 'Uncertainty',
    scientificAnchor:
      'Heisenberg’s principle: certain pairs of properties (like position and momentum) cannot both be known with unlimited precision at the same time. It is a limit on knowledge, not mere confusion.',
    noiracielTranslation:
      'NoiraCiel interprets uncertainty as a rule for the heart: you cannot fully know where you are and where you are going at once. Some days ask for position; others ask for momentum.',
    emotionalThemes: ['not-knowing', 'humility', 'movement', 'patience'],
    relatedMoods: ['restlessness', 'hope', 'searching'],
    relatedAlbums: ['still-we-sail', 'the-memory-atlas'],
    relatedSongs: [],
    relatedBookChapters: ['Beyond the Edge'],
    relatedGlyphs: ['Ik', 'Men'],
    visualLanguage: 'a blurred coordinate, two axes that will not both sharpen',
    speakerPromptAddition:
      'Uncertainty: scientifically, a limit on knowing paired properties together; poetically, choose movement without demanding complete certainty.',
  },
  {
    id: 'wavefunction',
    name: 'Wavefunction / Probability',
    scientificAnchor:
      'The wavefunction encodes the probabilities of a system’s possible outcomes; its squared magnitude gives the chance of each result. It describes likelihood, not a guaranteed path.',
    noiracielTranslation:
      'NoiraCiel interprets the wavefunction as the spread of futures you are carrying — not a destiny, but a landscape of likelihoods that music can lean, gently, toward one shape.',
    emotionalThemes: ['possibility', 'likelihood', 'many paths'],
    relatedMoods: ['drifting', 'searching', 'wondering'],
    relatedAlbums: ['the-sacred-drift', 'the-memory-atlas'],
    relatedSongs: [],
    relatedBookChapters: ['NoiraCiel: The World With Many Doors'],
    relatedGlyphs: ['Eb', 'Caban'],
    visualLanguage: 'a soft probability cloud, denser where the likely paths gather',
    speakerPromptAddition:
      'Wavefunction: scientifically, a map of probabilities (not certainties); poetically, the spread of possible futures you carry.',
  },
  {
    id: 'collapse',
    name: 'Collapse / Measurement',
    scientificAnchor:
      'When a quantum system is measured, the description updates to a single definite outcome. Interpreting exactly why is an open question in physics; "observer" means interaction, not a conscious mind willing a result.',
    noiracielTranslation:
      'NoiraCiel interprets collapse as the moment of decision — when the many become one. It costs the other futures, and that cost is real; choosing is also a small grief.',
    emotionalThemes: ['decision', 'commitment', 'loss of options', 'clarity'],
    relatedMoods: ['courage', 'clarity', 'resolve'],
    relatedAlbums: ['whats-youre-made-of', 'main'],
    relatedSongs: [],
    relatedBookChapters: ['The Life Lessons I Hope You Learn'],
    relatedGlyphs: ['Ahau', 'Etznab'],
    visualLanguage: 'a cloud resolving to one bright fixed point',
    speakerPromptAddition:
      'Collapse: scientifically, measurement yields one definite outcome (observation = interaction, not mind-magic); poetically, to choose is to let the other futures go.',
  },
  {
    id: 'interference',
    name: 'Interference',
    scientificAnchor:
      'Waves can add or cancel where they overlap, producing bright and dark bands. The combined pattern is something neither wave shows alone.',
    noiracielTranslation:
      'NoiraCiel interprets interference as two emotional frequencies crossing. Do not silence one too quickly — listen for the third pattern they make together.',
    emotionalThemes: ['tension', 'combination', 'emergence'],
    relatedMoods: ['tension', 'beauty', 'strange'],
    relatedAlbums: ['neon-saints', 'the-velvet-machine'],
    relatedSongs: [],
    relatedBookChapters: ['The Sacred Machine'],
    relatedGlyphs: ['Lamat', 'Chuen'],
    visualLanguage: 'two wave-sets crossing into bright and dark fringes',
    speakerPromptAddition:
      'Interference: scientifically, overlapping waves reinforce or cancel; poetically, two feelings crossing reveal a third pattern.',
  },
  {
    id: 'tunnelling',
    name: 'Tunnelling',
    scientificAnchor:
      'A quantum particle has a small probability of crossing an energy barrier it could not classically surmount. It is rare and governed by strict odds — not a guarantee.',
    noiracielTranslation:
      'NoiraCiel interprets tunnelling as the unlikely passage through what looked impassable — not magic, but the rare, real chance that you arrive on the other side of a wall.',
    emotionalThemes: ['breakthrough', 'the impossible barrier', 'rare chance'],
    relatedMoods: ['courage', 'transformation', 'survival'],
    relatedAlbums: ['blind-angel', 'whats-youre-made-of'],
    relatedSongs: [],
    relatedBookChapters: ['Beyond the Edge'],
    relatedGlyphs: ['Cauac', 'Ix'],
    visualLanguage: 'a faint path through a solid barrier, most of the wave reflected',
    speakerPromptAddition:
      'Tunnelling: scientifically, a small chance of crossing a barrier classically forbidden; poetically, the rare real passage through what looked impossible.',
  },
  {
    id: 'decoherence',
    name: 'Decoherence',
    scientificAnchor:
      'Contact with a noisy environment scrambles a quantum system’s delicate phase relationships, so its quantum behaviour fades into ordinary, classical statistics.',
    noiracielTranslation:
      'NoiraCiel interprets decoherence as how a fragile inner state loses itself to the noise of the world — why the thing you felt at 3am is so hard to keep by morning.',
    emotionalThemes: ['fragility', 'losing the inner state', 'the noise of the world'],
    relatedMoods: ['fragility', 'grief', 'vulnerability'],
    relatedAlbums: ['glass-animal', 'the-memory-atlas'],
    relatedSongs: [],
    relatedBookChapters: ['She Walks Through Smoke'],
    relatedGlyphs: ['Cimi', 'Akbal'],
    visualLanguage: 'a clean wave dissolving into static at its edges',
    speakerPromptAddition:
      'Decoherence: scientifically, the environment washes out fragile quantum coherence; poetically, how an inner state is lost to the world’s noise.',
  },
  {
    id: 'fields',
    name: 'Fields',
    scientificAnchor:
      'In modern physics the fundamental objects are fields filling all of space; particles are localised excitations of those fields. The field is the medium even where nothing seems to be.',
    noiracielTranslation:
      'NoiraCiel interprets the field as the invisible medium that connects everything in this world — the music, the books, the glyph, the listener — each a ripple in one continuous thing.',
    emotionalThemes: ['the unseen medium', 'belonging', 'continuity'],
    relatedMoods: ['vast', 'belonging', 'oceanic'],
    relatedAlbums: ['salt-cathedral', 'world-musics'],
    relatedSongs: [],
    relatedBookChapters: ['Atlantic Noir'],
    relatedGlyphs: ['Imix', 'Ben'],
    visualLanguage: 'a faint vector grid, ripples crossing an invisible medium',
    speakerPromptAddition:
      'Fields: scientifically, space-filling fields whose excitations are particles; poetically, the unseen medium connecting everything in NoiraCiel.',
  },
  {
    id: 'symmetry',
    name: 'Symmetry / Symmetry Breaking',
    scientificAnchor:
      'Symmetries describe what stays the same under a change; many structures in nature (and mass itself) arise when a perfect symmetry is spontaneously broken.',
    noiracielTranslation:
      'NoiraCiel interprets symmetry breaking as how beauty and form appear precisely when a perfect balance tips — the small asymmetry that lets a world, or a song, take shape.',
    emotionalThemes: ['balance', 'the flaw that creates form', 'change'],
    relatedMoods: ['elegance', 'change', 'beauty'],
    relatedAlbums: ['classic', 'the-velvet-machine'],
    relatedSongs: [],
    relatedBookChapters: ['NoiraCiel: The World With Many Doors'],
    relatedGlyphs: ['Lamat', 'Etznab'],
    visualLanguage: 'a mirror-perfect figure with one deliberate break',
    speakerPromptAddition:
      'Symmetry breaking: scientifically, structure arising when a perfect symmetry tips; poetically, the small flaw that lets form exist.',
  },
  {
    id: 'entropy',
    name: 'Entropy',
    scientificAnchor:
      'The second law of thermodynamics: in a closed system, disorder (entropy) tends to increase. Local order is possible, but it is paid for with greater disorder elsewhere.',
    noiracielTranslation:
      'NoiraCiel interprets entropy as the truth that things scatter — rooms, families, certainties. Order is not free; it is something you spend yourself to keep, and grief is the receipt.',
    emotionalThemes: ['dispersal', 'impermanence', 'the cost of order'],
    relatedMoods: ['grief', 'letting go', 'dark'],
    relatedAlbums: ['black-sun-gospel', 'metal'],
    relatedSongs: [],
    relatedBookChapters: ['The Life Lessons I Hope You Learn'],
    relatedGlyphs: ['Cauac', 'Caban'],
    visualLanguage: 'an ordered lattice loosening into scattered points',
    speakerPromptAddition:
      'Entropy: scientifically, disorder tends to increase in a closed system; poetically, things scatter, and keeping order costs something real.',
  },
  {
    id: 'time',
    name: 'Time / Arrow of Time',
    scientificAnchor:
      'Most microscopic laws work the same forwards and backwards; the felt direction of time is tied to entropy increasing, which is why the past is fixed and remembered while the future is open.',
    noiracielTranslation:
      'NoiraCiel interprets the arrow of time as memory itself: we remember one direction because the world only scatters one way. Saudade is the ache of a direction that will not reverse.',
    emotionalThemes: ['memory', 'irreversibility', 'longing'],
    relatedMoods: ['nostalgia', 'saudade', 'tender'],
    relatedAlbums: ['the-memory-atlas', 'main'],
    relatedSongs: [],
    relatedBookChapters: ['The Country of Saudade'],
    relatedGlyphs: ['Cib', 'Muluc'],
    visualLanguage: 'a single arrow, the past sharp behind it, the future soft ahead',
    speakerPromptAddition:
      'Arrow of time: scientifically, the felt direction tied to rising entropy; poetically, memory — the ache of what will not reverse.',
  },
  {
    id: 'resonance',
    name: 'Resonance',
    scientificAnchor:
      'A system driven at its natural frequency absorbs energy efficiently and responds with large amplitude. Match the frequency and a small push moves something large.',
    noiracielTranslation:
      'NoiraCiel interprets resonance as the right song at the right moment — when the world meets your own frequency and a small thing moves something enormous inside you.',
    emotionalThemes: ['attunement', 'amplification', 'the right moment'],
    relatedMoods: ['joy', 'energy', 'embodied'],
    relatedAlbums: ['funk-my-way-in', 'reggae-sessions', 'world-musics'],
    relatedSongs: [],
    relatedBookChapters: ['The Body Remembers the Fire'],
    relatedGlyphs: ['Chicchan', 'Ben'],
    visualLanguage: 'a string at its natural frequency, amplitude swelling',
    speakerPromptAddition:
      'Resonance: scientifically, driving a system at its natural frequency amplifies its response; poetically, the right song at the right moment moves something large.',
  },
  {
    id: 'light',
    name: 'Light / Photon',
    scientificAnchor:
      'Light comes in quanta called photons and behaves as both wave and particle depending on how it is probed. It carries energy and information at the universe’s speed limit.',
    noiracielTranslation:
      'NoiraCiel interprets light as the carrier between us — both wave and particle, both feeling and fact. And like the name itself, light is only visible because of the dark around it.',
    emotionalThemes: ['hope', 'the carrier', 'visibility through darkness'],
    relatedMoods: ['hope', 'redemption', 'longing'],
    relatedAlbums: ['black-sun-gospel', 'still-we-sail'],
    relatedSongs: [],
    relatedBookChapters: ['Children of Tomorrow'],
    relatedGlyphs: ['Ahau', 'Akbal'],
    visualLanguage: 'a single ray crossing a dark field, both line and point',
    speakerPromptAddition:
      'Light/photon: scientifically, quantised light that is both wave and particle; poetically, the carrier between us, visible because of the dark around it.',
  },
  {
    id: 'vacuum',
    name: 'Vacuum / Silence / Potential',
    scientificAnchor:
      'The quantum vacuum is not truly empty: it is the lowest-energy state of fields, still humming with fluctuations. "Nothing" has structure and latent potential.',
    noiracielTranslation:
      'NoiraCiel interprets the vacuum as silence that is not empty — the rest between notes, the unsaid, the page before the first word. Potential lives in what looks like nothing.',
    emotionalThemes: ['silence', 'latent potential', 'restraint'],
    relatedMoods: ['silence', 'stillness', 'restraint'],
    relatedAlbums: ['salt-cathedral', 'classic', 'blind-angel'],
    relatedSongs: [],
    relatedBookChapters: ['She Walks Through Smoke'],
    relatedGlyphs: ['Akbal', 'Cimi'],
    visualLanguage: 'a near-black field, faint fluctuations stirring in the dark',
    speakerPromptAddition:
      'Vacuum: scientifically, the lowest-energy state of fields, never truly empty; poetically, silence full of potential — the rest between notes.',
  },
]

export function getConceptById(id: string): PhysicsConcept | undefined {
  return PHYSICS_CONCEPTS.find((c) => c.id === id)
}

// Map each Tzolk'in sign to the physics concept it most resonates with, so the
// "featured concept of the day" connects to the Daily Glyph deterministically.
const SIGN_TO_CONCEPT: Record<string, string> = {
  Imix: 'fields', Ik: 'uncertainty', Akbal: 'vacuum', Kan: 'superposition',
  Chicchan: 'resonance', Cimi: 'entropy', Manik: 'collapse', Lamat: 'symmetry',
  Muluc: 'time', Oc: 'entanglement', Chuen: 'interference', Eb: 'wavefunction',
  Ben: 'resonance', Ix: 'tunnelling', Men: 'uncertainty', Cib: 'time',
  Caban: 'wavefunction', Etznab: 'collapse', Cauac: 'tunnelling', Ahau: 'light',
}

export interface FeaturedConcept {
  concept: PhysicsConcept
  /** A short reading tying today's glyph + wave position to the concept. */
  reading: string
}

/**
 * getFeaturedConcept — the physics concept of the day, derived from the Daily
 * Glyph (and lightly from the wave position). Deterministic per day.
 */
export function getFeaturedConcept(glyph: DailyGlyph): FeaturedConcept {
  const bySign = SIGN_TO_CONCEPT[glyph.sign.name]
  const concept =
    getConceptById(bySign) ??
    PHYSICS_CONCEPTS[glyph.mayan.julianDayNumber % PHYSICS_CONCEPTS.length]

  const reading =
    `Today's glyph — ${glyph.mayan.tzolkin.display} — translates, in the Field, to ${concept.name}. ` +
    `Scientifically, ${lowerFirst(concept.scientificAnchor)} ` +
    `${concept.noiracielTranslation}`

  return { concept, reading }
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/** Map an onboarding physics-image answer to a concept id. */
export const PHYSICS_IMAGE_TO_CONCEPT: Record<string, string> = {
  'wave-before-break': 'superposition',
  'two-particles': 'entanglement',
  'door-through-matter': 'tunnelling',
  'light-crossing-dark': 'light',
  'invisible-field': 'fields',
  'system-disorder': 'entropy',
  'state-before-choice': 'collapse',
}
