# NoiraCiel Quick Wins

---

## General (100)

### Audio Player & Playback

| # | Item | Status |
|---|------|--------|
| G01 | Press `Space` anywhere to play/pause — no focus required | DONE |
| G02 | `←` / `→` arrow keys seek ±10s while a track is playing | DONE |
| G03 | Press `?` to show a keyboard shortcut overlay | DONE |
| G04 | Progress ring around the album art on the global player | DONE |
| G05 | Floating "now playing" mini-pill sticks to top-right when turntable is closed | DONE |
| G06 | Resume prompt on song page: "Continue from 1:42?" | DONE |
| G07 | `<link rel="prefetch">` for the next track in the queue | DONE |
| G08 | "Play all" button on every album page | DONE |
| G09 | "Loop this song" toggle on the lyrics player | DONE |
| G10 | Global player shows album name as a second line below the song title | DONE |

### Ghost Performance

| # | Item | Status |
|---|------|--------|
| G11 | Show track title + album name in the GhostStage header bar | DONE |
| G12 | "Screenshot" button — saves current canvas frame as PNG | DONE |
| G13 | "Minimal mode" toggle that hides the label footer and chord overlay | DONE |
| G14 | Instruments fade in/out with 200ms opacity transition on track change | DONE |
| G15 | GhostStage header bar pulses with detected beat (sub-bass spike) | DONE |
| G16 | Subtle sheet music staff rendered behind the piano roll as watermark | DONE |
| G17 | "Ghost hour" mode triggers at midnight — all visualizers shift to deep-red palette | DONE |

### Synced Lyrics

| # | Item | Status |
|---|------|--------|
| G18 | "Share this moment" button copies URL with `?t=1m42s` for a specific word | DONE |
| G19 | "Copy this line" button appears on hover over any lyric line | DONE |
| G20 | Lyrics word count shown in the song page sidebar | DONE |
| G21 | Lyrics density heatmap strip | DONE |
| G22 | Animated entry for lyrics player | DONE |
| G23 | "Lyrics speed" control to slow/speed the synced highlight scroll rate | NOT DONE |
| G24 | "Download lyric sheet" — triggers browser print with clean CSS print stylesheet | NOT DONE |

### Song & Album Pages

| # | Item | Status |
|---|------|--------|
| G25 | Song duration as "X min Y sec" | DONE |
| G26 | BPM badge (optional field) | DONE |
| G27 | Key badge (optional field) | DONE |
| G28 | Season badge (optional field) | DONE |
| G29 | "Played X times" counter | DONE |
| G30 | "Played today" dot on track rows | DONE |
| G31 | Related chapters on song page | DONE |
| G32 | Lyric panel slide-in animation | DONE |
| G33 | Album art glow when playing | DONE |
| G34 | Related albums section | DONE |

### Stories

| # | Item | Status |
|---|------|--------|
| G35 | Reading progress bar (already done) | DONE |
| G36 | Estimated read time on story cards | DONE |
| G37 | Bookmark button + /reading page | DONE |
| G38 | Night read mode toggle | DONE |
| G39 | Play song while reading button | DONE |
| G40 | Related reads on story page | DONE |
| G41 | Active paragraph gold border on scroll | DONE |

### Discover & Browse

| # | Item | Status |
|---|------|--------|
| G42 | Surprise me random song button | DONE |
| G43 | Lyric/title search on discover | DONE |
| G44 | Last seen in room tag | NOT DONE |
| G45 | Mood filter shortcuts on discover | DONE |
| G46 | Featured track of the week on homepage | DONE |

### Memory Atlas

| # | Item | Status |
|---|------|--------|
| G47 | Daily puzzle in Memory Atlas | DONE |
| G48 | Streak counter with flame | DONE |
| G49 | Tile flip 3D CSS animation | DONE |
| G50 | Match/fail Web Audio sound FX | DONE |
| G51 | Story mode lore (already in completionFragment) | DONE |
| G52 | Leaderboard best times in Memory Atlas | DONE |

### Visual & Motion

| # | Item | Status |
|---|------|--------|
| G53 | Scroll fade-in for section headings | DONE |
| G54 | Gold page-progress bar (already done) | DONE |
| G55 | Hero parallax (already done) | DONE |
| G56 | @starting-style modal entrance animations | DONE |
| G57 | prefers-reduced-motion guard | DONE |
| G58 | Gold afterglow cursor on drag | DONE |
| G59 | Inactivity starfield after 5 min | DONE |
| G60 | Film grain toggle button | DONE |

### Micro-interactions & Easter Eggs

