'use client'

import type { AvatarType, UserStatus, ReactionType } from '../types'
import { REACTION_LABELS } from '../types'

interface AvatarPresenceProps {
  displayName: string
  avatarType: AvatarType
  status: UserStatus
  currentReaction?: ReactionType
  joinedMinutesAgo: number
  compact?: boolean
}

const AVATAR_GLYPHS: Record<AvatarType, string> = {
  shadow:   '◆',
  ember:    '◈',
  tide:     '◉',
  void:     '◍',
  revenant: '◇',
  still:    '○',
}

const STATUS_LABELS: Record<UserStatus, string> = {
  listening: 'listening',
  away:      'away',
  reacting:  'reacting',
}

export default function AvatarPresence({
  displayName,
  avatarType,
  status,
  currentReaction,
  joinedMinutesAgo,
  compact = false,
}: AvatarPresenceProps) {
  const glyph = AVATAR_GLYPHS[avatarType]
  const joinedLabel = joinedMinutesAgo < 60
    ? `${joinedMinutesAgo}m`
    : `${Math.floor(joinedMinutesAgo / 60)}h`

  return (
    <div className={`nr-presence${compact ? ' nr-presence--compact' : ''}`}>
      <div className={`nr-presence-glyph nr-presence-glyph--${avatarType}`} aria-hidden="true">
        {glyph}
      </div>
      <div className="nr-presence-info">
        <div className="nr-presence-name">{displayName}</div>
        {!compact && (
          <div className="nr-presence-status">
            <span className={`nr-presence-dot nr-presence-dot--${status}`} />
            <span>{STATUS_LABELS[status]}</span>
            <span className="nr-presence-joined">· {joinedLabel}</span>
          </div>
        )}
        {currentReaction && (
          <div className="nr-presence-reaction">
            &ldquo;{REACTION_LABELS[currentReaction]}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}
