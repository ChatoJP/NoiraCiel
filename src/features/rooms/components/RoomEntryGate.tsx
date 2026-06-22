'use client'

import { useState } from 'react'
import type { AvatarType } from '../types'

interface Props {
  roomId: string
  roomName: string
  onEnter: (displayName: string, avatarType: AvatarType) => void
}

const AVATARS: { type: AvatarType; label: string; glyph: string; description: string }[] = [
  { type: 'shadow',   label: 'Shadow',   glyph: '◆', description: 'Still, observant' },
  { type: 'ember',    label: 'Ember',    glyph: '◈', description: 'Warm, searching' },
  { type: 'tide',     label: 'Tide',     glyph: '○', description: 'Fluid, open' },
  { type: 'void',     label: 'Void',     glyph: '·', description: 'Quiet, deep' },
  { type: 'revenant', label: 'Revenant', glyph: '◉', description: 'Returning, known' },
  { type: 'still',    label: 'Still',    glyph: '—', description: 'Calm, grounded' },
]

export default function RoomEntryGate({ roomId, roomName, onEnter }: Props) {
  const [name, setName]     = useState('')
  const [avatar, setAvatar] = useState<AvatarType>('shadow')

  function handleEnter() {
    const displayName = name.trim() || 'Listener'
    const stored = { displayName, avatarType: avatar, enteredAt: Date.now() }
    localStorage.setItem(`nr-entry-${roomId}`, JSON.stringify(stored))
    onEnter(displayName, avatar)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleEnter()
  }

  return (
    <div className="nr-entry-gate" role="dialog" aria-modal="true" aria-label={`Enter ${roomName}`}>
      <div className="nr-entry-backdrop" aria-hidden="true" />
      <div className="nr-entry-modal">
        <div className="nr-entry-heading">
          <span className="nr-entry-glyph" aria-hidden="true">◆</span>
          <h2 className="nr-entry-title">Enter {roomName}</h2>
          <p className="nr-entry-subtitle">Choose how you arrive</p>
        </div>

        {/* Avatar selection */}
        <div className="nr-entry-section-label">Your presence</div>
        <div className="nr-entry-avatars" role="radiogroup" aria-label="Choose avatar">
          {AVATARS.map((a) => (
            <button
              key={a.type}
              role="radio"
              aria-checked={avatar === a.type}
              className={`nr-entry-avatar-btn${avatar === a.type ? ' nr-entry-avatar-btn--active' : ''}`}
              onClick={() => setAvatar(a.type)}
              title={a.description}
            >
              <span className="nr-entry-avatar-glyph" aria-hidden="true">{a.glyph}</span>
              <span className="nr-entry-avatar-label">{a.label}</span>
            </button>
          ))}
        </div>
        <p className="nr-entry-avatar-description">{AVATARS.find(a => a.type === avatar)?.description}</p>

        {/* Name input */}
        <div className="nr-entry-section-label">Your name (optional)</div>
        <input
          type="text"
          className="nr-entry-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Leave blank to enter as Listener"
          maxLength={32}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Display name"
        />

        <button className="nr-entry-submit" onClick={handleEnter}>
          <span className="nr-entry-submit-dot" aria-hidden="true" />
          Enter the room
        </button>

        <button className="nr-entry-skip" onClick={() => onEnter('Listener', avatar)}>
          Skip, enter as listener
        </button>

        <p className="nr-entry-notice">No account needed. Just presence.</p>
      </div>
    </div>
  )
}
