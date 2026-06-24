/**
 * noiracielRecommendationEngine.ts — the curator's logic.
 *
 * Given a user's message (and optionally the day's glyph), it detects an emotional
 * intent and recommends a NoiraCiel album, a song, a connected book chapter, and a
 * short reason written in the NoiraCiel voice.
 *
 * This is a deterministic, dependency-light scorer — it does NOT call the model.
 * The Speaker API uses its output as grounding so the AI recommends real content
 * rather than inventing it.
 */

import {
  ALBUMS,
  BOOKS,
  loadSongIndex,
  getBookForAlbum,
  type KnowledgeAlbum,
  type KnowledgeBook,
  type SongEntry,
} from '@/data/noiracielKnowledge'
import type { DailyGlyph } from '@/data/mayanInterpretations'

export interface Recommendation {
  detectedMoods: string[]
  recommendedAlbum: KnowledgeAlbum | null
  recommendedTrack: SongEntry | null
  recommendedBook: KnowledgeBook | null
  reason: string
}

/**
 * Maps loose, natural-language feelings the user might type onto the canonical
 * mood / recommendedFor vocabulary used in the knowledge layer.
 */
const FEELING_SYNONYMS: Record<string, string[]> = {
  grief: ['grief', 'loss', 'mourning', 'death', 'died', 'gone', 'miss', 'missing', 'funeral', 'goodbye'],
  loneliness: ['loneliness', 'lonely', 'alone', 'isolated', 'empty', 'abandoned'],
  love: ['love', 'in love', 'romance', 'romantic', 'beloved', 'heart', 'tenderness'],
  courage: ['courage', 'brave', 'strength', 'strong', 'fight', 'face', 'fearless'],
  anger: ['anger', 'angry', 'rage', 'furious', 'mad', 'resentment'],
  joy: ['joy', 'happy', 'happiness', 'joyful', 'celebrate', 'celebration', 'good mood'],
  calm: ['calm', 'peace', 'peaceful', 'rest', 'relax', 'quiet', 'still', 'stillness', 'unwind'],
  energy: ['energy', 'energetic', 'pumped', 'hype', 'workout', 'motivate', 'motivation', 'awake'],
  restlessness: ['restless', 'restlessness', 'anxious', 'anxiety', 'agitated', 'cannot sit', "can't sit", 'on edge'],
  transformation: ['transformation', 'change', 'changing', 'transform', 'rebirth', 'becoming', 'new chapter'],
  saudade: ['saudade', 'longing', 'yearning', 'ache', 'homesick', 'nostalgia', 'nostalgic'],
  loneliness_lost: ['lost', 'adrift', 'directionless', 'confused', 'searching', 'don\'t know', 'no meaning'],
  beauty: ['beautiful', 'beauty', 'lovely', 'gorgeous', 'pretty'],
  strange: ['strange', 'weird', 'odd', 'eerie', 'unusual', 'experimental', 'different'],
  darkness: ['dark', 'darkness', 'shadow', 'heavy', 'bleak', 'night', 'noir'],
  vulnerability: ['vulnerable', 'fragile', 'breaking', 'broken', 'sensitive', 'exposed'],
  hope: ['hope', 'hopeful', 'faith', 'keep going', 'persevere', 'perseverance'],
  memory: ['memory', 'memories', 'childhood', 'remember', 'the past', 'years ago'],
}

// Canonical → the keyword that actually appears in album recommendedFor / mood.
const CANONICAL_TO_TAGS: Record<string, string[]> = {
  grief: ['grief', 'loss', 'aching'],
  loneliness: ['loneliness', 'solitude'],
  love: ['love', 'romance', 'tender'],
  courage: ['courage', 'resilience', 'self-belief'],
  anger: ['anger', 'catharsis'],
  joy: ['joy', 'celebration', 'play'],
  calm: ['calm', 'rest', 'ease', 'healing'],
  energy: ['energy', 'motivation', 'adrenaline'],
  restlessness: ['restlessness', 'letting go', 'searching'],
  transformation: ['transformation', 'darkness'],
  saudade: ['saudade', 'distance', 'longing'],
  loneliness_lost: ['searching', 'letting go', 'meaning', 'reflection'],
  beauty: ['strange beauty', 'tenderness', 'wonder'],
  strange: ['strange beauty', 'experimental', 'strange'],
  darkness: ['darkness', 'night', 'intensity'],
  vulnerability: ['vulnerability', 'fragility', 'tenderness'],
  hope: ['hope', 'perseverance', 'starting over'],
  memory: ['memory', 'nostalgia', 'childhood'],
}

