export type GhostInstrument =
  | 'piano' | 'guitar' | 'drums' | 'bass'
  | 'strings' | 'orchestra' | 'synth' | 'choir' | 'energy'

export interface GhostPerformanceMeta {
  enabled: boolean
  mode: 'auto' | GhostInstrument
  primaryInstrument: GhostInstrument
  secondaryInstruments?: GhostInstrument[]
  inputPriority?: Array<'midi' | 'stems' | 'audio'>
  visualStyle?: 'noir-cinematic' | 'dark-minimal' | 'atmospheric'
  accentColor?: 'blue-gold' | 'gold-white' | 'blue-silver' | 'red-gold' | 'green-blue'
  showInstrument?: boolean
  showParticles?: boolean
  showWaveform?: boolean
  cameraMode?: 'static' | 'slow-pan' | 'close-up'
  midiPath?: string
  stems?: {
    drums?: string
    bass?: string
    piano?: string
    guitar?: string
    vocals?: string
    strings?: string
    synth?: string
    brass?: string
    choir?: string
  }
}

export interface Track {
  id: string
  title: string
  filename: string
  slug: string
  trackNumber: number | null
  albumCode: string | null
  albumSlug: string | null      // 'main' for root files; slugified subdir name for others
  duration: number | null
  durationFormatted: string
  format: string
  album: string | null
  artist: string | null
  year: number | null
  genre: string | null
  audioUrl: string
  coverArt: string | null
  lyrics: string | null
  hasLyrics: boolean
  videoUrl: string | null
  videoTaskId: string | null
  videoStatus: 'none' | 'pending' | 'generating' | 'complete' | 'failed'
  // Generated visual assets
  songArtUrl: string | null
  socialCardUrl: string | null
  chapterBannerUrl: string | null
  // Rendered lyric video (public/Videos/lyrics/{slug}.mp4)
  lyricVideoUrl: string | null
  // Full music video (R2: generated/kie/music-videos/{slug}.mp4)
  musicVideoUrl: string | null
  // Song metadata badges
  bpm?: number
  songKey?: string
  season?: string
  // Ghost Performance Engine metadata
  ghostPerformance?: GhostPerformanceMeta
}

export interface SongChapter {
  trackNumber: number
  title: string
  emotion: string
  scene: string
  symbols: string
}

export interface AlbumMeta {
  title: string
  artist: string
  spotifyUrl: string
  appleMusicUrl: string
  youtubeUrl: string
  totalDuration: number
  totalDurationFormatted: string
}

export interface Album {
  code: string
  title: string
  tracks: Track[]
  coverArt: string | null
  year: number | null
}

export interface MusicCatalogue {
  tracks: Track[]
  albums: Album[]
  albumMeta: AlbumMeta
  total: number
}

export interface VideoEntry {
  id: string
  title: string
  platform: 'youtube' | 'vimeo' | 'self-hosted' | 'kie'
  url: string
  thumbnail: string | null
  description: string | null
  publishedAt: string | null
  trackId: string | null
}

export interface PressAsset {
  type: 'photo' | 'logo' | 'bio' | 'rider'
  title: string
  filename: string
  url: string
  size: string | null
}

export interface AudioState {
  currentTrack: Track | null
  playlist: Track[]
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: 'none' | 'one' | 'all'
  isLoading: boolean
}
