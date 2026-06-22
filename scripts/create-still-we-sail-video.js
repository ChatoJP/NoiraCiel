#!/usr/bin/env node
'use strict'
/**
 * create-still-we-sail-video.js
 *
 * Full music video for "Still We Sail" using existing cinemagraphs.
 * Song: 256.88s (4m17s). Footage: 38 × 8s loops = 304s available.
 * Zero KIE.AI credits needed.
 *
 * Usage: node scripts/create-still-we-sail-video.js
 */

const fs   = require('fs')
const path = require('path')
const { execSync, spawnSync } = require('child_process')

const ROOT       = path.join(__dirname, '..')
const CIN_DIR    = path.join(ROOT, 'public/generated/kie/cinemagraphs')
const OUT_DIR    = path.join(ROOT, 'public/generated/kie/music-videos')
const AUDIO_SRC  = path.join(ROOT, 'Music/Still_We_Sail/audio/01_still_we_sail_v1.mp3')
const OUT_FILE   = path.join(OUT_DIR, 'still-we-sail.mp4')
const SONG_DUR   = 256.88  // seconds

fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── Shot sequence ────────────────────────────────────────────────────────────
// 32 × 8s = 256s ≈ song duration. Structured to match song arc:
//   Verse 1 → Pre-Chorus → Chorus → Verse 2 → Pre-Chorus → Chorus → Bridge → Final Chorus → Outro
//
// Repeats are intentional — creates the motif recurrence of the song structure.
const SEQUENCE = [
  // Verse 1 (0–32s): intimate departure, ash, rain, window
  'still-we-sail',              // 0–8s   cold open, ocean breathing
  'letters-never-crossed',      // 8–16s  "I left my name in ash on a door"
  'she-who-stayed-behind',      // 16–24s "your coat still smells like rain"
  'the-port-we-cannot-find',    // 24–32s "the maps all changed on me"

  // Pre-Chorus (32–48s): "Not brave / Just moved / By the shape of the bruise"
  'lisbon-is-not-a-city-it-is-a-wound',  // 32–40s — wound, bruise, city
  'saudade-has-a-weight',                // 40–48s — the weight of it

  // Chorus 1 (48–80s): "Still we sail / Past the wreck and the hail"
  'exile-body',                 // 48–56s  "still we sail" — body in motion
  'salt-gospel',                // 56–64s  "past the wreck and the hail"
  'i-chose-the-open',           // 64–72s  "what we fear feels less than stay"
  'atlantic-nocturne',          // 72–80s  the open Atlantic night

  // Verse 2 (80–112s): exile, harbour ghosting, stone in coat
  'she-who-stayed-behind',      // 80–88s  "the harbour ghosted out"
  'saudade-has-a-weight',       // 88–96s  "held your silence like a stone"
  'grief-in-different-latitudes', // 96–104s "some nights it pulled me under"
  'all-the-water-between',      // 104–112s "some nights it kept me afloat"

  // Pre-Chorus 2 (112–128s)
  'lisbon-is-not-a-city-it-is-a-wound',  // 112–120s
  'letters-never-crossed',               // 120–128s "if I turn back now"

  // Chorus 2 (128–160s)
  'exile-body',                 // 128–136s
  'salt-gospel',                // 136–144s
  'i-chose-the-open',           // 144–152s
  'still-we-sail',              // 152–160s "stopping now would cost us more"

  // Bridge (160–200s): "And if the sea takes names / let it take the old ones too"
  'a-body-made-of-night',       // 160–168s "if the sea takes names"
  'grief-in-different-latitudes', // 168–176s "I have learned what loss can do"
  'all-the-water-between',      // 176–184s "lean into the black"
  'atlantic-nocturne',          // 184–192s "broken stars be proof"
  'saudade-has-a-weight',       // 192–200s "we are made of moving through"

  // Final Chorus (200–232s): resolution, emergence
  'still-we-sail-to-light',     // 200–208s "still we sail" — resolution
  'i-chose-the-open',           // 208–216s
  'salt-gospel',                // 216–224s
  'still-we-sail-to-light',     // 224–232s

  // Outro (232–256s): stillness returning to the sea
  'still-we-sail',              // 232–240s
  'she-who-stayed-behind',      // 240–248s
  'still-we-sail',              // 248–256s fade to end
]

