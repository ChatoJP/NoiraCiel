export type RoomAccentColor = 'blue-gold' | 'gold-white' | 'violet-gold' | 'red-gold' | 'green-blue' | 'silver-blue'
export type AvatarType = 'shadow' | 'ember' | 'tide' | 'void' | 'revenant' | 'still'
export type UserStatus = 'listening' | 'away' | 'reacting'
export type MessageType = 'text' | 'song-share' | 'reaction-share'

export type ReactionType =
  | 'this_song_found_me'
  | 'i_felt_this_line'
  | 'stay_in_this_room'
  | 'send_this_song'
  | 'listen_together'
  | 'this_feels_like_me'
  | 'i_need_silence_after_this'

export const REACTION_LABELS: Record<ReactionType, string> = {
  this_song_found_me:           'This song found me',
  i_felt_this_line:             'I felt this line',
  stay_in_this_room:            'Stay in this room',
  send_this_song:               'Send this song',
  listen_together:              'Listen together',
  this_feels_like_me:           'This feels like me',
  i_need_silence_after_this:    'I need silence after this',
}

export interface MockTrack {
  id: string
  title: string
  artist: string
  duration: string
  albumName: string
  albumSlug?: string
  audioUrl?: string
}

export interface Room {
  id: string
  name: string
  tagline: string
  description: string
  mood: string[]
  album?: string
  albumSlug?: string
  currentTrack: MockTrack
  queue?: MockTrack[]
  accentColor: RoomAccentColor
  gradient: string
  isPremium: boolean
  isPrivate: boolean
  memberCount: number
  peakMembers: number
}

export interface UserPresence {
  userId: string
  displayName: string
  avatarType: AvatarType
  status: UserStatus
  currentReaction?: ReactionType
  joinedMinutesAgo: number
}

export interface Message {
  id: string
  userId: string
  displayName: string
  avatarType: AvatarType
  text: string
  minutesAgo: number
  type: MessageType
  songTitle?: string
}
