'use client'

import { useState, useEffect, useRef } from 'react'
import type { ReactionType } from '../types'
import { REACTION_LABELS } from '../types'

interface RoomEmotionalReactionsProps {
  trackTitle: string
  roomId?: string
  onReact?: (reaction: ReactionType) => void
}

const REACTIONS: ReactionType[] = [
  'this_song_found_me',
  'i_felt_this_line',
  'stay_in_this_room',
  'this_feels_like_me',
  'listen_together',
  'i_need_silence_after_this',
  'send_this_song',
]

const REACTION_GLYPHS: Record<ReactionType, string> = {
  this_song_found_me:        '◈',
  i_felt_this_line:          '—',
  stay_in_this_room:         '◉',
  listen_together:           '◇',
  this_feels_like_me:        '○',
  i_need_silence_after_this: '·',
  send_this_song:            '↑',
}

// Seeded random-ish initial counts so each room/track combo feels different
function seedCounts(roomId = 'default', trackTitle: string): Record<ReactionType, number> {
  const seed = (roomId + trackTitle).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const counts = {} as Record<ReactionType, number>
  REACTIONS.forEach((r, i) => {
    counts[r] = 3 + ((seed * (i + 1) * 7) % 16)
  })
  return counts
}

export default function RoomEmotionalReactions({ trackTitle, roomId, onReact }: RoomEmotionalReactionsProps) {
  const [selected, setSelected] = useState<ReactionType | null>(null)
  const [flash, setFlash]       = useState<ReactionType | null>(null)
  const [counts, setCounts]     = useState<Record<ReactionType, number>>(() => seedCounts(roomId, trackTitle))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Simulate other listeners reacting every ~45 seconds
  useEffect(() => {
    function scheduleNext() {
      const delay = (38 + Math.random() * 15) * 1000
      timerRef.current = setTimeout(() => {
        const r = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
        setCounts((prev) => ({ ...prev, [r]: prev[r] + 1 }))
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handleReact(reaction: ReactionType) {
    const wasSelected = selected === reaction
    setSelected(wasSelected ? null : reaction)
    if (!wasSelected) {
      setFlash(reaction)
      setCounts((prev) => ({ ...prev, [reaction]: prev[reaction] + 1 }))
      onReact?.(reaction)
      setTimeout(() => setFlash(null), 1200)
    }
  }

  return (
    <div className="nr-reactions">
      <div className="nr-reactions-label">React to this song</div>
      <div className="nr-reactions-track">{trackTitle}</div>
      <div className="nr-reactions-grid">
        {REACTIONS.map((r) => (
          <button
            key={r}
            className={`nr-reaction-btn${selected === r ? ' nr-reaction-btn--selected' : ''}${flash === r ? ' nr-reaction-btn--flash' : ''}`}
            onClick={() => handleReact(r)}
            aria-pressed={selected === r}
            aria-label={REACTION_LABELS[r]}
          >
            <span className="nr-reaction-glyph" aria-hidden="true">{REACTION_GLYPHS[r]}</span>
            <span className="nr-reaction-label">{REACTION_LABELS[r]}</span>
            <span className="nr-reaction-count">{counts[r]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
