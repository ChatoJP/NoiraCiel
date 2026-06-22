import type { Message } from '../types'

export const MOCK_CHAT: Record<string, Message[]> = {
  'atlantic-noir': [
    { id: 'm1', userId: 'u4', displayName: 'Ocean at 3AM',  avatarType: 'ember',    text: 'this is the first room I\'ve been in where the music actually matches how I feel', minutesAgo: 58, type: 'text' },
    { id: 'm2', userId: 'u2', displayName: 'The Returning', avatarType: 'tide',     text: 'same. something about the ocean metaphors in this album...', minutesAgo: 52, type: 'text' },
    { id: 'm3', userId: 'u6', displayName: 'The Shore',     avatarType: 'still',    text: 'I grew up by the sea and this sounds exactly like leaving it', minutesAgo: 44, type: 'text' },
    { id: 'm4', userId: 'u1', displayName: 'Silent Visitor', avatarType: 'shadow',  text: '«Side by Side» has been playing on repeat for weeks', minutesAgo: 38, type: 'text' },
    { id: 'm5', userId: 'u2', displayName: 'The Returning', avatarType: 'tide',     text: '↑ sent this song', minutesAgo: 35, type: 'song-share', songTitle: 'Side by Side' },
    { id: 'm6', userId: 'u3', displayName: 'Salt & Rain',   avatarType: 'void',     text: 'the silence after this track is part of the music', minutesAgo: 21, type: 'text' },
    { id: 'm7', userId: 'u6', displayName: 'The Shore',     avatarType: 'still',    text: 'there\'s something about listening to the same song as strangers... it\'s not lonely', minutesAgo: 14, type: 'text' },
    { id: 'm8', userId: 'u5', displayName: 'Winter Light',  avatarType: 'revenant', text: 'exactly. no small talk. just this.', minutesAgo: 9, type: 'text' },
  ],
  'jazz-night': [
    { id: 'm9',  userId: 'u8',  displayName: 'The Witness', avatarType: 'shadow',  text: 'the piano on this track is ridiculous', minutesAgo: 48, type: 'text' },
    { id: 'm10', userId: 'u7',  displayName: 'Smoke & Brass', avatarType: 'ember', text: 'late night jazz hits different', minutesAgo: 42, type: 'text' },
    { id: 'm11', userId: 'u9',  displayName: 'Nightwatch', avatarType: 'still',    text: '2am, drink in hand, this is exactly right', minutesAgo: 31, type: 'text' },
    { id: 'm12', userId: 'u10', displayName: 'Low Note',   avatarType: 'void',     text: 'the bass line in «The Heart Comes Home» is everything', minutesAgo: 18, type: 'text' },
    { id: 'm13', userId: 'u8',  displayName: 'The Witness', avatarType: 'shadow',  text: '↑ felt this line', minutesAgo: 12, type: 'reaction-share' },
  ],
  'after-midnight': [
    { id: 'm14', userId: 'u19', displayName: 'The Vigil',     avatarType: 'still', text: 'couldn\'t sleep. found this room. it\'s exactly what I needed', minutesAgo: 24, type: 'text' },
    { id: 'm15', userId: 'u18', displayName: 'Can\'t Sleep',  avatarType: 'void',  text: 'same. there\'s something reassuring about knowing other people are awake', minutesAgo: 19, type: 'text' },
    { id: 'm16', userId: 'u20', displayName: 'Almost Morning', avatarType: 'tide', text: '«Leave a Light On» was written for exactly this hour', minutesAgo: 11, type: 'text' },
    { id: 'm17', userId: 'u21', displayName: 'Known by Fire', avatarType: 'ember', text: 'the line "I never went to sleep without a reason" — that\'s the whole album', minutesAgo: 5, type: 'text' },
  ],
}

export function getChatForRoom(roomId: string): Message[] {
  return MOCK_CHAT[roomId] ?? []
}
