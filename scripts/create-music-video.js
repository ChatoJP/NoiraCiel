#!/usr/bin/env node
'use strict'
/**
 * create-music-video.js
 * Generic music video generator with burned-in synchronized lyrics.
 * Works for any song that has timestamps + audio + a shot list.
 *
 * Usage: node scripts/create-music-video.js <slug>
 * e.g.:  node scripts/create-music-video.js the-empty-chair
 */

const fs   = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT    = path.join(__dirname, '..')
const CIN_DIR = path.join(ROOT, 'public/generated/kie/cinemagraphs')
const OUT_DIR = path.join(ROOT, 'public/generated/kie/music-videos')
const R2_BASE = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── Song configs ─────────────────────────────────────────────────────────────
// Each entry: audio path, timestamp path, lyrics path, song duration, shot list.
// Shots loop in order to fill the full song duration.
const SONGS = {

  'the-empty-chair': {
    audio:     path.join(ROOT, "Music/hd_13 - The Empty Chair.wav"),
    lyrics:    path.join(ROOT, "Music/hd_13 - The Empty Chair.txt"),
    tsFile:    path.join(ROOT, "public/Lyrics/timestamps/the-empty-chair.json"),
    duration:  264.52,
    // Grief, absence, stillness — all light_flicker and breath cinemagraphs
    shots: [
      'the-empty-chair',             // own cinemagraph — chair, window, morning light
      'leave-a-light-on',            // "still leave a place for you"
      'the-house-we-couldnt-leave',  // "when the house is quiet"
      'borrowed-time',               // "time erases"
      'it-was-already-there',        // "what the world forgets to see"
      'grief-in-different-latitudes',// grief in the body
      'maybe-i-was-wrong',           // "funny how the heart remembers"
      'saudade-has-a-weight',        // weight of absence
      'good-things-grow-slow',       // "autumn leaves"
      'always-in-your-corner',       // "in the stories, in the laughter"
      'the-port-we-cannot-find',     // "a road we used to travel"
      'still-we-sail-to-light',      // moving on, light still present
      'atlantic-nocturne',           // "feel you in the breeze"
      'no-one-leaves-the-night-unchanged', // night, quiet, memory
      'all-the-water-between',       // distance, time
      'she-who-stayed-behind',       // those who remain
    ],
  },

  'leave-a-light-on': {
    audio:    path.join(ROOT, "Music/hd_12 - Leave A Light On.wav"),
    lyrics:   path.join(ROOT, "Music/hd_12 - Leave A Light On.txt"),
    tsFile:   path.join(ROOT, "public/Lyrics/timestamps/leave-a-light-on.json"),
    duration: 0, // auto-detected
    shots: [
      'leave-a-light-on',
      'the-house-we-couldnt-leave',
      'it-was-already-there',
      'always-in-your-corner',
      'still-we-sail-to-light',
      'borrowed-time',
      'the-empty-chair',
      'atlantic-nocturne',
      'good-things-grow-slow',
      'no-one-leaves-the-night-unchanged',
      'grief-in-different-latitudes',
      'saudade-has-a-weight',
    ],
  },

  'why': {
    audio:    path.join(ROOT, "Music/hd_1 - Why.wav"),
    lyrics:   path.join(ROOT, "Music/hd_1 - Why.txt"),
    tsFile:   path.join(ROOT, "public/Lyrics/timestamps/why.json"),
    duration: 0,
    shots: [
      'still-human-after-all-this-noise',
      'the-future-has-an-accent',
      'saudade-has-a-weight',
      'lisbon-is-not-a-city-it-is-a-wound',
      'no-one-leaves-the-night-unchanged',
      'the-port-we-cannot-find',
      'atlantic-nocturne',
      'all-the-water-between',
      'grief-in-different-latitudes',
      'a-body-made-of-night',
      'she-who-stayed-behind',
      'i-chose-the-open',
    ],
  },

  'side-by-side': {
    audio:    path.join(ROOT, "Music/hd_6- Side By Side.wav"),
    lyrics:   path.join(ROOT, "Music/hd_6- Side By Side.txt"),
    tsFile:   path.join(ROOT, "public/Lyrics/timestamps/side-by-side.json"),
    duration: 0,
    shots: [
      'side-by-side',
      'always-in-your-corner',
      'it-was-already-there',
      'good-things-grow-slow',
      'as-long-as-youre-okay',
      'still-worth-it',
      'borrowed-time',
      'leave-a-light-on',
      'the-house-we-couldnt-leave',
      'maybe-i-was-wrong',
      'she-who-stayed-behind',
      'saudade-has-a-weight',
    ],
  },

}

