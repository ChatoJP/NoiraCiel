#!/usr/bin/env node
'use strict'
/**
 * create-all-music-videos.js
 *
 * Generates a music video for every song that has:
 *   • a word-level timestamp file  (public/Lyrics/timestamps/{slug}.json)
 *   • an audio file                (Music/...)
 *
 * Technique: crossfade slideshow from artwork + chapter banners + gallery images.
 * No cinemagraphs needed. One FFmpeg pass per song — images + lyrics + audio.
 *
 * Usage:
 *   node scripts/create-all-music-videos.js               # all pending
 *   node scripts/create-all-music-videos.js --slug why    # single song
 *   node scripts/create-all-music-videos.js --dry-run     # inventory only
 */

const fs            = require('fs')
const path          = require('path')
const { spawnSync } = require('child_process')

const ROOT    = path.join(__dirname, '..')
const IMGS    = path.join(ROOT, 'public/images')
const OUT_DIR = path.join(ROOT, 'public/generated/kie/music-videos')
const TS_DIR  = path.join(ROOT, 'public/Lyrics/timestamps')
const MV_JSON = path.join(ROOT, 'public/music-videos.json')
const R2_BASE = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

const DRY_RUN  = process.argv.includes('--dry-run')
const SLUG_ARG = process.argv.includes('--slug') ? process.argv[process.argv.indexOf('--slug') + 1] : null

fs.mkdirSync(OUT_DIR, { recursive: true })

// ─── Image pool ──────────────────────────────────────────────────────────────
function loadImagePool() {
  const pool = { bySlug: {}, gallery: [], lyricBg: [], artist: [], bg: [] }
  const readDir = (dir) => {
    try { return fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)) } catch { return [] }
  }

  // Song art + chapter banners indexed by slug
  for (const f of readDir(path.join(IMGS, 'song-art'))) {
    const slug = f.replace(/\.[^.]+$/, '')
    pool.bySlug[slug] = pool.bySlug[slug] ?? {}
    pool.bySlug[slug].art = path.join(IMGS, 'song-art', f)
  }
  for (const f of readDir(path.join(IMGS, 'chapter-banners'))) {
    const slug = f.replace(/\.[^.]+$/, '')
    pool.bySlug[slug] = pool.bySlug[slug] ?? {}
    pool.bySlug[slug].banner = path.join(IMGS, 'chapter-banners', f)
  }

  // Generic pools
  pool.gallery  = readDir(path.join(IMGS, 'gallery')).map(f => path.join(IMGS, 'gallery', f))
  pool.lyricBg  = readDir(path.join(IMGS, 'lyric-backgrounds')).map(f => path.join(IMGS, 'lyric-backgrounds', f))
  pool.artist   = readDir(path.join(IMGS, 'artist')).map(f => path.join(IMGS, 'artist', f))
  pool.bg       = readDir(path.join(IMGS, 'backgrounds')).map(f => path.join(IMGS, 'backgrounds', f))
  return pool
}

// Album membership for thematic image selection
const ALBUM_SLUGS = {
  'still-we-sail': ['a-body-made-of-night','all-the-water-between','atlantic-nocturne','exile-body','grief-in-different-latitudes','i-chose-the-open','letters-never-crossed','salt-gospel','saudade-has-a-weight','she-who-stayed-behind','still-we-sail','still-we-sail-to-light','the-accordion-breathes','the-port-we-cannot-find','the-sea-keeps-our-names','what-fado-holds'],
  'velvet-machine': ['accordion-heart','contra-bass-confession','hard-techno-prayer','lisbon-is-not-a-city-it-is-a-wound','no-one-leaves-the-night-unchanged','saxophone-for-the-damned-and-the-loved','she-dances-like-a-memory','still-human-after-all-this-noise','the-accordion-breathes','the-future-has-an-accent','the-girl-with-the-cello-scar','the-saints-go-clubbing','the-velvet-machine','velvet-bruises','when-the-machines-learn-saudade'],
  'jazz': ['blood-on-the-hallelujah','carry-you-home','its-not-always-easy','keep-a-chair-for-you','mercy-wears-a-black-coat','the-heart-comes-home-at-night','the-river-knows-your-name','the-truth-has-teeth','the-woman-beside-the-fire'],
}
const SLUG_TO_ALBUM = {}
for (const [album, slugs] of Object.entries(ALBUM_SLUGS)) {
  for (const s of slugs) SLUG_TO_ALBUM[s] = album
}

