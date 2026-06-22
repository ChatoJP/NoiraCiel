#!/usr/bin/env node
'use strict'
/**
 * create-showreel.js
 * Cinematic NoiraCiel showreel from all completed cinemagraph clips.
 *
 * Structure:
 *   Opening title (5s) → 38 song clips with xfade (2s) + song titles → Closing card (4s)
 * Audio: "Still We Sail" as underscore, fade in/out
 *
 * Usage:
 *   node scripts/create-showreel.js
 *   node scripts/create-showreel.js --fast   (faster encode, larger file)
 */

const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT      = path.join(__dirname, '..')
const CIN_DIR   = path.join(ROOT, 'public/generated/kie/cinemagraphs')
const SONGS_DIR = path.join(ROOT, 'public/generated/kie/songs')
const OUT_DIR   = path.join(ROOT, 'public/generated/kie/showreel')
const TMP       = '/tmp/nc_showreel'

const AUDIO      = path.join(ROOT, 'Music/Still_We_Sail/audio/01_still_we_sail_v1.mp3')
const FONT_SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
const FONT_SANS  = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'

const CLIP_DUR   = 8    // each cinemagraph is 8 seconds
const XFADE_DUR  = 2    // crossfade duration
const INTRO_DUR  = 5    // opening title card
const OUTRO_DUR  = 5    // closing card
const FAST       = process.argv.includes('--fast')

const ALBUM_ORDER = [
  'the-life-lessons', 'blind-angel', 'jazz-sessions',
  'world-musics', 'funk-my-way-in', 'reggae-sessions',
  'still-we-sail', 'the-velvet-machine', 'the-sacred-drift',
  'whats-youre-made-of', 'bare-and-still-breathing', 'unknown',
]

