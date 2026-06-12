# NoiraCiel — Official Website

Atlantic Noir. Sea-Soul. Songs from the dark edge of memory.

## Stack

- **Next.js 16** (App Router)
- **TypeScript** + **Tailwind CSS**
- **music-metadata** — reads WAV/MP3/FLAC duration from file headers
- **Kie.ai Runway API** — generates cinematic music videos

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

`.env.local` is gitignored. It must never be committed.

The `.env.local` file needs:

```
KIE_API_KEY=your_kie_ai_api_key_here
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Music catalogue

Audio files live in `/Music` at the project root. The website scans this folder dynamically — dropping a new `.wav`, `.mp3`, or `.flac` file into `/Music` automatically makes it available on the website.

### File naming convention

```
hd_1 - Why.wav          ← audio
hd_1 - Why.txt          ← lyrics (optional, same base name)
```

The scanner parses `hd_X - Title` to extract track number and title. Any audio file without a matching `.txt` will show "Lyrics coming soon."

### Album metadata

The album title, artist name, and Spotify URL are configured in:

```
src/lib/musicScanner.ts  →  ALBUM_META
```

### Generate static songs.json (optional)

For deployments without runtime filesystem access (e.g. Vercel serverless with no persistent disk), generate a static catalogue:

```bash
node scripts/generate-songs-json.js
```

This writes `public/songs.json`. The website's API route reads from the filesystem at runtime by default; `songs.json` is a fallback for static export.

---

## Music video generation (Kie.ai + ffmpeg)

The script `scripts/generate-music-videos.js` generates full-length cinematic music videos.

**Strategy**: generates many 10-second clips per song via Kie.ai Runway, then stitches them
with ffmpeg and overlays the original WAV audio → one complete music video per song.

### Prerequisites

- Valid `KIE_API_KEY` in `.env.local`
- **ffmpeg** installed and on PATH — [ffmpeg.org](https://ffmpeg.org)
- Videos and clips saved under `public/Videos/`

### Step 1 — Preview the plan (free, no API calls)

```bash
node scripts/generate-music-videos.js
```

Prints the clip count, estimated video duration, and sample prompts for every song.

Single track preview:

```bash
node scripts/generate-music-videos.js --track 1
```

### Step 2 — Submit clip jobs

```bash
node scripts/generate-music-videos.js --execute
```

Submits all clip jobs to Kie.ai (446 clips for 17 songs, ~27 minutes to submit).
You have 5 seconds to cancel with `Ctrl+C`. State is saved to `public/Videos/index.json`.
Already-submitted clips are skipped — safe to re-run after an interruption.

Single track only:

```bash
node scripts/generate-music-videos.js --execute --track 1
```

### Step 3 — Poll, download, and stitch

```bash
node scripts/generate-music-videos.js --poll
```

Polls all pending clips. As each clip completes it is downloaded to
`public/Videos/clips/{track-slug}/`. Once all clips for a song are downloaded,
ffmpeg automatically stitches them and overlays the original WAV audio →
`public/Videos/{track-slug}.mp4`.

Run `--poll` again if it times out (20 min per run). Already-complete clips are not re-downloaded.

### Check status

```bash
node scripts/generate-music-videos.js --list
```

Shows clip progress per track: `complete/total clips (N pending)`.

### Other commands

```bash
# Clear all state and start fresh
node scripts/generate-music-videos.js --reset

# Re-stitch from already-downloaded clips (without re-polling Kie.ai)
node scripts/generate-music-videos.js --stitch
node scripts/generate-music-videos.js --stitch --track 1
```

### How it works

1. Song duration is read from `public/songs.json` (run `generate-songs-json.js` once to generate it)
2. `ceil(duration / 10)` clips are submitted — each with a slightly varied cinematic prompt
3. Clips are divided into three visual arcs: opening / midpoint / closing
4. ffmpeg concatenates the clips and replaces the audio with the original WAV
5. `public/Videos/index.json` is updated after each stitch — the website reads this file

### Rate limiting and safety

- 3.5 seconds between API submissions (well within Kie.ai's 20 req/10s limit)
- Up to 3 retries with exponential backoff on failure
- Fully idempotent: already-complete clips and videos are never regenerated
- Polling timeout: 20 minutes per run (run `--poll` again if needed)

---

## Deployment

### Environment variables in production

In Vercel, Netlify, or any host: set `KIE_API_KEY` in the dashboard environment variables section. Never commit `.env.local`.

### Build

```bash
npm run build
npm start
```

The music catalogue is scanned at runtime on every request to `/api/music` (dynamic route). There is no build-time scanning — the Music folder can be updated without rebuilding.

---

## Project structure

```
/Music                    ← audio files + lyrics .txt files
/public
  /Videos                 ← generated music videos (from generate-music-videos.js)
    index.json            ← video metadata loaded by the Videos section
/scripts
  generate-songs-json.js  ← writes public/songs.json (static fallback)
  generate-music-videos.js← Kie.ai Runway video generation
/src
  /app
    layout.tsx            ← root layout + providers
    page.tsx              ← home page (all sections)
    /music
      page.tsx            ← full album page with tracklist + lyrics
    /api
      /music              ← GET /api/music — scans /Music, returns catalogue
      /audio/[...path]    ← GET /api/audio/:filename — streams audio with range support
      /contact            ← POST /api/contact — contact form
  /components
    Navigation.tsx
    Hero.tsx
    MusicSection.tsx      ← home page music preview
    AlbumPage.tsx         ← full album page component
    FeaturedReleases.tsx
    WorldSection.tsx
    Biography.tsx
    Videos.tsx
    PressKit.tsx
    Newsletter.tsx
    Contact.tsx
    Footer.tsx
    /player
      GlobalPlayer.tsx    ← persistent bottom audio player
      TrackCard.tsx
  /context
    AudioContext.tsx       ← global audio state (React Context)
  /lib
    types.ts
    musicScanner.ts
    formatters.ts
.env.example              ← committed template (no secrets)
.env.local                ← your local secrets (gitignored)
```

---

## Adding a new song

1. Drop `hd_18 - New Song.wav` into `/Music`
2. Optionally add `hd_18 - New Song.txt` with lyrics
3. The song immediately appears on the website — no code changes needed

## Spotify

The Spotify album URL is configured in two places:
- `src/lib/musicScanner.ts` → `ALBUM_META.spotifyUrl`
- `src/components/MusicSection.tsx` → `SPOTIFY_URL`
