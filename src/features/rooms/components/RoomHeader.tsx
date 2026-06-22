'use client'

import Link from 'next/link'
import type { Room } from '../types'

interface RoomHeaderProps {
  room: Room
  liveCount?: number
}

export default function RoomHeader({ room, liveCount }: RoomHeaderProps) {
  const displayCount = liveCount ?? room.memberCount

  return (
    <header className="nr-room-header">
      <div className="nr-room-header-left">
        <Link href="/rooms" className="nr-room-back" aria-label="Back to all rooms">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M8 1L3 6L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Rooms</span>
        </Link>
        <div className="nr-room-header-name">
          {room.name}
          {room.isPremium && <span className="nr-room-premium-badge">private</span>}
        </div>
      </div>
      <div className="nr-room-header-right">
        <div className="nr-room-header-presence">
          <span className="nr-presence-live-dot" aria-hidden="true" />
          <span aria-live="polite" aria-atomic="true">{displayCount} listening</span>
        </div>
        <Link href="/rooms" className="nr-room-leave">
          Leave room
        </Link>
      </div>
    </header>
  )
}
