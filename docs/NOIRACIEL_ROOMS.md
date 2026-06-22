# NoiraCiel Rooms

> "Meet people through the songs that find you."

A virtual social music space where people connect through music, mood, stories, and emotional resonance. Not dating. Not Discord. Resonance.

---

## Product vision

NoiraCiel Rooms is a premium artistic community experience. People enter different music rooms, listen together, chat, and eventually connect privately through shared feeling.

**Core positioning:** You do not match by appearance. You match by resonance.

**Key language to use:**
- resonance · shared music · listening together · emotional rooms · artistic connection · private listening

**Language to avoid:**
- swipe · dating marketplace · ranking · hookups · scoring attractiveness

---

## Phase 1 MVP — Complete (frontend, mock data)

### What exists
- `/rooms` — Rooms landing page with hero, manifesto, room grid
- `/rooms/[roomId]` — Individual room page (9 public rooms)
- All components built (see file list below)
- Mock presence and chat data per room
- Responsive: desktop 3-column, tablet 2-column, mobile tab-based
- Scoped CSS under `.nr-rooms` / `.nr-room` — no site style bleed

### What is mock/demo
- `memberCount` — static numbers in `rooms.json`
- Presence panel — `mock-presence.ts` static arrays
- Chat messages — `mock-chat.ts` static arrays
- Music player — simulated elapsed time (ticker), no real audio sync
- All rooms use demo track metadata; audio comes from the global AudioContext when the user plays a track independently

---

## Phase 2 — Real-time & auth

### Requirements
- User accounts (Supabase Auth recommended — already used in project, or add)
- Avatar selection on first entry
- Real-time presence via Supabase Realtime or Ably
- Real-time chat via Supabase Realtime or Socket.IO
- Persistent message history (Supabase Postgres)
- Room member counts (live subscriptions)
- Saved room preferences per user

### Data schema (Postgres)

```sql
-- Users
create table room_profiles (
  id uuid primary key references auth.users(id),
  display_name text not null,
  avatar_type text not null default 'shadow',
  created_at timestamptz default now()
);

-- Rooms (can stay in JSON for now, or migrate to DB for admin control)
create table rooms (
  id text primary key,
  name text not null,
  is_active boolean default true,
  is_premium boolean default false
);

-- Messages
create table room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id uuid references room_profiles(id),
  display_name text not null,
  avatar_type text not null,
  text text not null check (length(text) <= 280),
  type text not null default 'text',
  song_title text,
  created_at timestamptz default now()
);

-- Presence (ephemeral — use Supabase presence channels, not a table)

-- Reactions
create table room_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  track_id text not null,
  user_id uuid references room_profiles(id),
  reaction_type text not null,
  created_at timestamptz default now()
);
```

### Real-time options
| Option | Pros | Cons |
|--------|------|------|
| **Supabase Realtime** | Already in project stack, free tier, Postgres-native | Slightly higher latency |
| **Ably** | Extremely low latency, presence built-in | Paid, new dependency |
| **Socket.IO + self-hosted** | Full control | Requires server, more ops |
| **Pusher** | Simple, reliable | Paid |

**Recommendation:** Start with Supabase Realtime. The project already uses Supabase for other features.

---

## Phase 3 — Connection mechanics

- "This song found me" global reaction that sends a signal to all room members
- "I felt this line" — attach to a specific lyric timestamp
- Send a song to another user (song card in chat)
- "Listen together" — mutual invitation for a private listening room
- Private listening room for two people (shared audio, optional chat)
- Emotional compatibility based on songs listened, rooms visited, reactions given
- User "resonance profile" (not visible to others, used for soft matching)

---

## Phase 4 — Voice / video

All voice and video must be:
- **Opt-in only** — never automatic
- **Consent-gated** — both parties must accept before any connection
- **One room at a time** — no multi-channel confusion

### Technical approach
- WebRTC peer-to-peer for private calls
- Daily.co or Livekit for managed WebRTC (recommended over raw WebRTC)
- Voice rooms: push-to-talk or room-wide ambient audio
- Video: private calls only — no public video rooms

---

## Phase 5 — Premium / exclusive

- NoiraCiel House (invitation-only private room)
- Members-only listening sessions
- Album premiere rooms (real-time, one-time events)
- Paid premium rooms (Stripe integration already in project)
- Guest artist sessions
- Private listening parties for releases

---

## Moderation & safety

### Implemented in Phase 1 (UI)
- `RoomSafetyNotice.tsx` — community guidelines banner
- No real names exposed; alias/display names only
- Private room behind invitation gate

### Required in Phase 2
- Report user button (API endpoint → moderation queue)
- Block user (server-side, prevents messages showing)
- Mute user (client-side, hide messages without server call)
- Message content filtering (profanity filter at minimum)
- Admin moderation dashboard

