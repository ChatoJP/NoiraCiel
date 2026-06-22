'use client'

import { useState, useEffect, useRef } from 'react'
import type { Room, AvatarType } from '../types'
import { getPresenceForRoom } from '../data/mock-presence'
import { getChatForRoom } from '../data/mock-chat'
import RoomHeader from './RoomHeader'
import RoomAmbience from './RoomAmbience'
import RoomMusicPlayer from './RoomMusicPlayer'
import RoomQueuePanel from './RoomQueuePanel'
import RoomPeoplePanel from './RoomPeoplePanel'
import RoomChat from './RoomChat'
import RoomEmotionalReactions from './RoomEmotionalReactions'
import RoomSafetyNotice from './RoomSafetyNotice'
import RoomEntryGate from './RoomEntryGate'

interface RoomPageProps {
  room: Room
}

type MobileTab = 'ambience' | 'chat' | 'people'

const ACCENT_CLASS: Record<string, string> = {
  'blue-gold':   'blue-gold',
  'gold-white':  'gold-white',
  'violet-gold': 'violet-gold',
  'red-gold':    'red-gold',
  'green-blue':  'green-blue',
  'silver-blue': 'silver-blue',
}

export default function RoomPage({ room }: RoomPageProps) {
  const [mobileTab, setMobileTab]         = useState<MobileTab>('ambience')
  const [entryGateOpen, setEntryGateOpen] = useState(false)
  const [liveCount, setLiveCount]         = useState(room.memberCount)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // R08: dimmer switch (0=darkest … 4=brightest, default 2)
  const [dimmerLevel, setDimmerLevel] = useState(2)

  // R09: candlelight session preset
  const [candlelight, setCandlelight] = useState(false)

  // R10: "the night is young" banner
  const [nightBanner, setNightBanner] = useState(false)
  const nightShownRef = useRef(false)

  const presence   = getPresenceForRoom(room.id)
  const chat       = getChatForRoom(room.id)
  const accentClass = ACCENT_CLASS[room.accentColor] ?? 'blue-gold'

  // Check if user has entered this room before
  useEffect(() => {
    const stored = localStorage.getItem(`nr-entry-${room.id}`)
    if (!stored) setEntryGateOpen(true)
  }, [room.id])

  // Live count fluctuation: ±1-2 every 25-60 seconds
  useEffect(() => {
    const min = Math.max(1, room.memberCount - 3)
    const max = room.memberCount + 6

    function tick() {
      setLiveCount((prev) => {
        const delta = Math.random() > 0.4 ? 1 : -1
        return Math.min(max, Math.max(min, prev + delta))
      })
      const nextDelay = (25 + Math.random() * 35) * 1000
      timerRef.current = setTimeout(tick, nextDelay)
    }

    const initial = (30 + Math.random() * 20) * 1000
    timerRef.current = setTimeout(tick, initial)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [room.memberCount])

  // R10: watch for liveCount first reaching 10
  useEffect(() => {
    if (!nightShownRef.current && liveCount >= 10) {
      nightShownRef.current = true
      setNightBanner(true)
      setTimeout(() => setNightBanner(false), 5000)
    }
  }, [liveCount])

  function handleEnter(_displayName: string, _avatarType: AvatarType) {
    setEntryGateOpen(false)
  }

  return (
    <div className={`nr-room nr-room--${accentClass}`}>
      {entryGateOpen && (
        <RoomEntryGate
          roomId={room.id}
          roomName={room.name}
          onEnter={handleEnter}
        />
      )}

      {/* R10: "The night is young" banner */}
      {nightBanner && (
        <div
          style={{
            position: 'fixed',
            top: '4.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(196,149,58,0.12)',
            border: '1px solid rgba(196,149,58,0.5)',
            backdropFilter: 'blur(10px)',
            padding: '0.6rem 2rem',
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontStyle: 'italic',
            fontSize: '0.9rem',
            letterSpacing: '0.15em',
            color: 'rgba(196,149,58,0.95)',
            whiteSpace: 'nowrap',
            animation: 'nr-night-banner 5s forwards',
          }}
        >
          ◈ The night is young
          <style>{`
            @keyframes nr-night-banner {
              0%   { opacity: 0; transform: translateX(-50%) translateY(-8px); }
              10%  { opacity: 1; transform: translateX(-50%) translateY(0); }
              80%  { opacity: 1; }
              100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
            }
          `}</style>
        </div>
      )}

      <RoomSafetyNotice />
      <RoomHeader room={room} liveCount={liveCount} />

      {/* R08/R09: Atmosphere controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 1rem',
        borderBottom: '1px solid rgba(184,197,208,0.06)',
        background: 'rgba(6,8,15,0.6)',
      }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(134,153,176,0.45)', marginRight: '0.25rem' }}>
          Atmosphere
        </span>
        {/* R08: dimmer */}
        <button
          onClick={() => setDimmerLevel(l => Math.max(0, l - 1))}
          disabled={dimmerLevel === 0}
          title="Dim lights"
          style={{ background: 'none', border: '1px solid rgba(184,197,208,0.15)', color: 'rgba(184,197,208,0.5)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', padding: '0.2rem 0.5rem', cursor: dimmerLevel === 0 ? 'default' : 'pointer', opacity: dimmerLevel === 0 ? 0.35 : 1 }}
        >
          ◁ dim
        </button>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', color: 'rgba(196,149,58,0.5)', minWidth: '1.5rem', textAlign: 'center' }}>
          {'◆'.repeat(dimmerLevel)}{'◇'.repeat(4 - dimmerLevel)}
        </span>
        <button
          onClick={() => setDimmerLevel(l => Math.min(4, l + 1))}
          disabled={dimmerLevel === 4}
          title="Brighten lights"
          style={{ background: 'none', border: '1px solid rgba(184,197,208,0.15)', color: 'rgba(184,197,208,0.5)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', padding: '0.2rem 0.5rem', cursor: dimmerLevel === 4 ? 'default' : 'pointer', opacity: dimmerLevel === 4 ? 0.35 : 1 }}
        >
          brighten ▷
        </button>
        {/* R09: candlelight preset */}
        <button
          onClick={() => setCandlelight(v => !v)}
          title={candlelight ? 'Disable candlelight session' : 'Enable candlelight session'}
          style={{
            marginLeft: '0.5rem',
            background: candlelight ? 'rgba(220,140,40,0.18)' : 'none',
            border: `1px solid ${candlelight ? 'rgba(220,140,40,0.45)' : 'rgba(184,197,208,0.15)'}`,
            color: candlelight ? 'rgba(220,160,60,0.9)' : 'rgba(184,197,208,0.45)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            padding: '0.2rem 0.65rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}
        >
          {candlelight ? '🕯 candlelight on' : '◇ candlelight'}
        </button>
      </div>

      {/* Mobile tab bar */}
      <div className="nr-room-tabs" role="tablist" aria-label="Room sections">
        {(['ambience', 'chat', 'people'] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={mobileTab === tab}
            className={`nr-room-tab${mobileTab === tab ? ' nr-room-tab--active' : ''}`}
            onClick={() => setMobileTab(tab)}
          >
            {tab === 'ambience' ? 'Room' : tab === 'chat' ? 'Chat' : 'People'}
          </button>
        ))}
      </div>

      {/* Desktop: 3-column layout — Mobile: tab-driven */}
      <div className="nr-room-body">
        {/* Left: Ambience + Player + Queue */}
        <div className={`nr-room-col nr-room-col--left${mobileTab !== 'ambience' ? ' nr-room-col--hidden-mobile' : ''}`}>
          <RoomAmbience
            room={room}
            liveCount={liveCount}
            dimmerLevel={dimmerLevel}
            candlelight={candlelight}
          />
          <RoomMusicPlayer track={room.currentTrack} accentClass={accentClass} />
          {room.queue && room.queue.length > 0 && (
            <RoomQueuePanel queue={room.queue} />
          )}
        </div>

        {/* Center: Chat */}
        <div className={`nr-room-col nr-room-col--center${mobileTab !== 'chat' ? ' nr-room-col--hidden-mobile' : ''}`}>
          <RoomChat messages={chat} roomId={room.id} roomName={room.name} />
        </div>

        {/* Right: People + Reactions */}
        <div className={`nr-room-col nr-room-col--right${mobileTab !== 'people' ? ' nr-room-col--hidden-mobile' : ''}`}>
          <RoomPeoplePanel users={presence} memberCount={room.memberCount} liveCount={liveCount} />
          <RoomEmotionalReactions trackTitle={room.currentTrack.title} roomId={room.id} />
        </div>
      </div>
    </div>
  )
}
