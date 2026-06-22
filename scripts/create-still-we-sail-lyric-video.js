#!/usr/bin/env node
'use strict'
/**
 * create-still-we-sail-lyric-video.js
 *
 * Rebuilds the Still We Sail music video with synchronized lyrics burned in.
 * Uses word-level timestamps from public/Lyrics/timestamps/still-we-sail.json.
 * Groups words into lyric lines, generates ASS subtitles, re-encodes video.
 */

const fs   = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT        = path.join(__dirname, '..')
const TIMESTAMPS  = path.join(ROOT, 'public/Lyrics/timestamps/still-we-sail.json')
const LYRICS_FILE = path.join(ROOT, 'Music/Still_We_Sail/lyrics/01_still_we_sail.md')
const SILENT_SRC  = '/tmp/nc_sws_video/silent.mp4'   // reuse the concat from last run
const AUDIO_SRC   = path.join(ROOT, 'Music/Still_We_Sail/audio/01_still_we_sail_v1.mp3')
const OUT_DIR     = path.join(ROOT, 'public/generated/kie/music-videos')
const OUT_FILE    = path.join(OUT_DIR, 'still-we-sail.mp4')
const TMP         = '/tmp/nc_sws_lyric'
const SONG_DUR    = 256.88
const FONT        = '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'

fs.mkdirSync(TMP, { recursive: true })
fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── Step 1: Group words into lyric lines ─────────────────────────────────────
console.log('\n── Step 1: Grouping word timestamps into lyric lines...')

const { words } = JSON.parse(fs.readFileSync(TIMESTAMPS))
const rawLyrics  = fs.readFileSync(LYRICS_FILE, 'utf-8')

// Extract lyric lines only (skip frontmatter, section headers, blank lines)
const lyricLines = rawLyrics
  .split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#') && !l.startsWith('[') && !l.startsWith('**') && !l.startsWith('---'))
  .filter(l => !/^(Inspiration|Score:|Selected|Generated|Album:|Lyrics)/.test(l))

// Normalise a word for matching: lowercase, strip punctuation
const norm = s => s.toLowerCase().replace(/[^a-z0-9']/g, '')

// Build ordered word list from lyrics
const lyricWords = lyricLines.flatMap(line =>
  line.split(/\s+/).map(w => norm(w)).filter(Boolean)
)

// Match lyric words to timestamp words sequentially
// Returns array of {word, start, end, lineIdx}
let tIdx = 0
const matched = []
for (let wIdx = 0; wIdx < lyricWords.length; wIdx++) {
  const target = lyricWords[wIdx]
  // Search forward in timestamps (allow up to 5 positions of slack)
  let found = false
  for (let slack = 0; slack < 8 && tIdx + slack < words.length; slack++) {
    if (norm(words[tIdx + slack].word) === target) {
      matched.push({ ...words[tIdx + slack], lineIdx: -1 })
      tIdx += slack + 1
      found = true
      break
    }
  }
  if (!found) {
    // push a placeholder so lineIdx alignment stays intact
    matched.push({ word: lyricWords[wIdx], start: matched[matched.length - 1]?.end ?? 0, end: matched[matched.length - 1]?.end ?? 0, lineIdx: -1 })
  }
}

// Reconstruct per-line groups
let wordPos = 0
const lines = lyricLines.map((line, lineIdx) => {
  const lineWordCount = line.split(/\s+/).filter(Boolean).length
  const slice = matched.slice(wordPos, wordPos + lineWordCount)
  wordPos += lineWordCount
  const validSlice = slice.filter(w => w.start > 0)
  if (!validSlice.length) return null
  return {
    text: line,
    start: validSlice[0].start,
    end:   validSlice[validSlice.length - 1].end + 0.25,
  }
}).filter(Boolean)

console.log(`   ${lines.length} lyric lines mapped`)
console.log(`   First: "${lines[0].text}" @ ${lines[0].start.toFixed(2)}s`)
console.log(`   Last:  "${lines[lines.length-1].text}" @ ${lines[lines.length-1].start.toFixed(2)}s`)

// ─── Step 2: Generate ASS subtitle file ──────────────────────────────────────
console.log('\n── Step 2: Generating ASS subtitles...')

function toAssTime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  const cs = Math.round((secs % 1) * 100)
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
}

// ASS header — elegant italic serif, centered, lower third
const assHeader = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Lyric,Liberation Serif,46,&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,0,1,0,0,100,100,2,0,1,1.5,2,2,60,60,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

// Merge consecutive lines that overlap or are very close (< 0.3s gap) into pairs
// so verses display one line, chorus displays cleanly
const dialogues = lines.map(line => {
  const fadeMs = 300  // 300ms fade in and out
  const text = `{\\fad(${fadeMs},${fadeMs})}${line.text}`
  return `Dialogue: 0,${toAssTime(Math.max(0, line.start - 0.15))},${toAssTime(line.end + 0.1)},Lyric,,0,0,0,,${text}`
}).join('\n')

const assPath = path.join(TMP, 'lyrics.ass')
fs.writeFileSync(assPath, assHeader + dialogues)
console.log(`   Written: ${assPath}`)

// ─── Step 3: Rebuild the silent concat if missing ─────────────────────────────
if (!fs.existsSync(SILENT_SRC)) {
  console.log('\n── Step 3: Rebuilding silent video concat...')
  // Rerun the concat from create-still-we-sail-video.js
  require('./create-still-we-sail-video.js')
} else {
  console.log('\n── Step 3: Reusing existing silent concat ✓')
}

// ─── Step 4: Burn subtitles + mix audio ──────────────────────────────────────
console.log('\n── Step 4: Encoding with burned lyrics + audio...')
console.log('   (this takes ~5 minutes — encoding 4m17s at ~1× realtime)\n')

const FADE_OUT_START = SONG_DUR - 4
const r = spawnSync('ffmpeg', [
  '-y',
  '-i', SILENT_SRC,
  '-i', AUDIO_SRC,
  '-map', '0:v',
  '-map', '1:a',
  '-vf', `ass=${assPath}`,
  '-af', `afade=t=in:ss=0:d=1,afade=t=out:st=${FADE_OUT_START}:d=4`,
  '-t', String(SONG_DUR),
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
  '-c:a', 'aac', '-b:a', '192k',
  '-movflags', '+faststart',
  OUT_FILE,
], { stdio: 'inherit', timeout: 600000 })

if (r.status !== 0) {
  console.error('\nEncoding failed')
  process.exit(1)
}

const sizeMB = (fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(1)
console.log(`\n── Complete ────────────────────────────────────────────────────`)
console.log(`   Output: ${OUT_FILE} (${sizeMB}MB)`)
console.log(`   Next:   node scripts/kie/upload-to-r2.js --music-video`)
