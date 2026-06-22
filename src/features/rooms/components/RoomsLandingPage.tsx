'use client'

import { useState } from 'react'
import type { Room } from '../types'
import RoomCard from './RoomCard'

interface RoomsLandingPageProps {
  rooms: Room[]
}

const FILTER_CATEGORIES = [
  { id: 'all',        label: 'All Rooms',  moods: [] as string[] },
  { id: 'jazz',       label: 'Jazz',       moods: ['jazz', 'warmth', 'honest'] },
  { id: 'folk',       label: 'Folk',       moods: ['folk', 'roots', 'earth', 'family'] },
  { id: 'electronic', label: 'Electronic', moods: ['electronic', 'trip-hop', 'atmospheric'] },
  { id: 'ambient',    label: 'Ambient',    moods: ['ambient', 'spiritual', 'drift', 'instrumental'] },
  { id: 'late-night', label: 'Late Night', moods: ['insomnia', '3am', 'late-night', 'noir', 'longing'] },
  { id: 'cinematic',  label: 'Cinematic',  moods: ['cinematic', 'dark', 'ghost'] },
  { id: 'world',      label: 'World',      moods: ['tribal', 'global', 'ancestral', 'percussion'] },
]

function matchesFilter(room: Room, filterId: string): boolean {
  if (filterId === 'all') return true
  const cat = FILTER_CATEGORIES.find((c) => c.id === filterId)
  if (!cat || cat.moods.length === 0) return true
  return room.mood.some((m) => cat.moods.includes(m.toLowerCase()))
}

export default function RoomsLandingPage({ rooms }: RoomsLandingPageProps) {
  const [activeFilter, setActiveFilter] = useState('all')

  const totalListening = rooms.reduce((sum, r) => sum + r.memberCount, 0)
  const allPublic  = rooms.filter((r) => !r.isPremium && !r.isPrivate)
  const allPrivate = rooms.filter((r) => r.isPremium || r.isPrivate)

  const publicRooms  = allPublic.filter((r) => matchesFilter(r, activeFilter))
  const privateRooms = allPrivate.filter((r) => matchesFilter(r, activeFilter))

  return (
    <div className="nr-rooms">
      {/* Hero */}
      <section className="nr-rooms-hero">
        <div className="nr-rooms-hero-bg" aria-hidden="true" />
        <div className="nr-rooms-hero-fog" aria-hidden="true" />
        <div className="nr-rooms-hero-content">
          <div className="nr-rooms-eyebrow">NoiraCiel Rooms</div>
          <h1 className="nr-rooms-title">
            Meet people through<br />the songs that find you.
          </h1>
          <p className="nr-rooms-subtitle">
            Not dating. Resonance.
          </p>
          <p className="nr-rooms-description">
            Enter a room. Hear the music. Find the ones who feel it too.
          </p>
          <div className="nr-rooms-live-bar">
            <span className="nr-presence-live-dot" aria-hidden="true" />
            <span>{totalListening} people listening across {allPublic.length} rooms right now</span>
          </div>
        </div>
      </section>

      {/* What this is */}
      <section className="nr-rooms-manifesto">
        <div className="nr-rooms-manifesto-inner">
          <p>You do not match by appearance. You match by resonance.</p>
          <p>A virtual house for people who feel music deeply.</p>
          <p>Enter a room. Stay as long as the music asks you to.</p>
        </div>
      </section>

      {/* Mood filter bar */}
      <div className="nr-rooms-filter-bar" role="tablist" aria-label="Filter rooms by mood">
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeFilter === cat.id}
            className={`nr-rooms-filter-pill${activeFilter === cat.id ? ' nr-rooms-filter-pill--active' : ''}`}
            onClick={() => setActiveFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Room grid */}
      {publicRooms.length > 0 && (
        <section className="nr-rooms-grid-section">
          <div className="nr-rooms-grid-label">
            {activeFilter === 'all' ? 'Open Rooms' : FILTER_CATEGORIES.find((c) => c.id === activeFilter)?.label}
          </div>
          <div className="nr-rooms-grid">
            {publicRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      )}

      {publicRooms.length === 0 && (
        <section className="nr-rooms-grid-section">
          <p className="nr-rooms-empty">No rooms match this vibe right now.</p>
        </section>
      )}

      {/* Private rooms */}
      {privateRooms.length > 0 && (
        <section className="nr-rooms-grid-section nr-rooms-grid-section--private">
          <div className="nr-rooms-grid-label">
            Private Rooms
            <span className="nr-rooms-grid-label-note">by invitation only</span>
          </div>
          <div className="nr-rooms-grid">
            {privateRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="nr-rooms-footer">
        <p>NoiraCiel Rooms is built around shared music, not shared profiles.</p>
        <p>Private connections begin with consent. No swiping. No ranking. No noise.</p>
      </footer>
    </div>
  )
}