| # | Item | Status |
|---|------|--------|
| G61 | Heartbeat glow on the NoiraCiel logo when any track is playing | DONE |
| G62 | Typing `noira` triggers a full-screen gold particle burst (200ms) | DONE |
| G63 | 404 page plays a single sad piano note (Web Audio) and shows a dark couplet | DONE |
| G64 | Pressing `N` on any album page navigates to the next track | DONE |

### Book

| # | Item | Status |
|---|------|--------|
| G65 | Page-turn sound effect on book navigation (Web Audio sine sweep) | DONE |
| G66 | "Print this poem" button with a clean print stylesheet | DONE |
| G67 | Word count + "reads aloud in ~N sec" below each poem title | DONE |
| G68 | "Random poem" button in the book index | DONE |

### Scholarship & Utility

| # | Item | Status |
|---|------|--------|
| G69 | Fund progress bar on the scholarship landing page | DONE |
| G70 | Countdown timer to the next show on the shows page | DONE |
| G71 | "X people joined this month" counter on the join page (seeded) | DONE |
| G72 | `/api/health` endpoint for uptime monitoring | DONE |

### SEO & Meta

| # | Item | Status |
|---|------|--------|
| G73 | `og:audio` meta tag on every song page | DONE |
| G74 | `<meta name="theme-color">` per album matching its accent color | DONE |
| G75 | `rel="canonical"` audit on all dynamically rendered pages | DONE |
| G76 | `/songs` index page listing every song with artwork | DONE |
| G77 | `robots.txt` disallow for `/api/*` and `/admin/*` routes | DONE |

### Settings & Preferences

| # | Item | Status |
|---|------|--------|
| G78 | "Liked songs" playlist from localStorage heart-clicks | DONE |
| G79 | Ambient audio toggle: rain, fireplace, night wind (looping Web Audio noise) | DONE |
| G80 | "Night mode intensifier" — deepens void color, heavier vignette | DONE |
| G81 | Session listening history — last 5 songs played this visit | DONE |

### Performance & Polish

| # | Item | Status |
|---|------|--------|
| G82 | Loading skeletons for every content card | DONE |
| G83 | View transitions between pages (Next.js `<ViewTransition>`) | DONE |
| G84 | `CHANGELOG.md` rendered at `/changelog` for superfans | DONE |
| G85 | "Audio visualizer mode" — frequency bars behind the logo when music plays | DONE |

### Mobile

| # | Item | Status |
|---|------|--------|
| G86 | Bottom sheet for track info on mobile | DONE |
| G87 | Swipe left/right on album art to skip tracks | DONE |
| G88 | Touch-drag on the waveform scrubber in the lyrics player | DONE |

### Podcast

| # | Item | Status |
|---|------|--------|
| G89 | Waveform visualizer per episode on the podcast page | DONE |

### Ghost Performance: Advanced

| # | Item | Status |
|---|------|--------|
| G90 | Beat-sync strobe: 1px gold horizontal line flashes at kick events | DONE |
| G91 | Per-album background color skin in Ghost Performance | DONE |
| G92 | "Export performance" — records canvas and offers WebM download | DONE |
| G93 | "First listen" badge in Ghost Performance | DONE |
| G94 | ChordOverlay shows the key beneath the chord name | DONE |

### Content & Copy

| # | Item | Status |
|---|------|--------|
| G95 | Randomly rotating NoiraCiel quote in the footer | DONE |
| G96 | "This song was written during a ___" factoid in the song sidebar | DONE |
| G97 | Artist hover card on any artist image | DONE |
| G98 | "Album liner notes" expandable section on each album page | DONE |
| G99 | Social proof counter: "X people played this song this week" (seeded) | DONE |
| G100 | "Played by X listeners" live-updating count on every song card | DONE |

---

## Rooms: Like a Bar (100)

### Atmosphere & Ambience

| # | Item | Status |
|---|------|--------|
| R01 | "Bar noise" ambient audio — crowd murmur, ice, laughter (looping Web Audio) | DONE |
| R02 | Animated smoke wisps on room canvas — slow procedural curls rising from bottom | DONE |
| R03 | Candle flicker in ambience — warm orange point-light that randomly dims/recovers | DONE |
| R04 | Rain-streaked window panel — secondary canvas showing rain on glass | DONE |
| R05 | Animated neon sign per room — unique glyph that hums and flickers | DONE |
| R06 | Animated bar stools along ambience bottom that fill as liveCount increases | DONE |
| R07 | "Fog density" tied to listener count — more people = denser fog layer | DONE |
| R08 | "Dimmer switch" — chat vote to lower/raise ambient light level | DONE |
| R09 | "Candlelight session" preset — warmer palette, slower animations, no chord overlay | DONE |
| R10 | "The night is young" banner slides in when liveCount first hits 10 | DONE |

