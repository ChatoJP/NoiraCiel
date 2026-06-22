'use client'

import { useState } from 'react'

interface PrivateListeningInviteProps {
  targetName: string
  onClose: () => void
}

export default function PrivateListeningInvite({ targetName, onClose }: PrivateListeningInviteProps) {
  const [sent, setSent] = useState(false)

  function handleSend() {
    // Phase 2: send real invitation via backend
    setSent(true)
  }

  return (
    <div className="nr-invite-overlay" role="dialog" aria-modal="true" aria-label={`Invite ${targetName} to listen privately`}>
      <div className="nr-invite-panel">
        <button className="nr-invite-close" onClick={onClose} aria-label="Close">×</button>

        {!sent ? (
          <>
            <div className="nr-invite-glyph" aria-hidden="true">◇</div>
            <h2 className="nr-invite-title">Listen together?</h2>
            <p className="nr-invite-description">
              Invite <strong>{targetName}</strong> to a private listening room — just the two of you, the same song, no obligation to speak.
            </p>
            <p className="nr-invite-note">
              They can accept or decline. No pressure. Private listening is not a chat request.
            </p>
            <div className="nr-invite-actions">
              <button className="nr-invite-send" onClick={handleSend}>
                Send invitation
              </button>
              <button className="nr-invite-cancel" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="nr-invite-glyph" aria-hidden="true">◈</div>
            <h2 className="nr-invite-title">Invitation sent</h2>
            <p className="nr-invite-description">
              If {targetName} accepts, a private room will open for both of you.
            </p>
            <p className="nr-invite-note nr-invite-note--muted">
              Private listening rooms are available in Phase 2. This is a preview of the experience.
            </p>
            <button className="nr-invite-cancel" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  )
}
