# KIE.AI × NoiraCiel Content Engine

*Architecture document — Phase 1 (dry-run pipeline)*  
*Last updated: 2026-06-15*

---

## 1. What KIE.AI Gives Us

| Capability | KIE.AI Service | NoiraCiel Use Case |
|---|---|---|
| Text-to-video with native audio | Veo 3.1, Wan 2.6, Kling 3.0 | Song films, social teasers |
| Image-to-video animation | Kling 2.6, Wan 2.6 | Cinemagraphs from existing song art |
| Multi-shot cinematic storytelling | Wan 2.6, Kling 3.0 | 60–90 second song films |
| Talking avatar / lip sync | InfiniteTalk, Kling Avatar 2.0 | Artist commentary videos |
| Cinematic style transfer | Runway Aleph | Regrade existing footage |
| Hyper-photorealistic product photography | GPT Image 2 | Books, vinyl, merch |
| Full music with stems | Suno V5.5 | Audiobook ambient scores |
| Voice synthesis | ElevenLabs via KIE.AI | Narration, commentary |
| Fast character image generation | Seedream / Nano Banana Pro | Social identity consistency |
| Image generation | Flux Kontext Pro | Song art, banners, social cards |

---

## 2. Five Content Pillars → Site Pages

### 2.1 Song Films (`/songs/{slug}` — Film tab)
- **What:** 60–90 second multi-shot cinematic short built from 4–6 AI video clips
- **Input:** song title, lyrics excerpt, chapter emotional context, NOIR_STYLE
- **Model:** Veo 3.1 (with native audio) or Kling 3.0 (multi-shot)
- **Output:** `public/generated/kie/films/{slug}/film.mp4` (assembled from shots)
- **Frontend:** New "Film" tab on SongChapterPage
- **Estimated per song:** 4–6 API calls (one per shot) + optional assembly

### 2.2 Animated Song Art / Cinemagraphs (`/songs/{slug}` — Living Artwork tab)
- **What:** Existing static song art converted to a subtle looping 4–8 second video
- **Input:** existing `public/images/song-art/{slug}.jpg` + animation prompt
- **Model:** Kling 2.6 image-to-video
- **Output:** `public/generated/kie/cinemagraphs/{slug}/loop.mp4`
- **Frontend:** Replaces static `<img>` with `<video autoPlay loop muted playsInline>` on song page header
- **Estimated per song:** 1 API call

### 2.3 Artist Commentary (`/songs/{slug}` — Director's Cut tab)
- **What:** 1–3 minute personal video where the artist explains the song's meaning
- **Input:** auto-generated commentary script (from lyrics + emotion context) + ElevenLabs narration + InfiniteTalk lip sync
- **Model:** ElevenLabs TTS + InfiniteTalk / Kling Avatar 2.0
- **Output:** `public/generated/kie/commentary/{slug}/commentary.mp4`
- **Frontend:** New "Director's Cut" tab on SongChapterPage
- **Estimated per song:** 2–3 API calls (TTS + avatar video)

### 2.4 AI Audiobook with Score (`/podcast` and future `/audiobook`)
- **What:** Every story chapter narrated with ElevenLabs voice + Suno ambient score underneath
- **Input:** `public/Books/stories/{slug}.pdf` → extracted text + narration prompt
- **Model:** ElevenLabs TTS (via KIE.AI) + Suno V5.5 for score
- **Output:** `public/generated/kie/audiobook/{slug}/narration.mp3` + `score.mp3` + `final.mp3`
- **Frontend:** Story/Audiobook tab on SongChapterPage + Podcast page enhancement
- **Estimated per chapter:** 2–3 API calls

### 2.5 Merch & Product Cinematics (`/objects`, `/download`)
- **What:** Studio-quality product photography + 4–8 second animation loop
- **Input:** product name, material, mood description
- **Model:** GPT Image 2 (photography) → Kling image-to-video (animation)
- **Output:** `public/generated/kie/objects/{slug}/photo.jpg` + `loop.mp4`
- **Frontend:** Product cards on `/objects` and `/download` with video hover
- **Estimated per product:** 2 API calls

---

## 3. Asset Generation Order (Recommended)

