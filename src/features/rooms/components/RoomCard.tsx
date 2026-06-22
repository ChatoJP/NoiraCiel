'use client'

import Link from 'next/link'
import type { Room } from '../types'

interface RoomCardProps {
  room: Room
}

export default function RoomCard({ room }: RoomCardProps) {
  const isPremium = room.isPremium || room.isPrivate

  return (
    <Link
      href={isPremium ? '#' : `/rooms/${room.id}`}
      className={`nr-card${isPremium ? ' nr-card--premium' : ''}`}
      aria-label={`Enter ${room.name}`}
      onClick={isPremium ? (e) => e.preventDefault() : undefined}
    >
      {/* Gradient background */}
      <div className="nr-card-bg" style={{ background: room.gradient }} aria-hidden="true" />
      <div className="nr-card-fog" aria-hidden="true" />

      {/* Premium lock */}
      {isPremium && (
        <div className="nr-card-lock" aria-label="Private room">
          <span>◈</span>
          <span>by invitation</span>
        </div>
      )}

      <div className="nr-card-content">
        {/* Mood tags */}
        <div className="nr-card-moods">
          {room.mood.slice(0, 3).map((m) => (
            <span key={m} className="nr-mood-tag nr-mood-tag--sm">{m}</span>
          ))}
        </div>

        {/* Room name */}
        <h2 className="nr-card-name">{room.name}</h2>
        <p className="nr-card-tagline">{room.tagline}</p>

        {/* Now playing */}
        <div className="nr-card-track">
          <span className="nr-card-track-icon" aria-hidden="true">♪</span>
          <span>{room.currentTrack.title}</span>
        </div>

        {/* People + CTA */}
        <div className="nr-card-footer">
          <div className="nr-card-people">
            <span className="nr-presence-live-dot" aria-hidden="true" />
            <span>{room.memberCount} inside</span>
          </div>
          <div className={`nr-card-enter${isPremium ? ' nr-card-enter--locked' : ''}`}>
            {isPremium ? 'Private' : 'Enter room'}
          </div>
        </div>
      </div>
    </Link>
  )
}
