import fs from 'fs'
import path from 'path'
import { PARTY_PEOPLE_ALBUM_SLUGS, type PartyAlbum, type PartyTrack } from './partyPeopleTypes'

export { PARTY_PEOPLE_ALBUM_SLUGS, toPlayableTrack } from './partyPeopleTypes'
export type { PartyAlbum, PartyTrack, PartyTheme } from './partyPeopleTypes'

const DATA_DIR = path.join(process.cwd(), 'data', 'party-people')

function readJSON<T>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T } catch { return null }
}

export function loadPartyAlbum(slug: string): PartyAlbum | null {
  const dir = path.join(DATA_DIR, slug)
  const concept = readJSON<any>(path.join(dir, 'concept.json'))
  const tracksRaw = readJSON<any[]>(path.join(dir, 'tracks.json'))
  const status = readJSON<Record<string, any>>(path.join(dir, 'status.json')) ?? {}
  if (!concept || !tracksRaw) return null

  const tracks: PartyTrack[] = tracksRaw.map((t) => {
    const s = status[t.slug] ?? {}
    const music = s.music ?? {}
    const trackArt = s.trackArt ?? {}
    const banner = s.banner ?? {}
    return {
      slug: t.slug,
      num: t.num,
      title: t.title,
      albumSlug: concept.slug,
      albumTitle: concept.title,
      description: t.description,
      tags: t.tags ?? [],
      bpm: t.bpm,
      key: t.key,
      energyLevel: t.energyLevel,
      arrangementPrompt: t.arrangementPrompt,
      soundDesignPrompt: t.soundDesignPrompt,
      mixMasterNotes: t.mixMasterNotes,
      djTransitionNotes: t.djTransitionNotes,
      visualizerPrompt: t.visualizerPrompt,
      filmPrompt: t.filmPrompt,
      audioUrl: music.state === 'complete' ? music.audioUrl : null,
      duration: music.duration ?? null,
      durationFormatted: music.durationFormatted ?? '',
      trackArtUrl: trackArt.state === 'complete' ? trackArt.url : null,
      bannerUrl: banner.state === 'complete' ? banner.url : null,
      ready: music.state === 'complete',
    }
  })

  return {
    slug: concept.slug,
    title: concept.title,
    genre: concept.genre,
    concept: concept.concept,
    statement: concept.statement,
    visualIdentity: concept.visualIdentity,
    bpmRange: concept.bpmRange,
    negativeTags: concept.negativeTags ?? [],
    theme: concept.theme,
    tracks,
  }
}

export function loadAllPartyAlbums(): PartyAlbum[] {
  return PARTY_PEOPLE_ALBUM_SLUGS
    .map((slug) => loadPartyAlbum(slug))
    .filter((a): a is PartyAlbum => a !== null)
}
