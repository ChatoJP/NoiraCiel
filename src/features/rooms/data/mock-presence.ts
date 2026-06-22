import type { UserPresence } from '../types'

export const MOCK_PRESENCE: Record<string, UserPresence[]> = {
  'atlantic-noir': [
    { userId: 'u1', displayName: 'Silent Visitor',     avatarType: 'shadow',   status: 'listening',  joinedMinutesAgo: 22 },
    { userId: 'u2', displayName: 'The Returning',      avatarType: 'tide',     status: 'reacting',   currentReaction: 'this_song_found_me', joinedMinutesAgo: 45 },
    { userId: 'u3', displayName: 'Salt & Rain',        avatarType: 'void',     status: 'listening',  joinedMinutesAgo: 8 },
    { userId: 'u4', displayName: 'Ocean at 3AM',       avatarType: 'ember',    status: 'listening',  joinedMinutesAgo: 61 },
    { userId: 'u5', displayName: 'Winter Light',       avatarType: 'revenant', status: 'away',       joinedMinutesAgo: 12 },
    { userId: 'u6', displayName: 'The Shore',          avatarType: 'still',    status: 'reacting',   currentReaction: 'i_felt_this_line', joinedMinutesAgo: 33 },
  ],
  'jazz-night': [
    { userId: 'u7',  displayName: 'Smoke & Brass',     avatarType: 'ember',    status: 'listening',  joinedMinutesAgo: 17 },
    { userId: 'u8',  displayName: 'The Witness',       avatarType: 'shadow',   status: 'reacting',   currentReaction: 'stay_in_this_room', joinedMinutesAgo: 55 },
    { userId: 'u9',  displayName: 'Nightwatch',        avatarType: 'still',    status: 'listening',  joinedMinutesAgo: 6 },
    { userId: 'u10', displayName: 'Low Note',          avatarType: 'void',     status: 'listening',  joinedMinutesAgo: 28 },
  ],
  'the-velvet-room': [
    { userId: 'u11', displayName: 'Dark Signal',       avatarType: 'void',     status: 'listening',  joinedMinutesAgo: 14 },
    { userId: 'u12', displayName: 'Frequency',         avatarType: 'revenant', status: 'reacting',   currentReaction: 'this_feels_like_me', joinedMinutesAgo: 38 },
    { userId: 'u13', displayName: 'The Texture',       avatarType: 'shadow',   status: 'listening',  joinedMinutesAgo: 5 },
  ],
  'ghost-performance': [
    { userId: 'u14', displayName: 'Listening Alone',   avatarType: 'still',    status: 'listening',  joinedMinutesAgo: 41 },
    { userId: 'u15', displayName: 'The Absence',       avatarType: 'shadow',   status: 'reacting',   currentReaction: 'i_need_silence_after_this', joinedMinutesAgo: 19 },
    { userId: 'u16', displayName: 'Piano Hours',       avatarType: 'ember',    status: 'listening',  joinedMinutesAgo: 66 },
    { userId: 'u17', displayName: 'Unnamed Feeling',   avatarType: 'revenant', status: 'listening',  joinedMinutesAgo: 3 },
  ],
  'after-midnight': [
    { userId: 'u18', displayName: 'Can\'t Sleep',      avatarType: 'void',     status: 'listening',  joinedMinutesAgo: 7 },
    { userId: 'u19', displayName: 'The Vigil',         avatarType: 'still',    status: 'reacting',   currentReaction: 'this_song_found_me', joinedMinutesAgo: 29 },
    { userId: 'u20', displayName: 'Almost Morning',    avatarType: 'tide',     status: 'listening',  joinedMinutesAgo: 53 },
    { userId: 'u21', displayName: 'Known by Fire',     avatarType: 'ember',    status: 'listening',  joinedMinutesAgo: 11 },
    { userId: 'u22', displayName: 'The Wait',          avatarType: 'shadow',   status: 'away',       joinedMinutesAgo: 34 },
  ],
  'the-roots-room': [
    { userId: 'u23', displayName: 'Inherited',         avatarType: 'still',    status: 'listening',  joinedMinutesAgo: 48 },
    { userId: 'u24', displayName: 'Grandmother\'s Song', avatarType: 'ember', status: 'reacting',   currentReaction: 'i_felt_this_line', joinedMinutesAgo: 22 },
    { userId: 'u25', displayName: 'The Deep Root',     avatarType: 'shadow',   status: 'listening',  joinedMinutesAgo: 9 },
  ],
}

export function getPresenceForRoom(roomId: string): UserPresence[] {
  return MOCK_PRESENCE[roomId] ?? []
}