### Non-negotiable rules
- No explicit sexual content (automated filter + manual moderation)
- No minors in dating/matching features (age gate)
- No harassment (zero tolerance, automatic temp ban on multiple reports)
- No spam (rate limiting: max 1 message per 2 seconds)
- Consent required before any voice/video connection
- No email addresses or real names in public room
- Privacy-first profile: avatar type + display name only

---

## Rooms data model

```typescript
interface Room {
  id: string                   // URL slug
  name: string
  tagline: string              // one line, poetic
  description: string          // 2-3 sentences
  mood: string[]               // e.g. ["noir", "ocean", "saudade"]
  album?: string               // linked album name
  albumSlug?: string           // linked album URL slug
  currentTrack: MockTrack      // Phase 1: mock; Phase 2: real-time from server
  accentColor: RoomAccentColor // determines color theming
  gradient: string             // CSS gradient for room background
  isPremium: boolean
  isPrivate: boolean
  memberCount: number          // Phase 1: static; Phase 2: live count
  peakMembers: number
}
```

---

## How to add a new room

1. Add an entry to `src/features/rooms/data/rooms.json`
2. Add mock presence to `src/features/rooms/data/mock-presence.ts` (key = room id)
3. Add mock chat to `src/features/rooms/data/mock-chat.ts` (key = room id)
4. The room is live at `/rooms/[your-id]`

For the gradient, use deep dark radial gradients. Examples in `rooms.json`.

---

## How to connect rooms to real tracks

In Phase 2, replace the `currentTrack` mock in each room with a server-side lookup:

```typescript
// In the room page server component:
const track = await getTrackBySlug(room.currentTrack.id)
// Pass to RoomPage as a real Track object
// RoomMusicPlayer can then use the AudioContext to actually play it
```

The `AudioContext` at `src/context/AudioContext.tsx` is already site-wide and can play any `Track`. The `play(track)` function from `useAudio()` will trigger the global player.

---

## How to connect rooms to albums

Each room has an optional `albumSlug` field. Use this to:
- Link to the album page (`/music/[albumSlug]`)
- Pull tracks from that album for the room playlist
- Show album artwork in the ambience area

---

## File list

### Created
```
src/features/rooms/
├── types.ts                               All TypeScript types
├── components/
│   ├── avatar-glyphs.ts                   Shared glyph constants
│   ├── RoomsLandingPage.tsx               /rooms page container
│   ├── RoomCard.tsx                       Room card in the grid
│   ├── RoomPage.tsx                       Individual room layout
│   ├── RoomHeader.tsx                     Room header bar
│   ├── RoomAmbience.tsx                   Animated background + room identity
│   ├── RoomMusicPlayer.tsx                Now playing bar
│   ├── RoomPeoplePanel.tsx                Presence panel
│   ├── AvatarPresence.tsx                 Individual user card
│   ├── RoomChat.tsx                       Chat container + input
│   ├── RoomMessage.tsx                    Individual message
│   ├── RoomEmotionalReactions.tsx         Reaction buttons
│   ├── PrivateListeningInvite.tsx         Invitation modal (Phase 2 stub)
│   └── RoomSafetyNotice.tsx              Community guidelines banner
├── data/
│   ├── rooms.json                         10 rooms (9 public, 1 private)
│   ├── mock-presence.ts                   Mock user presence per room
│   └── mock-chat.ts                       Mock chat messages per room
└── styles/
    └── rooms.css                          All room styles (scoped)

src/app/rooms/
├── page.tsx                               /rooms route
└── [roomId]/page.tsx                      /rooms/[roomId] route
```

### Modified
None — Rooms is fully isolated. The only site connection is navigation (add `/rooms` link if desired).

---

## How to test locally

```bash
npm run dev
# Navigate to:
# http://localhost:3000/rooms            — landing page
# http://localhost:3000/rooms/atlantic-noir   — Atlantic Noir room
# http://localhost:3000/rooms/jazz-night      — Jazz Night room
# http://localhost:3000/rooms/after-midnight  — After Midnight room (most active mock)
```

Available public room IDs: `atlantic-noir`, `jazz-night`, `the-velvet-room`, `ghost-performance`, `after-midnight`, `the-roots-room`, `fado-trip-hop`, `world-sounds`, `the-sacred-drift`

---

## Adding Rooms to navigation

In `src/components/Navigation.tsx`, add to `PRIMARY_LINKS` or `MORE_LINKS`:

```typescript
{ label: 'Rooms', href: '/rooms' },
```

---

## Voice/video roadmap

```
Phase 4a: Voice rooms
  └── Push-to-talk ambient voice in public rooms
  └── WebRTC via Livekit (self-hosted) or Daily.co (managed)

Phase 4b: Private voice calls
  └── "Call together" button after mutual listen-together invitation
  └── Strict consent: both users must accept
  └── No automatic connection

Phase 4c: Optional video
  └── Private rooms only
  └── Opt-in per call, not per profile
  └── Consent dialog before camera activates
```