const ALBUM_LABELS = {
  'the-life-lessons':      'THE LIFE LESSONS',
  'still-we-sail':         'STILL WE SAIL',
  'the-velvet-machine':    'THE VELVET MACHINE',
  'blind-angel':           'BLIND ANGEL',
  'jazz-sessions':         'JAZZ SESSIONS',
  'world-musics':          'WORLD MUSICS',
  'funk-my-way-in':        'FUNK MY WAY IN',
  'reggae-sessions':       'REGGAE SESSIONS',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function run(cmd, quiet = false) {
  execSync(cmd, { stdio: quiet ? 'pipe' : 'inherit', shell: true })
}

function esc(s) {
  // ffmpeg drawtext escaping
  return s.replace(/\\/g, '\\\\')
          .replace(/'/g, "’")   // smart quote instead of escaped
          .replace(/:/g, '\\:')
          .replace(/\[/g, '\\[')
          .replace(/\]/g, '\\]')
          .replace(/,/g, '\\,')
}

// text alpha: fade in 0.5→1.0s, hold until 3.5s, fade out 3.5→4.5s
const TEXT_ALPHA = `if(lt(t,0.5),0,if(lt(t,1.0),(t-0.5)/0.5,if(lt(t,3.5),1,if(lt(t,4.5),(4.5-t)/1.0,0))))`

// ─── Load + sort clips ────────────────────────────────────────────────────────
function getClips() {
  const clips = []
  for (const f of fs.readdirSync(SONGS_DIR).filter(f => f.endsWith('.json'))) {
    const m   = JSON.parse(fs.readFileSync(path.join(SONGS_DIR, f)))
    const cin = m.generatedAssets.cinemagraph
    if (cin.status !== 'complete') continue
    const mp4 = path.join(CIN_DIR, m.slug, 'loop.mp4')
    if (!fs.existsSync(mp4)) continue
    const ao = ALBUM_ORDER.indexOf(m.albumSlug)
    clips.push({
      slug:        m.slug,
      title:       m.title,
      albumSlug:   m.albumSlug,
      albumLabel:  ALBUM_LABELS[m.albumSlug] ?? m.albumSlug?.toUpperCase().replace(/-/g, ' ') ?? '',
      trackNumber: m.trackNumber ?? 99,
      mp4,
      albumOrder:  ao >= 0 ? ao : 99,
    })
  }
  return clips.sort((a, b) => a.albumOrder - b.albumOrder || a.trackNumber - b.trackNumber)
}

// ─── Pre-process one clip: add title + fades ─────────────────────────────────
function prepClip(clip, index) {
  const out = path.join(TMP, 'clips', `${String(index).padStart(2, '0')}.mp4`)
  if (fs.existsSync(out)) return out

  const title = esc(clip.title)
  const album = esc(clip.albumLabel)

  // Gold: 0xC4953A — white with shadow for title
  const vf = [
    `scale=1280:720`,
    `fps=24`,
    `fade=t=in:st=0:d=0.5`,
    `fade=t=out:st=${CLIP_DUR - 1.5}:d=1.5`,
    // Album label — small gold uppercase, above title
    `drawtext=fontfile='${FONT_SANS}':text='${album}':fontsize=12:fontcolor=0xC4953A@1.0:alpha='${TEXT_ALPHA}':x=60:y=H-110:shadowcolor=black@0.8:shadowx=1:shadowy=1`,
    // Song title — white serif
    `drawtext=fontfile='${FONT_SERIF}':text='${title}':fontsize=30:fontcolor=white@1.0:alpha='${TEXT_ALPHA}':x=60:y=H-82:shadowcolor=black@0.7:shadowx=1:shadowy=1`,
  ].join(',')

  run(
    `ffmpeg -y -i "${clip.mp4}" -vf "${vf}" -t ${CLIP_DUR} -c:v libx264 -preset fast -crf 20 -an "${out}"`,
    true
  )
  return out
}

// ─── Opening title card ───────────────────────────────────────────────────────
function createIntro() {
  const out = path.join(TMP, 'intro.mp4')
  if (fs.existsSync(out)) return out

  // Main title fades in at 1s, holds, fades out at end
  const aMain = `if(lt(t,1),0,if(lt(t,2),(t-1)/1,if(lt(t,3.5),1,if(lt(t,4.5),(4.5-t)/1,0))))`
  // Subtitle 0.7s later
  const aSub  = `if(lt(t,1.7),0,if(lt(t,2.7),(t-1.7)/1,if(lt(t,3.5),1,if(lt(t,4.5),(4.5-t)/1,0))))`

  const vf = [
    // Subtle dark gradient background (pure black is fine)
    `drawtext=fontfile='${FONT_SERIF}':text='N O I R A C I E L':fontsize=54:fontcolor=white@1.0:alpha='${aMain}':x=(W-text_w)/2:y=(H-text_h)/2-24:shadowcolor=black@0.4:shadowx=2:shadowy=2`,
    `drawtext=fontfile='${FONT_SANS}':text='L I V I N G   A R T W O R K':fontsize=13:fontcolor=0xC4953A@1.0:alpha='${aSub}':x=(W-text_w)/2:y=(H-text_h)/2+34`,
  ].join(',')

  run(
    `ffmpeg -y -f lavfi -i color=c=black:size=1280x720:rate=24 -vf "${vf}" -t ${INTRO_DUR} -c:v libx264 -preset fast -crf 18 "${out}"`,
    true
  )
  return out
}

// ─── Closing title card ───────────────────────────────────────────────────────
function createOutro() {
  const out = path.join(TMP, 'outro.mp4')
  if (fs.existsSync(out)) return out

  const a = `if(lt(t,1),0,if(lt(t,2),(t-1)/1,if(lt(t,3.5),1,if(lt(t,4.5),(4.5-t)/1,0))))`

  const vf = [
    `drawtext=fontfile='${FONT_SERIF}':text='still we sail':fontsize=26:fontcolor=white@1.0:alpha='${a}':x=(W-text_w)/2:y=(H-text_h)/2-16:shadowcolor=black@0.4:shadowx=1:shadowy=1`,
    `drawtext=fontfile='${FONT_SANS}':text='noiraciel.com':fontsize=14:fontcolor=0xC4953A@1.0:alpha='${a}':x=(W-text_w)/2:y=(H-text_h)/2+22`,
  ].join(',')

  run(
    `ffmpeg -y -f lavfi -i color=c=black:size=1280x720:rate=24 -vf "${vf}" -t ${OUTRO_DUR} -c:v libx264 -preset fast -crf 18 "${out}"`,
    true
  )
  return out
}

// ─── Build xfade filter_complex ───────────────────────────────────────────────
function buildFilterComplex(segments, durations) {
  // segments = array of file paths (n segments)
  // durations = array of durations per segment
  const n = segments.length
  let fc = ''
  let offset = 0
  let prevLabel = '[0:v]'

  for (let i = 0; i < n - 1; i++) {
    offset += durations[i] - XFADE_DUR
    const nextLabel = i === n - 2 ? '[vout]' : `[v${i}]`
    if (fc) fc += ';\n'
    fc += `${prevLabel}[${i + 1}:v]xfade=transition=fade:duration=${XFADE_DUR}:offset=${offset.toFixed(3)}${nextLabel}`
    prevLabel = nextLabel
  }
  return fc
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║      NoiraCiel — Living Artwork Showreel                  ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  fs.mkdirSync(path.join(TMP, 'clips'), { recursive: true })
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const clips = getClips()
  if (!clips.length) { console.error('No complete cinemagraph clips found.'); process.exit(1) }
  console.log(`  ${clips.length} clips  ·  audio: Still We Sail\n`)

  // ── Step 1: Pre-process clips ──────────────────────────────────────────────
  console.log('Step 1/4 — Pre-processing clips (title overlays + fades)...')
  const preparedPaths = []
  for (let i = 0; i < clips.length; i++) {
    process.stdout.write(`  [${String(i + 1).padStart(2)}/${clips.length}] ${clips[i].title.slice(0, 50).padEnd(50)}\r`)
    preparedPaths.push(prepClip(clips[i], i))
  }
  console.log('\n  Done.\n')

  // ── Step 2: Title cards ────────────────────────────────────────────────────
  console.log('Step 2/4 — Creating intro + outro cards...')
  const intro = createIntro()
  const outro = createOutro()
  console.log('  Done.\n')

  // ── Step 3: Concatenate with xfade ────────────────────────────────────────
  console.log('Step 3/4 — Concatenating with crossfades...')
  const segments  = [intro, ...preparedPaths, outro]
  const durations = [INTRO_DUR, ...Array(clips.length).fill(CLIP_DUR), OUTRO_DUR]
  const totalDur  = durations.reduce((s, d) => s + d, 0) - XFADE_DUR * (segments.length - 1)

  const mins = Math.floor(totalDur / 60)
  const secs = Math.round(totalDur % 60)
  console.log(`  Segments: ${segments.length}  ·  Duration: ~${mins}m ${secs}s\n`)

  const fc = buildFilterComplex(segments, durations)
  const fcFile = path.join(TMP, 'filter_complex.txt')
  fs.writeFileSync(fcFile, fc)

  const inputs = segments.map(p => `-i "${p}"`).join(' \\\n  ')
  const silentVideo = path.join(TMP, 'silent.mp4')
  const preset = FAST ? 'fast' : 'medium'

  run(
    `ffmpeg -y \\\n  ${inputs} \\\n  -filter_complex_script "${fcFile}" \\\n  -map "[vout]" \\\n  -c:v libx264 -preset ${preset} -crf 20 \\\n  "${silentVideo}"`
  )
  console.log('\n  Video assembled.\n')

  // ── Step 4: Mix audio ──────────────────────────────────────────────────────
  console.log('Step 4/4 — Mixing audio...')
  const audioFadeStart = Math.max(0, totalDur - 12)
  const finalOut = path.join(OUT_DIR, 'noiraciel-living-artwork.mp4')

  run(
    `ffmpeg -y \\\n` +
    `  -i "${silentVideo}" \\\n` +
    `  -i "${AUDIO}" \\\n` +
    `  -filter_complex "[1:a]afade=t=in:st=0:d=3,afade=t=out:st=${audioFadeStart.toFixed(1)}:d=12[a]" \\\n` +
    `  -map 0:v -map "[a]" \\\n` +
    `  -c:v copy -c:a aac -b:a 192k \\\n` +
    `  -shortest "${finalOut}"`
  )

  // ── Summary ───────────────────────────────────────────────────────────────
  const stat = fs.statSync(finalOut)
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║  Done!                                                    ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  console.log(`  File:     public/generated/kie/showreel/noiraciel-living-artwork.mp4`)
  console.log(`  Size:     ${(stat.size / 1024 / 1024).toFixed(1)} MB`)
  console.log(`  Duration: ~${mins}m ${secs}s`)
  console.log(`  Clips:    ${clips.length} songs\n`)
  console.log(`  Serve at: /generated/kie/showreel/noiraciel-living-artwork.mp4\n`)
}

main().catch(e => { console.error('\n✗', e.message); process.exit(1) })