```
Phase 1 — Dry Run (no API calls)
  1. generate-kie-manifest.js     → scans all songs, creates JSON manifests
  2. generate-cinemagraph-prompts.js  → fastest ROI, 1 call per song
  3. generate-song-film-prompts.js    → multi-shot film sequences
  4. generate-commentary-prompts.js   → scripts for narration
  5. generate-audiobook-prompts.js    → chapter narration text
  6. generate-product-prompts.js      → merch/book product shots
  7. validate-kie-assets.js           → full gap report

Phase 2 — Cinemagraphs (cheapest, highest visual impact)
  → Approve cinemagraphs first: 1 call each, transforms every song page

Phase 3 — Commentary (voice-first, no avatar)
  → ElevenLabs narration only (no avatar video yet)

Phase 4 — Song Films
  → Most expensive: 4–6 calls per song, approve album by album

Phase 5 — Audiobook
  → Per-chapter narration + score generation

Phase 6 — Product Cinematics
  → GPT Image 2 + Kling animate loop
```

---

## 4. Manifest JSON Structure (per song)

```json
{
  "songId": "hd-1-whywav",
  "slug": "why",
  "title": "Why",
  "album": "The Life Lessons I Hope You Learn",
  "albumSlug": "the-life-lessons",
  "albumCode": "HD",
  "trackNumber": 1,
  "artist": "NoiraCiel",
  "mood": "searching · existential · coastal drift · quiet awe",
  "style": "Atlantic noir soul · piano-led · cinematic",
  "hasLyrics": true,
  "lyricsExcerpt": "...",
  "lyricsPath": "public/Lyrics/timestamps/why.json",
  "storyPath": "public/Books/stories/why.pdf",
  "artworkPath": "public/images/song-art/why.jpg",
  "artworkUrl": "https://pub-....r2.dev/images/song-art/why.jpg",
  "emotion": "The lifelong question — searching for meaning that was already there.",
  "symbols": "road · horizon · open book · hands · dusk light",
  "generatedAssets": {
    "cinemagraph": {
      "status": "not_started",
      "prompt": "...",
      "sourceImagePath": "public/images/song-art/why.jpg",
      "animationType": "slow_fog_drift",
      "videoLoopPath": "",
      "publicUrl": "",
      "taskId": null,
      "submittedAt": null,
      "completedAt": null
    },
    "songFilm": {
      "status": "not_started",
      "shots": [
        {
          "order": 1,
          "prompt": "...",
          "durationSeconds": 12,
          "model": "veo3",
          "taskId": null,
          "status": "not_started",
          "localPath": "",
          "remoteUrl": ""
        }
      ],
      "finalVideoPath": "",
      "publicUrl": "",
      "assembledAt": null
    },
    "commentary": {
      "status": "not_started",
      "script": "...",
      "scriptPath": "",
      "voicePath": "",
      "avatarVideoPath": "",
      "publicUrl": "",
      "taskId": null
    },
    "audiobook": {
      "status": "not_started",
      "narrationText": "...",
      "narrationPath": "",
      "scorePath": "",
      "finalMixPath": "",
      "publicUrl": "",
      "taskId": null
    }
  },
  "approvals": {
    "cinemagraph": false,
    "songFilm": false,
    "commentary": false,
    "audiobook": false
  },
  "createdAt": "2026-06-15T00:00:00.000Z",
  "updatedAt": "2026-06-15T00:00:00.000Z"
}
```

---

## 5. Folder Structure

```
public/generated/kie/
  index.json                         ← master catalogue of all manifests
  songs/
    why.json
    who-wins-if-i-win.json
    ...                              ← one manifest per song (47 total)
  albums/
    the-life-lessons.json
    blind-angel.json
    ...
  objects/
    vinyl-collector-edition.json
    anthology-book.json
    ...
  films/
    why/
      shot-01.mp4
      shot-02.mp4
      film.mp4
    ...
  cinemagraphs/
    why/
      loop.mp4
    ...
  commentary/
    why/
      script.txt
      narration.mp3
      commentary.mp4
    ...
  audiobook/
    why/
      narration.mp3
      score.mp3
      final.mp3
    ...

scripts/kie/
  generate-kie-manifest.js           ← Phase 1 entry point
  generate-song-film-prompts.js
  generate-cinemagraph-prompts.js
  generate-commentary-prompts.js
  generate-audiobook-prompts.js
  generate-product-prompts.js
  validate-kie-assets.js
  kie-runner.js                      ← orchestrates all scripts

scripts/lib/
  kie-client.js                      ← existing API client (extended)
  asset-tracker.js                   ← existing state management
  prompts.js                         ← existing NoiraCiel identity prompts
```

---

## 6. Frontend Changes Required

### SongChapterPage.tsx — new tab system