function buildImageSequence(slug, durationSecs, pool) {
  const segDur   = 10  // seconds per image
  const xDur     = 1   // crossfade seconds
  const netSeg   = segDur - xDur  // 9s net per image
  const needed   = Math.ceil(durationSecs / netSeg) + 2

  // Seed the ordered list — own images first, then album peers, then general
  const ordered = []
  const add = (p) => { if (p && !ordered.includes(p)) ordered.push(p) }

  // Own: chapter banner then song art (different looks)
  if (pool.bySlug[slug]?.banner) add(pool.bySlug[slug].banner)
  if (pool.bySlug[slug]?.art)    add(pool.bySlug[slug].art)

  // Album peers (thematic match)
  const albumSlugs = ALBUM_SLUGS[SLUG_TO_ALBUM[slug]] ?? []
  const albumPeers = albumSlugs.filter(s => s !== slug)
  for (const peer of albumPeers) {
    add(pool.bySlug[peer]?.banner)
    add(pool.bySlug[peer]?.art)
  }

  // Generic pools in cinematic priority order
  for (const p of pool.lyricBg) add(p)
  for (const p of pool.gallery)  add(p)
  for (const p of pool.bg)       add(p)
  for (const p of pool.artist)   add(p)

  // All remaining slug images (other albums)
  for (const { banner, art } of Object.values(pool.bySlug)) {
    add(banner); add(art)
  }

  // Cycle to fill
  const seq = []
  while (seq.length < needed) {
    for (const p of ordered) {
      if (seq.length >= needed) break
      seq.push(p)
    }
  }
  return seq.slice(0, needed)
}