### Staff & Character

| # | Item | Status |
|---|------|--------|
| R11 | Bartender presence — a fixed glyph + name in the people panel | NOT DONE |
| R12 | Bartender one-liners every 8 min in the chat | NOT DONE |
| R13 | Bartender "recommendation" on entry drawn from room mood tags | NOT DONE |
| R14 | "Song request denied" comedic bartender response | NOT DONE |
| R15 | Bartender announces track changes: "Next up — ___, and it goes deep." | NOT DONE |

### Entry & Arrival

| # | Item | Status |
|---|------|--------|
| R16 | "No cover charge" marquee at room entry for free rooms | NOT DONE |
| R17 | "Coin drop" tick sound on room entry (Web Audio, single soft click) | NOT DONE |
| R18 | "Ice breaker" prompt at entry — "What's a memory this song gives you?" | NOT DONE |
| R19 | "Tonight I'm feeling ___" mood status field at room entry | NOT DONE |
| R20 | "Coat check" — session token in localStorage to return to the exact room state | NOT DONE |

### Queue & Jukebox

| # | Item | Status |
|---|------|--------|
| R21 | Jukebox panel — text song suggestions, top-voted plays next | NOT DONE |
| R22 | "Tab" feature — each user queues one song at a time | NOT DONE |
| R23 | "Encore" vote at end of queue — majority vote replays a track | NOT DONE |
| R24 | "Round two" button — instantly restarts queue when it ends | NOT DONE |
| R25 | "Power hour" mode — 60 tracks, 60 seconds each, no skipping | NOT DONE |
| R26 | "Request a slow song" button — queues a predetermined ballad | NOT DONE |
| R27 | "Throwback night" mode — room plays only songs from a specified album | NOT DONE |
| R28 | "Jazz standard marathon" — one weekly slot cycling through jazz tracks | NOT DONE |
| R29 | Songs in queue show submitter glyph next to the title | NOT DONE |
| R30 | "Jukebox glow" — now-playing card pulses gold for user-voted song | NOT DONE |

### Reactions & Social

| # | Item | Status |
|---|------|--------|
| R31 | "Round of applause" reaction — 👏 cascades through chat at song end | NOT DONE |
| R32 | "Toast" action — clinks glasses with another user; both get ◈ notification | NOT DONE |
| R33 | "Buy someone a round" — sends a ◆ token to another listener | NOT DONE |
| R34 | "Spilled drink" animation — liquid-spill CSS overlay on reaction storm | NOT DONE |
| R35 | "Smoke machine" burst — white-smoke canvas puff on heavy reaction storm | NOT DONE |
| R36 | Custom per-room emoji vocabulary — 3 bespoke reaction glyphs per room | NOT DONE |
| R37 | "Crowd sway" animation — canvas figures sway left-right on heavy bass | NOT DONE |

### Status & Presence

| # | Item | Status |
|---|------|--------|
| R38 | "X people arrived in the last 5 minutes" in live count subtext | NOT DONE |
| R39 | "Regulars board" — top 5 listeners by total session time | NOT DONE |
| R40 | "Regular" badge (◈) for users who've visited a room 3+ times | NOT DONE |
| R41 | "Patron of the night" badge — longest-present user at session close | NOT DONE |
| R42 | "Live wristband" glyph for users who attended a real show | NOT DONE |
| R43 | "Wallflower" mode — join without being listed in the people panel | NOT DONE |
| R44 | "Last person standing" badge for the final user after everyone leaves | NOT DONE |
| R45 | "Tonight's crowd" — 3 auto-generated adjectives from room mood tags | NOT DONE |

### Time-of-Night Mechanics

| # | Item | Status |
|---|------|--------|
| R46 | "Happy hour" glow on rooms peaking above average liveCount | NOT DONE |
| R47 | "Quiet hour" mode 3–5am — reduced visuals, whisper-only chat | NOT DONE |
| R48 | "Last call" at 2am — lighting dims 20%, bartender announces it | NOT DONE |
| R49 | "Closing time" ritual — all rooms play the same last song simultaneously | NOT DONE |
| R50 | "Last round" warning banner 5 min before queue ends | NOT DONE |
| R51 | "Band break" screen between tracks — 4-second dark screen with cigarette glyph | NOT DONE |
| R52 | "Bar hours" shown on room cards — opening and closing times | NOT DONE |
| R53 | "Ghost at the bar" mechanic — phantom glyph in empty rooms | NOT DONE |

### Chat Enhancements

