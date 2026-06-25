/**
 * noiracielKnowledge.ts — the NoiraCiel content/context layer for the Speaker.
 *
 * This curates the *real* NoiraCiel universe so the Speaker recommends actual
 * albums, songs and books rather than inventing them.
 *
 *   • ALBUMS  — hand-authored mood/emotion metadata over the real discography
 *               (titles, slugs, hrefs and genres mirror src/lib/musicScanner.ts
 *               and public/music-catalogue.json).
 *   • BOOKS   — the NoiraCiel literary collection (mirrors the CIEL canon).
 *   • PILLARS / PHILOSOPHY / CONCEPTS — the artistic universe in compact form.
 *   • loadSongIndex() — reads public/music-catalogue.json at runtime so song-level
 *               recommendations stay in sync with the catalogue.
 *
 * The mood vocabulary and `recommendedFor` arrays are the curated, valuable part —
 * they are how the recommendation engine answers "I feel lost" or "give me
 * something dark but beautiful". Where deeper per-song emotional metadata does
 * not yet exist, songs inherit their album's mood. TODO markers note where richer
 * per-song / per-chapter metadata should be connected when it becomes available.
 */

import fs from 'fs'
import path from 'path'

export interface KnowledgeAlbum {
  id: string            // matches albumSlug in the catalogue
  title: string
  href: string          // page path on the site
  world: string         // genre / sonic world (mirrors discography genre)
  mood: string[]        // emotional/atmospheric tags
  description: string
  recommendedFor: string[] // emotional needs this album answers
}

export interface KnowledgeBook {
  id: string
  title: string
  connectedAlbum: string | null // album id, if directly paired
  emotionalTheme: string
  description: string
}

