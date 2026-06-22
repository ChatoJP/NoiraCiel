'use client'

import type { Message } from '../types'
import { AVATAR_GLYPHS } from './avatar-glyphs'

interface RoomMessageProps {
  message: Message
  isOwn?: boolean
}

function formatTime(minutesAgo: number): string {
  if (minutesAgo < 1) return 'just now'
  if (minutesAgo < 60) return `${minutesAgo}m ago`
  return `${Math.floor(minutesAgo / 60)}h ago`
}

export default function RoomMessage({ message, isOwn = false }: RoomMessageProps) {
  const glyph = AVATAR_GLYPHS[message.avatarType]

  return (
    <div className={`nr-message${isOwn ? ' nr-message--own' : ''} nr-message--${message.type}`}>
      <div className={`nr-message-glyph nr-message-glyph--${message.avatarType}`} aria-hidden="true">
        {glyph}
      </div>
      <div className="nr-message-body">
        <div className="nr-message-meta">
          <span className="nr-message-name">{message.displayName}</span>
          <span className="nr-message-time">{formatTime(message.minutesAgo)}</span>
        </div>
        {message.type === 'song-share' && (
          <div className="nr-message-song-tag" aria-label="Song shared">
            ♪ {message.songTitle}
          </div>
        )}
        {message.type === 'reaction-share' && (
          <div className="nr-message-reaction-tag" aria-label="Reaction shared">
            ◈ reacted
          </div>
        )}
        <p className="nr-message-text">{message.text}</p>
      </div>
    </div>
  )
}
