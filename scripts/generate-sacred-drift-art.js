#!/usr/bin/env node
'use strict'
const fs = require('fs'), path = require('path')
const { loadEnv, log, sleep, downloadFile, submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
loadEnv()

const ROOT       = path.join(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT, 'public', 'images', 'song-art')
const STATE_FILE = path.join(ROOT, '.score-work', 'sacred-drift-art-state.json')
const NOIR = `16mm film grain, dark Atlantic palette (navy, black, amber gold), painterly, cinematic, no text, no faces, no neon.`
const PSY  = `Psychedelic sacred geometry, deep indigo violet gold palette, mandala energy, spiritual ethereal, no text, no faces.`

const TRACKS = [
  { slug: 'so-hum',               prompt: `Cinematic still — A figure in deep meditation, silhouetted against a vast cosmic sky full of galaxies. Hands in prayer mudra, a soft gold aura emanates from the body. ${PSY}` },
  { slug: 'the-frequency-knows',  prompt: `Cinematic still — Sound waves made visible as luminous golden ripples radiating from a single point of light in deep space. Sacred geometry overlaid. Deep indigo and gold. ${PSY}` },
  { slug: 'third-signal',         prompt: `Cinematic still — A glowing third eye symbol forming out of scattered particles of light in dark space. Violet and gold tones. Geometric precision with organic feel. ${PSY}` },
  { slug: 'dissolve',             prompt: `Cinematic still — A human silhouette slowly dissolving at the edges into thousands of golden particles of light merging with the cosmos. Deep blue background. ${PSY}` },
  { slug: 'sat-nam',              prompt: `Cinematic still — Ancient Sanskrit text carved into stone, illuminated by golden candlelight. The stone is old and sacred. Deep shadows, warm amber glow on the glyphs. ${NOIR}` },
  { slug: 'sacred-static',        prompt: `Cinematic still — An old vintage radio dial in a dark room, glowing amber, tuned between stations. The static is visible as golden light particles floating in the air around it. ${NOIR}` },
  { slug: 'the-drift',            prompt: `Cinematic still — A lone figure lying on their back in a small boat on a perfectly still dark ocean at night, surrounded by bioluminescent water glowing blue-green. Stars above. ${NOIR}` },
  { slug: 'all-is-one',           prompt: `Cinematic still — A sacred mandala seen from above, made of flower petals and golden dust, surrounded by darkness. Each petal a universe. Vast and intimate at once. ${PSY}` },
  { slug: 'shakti-rising',        prompt: `Cinematic still — A coiled serpent of golden light rising through the center of a dark cosmic space, blooming into a lotus at the crown. Kundalini energy made visual. ${PSY}` },
  { slug: 'neti-neti',            prompt: `Cinematic still — A series of translucent veils or masks dissolving one after another in dark space, revealing only pure light at the center. Nothing / not this. ${PSY}` },
  { slug: 'between-the-worlds',   prompt: `Cinematic still — A doorway made of light standing alone in deep fog at night. The door is slightly open, warm golden light coming from within. Two worlds visible. ${NOIR}` },
  { slug: 'om-namah',             prompt: `Cinematic still — The Om symbol in flame and golden light hovering in dark space. Ancient and electric simultaneously. Sacred fire geometry. Deep black background. ${PSY}` },
  { slug: 'the-return',           prompt: `Cinematic still — A path through dark forest leading toward a single warm light in the distance. The trees part to create a corridor. Homecoming and the sacred ordinary. ${NOIR}` },
  { slug: 'open-eye',             prompt: `Cinematic still — A giant eye made of cosmic nebula and stars — the iris is a galaxy, the pupil a black hole, ringed by golden light. Third eye as universe. ${PSY}` },
  { slug: 'the-sacred-drift',     prompt: `Cinematic still — A human figure dissolving into golden light while drifting upward through a vast cosmic ocean of stars and nebulae. The merging of self and universe. ${PSY}` },
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
  const state = loadState(); let submitted = 0
  for (const track of TRACKS) {
    if (fs.existsSync(path.join(OUTPUT_DIR, `${track.slug}.jpg`)) && !process.argv.includes('--force')) {
      log(`⏭  ${track.slug} — exists`); continue
    }
    if (state[track.slug]?.taskId && state[track.slug]?.status !== 'FAILED') {
      log(`⏭  ${track.slug} — submitted`); continue
    }
    try {
      const taskId = await submitImageJob(track.prompt, { aspectRatio: '1:1', outputFormat: 'jpeg' })
      state[track.slug] = { taskId, status: 'PENDING', slug: track.slug }
      log(`✓  ${track.slug} → ${taskId}`); submitted++; saveState(state); await sleep(RATE_LIMIT_MS)
    } catch (e) { log(`✗  ${track.slug}: ${e.message}`) }
  }
  log(`Done. ${submitted} art jobs submitted.`)
}

async function cmdPoll() {
  const state = loadState(); fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  let pending = 0, done = 0, failed = 0
  for (const [slug, info] of Object.entries(state)) {
    if (info.status === 'DOWNLOADED') { done++; continue }
    const result = await pollImageJob(info.taskId)
    if (result.done && !result.failed && result.url) {
      log(`↓  ${slug}`); await downloadFile(result.url, path.join(OUTPUT_DIR, `${slug}.jpg`))
      state[slug].status = 'DOWNLOADED'; saveState(state); log(`   ✓`); done++
    } else if (result.failed) {
      log(`✗  ${slug}`); state[slug].status = 'FAILED'; saveState(state); failed++
    } else { log(`⏳ ${slug}`); pending++ }
    await sleep(400)
  }
  // Update manifest
  if (done > 0) {
    const mp = path.join(ROOT, 'public', 'images', 'song-art', 'manifest.json')
    const manifest = JSON.parse(fs.readFileSync(mp, 'utf-8'))
    for (const [slug, info] of Object.entries(state)) {
      if (info.status === 'DOWNLOADED') manifest[slug] = `/images/song-art/${slug}.jpg`
    }
    fs.writeFileSync(mp, JSON.stringify(manifest, null, 2))
  }
  log(`\n${done} done · ${pending} pending · ${failed} failed`)
}

function cmdStatus() {
  const state = loadState()
  for (const [slug, info] of Object.entries(state)) {
    console.log(`${info.status === 'DOWNLOADED' ? '✓' : info.status === 'FAILED' ? '✗' : '⏳'}  ${slug}`)
  }
  console.log(`\n${Object.values(state).filter(s=>s.status==='DOWNLOADED').length}/${Object.keys(state).length} done`)
}

const args = process.argv.slice(2)
;(async () => {
  if (args.includes('--submit'))      await cmdSubmit()
  else if (args.includes('--poll'))   await cmdPoll()
  else if (args.includes('--status')) cmdStatus()
  else console.log('Usage: --submit | --poll | --status')
})()