// ── ALBUMS ───────────────────────────────────────────────────────────────────
// 'mood' and 'recommendedFor' are curated. Genres mirror the real discography.
export const ALBUMS: KnowledgeAlbum[] = [
  {
    id: 'main',
    title: 'The Life Lessons I Hope You Learn',
    href: '/music/the-life-lessons',
    world: 'Atlantic Noir · Sea-Soul',
    mood: ['intimate', 'tender', 'oceanic', 'reflective', 'aching', 'dignified'],
    description:
      'The origin album. 17 chapters on the lessons we only understand when it is almost too late — love, dignity, honest work, silence, grief that finds its place, the courage to return.',
    recommendedFor: ['grief', 'loss', 'love', 'gratitude', 'family', 'reflection', 'patience', 'meaning'],
  },
  {
    id: 'jazz-sessions',
    title: 'NoiraCiel Jazz Sessions',
    href: '/music/jazz-sessions',
    world: 'Jazz · Atlantic Noir',
    mood: ['nocturnal', 'warm', 'intimate', 'smoky', 'horizontal', 'late-night'],
    description:
      'Late-night sessions. The music of return — to love, to the self, to the river that knows your name. More horizontal and intimate than the main album.',
    recommendedFor: ['loneliness', 'love', 'rest', 'late night', 'comfort', 'romance'],
  },
  {
    id: 'blind-angel',
    title: 'The Blind Angel — Intimate Metal Sessions',
    href: '/music/blind-angel',
    world: 'Intimate Metal',
    mood: ['raw', 'sacred', 'heavy', 'cathartic', 'sovereign', 'burning'],
    description:
      'Stripped, raw, intimate metal. The Blind Angel rises from ruin and carries darkness as sovereign weight, not as shame — the sacred in the broken, mercy that burns.',
    recommendedFor: ['anger', 'courage', 'catharsis', 'survival', 'transformation', 'darkness'],
  },
  {
    id: 'the-velvet-machine',
    title: 'The Velvet Machine',
    href: '/music/the-velvet-machine',
    world: 'Electronic · Fado · Atlantic Noir',
    mood: ['sensual', 'mechanical', 'velvet', 'nocturnal', 'cinematic', 'strange'],
    description:
      'Electronic fado in Atlantic Noir — the human voice threaded through the machine, tenderness given a pulse and a circuit.',
    recommendedFor: ['desire', 'transformation', 'strange beauty', 'late night', 'the machine'],
  },
  {
    id: 'still-we-sail',
    title: 'Still We Sail',
    href: '/music/still-we-sail',
    world: 'Atlantic Noir · Fado · Sea-Soul',
    mood: ['oceanic', 'resilient', 'saudade', 'windswept', 'enduring', 'hopeful'],
    description:
      'Fado and Sea-Soul for the ones who keep going. Departure and return, the Atlantic relationship with distance, the quiet courage of sailing on.',
    recommendedFor: ['perseverance', 'saudade', 'distance', 'hope', 'starting over', 'courage'],
  },
  {
    id: 'whats-youre-made-of',
    title: "What You're Made Of",
    href: '/music/whats-youre-made-of',
    world: 'Hip-Hop · DnB · Soul · Trap · Piano & Violin',
    mood: ['driving', 'defiant', 'soulful', 'urgent', 'cinematic', 'fierce'],
    description:
      'Hip-hop and DnB meeting piano and violin — the test of pressure, what is revealed when life pushes and you find out what you are made of.',
    recommendedFor: ['courage', 'motivation', 'anger', 'resilience', 'self-belief', 'pressure'],
  },
  {
    id: 'the-sacred-drift',
    title: 'The Sacred Drift',
    href: '/music/the-sacred-drift',
    world: 'Indie Pop · R&B · DnB · Trip-Pop · Psych · Mantras',
    mood: ['drifting', 'hypnotic', 'spiritual', 'weightless', 'searching', 'luminous'],
    description:
      'A psychedelic, mantra-touched drift through indie pop and trip-pop — surrender, letting go, the sacred found in the act of floating.',
    recommendedFor: ['letting go', 'searching', 'transformation', 'stillness', 'wonder', 'restlessness'],
  },
  {
    id: 'funk-my-way-in',
    title: 'Funk My Way In',
    href: '/music/funk-my-way-in',
    world: 'Funk · Soul · Groove',
    mood: ['joyful', 'groovy', 'alive', 'warm', 'embodied', 'playful'],
    description:
      'Pure groove and soul — the body remembering joy, the warmth of a room that finds its rhythm.',
    recommendedFor: ['joy', 'celebration', 'energy', 'dancing', 'lightness', 'play'],
  },
  {
    id: 'world-musics',
    title: 'World Musics',
    href: '/music/world-musics',
    world: 'World Music · African · Latin · Global',
    mood: ['expansive', 'rooted', 'communal', 'rhythmic', 'global', 'celebratory'],
    description:
      'A global gathering — African, Latin and worldwide rhythms threaded through the NoiraCiel sensibility. Roots, community, the human family.',
    recommendedFor: ['belonging', 'roots', 'celebration', 'energy', 'connection', 'travel'],
  },
  {
    id: 'reggae-sessions',
    title: 'Reggae Sessions',
    href: '/music/reggae-sessions',
    world: 'Reggae · Roots · Dub',
    mood: ['warm', 'rooted', 'easeful', 'sunlit', 'steady', 'healing'],
    description:
      'Roots reggae and dub — the slow, steady heartbeat of resilience and ease, conscious warmth and gentle defiance.',
    recommendedFor: ['rest', 'calm', 'healing', 'ease', 'resilience', 'warmth'],
  },
  {
    id: 'salt-cathedral',
    title: 'The Salt Cathedral',
    href: '/music/salt-cathedral',
    world: 'Atlantic Noir · Sea-Soul · Trip-Hop Jazz · Oceanic DnB',
    mood: ['vast', 'sacred', 'oceanic', 'reverent', 'cool', 'cavernous'],
    description:
      'A cathedral built from salt and sea air — trip-hop jazz and oceanic DnB raised into something reverent, the holy found in the Atlantic.',
    recommendedFor: ['awe', 'grief', 'reverence', 'solitude', 'depth', 'transformation'],
  },
  {
    id: 'neon-saints',
    title: 'Neon Saints of the Machine',
    href: '/music/neon-saints',
    world: 'Dark Cyber-Soul · Industrial DnB · Gospel Shadows · Jazz Harmony',
    mood: ['electric', 'shadowed', 'sacred', 'urban', 'gritty', 'transcendent'],
    description:
      'Dark cyber-soul and industrial DnB lit by gospel shadows — sainthood in the age of the machine, grace found in neon and steel.',
    recommendedFor: ['darkness', 'transformation', 'the machine', 'faith', 'night', 'intensity'],
  },
  {
    id: 'glass-animal',
    title: 'The Glass Animal',
    href: '/music/glass-animal',
    world: 'Experimental Art-Pop · Trip-Pop · Chamber Soul · Fragile Electronic Jazz',
    mood: ['fragile', 'translucent', 'delicate', 'strange', 'tender', 'experimental'],
    description:
      'Fragile art-pop and chamber soul — the self as something see-through and breakable, beauty in vulnerability and the fear of being seen.',
    recommendedFor: ['vulnerability', 'fragility', 'strange beauty', 'tenderness', 'loneliness', 'sensitivity'],
  },
  {
    id: 'black-sun-gospel',
    title: 'Black Sun Gospel',
    href: '/music/black-sun-gospel',
    world: 'Dark Soul · Blues-Rock · Cinematic Gospel · Slow-Burn DnB',
    mood: ['smouldering', 'gospel', 'bluesy', 'cinematic', 'redemptive', 'dark'],
    description:
      'Slow-burn dark soul and cinematic gospel — redemption sung from the shadow side, light wrestled out of a black sun.',
    recommendedFor: ['grief', 'redemption', 'darkness', 'faith', 'longing', 'transformation'],
  },
  {
    id: 'the-memory-atlas',
    title: 'The Memory Atlas',
    href: '/music/the-memory-atlas',
    world: 'Cinematic Puzzle-Pop · Art-Rock · Orchestral Trip-Hop · Emotional Electronic Folk',
    mood: ['nostalgic', 'wondering', 'bittersweet', 'cartographic', 'tender', 'cinematic'],
    description:
      "A cartographer's record of a childhood reachable only by half-remembered roads — every song a room in a house that no longer exists, mapped from memory.",
    recommendedFor: ['nostalgia', 'memory', 'childhood', 'saudade', 'wonder', 'tenderness'],
  },
  // Lighter-touch worlds — kept for completeness; mood metadata is broad.
  {
    id: 'metal',
    title: 'Metal',
    href: '/music/metal',
    world: 'Metal',
    mood: ['heavy', 'intense', 'cathartic', 'powerful'],
    description: 'The full-weight metal sessions — power and catharsis without apology.',
    recommendedFor: ['anger', 'catharsis', 'energy', 'intensity'],
  },
  {
    id: 'hardstyle',
    title: 'Hardstyle',
    href: '/music/hardstyle',
    world: 'Hardstyle · Electronic',
    mood: ['euphoric', 'pounding', 'relentless', 'electric'],
    description: 'Hardstyle energy — relentless, euphoric, built for momentum.',
    recommendedFor: ['energy', 'motivation', 'adrenaline', 'celebration'],
  },
  {
    id: 'classic',
    title: 'Classic',
    href: '/music/classic',
    world: 'Classical · Cinematic',
    mood: ['stately', 'cinematic', 'elegant', 'timeless'],
    description: 'Classical and cinematic pieces — stillness, elegance, the long line.',
    recommendedFor: ['calm', 'reflection', 'elegance', 'focus'],
  },
  {
    id: 'party-exploder',
    title: 'Party Exploder',
    href: '/music/party-exploder',
    world: 'Party Mix · Compilation',
    mood: ['joyful', 'high-energy', 'celebratory', 'fun'],
    description: 'A high-energy party compilation — pure release and celebration.',
    recommendedFor: ['joy', 'celebration', 'energy', 'dancing'],
  },
  {
    id: 'ak96-party-session-1',
    title: 'Ak96 Mixes — Party Session N1',
    href: '/music/ak96-party-session-1',
    world: 'DJ Mix · Party Session',
    mood: ['energetic', 'continuous', 'celebratory', 'kinetic'],
    description: 'A continuous DJ party session — momentum, motion, the night in full swing.',
    recommendedFor: ['energy', 'celebration', 'dancing', 'motion'],
  },
]