// ─── Resolve slug ─────────────────────────────────────────────────────────────
const slug = process.argv[2]
if (!slug || !SONGS[slug]) {
  console.error(`\nUsage: node scripts/create-music-video.js <slug>`)
  console.error(`Available: ${Object.keys(SONGS).join(', ')}`)
  process.exit(1)
}
const song = SONGS[slug]

// Auto-detect duration if not set
if (!song.duration) {
  const r = spawnSync('ffprobe', [
    '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', song.audio
  ], { encoding: 'utf8' })
  song.duration = parseFloat(r.stdout.trim())
}

const TMP     = path.join(ROOT, `.tmp/mv/${slug}`)
const OUT     = path.join(OUT_DIR, `${slug}.mp4`)
fs.mkdirSync(TMP, { recursive: true })

// Build full shot sequence to cover song duration
const clipDur  = 8
const needed   = Math.ceil(song.duration / clipDur)
const sequence = []
while (sequence.length < needed) {
  for (const s of song.shots) {
    if (sequence.length >= needed) break
    sequence.push(s)
  }
}

console.log(`\n── Music Video: ${slug} ──────────────────────────────────────`)
console.log(`   Duration: ${(song.duration/60).toFixed(1)}min  |  Shots needed: ${needed}  |  Sequence: ${sequence.length}`)

// Verify clips
let allOk = true
for (const s of [...new Set(sequence)]) {
  const f = path.join(CIN_DIR, s, 'loop.mp4')
  if (!fs.existsSync(f)) { console.error(`   ✗ MISSING: ${s}`); allOk = false }
}
if (!allOk) process.exit(1)
console.log(`   All ${[...new Set(sequence)].length} unique clips verified ✓`)

// ─── Timestamps → lyric lines ─────────────────────────────────────────────────
console.log('\n── Mapping lyrics to timestamps...')
const { words } = JSON.parse(fs.readFileSync(song.tsFile))
const rawLyrics  = fs.readFileSync(song.lyrics, 'utf-8')
const lyricLines = rawLyrics.split('\n').map(l => l.trim())
  .filter(l => l && !l.startsWith('#') && !l.startsWith('[') && !l.startsWith('**') && !l.startsWith('---'))
  .filter(l => !/^(Inspiration|Score:|Selected|Generated|Album:|Lyrics)/.test(l))

