/**
 * noiracielWorlds.ts — "Worlds": the conceptual bridges of NoiraCiel.
 *
 * A World is not just an album. It binds an album (or two) to its book, its mood,
 * its colours, its glyph affinities, a Speaker mode and a Field (physics) concept
 * — the connective tissue that makes the universe feel entangled rather than a set
 * of separate pages.
 *
 * Client-safe: pure data + lookups, no server-only imports. Album titles/hrefs are
 * resolved from album ids at render time (server) via noiracielKnowledge.
 */

import type { SpeakerMode } from '@/types/noiracielOnboarding'

const R2 = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

export interface NoiraCielWorld {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  mood: string[]
  colors: string[]            // hex, for accent gradients
  connectedAlbums: string[]   // album ids (see noiracielKnowledge)
  connectedBooks: string[]    // book titles
  connectedStories: string[]  // story slugs (optional; may be empty)
  glyphAffinities: string[]   // Tzolk'in sign names
  physicsConcepts: string[]   // physics concept ids (see noiracielPhysicsConcepts)
  speakerMode: SpeakerMode
  thumbnail: string           // R2 image URL (StoryThumb degrades gracefully)
}

export const WORLDS: NoiraCielWorld[] = [
  {
    id: 'atlantic-noir',
    slug: 'atlantic-noir',
    title: 'Atlantic Noir',
    subtitle: 'The dark ocean, memory, and the edge of the world.',
    description:
      'Where NoiraCiel begins. Sea-soul and fado at the edge of the known water — silence, saudade, and the dignity of ordinary lives carried on the tide.',
    mood: ['silence', 'ocean', 'memory', 'saudade'],
    colors: ['#0d1b2a', '#1a3a4b', '#C4953A'],
    connectedAlbums: ['still-we-sail', 'salt-cathedral', 'main'],
    connectedBooks: ['Atlantic Noir', 'The Country of Saudade'],
    connectedStories: [],
    glyphAffinities: ['Imix', 'Akbal', 'Muluc'],
    physicsConcepts: ['fields', 'time', 'entanglement'],
    speakerMode: 'Nocturnal Librarian',
    thumbnail: `${R2}/images/song-art/still-we-sail.jpg`,
  },
  {
    id: 'the-velvet-machine',
    slug: 'the-velvet-machine',
    title: 'The Velvet Machine',
    subtitle: 'Tenderness given a pulse and a circuit.',
    description:
      'Electronic fado threaded through the machine — desire, elegance and the human voice moving through the night like it owes you something beautiful.',
    mood: ['desire', 'elegance', 'nocturnal', 'strange'],
    colors: ['#160d2a', '#3a1f4b', '#b87fd4'],
    connectedAlbums: ['the-velvet-machine', 'neon-saints'],
    connectedBooks: ['The Sacred Machine'],
    connectedStories: [],
    glyphAffinities: ['Lamat', 'Chicchan', 'Ahau'],
    physicsConcepts: ['interference', 'resonance', 'symmetry'],
    speakerMode: 'Private Curator',
    thumbnail: `${R2}/images/song-art/the-velvet-machine.jpg`,
  },
  {
    id: 'salt-cathedral',
    slug: 'salt-cathedral',
    title: 'The Salt Cathedral',
    subtitle: 'The holy built from sea air and reverence.',
    description:
      'Trip-hop jazz and oceanic DnB raised into something reverent — a cathedral of probability where grief becomes awe.',
    mood: ['awe', 'reverence', 'depth', 'oceanic'],
    colors: ['#091522', '#143a4b', '#7a9aad'],
    connectedAlbums: ['salt-cathedral', 'still-we-sail'],
    connectedBooks: ['Atlantic Noir'],
    connectedStories: [],
    glyphAffinities: ['Imix', 'Ben', 'Cib'],
    physicsConcepts: ['fields', 'vacuum', 'wavefunction'],
    speakerMode: 'Ritual Narrator',
    thumbnail: `${R2}/images/song-art/the-coat-i-left-on-the-rail.jpg`,
  },
  {
    id: 'the-glass-animal',
    slug: 'the-glass-animal',
    title: 'The Glass Animal',
    subtitle: 'The self as something see-through and breakable.',
    description:
      'Fragile art-pop and chamber soul — feminine mystery, the grammar of silence, beauty in vulnerability and the fear of being seen.',
    mood: ['fragility', 'tenderness', 'mystery', 'strange beauty'],
    colors: ['#0d1020', '#1a1430', '#9b8fc0'],
    connectedAlbums: ['glass-animal'],
    connectedBooks: ['She Walks Through Smoke'],
    connectedStories: [],
    glyphAffinities: ['Etznab', 'Cimi', 'Akbal'],
    physicsConcepts: ['decoherence', 'superposition', 'uncertainty'],
    speakerMode: 'Poetic Analyst',
    thumbnail: `${R2}/images/song-art/the-entrance-hall.jpg`,
  },
  {
    id: 'black-sun-gospel',
    slug: 'black-sun-gospel',
    title: 'Black Sun Gospel',
    subtitle: 'Redemption sung from the shadow side.',
    description:
      'Slow-burn dark soul and cinematic gospel — light wrestled out of a black sun, grief moving toward its proper place.',
    mood: ['grief', 'redemption', 'dark', 'longing'],
    colors: ['#0a0a0a', '#1a1014', '#C4953A'],
    connectedAlbums: ['black-sun-gospel'],
    connectedBooks: ['The Life Lessons I Hope You Learn'],
    connectedStories: [],
    glyphAffinities: ['Cauac', 'Cimi', 'Ahau'],
    physicsConcepts: ['entropy', 'light', 'collapse'],
    speakerMode: 'Calm Companion',
    thumbnail: `${R2}/images/song-art/black-sun-rising.jpg`,
  },
  {
    id: 'the-memory-atlas',
    slug: 'the-memory-atlas',
    title: 'The Memory Atlas',
    subtitle: 'A childhood reachable only by half-remembered roads.',
    description:
      'Cinematic puzzle-pop mapped from memory instead of geography — every song a room in a house that no longer exists.',
    mood: ['nostalgia', 'memory', 'wonder', 'bittersweet'],
    colors: ['#1a1408', '#3a2c10', '#B98F4A'],
    connectedAlbums: ['the-memory-atlas'],
    connectedBooks: ['Children of Tomorrow'],
    connectedStories: [],
    glyphAffinities: ['Cib', 'Muluc', 'Eb'],
    physicsConcepts: ['time', 'wavefunction', 'decoherence'],
    speakerMode: 'Poetic Analyst',
    thumbnail: `${R2}/images/song-art/the-drawer-that-still-sticks.jpg`,
  },
]

export function getWorldBySlug(slug: string): NoiraCielWorld | undefined {
  return WORLDS.find((w) => w.slug === slug)
}
