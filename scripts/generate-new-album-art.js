#!/usr/bin/env node
/**
 * generate-new-album-art.js
 * Song art for "What You're Made Of" and "Bare and Still Breathing" albums.
 *
 * Usage:
 *   node scripts/generate-new-album-art.js --submit
 *   node scripts/generate-new-album-art.js --poll
 *   node scripts/generate-new-album-art.js --status
 */
'use strict'

const fs   = require('fs')
const path = require('path')
const { loadEnv, log, sleep, downloadFile, submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')

loadEnv()

const ROOT       = path.join(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT, 'public', 'images', 'song-art')
const STATE_FILE = path.join(ROOT, '.score-work', 'new-album-art-state.json')
const NOIR_SHORT = `16mm film grain, dark Atlantic palette (navy, black, amber gold), painterly, cinematic, no text, no faces, no neon.`

const TRACKS = [
  // ─── What You're Made Of (Hip-Hop / Trap / DnB / Soul — Piano & Violin) ────
  { slug: 'you-were-never-broken',         prompt: `Cinematic still — A figure standing in a rain-drenched alley, head tilted upward, cracks of light breaking through storm clouds above. The posture is not defeat but defiance. ${NOIR_SHORT}` },
  { slug: 'the-weight-that-taught-you',    prompt: `Cinematic still — Hands cupping a heavy river stone, water dripping, amber light catching the surface. The weight is visible but held with purpose. Dark navy and gold tones. ${NOIR_SHORT}` },
  { slug: 'start-somewhere',               prompt: `Cinematic still — A single footprint in wet concrete on an empty urban street at dawn. First step taken. The road ahead stretches into the dark with a narrow line of gold on the horizon. ${NOIR_SHORT}` },
  { slug: 'fear-was-never-the-point',      prompt: `Cinematic still — A door left ajar, light pouring through the gap into a dark hallway. Shoes on the threshold, about to step through. The light is warm gold, the hallway is deep navy shadow. ${NOIR_SHORT}` },
  { slug: 'the-version-that-survived',     prompt: `Cinematic still — A reflection in a shattered mirror — not distorted but multiplied, each shard showing a different version. Dark background, amber light on the fragments. ${NOIR_SHORT}` },
  { slug: 'nothing-needs-fixing-tonight',  prompt: `Cinematic still — A person lying on their back on a rooftop at night looking at stars, completely still. City lights glow amber far below. A blanket, a cup on the ledge. Pure rest. ${NOIR_SHORT}` },
  { slug: 'the-work-nobody-sees',          prompt: `Cinematic still — A single lamp illuminating a desk in a dark room at 3am. Scattered papers, a half-empty coffee cup, hands on a keyboard. The rest of the room in shadow. ${NOIR_SHORT}` },
  { slug: 'permission',                    prompt: `Cinematic still — A set of old iron keys hanging on a hook, one key catching golden light, slightly separate from the others. Dark wood background, film grain. A door seen slightly blurred behind. ${NOIR_SHORT}` },
  { slug: 'what-you-owe-yourself',         prompt: `Cinematic still — A person's hands cradling their own face, gentle, like offering comfort to themselves. Dark navy background, warm amber side light. Quiet dignity. ${NOIR_SHORT}` },
  { slug: 'slow-becoming',                 prompt: `Cinematic still — Time-lapse feel frozen in one frame — a plant growing through cracked pavement, just one inch emerged. Rain on the concrete around it. Amber morning light. ${NOIR_SHORT}` },
  { slug: 'forgive-the-one-who-didnt-know', prompt: `Cinematic still — An old photograph partially burned at the corners, held over a flame that has just gone out. The image is blurred but the gesture is letting go with care. ${NOIR_SHORT}` },
  { slug: 'built-in-the-dark',            prompt: `Cinematic still — Interior of an old workshop at night, a single hanging lamp illuminating half-finished carved woodwork. Sawdust on the floor. Something being built from nothing, alone. ${NOIR_SHORT}` },
  { slug: 'the-quiet-revolution',         prompt: `Cinematic still — A single candle in a dark room, flame barely moving. Around it, total stillness. The light reaches only a few inches. Intimate, inner, powerful. ${NOIR_SHORT}` },
  { slug: 'not-your-worst-day',           prompt: `Cinematic still — A calendar page torn halfway off a wall, the date almost gone. Morning light comes through a window, casting a clean shadow on the fresh page beneath. ${NOIR_SHORT}` },
  { slug: 'whats-youre-made-of',          prompt: `Cinematic still — A fist unclenching to reveal a small glowing ember in the palm. Dark stormy background, gold light emanating from within. Dust and smoke around the hand. ${NOIR_SHORT}` },

  // ─── Bare and Still Breathing (Unplugged · Acoustic · Guitar & Voice) ───────
  { slug: 'still-here',                   prompt: `Cinematic still — Early morning light through old curtains. A person's silhouette sitting at a windowsill, coffee in hand, watching the first light. Simple, quiet, alive. ${NOIR_SHORT}` },
  { slug: 'one-more-morning',             prompt: `Cinematic still — A simple kitchen table at dawn. A single mug of tea, steam rising, the window just turning light. No clutter. Just presence and the first quiet minutes. ${NOIR_SHORT}` },
  { slug: 'show-up',                      prompt: `Cinematic still — A worn pair of shoes at a front door, laces tied. The door is open slightly. A single step about to be taken out into a foggy morning light. ${NOIR_SHORT}` },
  { slug: 'i-see-you-trying',             prompt: `Cinematic still — Two hands almost touching across a wooden table, warmth between them without contact. Candlelight, worn wood surface, quiet intimacy. ${NOIR_SHORT}` },
  { slug: 'enough-already',              prompt: `Cinematic still — A mirror showing a reflection with a single warm light source. The image is soft-focus, gentle. No harsh angles. The scene says: you are enough, as you are, here. ${NOIR_SHORT}` },
  { slug: 'when-it-gets-quiet',           prompt: `Cinematic still — An empty room at dusk, one chair facing the window, golden last-light pooling on the floor. Complete stillness. A place where you hear yourself. ${NOIR_SHORT}` },
  { slug: 'just-a-little-longer',         prompt: `Cinematic still — A rope bridge over a foggy ravine, one end disappearing in mist, the other end visible and solid. The invitation is to keep going, the other side is there. ${NOIR_SHORT}` },
  { slug: 'you-already-know',             prompt: `Cinematic still — A compass held in open hands, the needle settling. The hands are steady. Around them, fog. The compass knows. Trust what's inside. ${NOIR_SHORT}` },
  { slug: 'slow-down',                    prompt: `Cinematic still — A bicycle leaning against a stone wall covered in ivy. No rider. An afternoon light. The world is not in a hurry here. The whole image breathes slow. ${NOIR_SHORT}` },
  { slug: 'the-good-youve-done',          prompt: `Cinematic still — A tree with initials carved in its bark, the carving old and healed over by years of growth. Late afternoon light dappling through leaves. Evidence of permanence. ${NOIR_SHORT}` },
  { slug: 'after-the-storm',              prompt: `Cinematic still — A flooded street just after rain, sky now clearing with one break of gold light through clouds. Puddles reflect the sky. The storm is over. The world is renewed. ${NOIR_SHORT}` },
  { slug: 'keep-going-love',              prompt: `Cinematic still — A lone figure walking a winding coastal path, small against the vast Atlantic landscape. Not lost — purposeful. Wind in coat. The horizon ahead. ${NOIR_SHORT}` },
  { slug: 'roots',                        prompt: `Cinematic still — An ancient tree's exposed roots above ground, gnarled and deep, holding the earth. Morning light at the base. The roots are beautiful not despite their age but because of it. ${NOIR_SHORT}` },
  { slug: 'the-simplest-things',          prompt: `Cinematic still — A worn wooden table with a wildflower in a small glass of water. Someone just placed it there. Natural light, nothing else needed. The simplest arrangement is enough. ${NOIR_SHORT}` },
  { slug: 'bare-and-still-breathing',     prompt: `Cinematic still — A person standing in the ocean knee-deep at sunset, arms slightly open, face upturned. Not drowning — arriving. Gold light on the water. Stripped to the essential. ${NOIR_SHORT}` },
]

function loadState() {
  if (fs.existsSync(STATE_FILE)) try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch {}
  return {}
}
function saveState(s) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))
}