Current state: scrollable page with inline sections  
Target: tabbed page with:

| Tab | Component | Status |
|---|---|---|
| Overview | Existing header + play button | ✓ exists |
| Lyrics / Karaoke | `SyncedLyricsPlayer` | ✓ exists |
| Film | `SongFilmPlayer` | Phase 4 |
| Living Artwork | `SongCinemagraph` | Phase 2 |
| Director's Cut | `CommentaryPlayer` | Phase 3 |
| Story / Audiobook | `StorySection` + `AudiobookPlayer` | Phase 5 (partial exists) |

### AlbumPage — generated film clips teaser
- Show 2–3 second preview thumbnails from song films in album track list

### Objects / Download page
- Replace static product images with cinematic video loops (4–8 sec, autoPlay loop muted)

### Podcast / Audiobook page
- Add "AI Audiobook" section with narrated chapters + ambient score player

---

## 7. Cost Control Rules

1. **Dry-run always first** — `KIE_DRY_RUN=true` generates all prompts/manifests with zero API spend
2. **Approval per asset type** — each manifest has `approvals.{type}: false` until explicitly set
3. **Album-by-album batching** — generate one album at a time, review before next
4. **Cheapest first** — Cinemagraphs → Commentary voice → Films → Audiobook
5. **Preview report before spend** — `kie-runner.js --report` shows cost estimate
6. **Local history** — every API call logged to `public/generated/kie/.history.ndjson`
7. **R2 mirroring** — completed assets synced to R2, local files can be purged

### Estimated costs (rough, 2026 KIE.AI pricing)

| Asset Type | API Calls | Est. per Song |
|---|---|---|
| Cinemagraph (Kling) | 1 | ~$0.08–0.30 |
| Song film (4 shots, Veo3) | 4–6 | ~$1.00–3.00 |
| Commentary voice (ElevenLabs) | 1 | ~$0.05–0.20 |
| Commentary avatar (InfiniteTalk) | 1 | ~$0.50–2.00 |
| Audiobook narration | 1 | ~$0.05–0.20 |
| Audiobook score (Suno) | 1 | ~$0.10–0.50 |

**For all 47 songs, cinemagraphs only:** ~$4–14 total  
**Full pipeline, all 47 songs:** ~$80–250 estimated  
Always approve per batch before spend.

---

## 8. NoiraCiel Identity Rules (enforced in every prompt)

All generated prompts must include these style guards:

**DO:**
- 16mm film grain, painterly textures
- Dark Atlantic palette: deep navy, pitch black, warm amber, weathered bone
- Slow atmospheric pacing, long tonal range
- Intimate close-ups: hands, objects, faces in shadow
- Natural materials: stone, wood, water, cloth, candle
- Coastal Atlantic world: sea cliffs, fog, old boats, salt-stained glass
- Emotional dignity without sentimentality

**NEVER:**
- Neon lights, fast cuts, CGI look, glossy surfaces
- Text overlays inside video or image (unless explicitly requested)
- Logos inside generated media
- Dancing silhouettes, stock-video clichés
- Cartoonish shapes, plastic faces, generic AI aesthetics
- Random candles everywhere (use light purposefully)
- Random forest / nature scenes unconnected to the song

---

## 9. Environment Variables Required

```bash
# .env.local additions
KIE_API_KEY=                    # KIE.AI API key
KIE_BASE_URL=https://api.kie.ai/api/v1
KIE_DRY_RUN=true               # set to false only when approving generation
KIE_APPROVAL_MODE=false        # set to true to enable approved assets only
KIE_ELEVENLABS_VOICE_ID=hpp4J3VqNfWAUOO0d1Us  # default NoiraCiel voice
```

---

## 10. Phase 1 Deliverables (dry-run only)

Run `node scripts/kie/kie-runner.js` to get:

1. ✓ Song manifests for all 47 tracks in `public/generated/kie/songs/`
2. ✓ Cinemagraph prompts + animation types per song
3. ✓ Song film shot sequences (4–6 prompts per song)
4. ✓ Commentary scripts per song
5. ✓ Audiobook narration text per song
6. ✓ Product prompts for books and objects
7. ✓ Validation report: what's ready, what's missing, what's blocked
8. ✓ Generation history log at `public/generated/kie/.history.ndjson`
9. ✓ Master index at `public/generated/kie/index.json`

No KIE.AI API credits spent until you explicitly set `KIE_DRY_RUN=false` and approve per manifest.
