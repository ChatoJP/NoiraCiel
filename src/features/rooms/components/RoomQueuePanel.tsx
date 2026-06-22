'use client'

import type { MockTrack } from '../types'

interface Props {
  queue: MockTrack[]
}

export default function RoomQueuePanel({ queue }: Props) {
  if (!queue || queue.length === 0) return null

  return (
    <div className="nr-queue">
      <div className="nr-queue-header">
        <span className="nr-queue-title">Up next in this room</span>
        <span className="nr-queue-count">{queue.length} tracks</span>
      </div>
      <ol className="nr-queue-list">
        {queue.map((track, i) => (
          <li key={track.id} className="nr-queue-item">
            <span className="nr-queue-num" aria-hidden="true">{i + 1}</span>
            <div className="nr-queue-info">
              <span className="nr-queue-track-title">{track.title}</span>
              <span className="nr-queue-track-meta">{track.albumName} · {track.duration}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