// ─── Audio discovery ─────────────────────────────────────────────────────────
function slugify(s) {
  return s.toLowerCase().replace(/[''']/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}
function buildAudioMap() {
  const map = {}
  function scan(dir) {
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.isDirectory()) { scan(path.join(dir, e.name)); continue }
      if (!/\.(wav|mp3|flac)$/i.test(e.name)) continue
      const noExt = e.name.replace(/\.(wav|mp3|flac)$/i, '')
      const clean = noExt.replace(/^hd_\d+[-\s]+/i, '').replace(/^[\d]+[._]+/, '').replace(/_v\d+$/i, '').replace(/_/g, ' ').trim()
      const slug  = slugify(clean)
      if (slug && slug.length > 3) map[slug] = path.join(dir, e.name)
    }
  }
  scan(path.join(ROOT, 'Music'))
  return map
}
function buildLyricsMap() {
  const map = {}
  function scan(dir) {
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.isDirectory()) { scan(path.join(dir, e.name)); continue }
      if (!/\.(txt|md)$/i.test(e.name)) continue
      const noExt = e.name.replace(/\.(txt|md)$/i, '')
      const clean = noExt.replace(/^hd_\d+[-\s]+/i, '').replace(/^[\d]+[._]+/, '').replace(/_v\d+$/i, '').replace(/_/g, ' ').trim()
      const slug  = slugify(clean)
      if (slug && slug.length > 3) map[slug] = path.join(dir, e.name)
    }
  }
  scan(path.join(ROOT, 'Music'))
  return map
}

function probeDuration(audioPath) {
  const r = spawnSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioPath], { encoding: 'utf8' })
  return parseFloat(r.stdout.trim())
}

// ─── ASS lyrics ──────────────────────────────────────────────────────────────
const ASS_HEADER = `[Script Info]
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
function toAssTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), cs = Math.round((s % 1) * 100)
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`
}
function buildAss(tsFile, lyricsFile) {
  const { words } = JSON.parse(fs.readFileSync(tsFile))
  const raw = fs.readFileSync(lyricsFile, 'utf-8')
  const lyricLines = raw.split('\n').map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('[') && !l.startsWith('**') && !l.startsWith('---'))
    .filter(l => !/^(Inspiration|Score:|Selected|Generated|Album:|Lyrics|Verse|Chorus|Bridge|Hook|Outro|Intro)[\s:]/i.test(l))
  const norm = s => s.toLowerCase().replace(/[^a-z0-9']/g, '')
  const lyricWords = lyricLines.flatMap(line => line.split(/\s+/).map(w => norm(w)).filter(Boolean))
  let tIdx = 0
  const matched = []
  for (const target of lyricWords) {
    let found = false
    for (let slack = 0; slack < 10 && tIdx + slack < words.length; slack++) {
      if (norm(words[tIdx + slack].word) === target) { matched.push({ ...words[tIdx + slack] }); tIdx += slack + 1; found = true; break }
    }
    if (!found) matched.push({ word: target, start: matched[matched.length-1]?.end ?? 0, end: matched[matched.length-1]?.end ?? 0 })
  }
  let wordPos = 0
  const lines = lyricLines.map(line => {
    const count = line.split(/\s+/).filter(Boolean).length
    const slice = matched.slice(wordPos, wordPos + count).filter(w => w.start > 0)
    wordPos += count
    if (!slice.length) return null
    return { text: line, start: slice[0].start, end: slice[slice.length-1].end + 0.25 }
  }).filter(Boolean)
  const dialogues = lines.map(l =>
    `Dialogue: 0,${toAssTime(Math.max(0, l.start - 0.15))},${toAssTime(l.end + 0.1)},Lyric,,0,0,0,,{\\fad(300,300)}${l.text}`
  ).join('\n')
  return { ass: ASS_HEADER + dialogues, lineCount: lines.length }
}

// ─── Update music-videos.json ────────────────────────────────────────────────
function updateMvJson(slug, duration, imgCount) {
  const mv    = JSON.parse(fs.readFileSync(MV_JSON))
  const r2Url = `${R2_BASE}/generated/kie/music-videos/${slug}.mp4`
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const album = SLUG_TO_ALBUM[slug] ?? 'main'
  const entry = {
    trackId:     slug,
    albumSlug:   album === 'hd-main' ? 'main' : album,
    title,
    url:         r2Url,
    thumbnail:   `/images/song-art/${slug}.jpg`,
    duration:    `${Math.floor(duration/60)}:${String(Math.round(duration%60)).padStart(2,'0')}`,
    description: `${imgCount} cinematic scenes`,
    publishedAt: new Date().toISOString().slice(0, 10),
  }
  const idx = mv.videos.findIndex(v => v.trackId === slug)
  if (idx >= 0) mv.videos[idx] = entry; else mv.videos.push(entry)
  fs.writeFileSync(MV_JSON, JSON.stringify(mv, null, 2))
}

// ─── Generate a 10-second static clip from one image ─────────────────────────
function makeClip(imgPath, outPath) {
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) return true
  const r = spawnSync('ffmpeg', [
    '-y', '-loop', '1', '-t', '10', '-r', '1', '-i', imgPath,
    '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'stillimage', '-crf', '26',
    outPath,
  ], { stdio: 'pipe', timeout: 30_000 })
  return r.status === 0
}

// ─── Generate one music video ─────────────────────────────────────────────────
function makeVideo(slug, audioPath, lyricsPath, tsPath, pool) {
  const TMP = path.join(ROOT, `.tmp/mv/${slug}`)
  const OUT = path.join(OUT_DIR, `${slug}.mp4`)
  fs.mkdirSync(TMP, { recursive: true })
  fs.mkdirSync(path.join(TMP, 'clips'), { recursive: true })

  const duration = probeDuration(audioPath)
  if (!duration || isNaN(duration)) { console.log(`  ✗ Cannot probe duration: ${audioPath}`); return false }

  const SEG_DUR = 10   // seconds per image clip
  const images  = buildImageSequence(slug, duration, pool)
  console.log(`   ${(duration/60).toFixed(1)}min | ${images.length} scenes`)

  // ── Build ASS subtitles ──────────────────────────────────────────────────
  let assPath = null
  if (lyricsPath) {
    try {
      const { ass, lineCount } = buildAss(tsPath, lyricsPath)
      assPath = path.join(TMP, 'lyrics.ass')
      fs.writeFileSync(assPath, ass)
      console.log(`   ${lineCount} lyric lines`)
    } catch (e) { console.log(`   No lyrics: ${e.message}`) }
  }

  // ── Step 1: Generate static image clips (1fps, ultrafast, ~0.1s each) ────
  process.stdout.write('   Generating clips')
  const clipPaths = []
  for (let i = 0; i < images.length; i++) {
    const clipOut = path.join(TMP, 'clips', `clip_${String(i).padStart(3,'0')}.mp4`)
    if (!makeClip(images[i], clipOut)) { console.log(`\n   ✗ Failed clip ${i}: ${images[i]}`); return false }
    clipPaths.push(clipOut)
    if (i % 5 === 4) process.stdout.write('.')
  }
  console.log(` done (${clipPaths.length})`)

  // ── Step 2: Stream-copy concat → silent video ─────────────────────────────
  const concatFile = path.join(TMP, 'concat.txt')
  fs.writeFileSync(concatFile, clipPaths.map(p => `file '${p}'`).join('\n'))
  const silentOut = path.join(TMP, 'silent.mp4')
  const r1 = spawnSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', silentOut,
  ], { stdio: 'pipe', timeout: 60_000 })
  if (r1.status !== 0) { console.error('   ✗ Concat failed'); return false }

  // ── Step 3: Re-encode with ASS lyrics + audio ─────────────────────────────
  console.log('   Encoding with lyrics + audio...')
  const fadeStart = duration - 4
  const vf = assPath ? `scale=1280:720,fps=25,ass=${assPath.replace(/:/g, '\\:')}` : 'scale=1280:720,fps=25'
  const r2 = spawnSync('ffmpeg', [
    '-y',
    '-i', silentOut,
    '-i', audioPath,
    '-map', '0:v', '-map', '1:a',
    '-vf', vf,
    '-af', `afade=t=in:ss=0:d=1,afade=t=out:st=${fadeStart}:d=4`,
    '-t', String(duration),
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
    '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart',
    OUT,
  ], { stdio: ['ignore', 'inherit', 'pipe'], timeout: 1_200_000 })

  if (r2.status !== 0) {
    const err = r2.stderr?.toString().split('\n').filter(l => /error|invalid|no such/i.test(l)).slice(-5).join('\n')
    console.error('   ✗ Encoding failed:', err || '(check ffmpeg output above)')
    return false
  }

  const sizeMB = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1)
  console.log(`   ✓ ${OUT} (${sizeMB}MB)`)
  updateMvJson(slug, duration, images.length)
  return true
}

// ─── Entry point ─────────────────────────────────────────────────────────────
async function main() {
  const pool      = loadImagePool()
  const audioMap  = buildAudioMap()
  const lyricsMap = buildLyricsMap()

  const doneSlugs = new Set(
    fs.existsSync(OUT_DIR)
      ? fs.readdirSync(OUT_DIR)
          .filter(f => f.endsWith('.mp4'))
          .filter(f => fs.statSync(path.join(OUT_DIR, f)).size > 1_000_000) // must be > 1MB
          .map(f => f.replace('.mp4',''))
      : []
  )

  let tsSlugs = fs.readdirSync(TS_DIR).map(f => f.replace('.json','')).filter(s => !s.startsWith('noiraciel-'))
  let work = tsSlugs.filter(s => audioMap[s] && !doneSlugs.has(s))
  if (SLUG_ARG) work = work.filter(s => s === SLUG_ARG)

  console.log(`\n══ NoiraCiel Music Video Batch ══════════════════════════════════`)
  console.log(`   Images in pool: ${Object.keys(pool.bySlug).length} songs + ${pool.gallery.length} gallery + ${pool.lyricBg.length} lyric-bg`)
  console.log(`   Already done: ${doneSlugs.size}   To generate: ${work.length}`)

  if (work.length === 0) { console.log('\n   Nothing to do.'); return }

  for (const slug of work) {
    const imgs  = buildImageSequence(slug, 240, pool) // estimate for display
    const hasSelf = pool.bySlug[slug]?.banner || pool.bySlug[slug]?.art
    console.log(`   ${hasSelf ? '✓img' : '    '} ${slug} [~${imgs.length} frames]`)
  }

  if (DRY_RUN) { console.log('\n   --dry-run: stopping here.'); return }

  let ok = 0, failed = 0
  for (let i = 0; i < work.length; i++) {
    const slug = work[i]
    console.log(`\n── [${i+1}/${work.length}] ${slug} ─────────────────────────`)
    const ok_ = makeVideo(slug, audioMap[slug], lyricsMap[slug] ?? null, path.join(TS_DIR, `${slug}.json`), pool)
    if (ok_) { ok++ } else { failed++ }
  }

  console.log(`\n══ Complete: ${ok} generated, ${failed} failed ══`)
  if (ok > 0) console.log('   Next: node scripts/kie/upload-to-r2.js --music-video')
}

main().catch(e => { console.error(e); process.exit(1) })
