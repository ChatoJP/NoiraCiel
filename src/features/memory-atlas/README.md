# NoiraCiel: The Memory Atlas

An isolated, self-contained interactive experience for the NoiraCiel website.

---

## How to run / test

1. Start the dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/memory-atlas`
3. The game runs entirely client-side. Progress is persisted in `localStorage` under the key `noiraciel-memory-atlas-v1`.

---

## How to add more levels

Edit `src/features/memory-atlas/data/still-we-sail.json`.

Add a new object to the `levels` array following this structure:

```json
{
  "id": "unique-level-id",
  "title": "Level Title",
  "subtitle": "Memory VI",
  "number": 6,
  "artwork": {
    "gradient": "linear-gradient(180deg, #030610 0%, #0a1628 100%)",
    "accentColor": "#C4953A",
    "description": "What the image depicts.",
    "mood": "The emotional register in one sentence."
  },
  "clues": [
    {
      "id": "unique-clue-id",
      "sentence": "The sentence with ____ as the blank.",
      "answer": "answer",
      "altAnswers": ["alternative", "answers"],
      "hint": "Optional hint shown after 2 wrong attempts.",
      "fragment": {
        "id": "unique-fragment-id",
        "type": "lyric",
        "text": "The fragment text revealed on solving.",
        "attribution": "Optional attribution"
      },
      "shardGranted": "ShardName",
      "revealZone": 0
    }
  ],
  "completionFragment": {
    "id": "unique-completion-id",
    "type": "lore",
    "text": "Text shown when all clues are solved."
  }
}
```

**Fragment types:** `lyric`, `story`, `lore`  
**revealZone:** 0-indexed. Must be between 0 and `clues.length - 1`. Each zone reveals a section of the artwork.  
**shardGranted:** Optional. Must match a name in the world's `availableShards` array.

---

## How to add future images

Currently, artwork is rendered as CSS gradients (defined in the `artwork.gradient` field of each level). To replace with real images:

1. Add your image to `/public/memory-atlas/` (create this folder).
2. Modify `src/features/memory-atlas/components/ImageReveal.tsx`.
3. Change the `ma-artwork` div to use `<Image>` from `next/image` instead of a gradient background.
4. Update the `ArtworkConfig` type in `types.ts` to include an optional `imagePath` field.

---

## How to add audio

Audio placeholders can be added per-level. To add:

1. Add audio files to `/public/memory-atlas/audio/`.
2. Add an `audioPath` field to `MemoryLevelData` type and level JSON.
3. Use an `<audio>` element (or the existing global AudioContext) in `MemoryLevel.tsx`.
4. Consider ambient ocean/accordion tracks per world for atmosphere.

---

## How to add future worlds/albums

1. Create a new data file: `src/features/memory-atlas/data/[world-id].json`
2. Import it in `src/features/memory-atlas/MemoryAtlas.tsx` and add to `WORLD_DATA_MAP`
3. Add an entry to `src/features/memory-atlas/data/worlds.json` with `"status": "available"`

---

## How to connect this to the website

### 1. The route is already live at `/memory-atlas`

The file `src/app/memory-atlas/page.tsx` creates the route. It imports only from the isolated feature folder.

### 2. Add this button anywhere on the site

```tsx
<Link href="/memory-atlas" className="...your styling...">
  Enter The Memory Atlas
</Link>
```

Or as a plain anchor:

```html
<a href="/memory-atlas">Enter The Memory Atlas</a>
```

Suggested placement: Homepage hero section, navigation menu, or Music section.

---

## Files created / changed

### Created (new files — no existing code touched)

```
src/features/memory-atlas/
├── index.tsx                          Re-export
├── MemoryAtlas.tsx                    Root game component with state management
├── types.ts                           All TypeScript types
├── components/
│   ├── IntroScreen.tsx                Cinematic intro with particles
│   ├── WorldSelect.tsx                World/album selection screen
│   ├── MemoryLevel.tsx                Main gameplay screen (artwork + puzzle)
│   ├── ImageReveal.tsx                Fog overlay with animated zone reveal
│   ├── WordPuzzle.tsx                 Word input with validation and hints
│   ├── FragmentUnlock.tsx             Fragment display as they unlock
│   ├── MemoryShardCounter.tsx         Compact shard display
│   ├── ProgressBar.tsx                Level progress bar
│   ├── CompletionScreen.tsx           Per-level completion screen
│   └── WorldCompleteScreen.tsx        World/album completion celebration
├── data/
│   ├── worlds.json                    World index (all albums)
│   └── still-we-sail.json             5 playable levels for Still We Sail
├── styles/
│   └── memory-atlas.css              All game styles (scoped under .memory-atlas)
└── utils/
    ├── gameState.ts                   Reducer + localStorage persistence
    └── validation.ts                  Answer validation with fuzzy matching

src/app/memory-atlas/
└── page.tsx                           Next.js route (only file in app dir)
```

### Modified (minimal, safe changes)

```
tailwind.config.ts    — Added './src/features/**/*.{js,ts,jsx,tsx,mdx}' to content array
```

---

## Architecture notes

- **Fully isolated:** All game code lives in `src/features/memory-atlas/`. The only connection to the site is the route page at `src/app/memory-atlas/page.tsx`.
- **Scoped styles:** All CSS is scoped under `.memory-atlas` class. No global style interference.
- **Data-driven:** All levels, clues, fragments, and shards are in JSON files. No code changes needed to add content.
- **State persistence:** Game progress survives page refreshes via localStorage.
- **Type-safe:** Full TypeScript coverage with strict types.
- **Responsive:** Works on desktop (side-by-side layout) and mobile (stacked layout).
- **No new dependencies:** Uses only packages already installed (React, Next.js). Framer Motion is available if animations need enhancement later.