// ── BOOKS ──────────────────────────────────────────────────────────────────
// The NoiraCiel literary collection — each book an inner mythology.
export const BOOKS: KnowledgeBook[] = [
  {
    id: 'the-life-lessons',
    title: 'The Life Lessons I Hope You Learn',
    connectedAlbum: 'main',
    emotionalTheme: 'love, time, and the things we learn too late',
    description: 'Essays paired with the origin album — the quiet wisdom of ordinary lives honoured fully.',
  },
  {
    id: 'atlantic-noir',
    title: 'Atlantic Noir',
    connectedAlbum: 'still-we-sail',
    emotionalTheme: 'the ocean as metaphor — departure, return, distance',
    description: 'On the Portuguese relationship with distance and the sea as the edge of the known world.',
  },
  {
    id: 'the-blind-angel-sessions',
    title: 'The Blind Angel Sessions',
    connectedAlbum: 'blind-angel',
    emotionalTheme: 'darkness, survival, interior sovereignty',
    description: 'Companion to the metal album — carrying darkness as weight rather than shame.',
  },
  {
    id: 'the-country-of-saudade',
    title: 'The Country of Saudade',
    connectedAlbum: 'still-we-sail',
    emotionalTheme: 'ache, love, absence, beauty',
    description: 'On the untranslatable Portuguese word — the ache of loving what is absent.',
  },
  {
    id: 'she-walks-through-smoke',
    title: 'She Walks Through Smoke',
    connectedAlbum: 'glass-animal',
    emotionalTheme: 'feminine mystery, restraint, the grammar of silence',
    description: 'On what is withheld, and the power of what is not said.',
  },
  {
    id: 'the-body-remembers-the-fire',
    title: 'The Body Remembers the Fire',
    connectedAlbum: 'funk-my-way-in',
    emotionalTheme: 'instinct, dance, the intelligence of the body',
    description: 'On rhythm, tribal house and the wisdom the body keeps when the mind forgets.',
  },
  {
    id: 'the-sacred-machine',
    title: 'The Sacred Machine',
    connectedAlbum: 'neon-saints',
    emotionalTheme: 'AI, creation, making something that feels',
    description: 'On what it means to build art at scale while keeping the soul human-led.',
  },
  {
    id: 'beyond-the-edge',
    title: 'Beyond the Edge',
    connectedAlbum: 'still-we-sail',
    emotionalTheme: 'courage, discovery, the first step into the unknown',
    description: 'On Atlantic discovery and the nerve required to look past the known water.',
  },
  {
    id: 'children-of-tomorrow',
    title: 'Children of Tomorrow',
    connectedAlbum: 'the-memory-atlas',
    emotionalTheme: 'hope, innocence, what we build for those who come after',
    description: 'On legacy and the world we leave for the ones not yet here.',
  },
  {
    id: 'the-world-with-many-doors',
    title: 'NoiraCiel: The World With Many Doors',
    connectedAlbum: null,
    emotionalTheme: 'the manifesto — the synthesis of all artistic pillars',
    description: 'The synthesis: all of NoiraCiel gathered into one threshold with many entrances.',
  },
]

