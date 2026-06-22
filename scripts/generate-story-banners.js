#!/usr/bin/env node
'use strict'
/**
 * generate-story-banners.js
 * Generates 16:9 cinematic chapter-banner images for the 45 new stories
 * (WYMO + BASB + TSD albums). Output: public/images/chapter-banners/{slug}.jpg
 *
 * Usage:
 *   node scripts/generate-story-banners.js --status
 *   node scripts/generate-story-banners.js --submit
 *   node scripts/generate-story-banners.js --poll
 */

const fs   = require('fs')
const path = require('path')
const { loadEnv, log, sleep, downloadFile, submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
loadEnv()

const ROOT       = path.join(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT, 'public', 'images', 'chapter-banners')
const STATE_FILE = path.join(ROOT, '.score-work', 'story-banners-state.json')
const MANIFEST   = path.join(OUTPUT_DIR, 'manifest.json')

const NOIR = `16mm film grain, dark Atlantic palette (navy, black, amber gold), painterly, cinematic, wide 16:9, no text, no faces, no neon.`
const PSY  = `Psychedelic sacred geometry, deep indigo violet gold palette, mandala energy, spiritual ethereal, wide 16:9, no text, no faces.`
const SOFT = `Warm acoustic light, natural textures (wood, linen, stone), intimate and gentle, golden hour, wide 16:9, no text, no faces.`

const TRACKS = [
  // ── What You're Made Of ─────────────────────────────────────────────────────
  {
    slug: 'you-were-never-broken',
    prompt: `Cinematic still — A cracked ceramic bowl repaired with golden lacquer (kintsugi), held in two weathered hands in soft light. Every crack filled with gold. Dark, warm, intimate. ${NOIR}`,
  },
  {
    slug: 'the-weight-that-taught-you',
    prompt: `Cinematic still — Weathered hands at rest after a lifetime of labour, fingers thick and calloused, resting on a wooden table. Early morning light, humble dignity, warm amber glow. ${NOIR}`,
  },
  {
    slug: 'start-somewhere',
    prompt: `Cinematic still — A single footstep in wet sand at the beginning of a long empty beach. The horizon stretches ahead. Fog lifting in morning light. First step of a long journey. ${NOIR}`,
  },
  {
    slug: 'fear-was-never-the-point',
    prompt: `Cinematic still — A door slightly ajar, warm light spilling through the crack into a dark corridor. The threshold between fear and possibility. Gold light, black shadow, invitation. ${NOIR}`,
  },
  {
    slug: 'the-version-that-survived',
    prompt: `Cinematic still — A lone figure standing at the edge of a cliff, looking out over the Atlantic at dusk. The storm has passed. They are still standing. Long coat, wind in hair, vast horizon. ${NOIR}`,
  },
  {
    slug: 'nothing-needs-fixing-tonight',
    prompt: `Cinematic still — A person sitting alone on a worn sofa in a lamp-lit room, eyes half closed, a cup of tea in hand. The evening light is gold. Nothing is demanded. Everything is still. ${NOIR}`,
  },
  {
    slug: 'the-work-nobody-sees',
    prompt: `Cinematic still — A desk in a dark room before dawn, a single lamp illuminating scattered papers and a half-finished work. The city is asleep outside the window. Solitary creative effort. ${NOIR}`,
  },
  {
    slug: 'permission',
    prompt: `Cinematic still — An old letter in an envelope, sealed then torn open, lying on a wooden surface in morning light. The act of giving oneself permission made visible. Gold light, paper, freedom. ${NOIR}`,
  },
  {
    slug: 'what-you-owe-yourself',
    prompt: `Cinematic still — An open ledger or notebook on a table, fountain pen beside it, the first entry written in careful script. Quiet interior, morning light, the accounting of a life. ${NOIR}`,
  },
  {
    slug: 'slow-becoming',
    prompt: `Cinematic still — A loaf of bread cooling on a windowsill, golden crust, steam rising in the morning light. Slow craft, patience made edible, the quiet triumph of ordinary mastery. ${SOFT}`,
  },
  {
    slug: 'forgive-the-one-who-didnt-know',
    prompt: `Cinematic still — An empty chair at a kitchen table with afternoon light falling through a window. The absence of someone is present. Two mugs. One conversation that never happened. ${NOIR}`,
  },
  {
    slug: 'built-in-the-dark',
    prompt: `Cinematic still — Hands laying bricks in the dark, only a lantern nearby. Foundation work in near darkness. The most important construction, invisible to everyone else. ${NOIR}`,
  },
  {
    slug: 'the-quiet-revolution',
    prompt: `Cinematic still — A woman sitting alone at a cafe table on a quiet Saturday morning, looking out the window with a small private smile. Nobody else knows what has changed. Interior peace. ${SOFT}`,
  },
  {
    slug: 'not-your-worst-day',
    prompt: `Cinematic still — A collection of old photographs spread on a table, many of them showing ordinary, happy moments. A hand reaching toward one of the good ones. The full inventory of a life. ${NOIR}`,
  },
  {
    slug: 'whats-youre-made-of',
    prompt: `Cinematic still — A blacksmith's forge at dusk, tools and metal and the deep orange glow of working fire. What is made in heat. The material of a life revealed by pressure and time. ${NOIR}`,
  },

  // ── Bare and Still Breathing ────────────────────────────────────────────────
  {
    slug: 'still-here',
    prompt: `Cinematic still — Morning light breaking through curtains in a simple bedroom. A hand reaches to open them. The world outside is beginning. The person is still here. Gentle gold light. ${SOFT}`,
  },
  {
    slug: 'one-more-morning',
    prompt: `Cinematic still — A single coffee cup on a windowsill in early morning light, steam rising. Outside, the first light on a quiet street. The ritual of one more morning, simple and sacred. ${SOFT}`,
  },
  {
    slug: 'show-up',
    prompt: `Cinematic still — An entrance to a building seen from the outside — a school, a hall, a community space. A figure standing at the threshold, about to enter. The act of showing up. ${NOIR}`,
  },
  {
    slug: 'i-see-you-trying',
    prompt: `Cinematic still — A parent sitting on a bench at the edge of a children's sports field, hands clasped, watching with full attention. The invisible labour of witnessing someone you love. ${SOFT}`,
  },
  {
    slug: 'enough-already',
    prompt: `Cinematic still — A slightly imperfect homemade cake with birthday candles, warm kitchen light, a child's drawing nearby. The beauty of good enough, made with love. ${SOFT}`,
  },
  {
    slug: 'when-it-gets-quiet',
    prompt: `Cinematic still — An empty armchair by a window, late afternoon light, a book resting open on the arm. The silence after busyness has passed. What is waiting in the quiet. ${NOIR}`,
  },
  {
    slug: 'just-a-little-longer',
    prompt: `Cinematic still — A hospital corridor at night, a figure seated outside a room, a paper cup of cold coffee in hand. The vigil. The keeping of presence through the long dark hours. ${NOIR}`,
  },
  {
    slug: 'you-already-know',
    prompt: `Cinematic still — A person sitting in a car in an empty car park, eyes closed, hands resting in their lap. The stillness before the knowing arrives. Quiet midday light. Interior peace. ${SOFT}`,
  },
  {
    slug: 'slow-down',
    prompt: `Cinematic still — A forest path dappled with late afternoon light, empty and unhurried. Fallen leaves on the ground. The invitation to decelerate into the present moment. ${SOFT}`,
  },
  {
    slug: 'the-good-youve-done',
    prompt: `Cinematic still — A found letter, handwritten and personal, lying on a wooden surface in warm light. Evidence of kindness that was unknown to the giver. The ledger of good. ${NOIR}`,
  },
  {
    slug: 'after-the-storm',
    prompt: `Cinematic still — A garden the morning after a storm. Some branches down, some flowers beaten flat — but the sun is returning and the earth is still alive. Recovery made visible. ${SOFT}`,
  },
  {
    slug: 'keep-going-love',
    prompt: `Cinematic still — A child's drawing slipped under a door, showing two people standing together, a sun in the corner. Small act of love. The note that kept someone going. ${SOFT}`,
  },
  {
    slug: 'roots',
    prompt: `Cinematic still — Two sets of hands side by side — one older, one younger — showing the same shape of fingers, the same particular line of the wrist. Inheritance made visible. ${SOFT}`,
  },
  {
    slug: 'the-simplest-things',
    prompt: `Cinematic still — A breakfast table set simply — coffee, bread, light from a window, a plant in a pot, a newspaper. The ordinary made sacred by attention. ${SOFT}`,
  },
  {
    slug: 'bare-and-still-breathing',
    prompt: `Cinematic still — A single figure in a nearly empty room, sitting on the floor against the wall, early morning light across the floor. Stripped back to the essential. Still breathing. ${NOIR}`,
  },

  // ── The Sacred Drift ────────────────────────────────────────────────────────
  {
    slug: 'so-hum',
    prompt: `Cinematic still — A meditating silhouette at dawn on a hilltop, soft golden glow beginning behind them. The witness. The awareness behind the eyes. Sacred geometry of light. ${PSY}`,
  },
  {
    slug: 'the-frequency-knows',
    prompt: `Cinematic still — Sound waves made visible as golden ripples in deep blue space, emanating from a single point of light. The frequency that carries knowing before words. ${PSY}`,
  },
  {
    slug: 'third-signal',
    prompt: `Cinematic still — A luminous eye formed of stars and nebula, the iris a galaxy, the pupil a deep black void. The witness that watches the watching. Cosmic scale, violet and gold. ${PSY}`,
  },
  {
    slug: 'dissolve',
    prompt: `Cinematic still — A human silhouette at the edges dissolving into golden particles of light, merging with a vast dark sky. The self releasing into something larger. ${PSY}`,
  },
  {
    slug: 'sat-nam',
    prompt: `Cinematic still — Ancient Sanskrit script carved in stone, lit by golden candlelight. Sacred letters, worn by centuries, still legible. The true name beneath all names. ${NOIR}`,
  },
  {
    slug: 'sacred-static',
    prompt: `Cinematic still — An old wooden shortwave radio glowing amber in a dark room, its dial between stations. Golden static particles floating in the air. The sacred in the between-spaces. ${NOIR}`,
  },
  {
    slug: 'the-drift',
    prompt: `Cinematic still — A small boat on perfectly still dark water at night, a single figure lying back looking up at stars. Bioluminescent glow beneath. Drifting without destination. ${NOIR}`,
  },
  {
    slug: 'all-is-one',
    prompt: `Cinematic still — A sacred mandala seen from above, made of flower petals and golden dust in darkness. Each petal a universe. The geometry of unity. Violet, gold, deep blue. ${PSY}`,
  },
  {
    slug: 'shakti-rising',
    prompt: `Cinematic still — A column of golden serpentine light rising through dark space, blooming into a lotus at the top. Kundalini energy made visual. Power and grace combined. ${PSY}`,
  },
  {
    slug: 'neti-neti',
    prompt: `Cinematic still — A series of translucent veils or masks dissolving one after another in dark space, each revealing the next, until only pure light remains at the center. ${PSY}`,
  },
  {
    slug: 'between-the-worlds',
    prompt: `Cinematic still — An old wooden door standing alone in deep forest fog at night, warm light spilling through the crack. The threshold between what was and what comes next. ${NOIR}`,
  },
  {
    slug: 'om-namah',
    prompt: `Cinematic still — The Om symbol formed in flame and golden light hovering in deep black space. Ancient and electric simultaneously. Sacred fire geometry, pure and powerful. ${PSY}`,
  },
  {
    slug: 'the-return',
    prompt: `Cinematic still — A forest path leading toward a single warm light in the distance, trees forming a natural corridor. Homecoming. The sacred ordinary at the end of the journey. ${NOIR}`,
  },
  {
    slug: 'open-eye',
    prompt: `Cinematic still — Ordinary supermarket light in the cereal aisle, but transformed — the fluorescent glow seems almost sacred, falling on shelves in a way that reveals rather than illuminates. ${SOFT}`,
  },
  {
    slug: 'the-sacred-drift',
    prompt: `Cinematic still — A human figure dissolving upward into a vast ocean of stars and golden light, losing all separation, becoming everything. The arrival that is the journey. ${PSY}`,
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
    if (state[track.slug]?.taskId && state[track.slug]?.status !== 'FAILED') {
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
    console.log('  node scripts/generate-story-banners.js --submit')
    console.log('  node scripts/generate-story-banners.js --poll')
    console.log('  node scripts/generate-story-banners.js --status')
    console.log(`\n${TRACKS.length} tracks configured.`)
  }
})()
