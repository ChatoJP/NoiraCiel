import type { Track } from './types'

export const PARTY_PEOPLE_ALBUM_SLUGS = ['ritual-voltage', 'concrete-saints', 'velvet-circuit', 'drum-oracle'] as const

export interface PartyTheme {
  name: string
  label: string
  mood: string
  accentRgb: string
  bgTintRgb: string
}

export interface PartyTrack {
  slug: string
  num: number
  title: string
  albumSlug: string
  albumTitle: string
  description: string
  tags: string[]
  bpm: number
  key: string
  energyLevel: number
  arrangementPrompt: string
  soundDesignPrompt: string
  mixMasterNotes: string
  djTransitionNotes: string
  visualizerPrompt: string
  filmPrompt: string
  audioUrl: string | null
  duration: number | null
  durationFormatted: string
  trackArtUrl: string | null
  bannerUrl: string | null
  ready: boolean
}

export interface PartyAlbum {
  slug: string
  title: string
  genre: string
  concept: string
  statement: string
  visualIdentity: string
  bpmRange: [number, number]
  negativeTags: string[]
  theme: PartyTheme
  tracks: PartyTrack[]
}

/** Maps a ready PartyTrack onto the shared Track shape so it can play
 *  through the site's existing global AudioContext/mini-player. */
export function toPlayableTrack(t: PartyTrack): Track {
  return {
    id: `party-${t.albumSlug}-${t.slug}`,
    title: t.title,
    filename: `${String(t.num).padStart(2, '0')}_${t.slug}.mp3`,
    slug: t.slug,
    trackNumber: t.num,
    albumCode: null,
    albumSlug: t.albumSlug,
    duration: t.duration,
    durationFormatted: t.durationFormatted,
    format: 'MP3',
    album: t.albumTitle,
    artist: 'NoiraCiel',
    year: null,
    genre: null,
    audioUrl: t.audioUrl ?? '',
    coverArt: t.trackArtUrl,
    lyrics: null,
    hasLyrics: false,
    videoUrl: null,
    videoTaskId: null,
    videoStatus: 'none',
    songArtUrl: t.trackArtUrl,
    socialCardUrl: null,
    chapterBannerUrl: t.bannerUrl,
    lyricVideoUrl: null,
    musicVideoUrl: null,
  }
}
