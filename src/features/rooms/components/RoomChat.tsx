'use client'

import { useState, useRef, useEffect } from 'react'
import type { Message, AvatarType } from '../types'
import RoomMessage from './RoomMessage'

interface RoomChatProps {
  messages:     Message[]
  roomId:       string
  roomName:     string
  currentTrack?: string  // R15: track title to announce changes
}

const MY_USER_ID = 'me'
const MY_AVATAR: AvatarType = 'shadow'
const MY_NAME = 'You'
const MAX_STORED = 50

// R12: Bartender one-liners pool
const BARTENDER_LINES = [
  "Another round of melancholy? Coming right up.",
  "I've been polishing this same glass since the first track. Feels right.",
  "You know what goes well with this song? Silence, and good company.",
  "Careful — that last chord might hit harder than the whiskey.",
  "I've heard this album a hundred times. Still gives me pause.",
  "The night's still young. No rush.",
  "Some people come in for the music. Some for the dark. Most for both.",
  "I'll say this: whoever wrote this song was telling the truth.",
]

// R14: Bartender song request denial pool
const BARTENDER_DENIALS = [
  "Request denied. The jukebox has its own ideas tonight.",
  "Not tonight. The bar decides what plays when it gets this quiet.",
  "I appreciate the enthusiasm. The answer is still no.",
  "There's a process. You're not in it.",
  "The playlist is already crying. Let it finish.",
  "Bold ask. Respectfully denied.",
]

const BARTENDER_ID = 'bartender'
const BARTENDER_AVATAR: AvatarType = 'ember'

function storageKey(roomId: string) {
  return `nr-chat-${roomId}`
}

function loadFromStorage(roomId: string, fallback: Message[]): Message[] {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(storageKey(roomId))
    if (raw) return JSON.parse(raw) as Message[]
  } catch {}
  return fallback
}

function bartenderMsg(text: string): Message {
  return {
    id:          `bartender-${Date.now()}-${Math.random()}`,
    userId:      BARTENDER_ID,
    displayName: 'The Bartender',
    avatarType:  BARTENDER_AVATAR,
    text,
    minutesAgo:  0,
    type:        'text',
  }
}

export default function RoomChat({ messages: initialMessages, roomId, roomName, currentTrack }: RoomChatProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    loadFromStorage(roomId, initialMessages)
  )
  const [input, setInput] = useState('')
  const listRef        = useRef<HTMLDivElement>(null)
  const prevTrackRef   = useRef<string | undefined>(currentTrack)
  const bartenderTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  // Persist to localStorage whenever messages change (only user-sent ones)
  function saveToStorage(msgs: Message[]) {
    try {
      const own = msgs.filter((m) => m.userId === MY_USER_ID)
      localStorage.setItem(storageKey(roomId), JSON.stringify(own.slice(-MAX_STORED)))
    } catch {}
  }

  function injectMsg(msg: Message) {
    setMessages(prev => [...prev, msg])
  }

  // R12: Bartender one-liner every 8 minutes
  useEffect(() => {
    bartenderTimer.current = setInterval(() => {
      const line = BARTENDER_LINES[Math.floor(Math.random() * BARTENDER_LINES.length)]
      injectMsg(bartenderMsg(line))
    }, 8 * 60 * 1000)
    return () => { if (bartenderTimer.current) clearInterval(bartenderTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // R15: Announce track change in chat
  useEffect(() => {
    if (currentTrack && currentTrack !== prevTrackRef.current) {
      prevTrackRef.current = currentTrack
      injectMsg(bartenderMsg(`Next up — "${currentTrack}", and it goes deep.`))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack])

  function handleSend() {
    const text = input.trim()
    if (!text) return

    // R14: Song request interception
    if (/^\/(request|req)\b/i.test(text)) {
      const denial = BARTENDER_DENIALS[Math.floor(Math.random() * BARTENDER_DENIALS.length)]
      const userMsg: Message = {
        id: `my-${Date.now()}`, userId: MY_USER_ID, displayName: MY_NAME,
        avatarType: MY_AVATAR, text, minutesAgo: 0, type: 'text',
      }
      setMessages(prev => [...prev, userMsg, bartenderMsg(denial)])
      setInput('')
      return
    }

    const msg: Message = {
      id:          `my-${Date.now()}`,
      userId:      MY_USER_ID,
      displayName: MY_NAME,
      avatarType:  MY_AVATAR,
      text,
      minutesAgo:  0,
      type:        'text',
    }
    setMessages((prev) => {
      const next = [...prev, msg]
      saveToStorage(next)
      return next
    })
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="nr-chat">
      <div className="nr-chat-header">
        <span className="nr-chat-title">Room chat</span>
        <span className="nr-chat-hint">speak freely · /request [song] to be denied</span>
      </div>

      <div className="nr-chat-messages" ref={listRef} role="log" aria-label={`${roomName} chat`} aria-live="polite">
        {messages.length === 0 && (
          <div className="nr-chat-empty">
            The room is quiet. Be the first to say something.
          </div>
        )}
        {messages.map((msg) => (
          <RoomMessage key={msg.id} message={msg} isOwn={msg.userId === MY_USER_ID} />
        ))}
      </div>

      <div className="nr-chat-input-row">
        <input
          type="text"
          className="nr-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say something…"
          maxLength={280}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Chat message"
        />
        <button
          className="nr-chat-send"
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
