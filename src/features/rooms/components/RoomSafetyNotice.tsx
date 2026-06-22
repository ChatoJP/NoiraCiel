'use client'

import { useState } from 'react'

export default function RoomSafetyNotice() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="nr-safety" role="note" aria-label="Community guidelines">
      <div className="nr-safety-content">
        <span className="nr-safety-glyph" aria-hidden="true">◈</span>
        <p className="nr-safety-text">
          NoiraCiel Rooms is a community built on resonance, not appearance.
          Be present. Be honest. No harassment, no spam.{' '}
          <button className="nr-safety-link" onClick={() => {}}>Community guidelines</button>
        </p>
        <button
          className="nr-safety-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notice"
        >
          ×
        </button>
      </div>
    </div>
  )
}
