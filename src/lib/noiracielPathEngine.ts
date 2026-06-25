/**
 * noiracielPathEngine.ts — SERVER-ONLY content binding for NoiraCiel Paths.
 *
 * Binds a path (see the client-safe src/lib/noiracielPaths) to REAL content
 * (albums/songs/books from src/data/noiracielKnowledge, which reads the catalogue
 * via fs) and to today's symbolic time, and builds the Speaker personalization
 * block. Do not import this from client components — use noiracielPaths there.
 */

import {
  ALBUMS,
  getAlbumById,
  getBookForAlbum,
  loadSongIndex,
  BOOKS,
} from '@/data/noiracielKnowledge'
import type { DailyGlyph, WaveReading } from '@/data/mayanInterpretations'
import {
  type NoiraCielPath,
  type PathResult,
  type SpeakerMode,
  type UserProfile,
} from '@/types/noiracielOnboarding'
import { PATHS, PATH_REFLECTIONS, getPathById, scoreToPath } from '@/lib/noiracielPaths'
import { getConceptById } from '@/data/noiracielPhysicsConcepts'

// Re-export the client-safe path primitives so existing server imports keep working.
export { PATHS, getPathById, scoreToPath }

// Album ids that have a dedicated /book/<slug> route. Others fall back to /book.
const BOOK_ROUTES: Record<string, string> = {
  main: '/book/the-life-lessons',
  'jazz-sessions': '/book/jazz-sessions',
  'blind-angel': '/book/blind-angel',
  'whats-youre-made-of': '/book/whats-youre-made-of',
  'the-sacred-drift': '/book/the-sacred-drift',
}

function bookHrefFor(albumId: string): string {
  return BOOK_ROUTES[albumId] ?? '/book'
}

// Pick a representative track from an album, deterministically by path id.
function pickPathSong(albumId: string, seed: number) {
  const songs = loadSongIndex().filter((s) => s.albumSlug === albumId && s.slug)
  if (songs.length === 0) return null
  return songs[seed % songs.length]
}

function seedFromString(s: string): number {
  let n = 0
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0
  return n
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * buildPathResult — bind a path to a real album/song/book/room and to today's
 * glyph + the current wave. `glyph`/`wave` are optional (Mayan layer may be off).
 */
export function buildPathResult(
  path: NoiraCielPath,
  opts: { glyph?: DailyGlyph; wave?: WaveReading } = {},
): PathResult {
  const album = getAlbumById(path.albumIds[0]) ?? ALBUMS[0]
  const seed = seedFromString(path.id)
  const song = pickPathSong(album.id, seed)
  const book = getBookForAlbum(album.id) ?? BOOKS.find((b) => path.albumIds.includes(b.connectedAlbum ?? ''))

  const dailyGlyphConnection = opts.glyph
    ? `Today's glyph is ${opts.glyph.mayan.tzolkin.display} — ${opts.glyph.sign.keywords.slice(0, 2).join(', ')}. To ${path.name}, it reads as an invitation toward ${path.emotionalWorld.toLowerCase().replace(/\.$/, '')}.`
    : 'The Daily Glyph is resting for you — you chose to enter without it. You can turn it on any time.'

  const waveConnection = opts.wave
    ? `You meet ${opts.wave.wave.name} at day ${opts.wave.wave.currentPosition} of 13. ${capitalize(path.name)} ${path.waveStyle}.`
    : `When you are ready, ${path.name.toLowerCase()} ${path.waveStyle}.`

  const concepts = path.physicsAffinity.map((id) => getConceptById(id)).filter(Boolean)
  const fieldConnection =
    concepts.length > 0
      ? `In the Field, you resonate with ${concepts.map((c) => c!.name).join(' and ')}. ${concepts[0]!.noiracielTranslation}`
      : 'The Field is open to you whenever you want structure for what you feel.'

  return {
    path,
    emotionalWorld: path.emotionalWorld,
    albumTitle: album.title,
    albumHref: album.href,
    albumWorld: album.world,
    songTitle: song?.title ?? null,
    songHref: song?.href ?? null,
    bookTitle: book?.title ?? null,
    bookHref: bookHrefFor(album.id),
    roomId: path.roomId,
    roomName: path.roomName,
    speakerMode: path.speakerMode,
    glyphAffinity: path.glyphAffinity,
    physicsAffinity: path.physicsAffinity,
    fieldConnection,
    dailyGlyphConnection,
    waveConnection,
    reflectionQuestion: PATH_REFLECTIONS[path.id],
    firstAction: path.dailyRitual,
  }
}

// ── Speaker personalization ──────────────────────────────────────────────────

const MAYAN_PHRASE: Record<UserProfile['mayanLayer'], string> = {
  full: 'They want the symbolic-time layer included — read today’s glyph and the current 13-day wave fully.',
  light: 'They want the symbolic-time layer only lightly — touch the glyph or wave briefly, do not lead with it.',
  off: 'They have turned the symbolic-time layer off — do not bring up the glyph or the wave unless they ask.',
}

/**
 * getPersonalizedSpeakerContext — a short grounding block for the Speaker prompt
 * so it greets and reads the day through the listener's path. Safe to call with
 * a partial/loose profile (validates fields).
 */
export function getPersonalizedSpeakerContext(
  profile: Partial<UserProfile> | null | undefined,
  glyph?: DailyGlyph,
  wave?: WaveReading,
): string {
  if (!profile || !profile.pathId) return ''
  const path = getPathById(profile.pathId)
  if (!path) return ''

  const mode = (profile.speakerMode as SpeakerMode) || path.speakerMode
  const layer = profile.mayanLayer ?? 'full'
  const affinity = (profile.glyphAffinity && profile.glyphAffinity.length
    ? profile.glyphAffinity
    : path.glyphAffinity).slice(0, 3)
  const physics = (profile.physicsAffinity && profile.physicsAffinity.length
    ? profile.physicsAffinity
    : path.physicsAffinity)
    .map((id) => getConceptById(id)?.name)
    .filter(Boolean)
    .slice(0, 2)

  const lines = [
    'RETURNING LISTENER (personalise gently — do not recite this back as a list):',
    `• Their NoiraCiel Path is ${path.name}. ${path.description}`,
    `• Emotional world: ${path.emotionalWorld}`,
    `• Speak in the register of a ${mode}.`,
    `• Glyph affinity: ${affinity.join(', ')}.`,
    physics.length ? `• Field (physics) affinity: ${physics.join(', ')} — use as metaphor only, never as proof.` : '',
    `• ${MAYAN_PHRASE[layer]}`,
    `• You may greet them as ${path.name} when it feels natural, never forced.`,
    `• Interpret today through their world: ${path.emotionalWorld.toLowerCase()}`,
  ].filter(Boolean)
  if (layer !== 'off' && wave) {
    lines.push(`• In the current ${wave.wave.name}, this listener ${path.waveStyle}.`)
  }
  return lines.join('\n')
}
