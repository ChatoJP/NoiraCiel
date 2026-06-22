'use client'

import type { UserPresence } from '../types'
import AvatarPresence from './AvatarPresence'

interface RoomPeoplePanelProps {
  users: UserPresence[]
  memberCount: number
  liveCount?: number
}

// R11: Bartender character — fixed presence at top of people list
function BartenderPresence() {
  return (
    <div
      role="listitem"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.45rem 0.5rem',
        borderBottom: '1px solid rgba(196,149,58,0.1)',
        marginBottom: '0.25rem',
      }}
    >
      <span style={{ fontSize: '0.95rem', lineHeight: 1, color: 'rgba(196,149,58,0.8)', flexShrink: 0 }}>
        ◈
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'rgba(242,237,227,0.75)' }}>
          The Bartender
        </span>
        <span style={{ display: 'block', fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: '0.6rem', color: 'rgba(196,149,58,0.55)', marginTop: '0.1rem' }}>
          always here
        </span>
      </div>
      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', flexShrink: 0 }}>
        staff
      </span>
    </div>
  )
}

export default function RoomPeoplePanel({ users, memberCount, liveCount }: RoomPeoplePanelProps) {
  const displayCount    = liveCount ?? memberCount
  const listeningCount  = users.filter(u => u.status !== 'away').length

  return (
    <div className="nr-people">
      <div className="nr-people-header">
        <span className="nr-people-title">In this room</span>
        <span className="nr-people-count">
          <span className="nr-people-dot" aria-hidden="true" />
          <span className="nr-people-count-num" aria-live="polite" aria-atomic="true">
            {displayCount}
          </span>
        </span>
      </div>
      <div className="nr-people-subtitle">
        {listeningCount} listening now
      </div>
      <div className="nr-people-list" role="list" aria-label="People in room">
        {/* R11: Bartender always at the top */}
        <BartenderPresence />
        {users.map((user) => (
          <div key={user.userId} role="listitem">
            <AvatarPresence
              displayName={user.displayName}
              avatarType={user.avatarType}
              status={user.status}
              currentReaction={user.currentReaction}
              joinedMinutesAgo={user.joinedMinutesAgo}
            />
          </div>
        ))}
        {displayCount > users.length && (
          <div className="nr-people-more">
            + {displayCount - users.length} more listening quietly
          </div>
        )}
      </div>
    </div>
  )
}