// Verify all clips exist locally
console.log('\n── Still We Sail — Music Video ─────────────────────────────')
console.log(`   ${SEQUENCE.length} shots × 8s = ${SEQUENCE.length * 8}s  |  song: ${SONG_DUR}s`)
let allOk = true
for (const slug of [...new Set(SEQUENCE)]) {
  const f = path.join(CIN_DIR, slug, 'loop.mp4')
  if (!fs.existsSync(f)) { console.error(`   ✗ MISSING: ${slug}`); allOk = false }
  else console.log(`   ✓ ${slug}`)
}
if (!allOk) { console.error('\nAbort — missing clips.'); process.exit(1) }
if (!fs.existsSync(AUDIO_SRC)) { console.error(`\nAbort — audio not found: ${AUDIO_SRC}`); process.exit(1) }

// ─── Step 1: Write concat list ────────────────────────────────────────────────
console.log('\n── Step 1: Building concat list...')
const TMP = '/tmp/nc_sws_video'
fs.mkdirSync(TMP, { recursive: true })

const concatLines = SEQUENCE.map(slug => {
  const src = path.join(CIN_DIR, slug, 'loop.mp4')
  return `file '${src}'`
}).join('\n')

const concatFile = path.join(TMP, 'concat.txt')
fs.writeFileSync(concatFile, concatLines)
console.log(`   ${SEQUENCE.length} entries written`)

// ─── Step 2: Concat video (stream copy — instant) ─────────────────────────────
console.log('\n── Step 2: Concatenating video...')
const silentOut = path.join(TMP, 'silent.mp4')
const r1 = spawnSync('ffmpeg', [
  '-y',
  '-f', 'concat', '-safe', '0',
  '-i', concatFile,
  '-c', 'copy',
  silentOut,
], { stdio: 'pipe' })

if (r1.status !== 0) {
  console.error(r1.stderr?.toString().slice(-500))
  process.exit(1)
}
console.log('   done')

// ─── Step 3: Mix audio, trim to song duration ────────────────────────────────
// Stream-copy video (no re-encode), only process audio (fade in/out).
console.log('\n── Step 3: Mixing audio (stream-copy video, audio-only encode)...')
const FADE_OUT_START = SONG_DUR - 4  // 4s audio fade out at end

const r2 = spawnSync('ffmpeg', [
  '-y',
  '-i', silentOut,
  '-i', AUDIO_SRC,
  '-map', '0:v',
  '-map', '1:a',
  '-af', `afade=t=in:ss=0:d=1,afade=t=out:st=${FADE_OUT_START}:d=4`,
  '-t', String(SONG_DUR),
  '-c:v', 'copy',           // stream-copy video — instant
  '-c:a', 'aac', '-b:a', '192k',
  '-movflags', '+faststart',
  OUT_FILE,
], { stdio: 'pipe', timeout: 120000 })

if (r2.status !== 0) {
  console.error(r2.stderr?.toString().slice(-800))
  process.exit(1)
}

const sizeMB = (fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(1)
console.log(`   ✓ ${OUT_FILE} (${sizeMB}MB)`)

// ─── Done ────────────────────────────────────────────────────────────────────
console.log(`
── Complete ────────────────────────────────────────────────────
   Output : ${OUT_FILE}
   Size   : ${sizeMB}MB
   Length : ${Math.floor(SONG_DUR / 60)}m${Math.round(SONG_DUR % 60)}s
   Shots  : ${SEQUENCE.length} scenes

   Next: upload to R2
   node scripts/kie/upload-to-r2.js --music-video
`)