const norm = s => s.toLowerCase().replace(/[^a-z0-9']/g, '')
const lyricWords = lyricLines.flatMap(line =>
  line.split(/\s+/).map(w => norm(w)).filter(Boolean)
)

let tIdx = 0
const matched = []
for (let wIdx = 0; wIdx < lyricWords.length; wIdx++) {
  const target = lyricWords[wIdx]
  let found = false
  for (let slack = 0; slack < 8 && tIdx + slack < words.length; slack++) {
    if (norm(words[tIdx + slack].word) === target) {
      matched.push({ ...words[tIdx + slack] })
      tIdx += slack + 1
      found = true
      break
    }
  }
  if (!found) {
    matched.push({ word: lyricWords[wIdx], start: matched[matched.length - 1]?.end ?? 0, end: matched[matched.length - 1]?.end ?? 0 })
  }
}

let wordPos = 0
const lines = lyricLines.map(line => {
  const count = line.split(/\s+/).filter(Boolean).length
  const slice = matched.slice(wordPos, wordPos + count).filter(w => w.start > 0)
  wordPos += count
  if (!slice.length) return null
  return { text: line, start: slice[0].start, end: slice[slice.length - 1].end + 0.25 }
}).filter(Boolean)

console.log(`   ${lines.length} lines mapped  (${lines[0].text} @ ${lines[0].start.toFixed(1)}s)`)

// ─── ASS subtitle file ────────────────────────────────────────────────────────
const toAss = s => {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60), cs = Math.round((s%1)*100)
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
}
const assPath = path.join(TMP, 'lyrics.ass')
fs.writeFileSync(assPath,
  `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\nWrapStyle: 1\n\n` +
  `[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n` +
  `Style: Lyric,Liberation Serif,46,&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,0,1,0,0,100,100,2,0,1,1.5,2,2,60,60,80,1\n\n` +
  `[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n` +
  lines.map(l =>
    `Dialogue: 0,${toAss(Math.max(0, l.start - 0.15))},${toAss(l.end + 0.1)},Lyric,,0,0,0,,{\\fad(300,300)}${l.text}`
  ).join('\n')
)

// ─── Concat video ─────────────────────────────────────────────────────────────
console.log('\n── Concatenating clips...')
const concatFile = path.join(TMP, 'concat.txt')
fs.writeFileSync(concatFile, sequence.map(s => `file '${path.join(CIN_DIR, s, 'loop.mp4')}'`).join('\n'))
const silentOut = path.join(TMP, 'silent.mp4')
const r1 = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', silentOut], { stdio: 'pipe' })
if (r1.status !== 0) { console.error(r1.stderr?.toString().slice(-300)); process.exit(1) }
console.log('   Done ✓')

// ─── Encode with lyrics + audio ───────────────────────────────────────────────
console.log('\n── Encoding with lyrics + audio (~5 min)...\n')
const fadeStart = song.duration - 4
const r2 = spawnSync('ffmpeg', [
  '-y',
  '-i', silentOut,
  '-i', song.audio,
  '-map', '0:v', '-map', '1:a',
  '-vf', `ass=${assPath}`,
  '-af', `afade=t=in:ss=0:d=1,afade=t=out:st=${fadeStart}:d=4`,
  '-t', String(song.duration),
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
  '-c:a', 'aac', '-b:a', '192k',
  '-movflags', '+faststart',
  OUT,
], { stdio: 'inherit', timeout: 600000 })

if (r2.status !== 0) { console.error('Encoding failed'); process.exit(1) }

const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1)
console.log(`\n── Done: ${OUT} (${sizeMB}MB)`)

// ─── Update music-videos.json ────────────────────────────────────────────────
const mvPath = path.join(ROOT, 'public/music-videos.json')
const mv = JSON.parse(fs.readFileSync(mvPath))
const r2Url = `${R2_BASE}/generated/kie/music-videos/${slug}.mp4`
const existing = mv.videos.findIndex(v => v.trackId === slug)
const entry = { trackId: slug, albumSlug: 'main', title: slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), url: r2Url, thumbnail: `/images/song-art/${slug}.jpg`, duration: `${Math.floor(song.duration/60)}:${String(Math.round(song.duration%60)).padStart(2,'0')}`, description: `${sequence.length} cinemagraph scenes · Veo3`, publishedAt: new Date().toISOString().slice(0,10) }
if (existing >= 0) mv.videos[existing] = entry; else mv.videos.push(entry)
fs.writeFileSync(mvPath, JSON.stringify(mv, null, 2))
console.log(`   music-videos.json updated`)
console.log(`\n   Next: node scripts/kie/upload-to-r2.js --music-video`)