// ── PILLARS, PHILOSOPHY & CONCEPTS ───────────────────────────────────────────
export const PILLARS = [
  'Atlantic Noir — the aesthetics of the dark ocean and the edge of the world',
  'Saudade — the untranslatable ache of loving what is absent',
  'Dignity — ordinary lives honoured with extraordinary weight',
  'Silence — the grammar of restraint, the shape of what is withheld',
  'The Interior Fire — the flame that survives when everything outside goes out',
  'Grief with Dignity — grief that knows its proper place',
  'The Invisible Inheritance — what ancestors plant in us without our knowing',
  'Patience — the radical act of trusting time',
  'Return — the courage to go back and say what should have been said',
  'Freedom Through Truth — the liberation of speaking clearly, whatever the cost',
]

export const PHILOSOPHY = [
  'NoiraCiel is my art. The machine behind it is my architecture.',
  'The art is human. The scale is automated.',
]

export const CONCEPTS = {
  rooms:
    'NoiraCiel Rooms — quiet shared spaces inside the universe, each tuned to a mood or world, where listeners gather around a feeling rather than a feed.',
  artists:
    'NoiraCiel Artists — the idea that the universe is a house with many makers, human-led and AI-assisted, where the art stays human and the scale is automated.',
  scholarship:
    'The Invisible Roots Scholarship — a portion of NoiraCiel supports students who carry invisible roots: those academic institutions rarely celebrate.',
}

// ── SONG INDEX (read from the live catalogue) ────────────────────────────────
export interface SongEntry {
  id: string
  title: string
  slug: string
  album: string | null
  albumSlug: string | null
  href: string
  // TODO: per-song emotional metadata does not yet exist in the catalogue.
  // Until it does, songs inherit their album's mood via mood below.
  mood: string[]
}

let _songCache: SongEntry[] | null = null

/**
 * loadSongIndex — read public/music-catalogue.json and return a lightweight,
 * Speaker-friendly song list. Cached after first read. Server-side only.
 * Fails soft: returns [] if the catalogue cannot be read.
 */
export function loadSongIndex(): SongEntry[] {
  if (_songCache) return _songCache
  try {
    const file = path.join(process.cwd(), 'public', 'music-catalogue.json')
    const raw = fs.readFileSync(file, 'utf-8')
    const parsed = JSON.parse(raw) as { tracks?: Array<Record<string, unknown>> }
    const albumById = new Map(ALBUMS.map((a) => [a.id, a]))

    _songCache = (parsed.tracks ?? []).map((t) => {
      const albumSlug = (t.albumSlug as string) ?? null
      const album = albumById.get(albumSlug ?? '')
      const slug = (t.slug as string) ?? ''
      return {
        id: (t.id as string) ?? slug,
        title: (t.title as string) ?? 'Untitled',
        slug,
        album: (t.album as string) ?? null,
        albumSlug,
        href: slug ? `/songs/${slug}` : album?.href ?? '/music',
        mood: album?.mood ?? [],
      }
    })
    return _songCache
  } catch {
    return []
  }
}

// ── Lookups ──────────────────────────────────────────────────────────────────
export function getAlbumById(id: string): KnowledgeAlbum | undefined {
  return ALBUMS.find((a) => a.id === id)
}

export function getBookForAlbum(albumId: string): KnowledgeBook | undefined {
  return BOOKS.find((b) => b.connectedAlbum === albumId)
}

/** Every distinct mood + recommendedFor keyword across the catalogue. */
export function moodVocabulary(): string[] {
  const set = new Set<string>()
  for (const a of ALBUMS) {
    a.mood.forEach((m) => set.add(m))
    a.recommendedFor.forEach((m) => set.add(m))
  }
  return [...set].sort()
}