| # | Item | Status |
|---|------|--------|
| R54 | "Drink orders" — `/order [drink]` slash command in chat | NOT DONE |
| R55 | "Bar napkin" — 140-char anonymous note pinned to room for 24h | NOT DONE |
| R56 | "Sticky note" — named note on room wall persisting 24h | NOT DONE |
| R57 | "Midnight confession" — anonymous note pinned at midnight, cleared at dawn | NOT DONE |
| R58 | "Check please" — signal you're leaving in 5 min | NOT DONE |
| R59 | "Call it a night" button — graceful exit with session recap | NOT DONE |
| R60 | Coaster graphic slides in under first message of a new user | NOT DONE |

### Layout & Visuals

| # | Item | Status |
|---|------|--------|
| R61 | "Sing along" mode — current lyric line in large type across the ambience | NOT DONE |
| R62 | "No phones at the table" mode — strips to ambience + one chat input | NOT DONE |
| R63 | "Floor seat" vs "bar seat" toggle — switches room column layout | NOT DONE |
| R64 | "Concert setlist" panel — queue as a printed setlist card | NOT DONE |
| R65 | "Band photo" artifact — Ghost Performance screenshot framed like a pub photo | NOT DONE |
| R66 | "Booth" mode — collapsible private sidebar for 2 users | NOT DONE |
| R67 | "Table for two" — invite one other user to a private listening bubble | NOT DONE |
| R68 | Ambience "door" element — animated SVG door that opens/closes on entry/exit | NOT DONE |
| R69 | "Reserved table" marker — one seat visually reserved for the artist | NOT DONE |
| R70 | "Drink menu" sidebar — decorative cocktails named after songs | NOT DONE |

### Metrics & Gamification

| # | Item | Status |
|---|------|--------|
| R71 | "Room reputation" score on room cards | NOT DONE |
| R72 | "Bar tab score" per session — songs × reactions × minutes | NOT DONE |
| R73 | "Walk of fame" on rooms landing — rooms ranked by total listener-hours | NOT DONE |
| R74 | "Bar tab receipt" — session summary card | NOT DONE |
| R75 | "Bingo card" — first to hear 5 mood-matched songs wins | NOT DONE |
| R76 | "Trivia night" slot — weekly text quiz about the current song | NOT DONE |

### Room Cards & Landing Page

| # | Item | Status |
|---|------|--------|
| R77 | "On the house" — one room per night shows "Tonight: free entry" | NOT DONE |
| R78 | "Tonight's special" ribbon on the most active room card | NOT DONE |
| R79 | "No cover, just vibe" marquee animation at top of rooms landing | NOT DONE |
| R80 | "VIP lounge" teaser on private room cards — blurred preview | NOT DONE |
| R81 | Room card shows "first visited [date]" for returning users | NOT DONE |
| R82 | Room cards show a "crowd energy" color bar from recent reaction counts | NOT DONE |

### Room Identity & Lore

| # | Item | Status |
|---|------|--------|
| R83 | Each room has a "room note" from the artist, shown at entry | NOT DONE |
| R84 | "Artist was here" marker — glyph when NoiraCiel recently curated the room | NOT DONE |
| R85 | Per-room signature cocktail name displayed in the entry gate header | NOT DONE |
| R86 | Each room has a "founding story" expandable tab | NOT DONE |
| R87 | "Tonight's theme" — one sentence framing the playlist, set in rooms.json | NOT DONE |
| R88 | "Room archive" — past sessions log showing which songs played last week | NOT DONE |

### Premium Room Features

| # | Item | Status |
|---|------|--------|
| R89 | "Sound check" on entry to premium rooms — brief audio preview with EQ viz | NOT DONE |
| R90 | "Countdown to midnight" visual in premium rooms | NOT DONE |
| R91 | "Open mic" slot in premium queue — one position for a live stream link | NOT DONE |
| R92 | "Spill your feelings" — anonymized micro-confessions tied to current song | NOT DONE |

### Ghost Performance in Room Context

| # | Item | Status |
|---|------|--------|
| R93 | "Band on stage" indicator in ambience header when Ghost Performance is active | NOT DONE |
| R94 | Ghost Performance instruments sway to match crowd energy from reaction count | NOT DONE |
| R95 | "Live set" mode — gapless crossfade between AudioContext nodes | NOT DONE |
| R96 | Room-specific Ghost Performance color skin from room.gradient | NOT DONE |

### Queue End & Goodbye

| # | Item | Status |
|---|------|--------|
| R97 | "Room closing" ceremony — candles extinguish one by one as last song fades | NOT DONE |
| R98 | "Session ended" card — songs heard, top reaction, longest conversation streak | NOT DONE |
| R99 | "Come back tomorrow" note from bartender with next day's schedule | NOT DONE |
| R100 | "The bar is closed" overlay — single candle + room's founding quote | NOT DONE |