/** Detect canonical feelings present in a free-text message. */
export function detectMoods(message: string): string[] {
  const text = ` ${message.toLowerCase()} `
  const found: string[] = []
  for (const [canonical, words] of Object.entries(FEELING_SYNONYMS)) {
    if (words.some((w) => text.includes(w))) found.push(canonical)
  }
  return found
}

/** Score an album against a set of target tags. */
function scoreAlbum(album: KnowledgeAlbum, tags: string[]): number {
  const hay = new Set([...album.mood, ...album.recommendedFor].map((s) => s.toLowerCase()))
  let score = 0
  for (const tag of tags) {
    if (hay.has(tag.toLowerCase())) score += 2
    else {
      // partial credit for substring overlaps (e.g. "strange" in "strange beauty")
      for (const h of hay) {
        if (h.includes(tag.toLowerCase()) || tag.toLowerCase().includes(h)) {
          score += 1
          break
        }
      }
    }
  }
  return score
}

/** Pick one track from an album's catalogue entries (deterministic by seed). */
function pickTrack(albumId: string, seed: number): SongEntry | null {
  const songs = loadSongIndex().filter((s) => s.albumSlug === albumId && s.slug)
  if (songs.length === 0) return null
  return songs[seed % songs.length]
}

/**
 * recommend — the main entry point.
 *
 * @param message  the user's message
 * @param glyph    today's daily glyph (optional; nudges the choice + reason)
 */
export function recommend(message: string, glyph?: DailyGlyph): Recommendation {
  const detected = detectMoods(message)

  // Build the target tag set: explicit feelings + the day's symbolic leanings.
  const tags: string[] = []
  for (const m of detected) tags.push(...(CANONICAL_TO_TAGS[m] ?? [m]))
  if (glyph) {
    // The glyph's sign keywords softly tilt the recommendation.
    tags.push(...glyph.sign.keywords.map((k) => k.toLowerCase()))
  }

  // Score every album.
  const ranked = ALBUMS
    .map((a) => ({ album: a, score: scoreAlbum(a, tags) }))
    .sort((a, b) => b.score - a.score)

  // Deterministic seed from the glyph (or a default) so repeats feel stable per day.
  const seed = glyph ? glyph.mayan.julianDayNumber : 0

  let recommendedAlbum: KnowledgeAlbum | null
  if (ranked[0] && ranked[0].score > 0) {
    recommendedAlbum = ranked[0].album
  } else if (glyph) {
    // No clear emotional signal — let the day choose.
    recommendedAlbum = ALBUMS[seed % ALBUMS.length]
  } else {
    recommendedAlbum = null
  }

  const recommendedTrack = recommendedAlbum ? pickTrack(recommendedAlbum.id, seed) : null
  const recommendedBook = recommendedAlbum
    ? getBookForAlbum(recommendedAlbum.id) ?? BOOKS[seed % BOOKS.length]
    : null

  // Compose a short reason in the NoiraCiel register.
  const reason = buildReason(detected, recommendedAlbum, glyph)

  return {
    detectedMoods: detected,
    recommendedAlbum,
    recommendedTrack,
    recommendedBook,
    reason,
  }
}

function buildReason(
  moods: string[],
  album: KnowledgeAlbum | null,
  glyph?: DailyGlyph,
): string {
  if (!album) {
    return glyph
      ? `Today's glyph — ${glyph.mayan.tzolkin.display} — favours ${glyph.sign.keywords.slice(0, 2).join(' and ')}.`
      : 'Tell me what you are carrying, and I will find the right place to begin.'
  }

  const moodPhrase = moods.length
    ? `what you are carrying (${moods.map((m) => m.replace('_', ' ')).join(', ')})`
    : 'where you are right now'

  const glyphPhrase = glyph
    ? ` Today's glyph favours ${glyph.sign.keywords.slice(0, 2).join(' and ')}, which is why ${album.title} feels right.`
    : ''

  return `For ${moodPhrase}, I would place you near ${album.title} — ${album.world}.${glyphPhrase}`
}
