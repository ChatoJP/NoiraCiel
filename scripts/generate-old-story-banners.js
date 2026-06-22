#!/usr/bin/env node
'use strict'
/**
 * generate-old-story-banners.js
 * Generates 16:9 cinematic chapter-banner images for the 30 older stories
 * (Life Lessons, Jazz Sessions, Blind Angel, Velvet Machine, Still We Sail albums)
 *
 * Usage:
 *   node scripts/generate-old-story-banners.js --status
 *   node scripts/generate-old-story-banners.js --submit
 *   node scripts/generate-old-story-banners.js --poll
 *   node scripts/generate-old-story-banners.js --submit --force   (re-submit failed/existing)
 */

const fs   = require('fs')
const path = require('path')
const { loadEnv, log, sleep, downloadFile, submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
loadEnv()

const ROOT       = path.join(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT, 'public', 'images', 'chapter-banners')
const STATE_FILE = path.join(ROOT, '.score-work', 'old-story-banners-state.json')
const MANIFEST   = path.join(OUTPUT_DIR, 'manifest.json')

const NOIR  = `16mm film grain, dark Atlantic palette (navy, black, amber gold), painterly, cinematic, wide 16:9, no text, no faces, no neon.`
const JAZZ  = `Jazz-era cinematic still, smoky amber light, dark mahogany and deep indigo palette, intimate and smoky, wide 16:9, no text, no faces.`
const METAL = `Cinematic still, dark intimate metal aesthetic, cold stone, candlelight, deep shadow, charcoal and silver palette, wide 16:9, no text, no faces.`
const FADO  = `Cinematic Fado aesthetic, Lisbon night, cobblestones and fado light, deep amber, navy, terracotta palette, melancholy and beautiful, wide 16:9, no text, no faces.`
const ELEC  = `Cinematic electronic-noir aesthetic, deep indigo with electric cobalt accents, neon-free, painterly, dark Atlantic atmosphere, wide 16:9, no text, no faces.`

const TRACKS = [
  // ── Life Lessons / Atlantic Noir ─────────────────────────────────────────
  {
    slug: 'a-body-made-of-night',
    prompt: `Cinematic still — A pair of hands in dark water at night, barely visible, lit only by moonlight on the surface. The body as shadow, as secret, as memory. Deep navy and black. ${NOIR}`,
  },
  {
    slug: 'all-the-water-between',
    prompt: `Cinematic still — The Atlantic Ocean seen from a clifftop at dusk, vast and silver-dark, stretching to a horizon where sky and sea almost merge. Distance as a physical thing. ${NOIR}`,
  },
  {
    slug: 'atlantic-nocturne',
    prompt: `Cinematic still — A lighthouse beam sweeping through heavy sea fog at night, the Atlantic barely visible below. The light and the dark, the seen and the unseen. ${NOIR}`,
  },
  {
    slug: 'grief-in-different-latitudes',
    prompt: `Cinematic still — A world map with sea routes marked, one route circled in amber ink, on a table in a low-lit room. Grief as something carried across distances. ${NOIR}`,
  },
  {
    slug: 'i-chose-the-open',
    prompt: `Cinematic still — A road at dawn, leading away from a small town, the horizon open ahead. The invisible moment of a private decision to leave or stay. Long exposure, amber light. ${NOIR}`,
  },
  {
    slug: 'letters-never-crossed',
    prompt: `Cinematic still — A bundle of handwritten letters tied with string, lying on a dark wooden table in candlelight, one envelope already opened. Things that were never sent. ${NOIR}`,
  },
  {
    slug: 'no-one-leaves-the-night-unchanged',
    prompt: `Cinematic still — An empty night street after rain, streetlights reflected in puddles, a single figure at the far end walking away. The way night changes everyone who passes through it. ${NOIR}`,
  },
  {
    slug: 'she-who-stayed-behind',
    prompt: `Cinematic still — A woman in a dark coat standing at a harbour wall watching a ship disappear into fog. Her back to camera. The coast, the departure, the staying. ${NOIR}`,
  },
  {
    slug: 'still-human-after-all-this-noise',
    prompt: `Cinematic still — A face half-reflected in a rain-covered window, city lights blurred behind the glass. The human thing persisting underneath the noise of the world. ${NOIR}`,
  },
  {
    slug: 'the-port-we-cannot-find',
    prompt: `Cinematic still — A harbour at night, empty boats rocking in dark water, a fog horn visible but no ships. The port that keeps moving. Home as a concept. ${NOIR}`,
  },
  {
    slug: 'the-sea-keeps-our-names',
    prompt: `Cinematic still — Carved initials in a stone harbour wall, weathered and worn by salt and time. The sea as archive, as memory-keeper. Atlantic light, ancient stone. ${NOIR}`,
  },

  // ── Jazz Sessions ─────────────────────────────────────────────────────────
  {
    slug: 'accordion-heart',
    prompt: `Cinematic still — A vintage accordion resting on a leather chair in a dim jazz bar, the bellows slightly open as if mid-breath. Memory as instrument. Amber light, deep shadow. ${JAZZ}`,
  },
  {
    slug: 'contra-bass-confession',
    prompt: `Cinematic still — A double bass standing alone in a corner of a dark rehearsal space, a single stage light hitting it from above. The truth that only comes out in the low register. ${JAZZ}`,
  },
  {
    slug: 'saxophone-for-the-damned-and-the-loved',
    prompt: `Cinematic still — A saxophone on a velvet cloth on a backstage table, a half-empty glass of whiskey beside it. The instrument as confessor, as comfort. Dark amber and mahogany. ${JAZZ}`,
  },
  {
    slug: 'she-dances-like-a-memory',
    prompt: `Cinematic still — A dancer's feet on a hardwood floor, mid-motion in low amber light. The rest of her body implied by shadow. A memory that moves. Jazz bar, late night. ${JAZZ}`,
  },
  {
    slug: 'the-accordion-breathes',
    prompt: `Cinematic still — Close-up of accordion keys and bellows in low amber light, the texture of old leather and worn buttons. Old breath in old lungs. Memory as music. ${JAZZ}`,
  },
  {
    slug: 'the-girl-with-the-cello-scar',
    prompt: `Cinematic still — The curve of a cello against a white-painted wall in early morning light, a small indentation visible in the wood where years of playing have marked it. Proof of love. ${JAZZ}`,
  },

  // ── Lisbon / Fado ─────────────────────────────────────────────────────────
  {
    slug: 'lisbon-is-not-a-city-it-is-a-wound',
    prompt: `Cinematic still — A narrow Lisbon street at night, light spilling from a fado house doorway onto wet cobblestones. The city as feeling, not geography. Deep amber and Moorish blue tiles. ${FADO}`,
  },
  {
    slug: 'saudade-has-a-weight',
    prompt: `Cinematic still — A window with iron grilles overlooking the Tagus river at dusk, a figure standing inside looking out. Saudade made physical, palpable as stone. Lisbon light. ${FADO}`,
  },
  {
    slug: 'salt-gospel',
    prompt: `Cinematic still — A fishing net spread across harbour stones to dry, the sea behind it silver at dawn. Salt and religion and the working life at the edge of the Atlantic. ${FADO}`,
  },
  {
    slug: 'what-fado-holds',
    prompt: `Cinematic still — A fado singer's hands, microphone-less, held at chest height on a small stage in a dark room. The gesture that holds the feeling the song cannot say. ${FADO}`,
  },
  {
    slug: 'the-future-has-an-accent',
    prompt: `Cinematic still — An airport departure board with many destinations listed, lit from behind in yellow-white light. The plural futures. Where you've been as map, not flaw. ${FADO}`,
  },

  // ── Still We Sail / Atlantic ───────────────────────────────────────────────
  {
    slug: 'exile-body',
    prompt: `Cinematic still — A coat hanging on a hook by a door in an empty hallway, carrying the shape of the person who just left. The body as address forwarded. Atlantic noir. ${NOIR}`,
  },
  {
    slug: 'still-we-sail',
    prompt: `Cinematic still — A small sailing boat at sea in silver light, its sail full of Atlantic wind, heading toward an open horizon. Leaving as a form of love. Wide, cinematic. ${NOIR}`,
  },
  {
    slug: 'still-we-sail-to-light',
    prompt: `Cinematic still — A boat crossing dark Atlantic water at night, a distant light on the horizon. The sail reflects moonlight. Together in the going, together in the arriving. ${NOIR}`,
  },

  // ── Velvet Machine / Electronic Noir ─────────────────────────────────────
  {
    slug: 'hard-techno-prayer',
    prompt: `Cinematic still — A lone figure in a dark club, head tilted back, eyes closed, in a beam of white light amid fog. The body as the prayer. Electronic, physical, spiritual. ${ELEC}`,
  },
  {
    slug: 'the-saints-go-clubbing',
    prompt: `Cinematic still — A dark nightclub interior between sets — empty dancefloor, lights low, smoke still visible. The sacred disguised as ordinary pleasure. Deep indigo, amber. ${ELEC}`,
  },
  {
    slug: 'the-velvet-machine',
    prompt: `Cinematic still — The interior of a city at night from above, neon-free, streets of gold and dark water, the rhythm of it visible in the light patterns. The city's heartbeat. ${ELEC}`,
  },
  {
    slug: 'velvet-bruises',
    prompt: `Cinematic still — A close-up of worn velvet fabric, pressed and unpressed, marks of use and touch. Something that has been held, used, felt. Honest texture. Dark and tactile. ${ELEC}`,
  },
  {
    slug: 'when-the-machines-learn-saudade',
    prompt: `Cinematic still — An old analogue synthesizer in a dark studio, its lights glowing, dials turned up, playing to an empty room. The machine as keeper of feeling. ${ELEC}`,
  },
]

function loadState() {
  if (fs.existsSync(STATE_FILE)) try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch {}
  return {}
}

function saveState(s) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

function updateManifest(state) {
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf-8')) : {}
  for (const [slug, info] of Object.entries(state)) {
    if (info.status === 'DOWNLOADED') manifest[slug] = `/images/chapter-banners/${slug}.jpg`
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
}

async function cmdSubmit() {
  const state = loadState()
  let submitted = 0
  for (const track of TRACKS) {
    const outFile = path.join(OUTPUT_DIR, `${track.slug}.jpg`)
    if (fs.existsSync(outFile) && !process.argv.includes('--force')) {
      log(`⏭  ${track.slug} — exists`); continue
    }
    if (state[track.slug]?.taskId && state[track.slug]?.status !== 'FAILED' && !process.argv.includes('--force')) {
      log(`⏭  ${track.slug} — already submitted`); continue
    }
    try {
      const taskId = await submitImageJob(track.prompt, { aspectRatio: '16:9', outputFormat: 'jpeg' })
      state[track.slug] = { taskId, status: 'PENDING', slug: track.slug }
      log(`✓  ${track.slug} → ${taskId}`)
      submitted++
      saveState(state)
      await sleep(RATE_LIMIT_MS)
    } catch (e) {
      log(`✗  ${track.slug}: ${e.message}`)
    }
  }
  log(`\nDone. ${submitted} jobs submitted.`)
}

async function cmdPoll() {
  const state = loadState()
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  let done = 0, pending = 0, failed = 0

  for (const [slug, info] of Object.entries(state)) {
    if (info.status === 'DOWNLOADED') { done++; continue }
    const result = await pollImageJob(info.taskId)
    if (result.done && !result.failed && result.url) {
      const outFile = path.join(OUTPUT_DIR, `${slug}.jpg`)
      log(`↓  ${slug}`)
      await downloadFile(result.url, outFile)
      state[slug].status = 'DOWNLOADED'
      saveState(state)
      log(`   ✓`)
      done++
    } else if (result.failed) {
      log(`✗  ${slug}`)
      state[slug].status = 'FAILED'
      saveState(state)
      failed++
    } else {
      log(`⏳ ${slug}`)
      pending++
    }
    await sleep(400)
  }
  updateManifest(state)
  log(`\n${done} done · ${pending} pending · ${failed} failed`)
}

function cmdStatus() {
  const state = loadState()
  const existing = TRACKS.filter(t => fs.existsSync(path.join(OUTPUT_DIR, `${t.slug}.jpg`))).length
  log(`Files on disk: ${existing}/${TRACKS.length}`)
  for (const [slug, info] of Object.entries(state)) {
    const icon = info.status === 'DOWNLOADED' ? '✓' : info.status === 'FAILED' ? '✗' : '⏳'
    console.log(`${icon}  ${slug}`)
  }
  const done = Object.values(state).filter(s => s.status === 'DOWNLOADED').length
  console.log(`\n${done}/${Object.keys(state).length} downloaded`)
}

const args = process.argv.slice(2)
;(async () => {
  if (args.includes('--submit'))      await cmdSubmit()
  else if (args.includes('--poll'))   await cmdPoll()
  else if (args.includes('--status')) cmdStatus()
  else {
    console.log('Usage:')
    console.log('  node scripts/generate-old-story-banners.js --submit')
    console.log('  node scripts/generate-old-story-banners.js --poll')
    console.log('  node scripts/generate-old-story-banners.js --status')
    console.log(`\n${TRACKS.length} tracks configured.`)
  }
})()