async function cmdSubmit() {
  const state = loadState()
  let submitted = 0
  for (const track of TRACKS) {
    const destPath = path.join(OUTPUT_DIR, `${track.slug}.jpg`)
    if (fs.existsSync(destPath) && !process.argv.includes('--force')) {
      log(`⏭  ${track.slug} — art already exists`)
      continue
    }
    if (state[track.slug]?.taskId && state[track.slug]?.status !== 'FAILED') {
      log(`⏭  ${track.slug} — already submitted (${state[track.slug].taskId})`)
      continue
    }
    try {
      const taskId = await submitImageJob(track.prompt, { aspectRatio: '1:1', outputFormat: 'jpeg' })
      state[track.slug] = { taskId, status: 'PENDING', slug: track.slug }
      log(`✓  Submitted: ${track.slug} → ${taskId}`)
      submitted++
      saveState(state)
      await sleep(RATE_LIMIT_MS)
    } catch (e) {
      log(`✗  ${track.slug}: ${e.message}`)
    }
  }
  log(`\nDone. ${submitted} art jobs submitted.`)
}

async function cmdPoll() {
  const state = loadState()
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  let pending = 0, done = 0, failed = 0

  for (const [slug, info] of Object.entries(state)) {
    if (info.status === 'DOWNLOADED') { done++; continue }
    const result = await pollImageJob(info.taskId)
    if (result.done && !result.failed && result.url) {
      const dest = path.join(OUTPUT_DIR, `${slug}.jpg`)
      log(`↓  Downloading ${slug}…`)
      await downloadFile(result.url, dest)
      state[slug].status = 'DOWNLOADED'
      state[slug].url = result.url
      saveState(state)
      log(`   ✓  ${slug}.jpg`)
      done++
    } else if (result.failed) {
      log(`✗  ${slug} — FAILED`)
      state[slug].status = 'FAILED'
      saveState(state)
      failed++
    } else {
      log(`⏳ ${slug} — pending`)
      pending++
    }
    await sleep(500)
  }

  // Update manifest
  if (done > 0) {
    const manifestPath = path.join(ROOT, 'public', 'images', 'song-art', 'manifest.json')
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    for (const [slug, info] of Object.entries(state)) {
      if (info.status === 'DOWNLOADED') manifest[slug] = `/images/song-art/${slug}.jpg`
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    log(`Manifest updated`)
  }

  log(`\nStatus: ${done} done · ${pending} pending · ${failed} failed`)
}

function cmdStatus() {
  const state = loadState()
  for (const [slug, info] of Object.entries(state)) {
    const icon = info.status === 'DOWNLOADED' ? '✓' : info.status === 'FAILED' ? '✗' : '⏳'
    console.log(`${icon}  ${slug} — ${info.status}`)
  }
  const total = Object.keys(state).length
  const done  = Object.values(state).filter(s => s.status === 'DOWNLOADED').length
  console.log(`\n${done}/${total} downloaded`)
}

const args = process.argv.slice(2)
;(async () => {
  if (args.includes('--submit'))      await cmdSubmit()
  else if (args.includes('--poll'))   await cmdPoll()
  else if (args.includes('--status')) cmdStatus()
  else console.log('Usage: --submit | --poll | --status')
})()
