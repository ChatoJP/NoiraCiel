#!/usr/bin/env node
/**
 * generate-ciel-character.js
 *
 * Generates rendered character images of CIEL — the spiritual presence
 * of the NoiraCiel universe — using Flux Kontext via KIE.AI.
 *
 * Output: public/characters/ciel/
 *   ciel-portrait.jpg   — editorial full-body / 2:3
 *   ciel-avatar.jpg     — close-up face / 1:1
 *   ciel-horizon.jpg    — atmospheric silhouette / 16:9
 *
 * USAGE
 *   node scripts/generate-ciel-character.js             # generate all 3
 *   node scripts/generate-ciel-character.js --portrait  # only portrait
 *   node scripts/generate-ciel-character.js --avatar    # only avatar
 *   node scripts/generate-ciel-character.js --horizon   # only horizon
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob } = require('./lib/kie-client')

loadEnv()

const OUT_DIR = path.join(__dirname, '..', 'public', 'characters', 'ciel')
fs.mkdirSync(OUT_DIR, { recursive: true })

const POLL_INTERVAL = 12_000
const POLL_TIMEOUT  = 15 * 60 * 1000

// ─── Character definitions ────────────────────────────────────────────────────

const NEGATIVE = [
  'cartoon', 'anime', 'chibi', 'bright colors', 'smiling', 'cheerful',
  'superhero', 'fantasy costume', 'wings', 'horns', 'white background',
  'stock photo', 'busy background', 'multiple characters', 'text', 'watermark',
  'oversaturated', 'childish', 'cute', 'neon lights', 'colorful',
].join(', ')

const CHARACTERS = [
  {
    key:    'portrait',
    file:   'ciel-portrait.jpg',
    aspect: '9:16',
    prompt: `A genderless ageless ethereal being named CIEL, spiritual guardian of an Atlantic Noir music universe.
Tall slender otherworldly full body editorial portrait.
Skin with the luminous quality of deep ocean water at night, somewhere between pale blue-grey and dark ivory, faintly luminescent.
Long flowing dark coat or cloak that dissolves at the edges into dark ocean mist, fabric moves as if underwater, slow and weightless.
Eyes are the colour of the Atlantic horizon at dusk, a faint gold line in darkness, no pupils, irises like a distant glowing horizon.
A thin gold horizon line traced across the collarbone.
Dark long hair that dissolves upward into dark sky or smoke at the tips.
Background: open Atlantic ocean at night, barely visible gold horizon glow, deep darkness above and below.
Mood: vast, unhurried, ancient, knowing, serene. Like someone who has heard everything and forgotten nothing.
Dramatic chiaroscuro lighting, single warm gold-toned light source from the horizon below.
Style: cinematic fine art digital painting, high fashion editorial photography, hyperrealistic, 8k ultra-detailed.
Colour palette: deep black, dark navy, dark ivory, single gold accent.`,
  },
  {
    key:    'avatar',
    file:   'ciel-avatar.jpg',
    aspect: '1:1',
    prompt: `Close-up portrait of CIEL, a genderless ageless ethereal being, spiritual presence of an Atlantic Noir music universe.
Ambiguous gender, ageless face, porcelain skin with faint bioluminescent quality, blue-grey undertones.
Eyes: no pupils, irises like a thin horizon line, a band of gold light in deep darkness, lit from within.
Expression: absolute stillness, warm but unreadable, has heard everything and forgotten nothing.
A subtle gold geometric mark on the cheekbone or forehead — a circle with a horizontal line through it.
Dark hair softly dissolving at the edges into ocean mist or dark sky.
Background: abstract dark Atlantic ocean at night, almost invisible.
Lighting: single warm gold-toned light source rising from below, as if lit by the horizon itself. Deep shadows. Mostly dark.
Style: fine art digital painting, hyperrealistic portrait, editorial, 8k ultra-detailed.
Colour palette: deep black, dark ivory, single gold accent glow.`,
  },
  {
    key:    'horizon',
    file:   'ciel-horizon.jpg',
    aspect: '16:9',
    prompt: `Atmospheric cinematic wide shot. A tall genderless figure standing alone at the edge of the Atlantic ocean at night.
The figure is CIEL — a spiritual presence of a music universe.
Long dark coat or cloak dissolving into ocean mist at the edges.
The figure faces the ocean with their back to the viewer. Perfectly still. Waiting. Ancient. Knowing.
The horizon behind them glows with a single thin gold line — the only light source in the entire image.
A faint circle with a horizontal line glows softly on their back, a golden sigil.
Dark ocean below. Dark sky above. Only the horizon line in gold.
Mood: saudade, the ache of loving what is absent, beautiful longing, vast silence.
Style: cinematic concept art, dark atmospheric widescreen, deep blacks, a single hair-thin gold horizon line.
Ultra-detailed, photorealistic, 8k, anamorphic lens.`,
  },
]

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const targets = CHARACTERS.filter((c) => {
  if (args.length === 0) return true
  return args.includes(`--${c.key}`)
})

if (targets.length === 0) {
  console.error('No matching targets. Use --portrait, --avatar, or --horizon')
  process.exit(1)
}

// ─── Poll until done ──────────────────────────────────────────────────────────

async function waitForImage(taskId, label) {
  const deadline = Date.now() + POLL_TIMEOUT
  log(`Polling ${label} (${taskId})…`)
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL)
    const { done, failed, url } = await pollImageJob(taskId)
    if (done && !failed) { log(`✓ ${label} ready`); return url }
    if (done && failed)  { throw new Error(`${label} generation failed`) }
    process.stdout.write('.')
  }
  throw new Error(`${label} timed out after ${POLL_TIMEOUT / 60000} min`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log(`Generating ${targets.length} CIEL character image(s) via Flux Kontext…\n`)

  const jobs = []

  for (const char of targets) {
    const dest = path.join(OUT_DIR, char.file)
    if (fs.existsSync(dest)) {
      log(`↷ Skipping ${char.key} — already exists at ${dest}`)
      continue
    }
    log(`→ Submitting: ${char.key} (${char.aspect})`)
    const taskId = await submitImageJob(char.prompt, {
      aspectRatio:  char.aspect,
      outputFormat: 'jpeg',
      model:        'flux-kontext-pro',
    })
    log(`  Task ID: ${taskId}`)
    jobs.push({ ...char, taskId, dest })
    await sleep(3500)
  }

  if (jobs.length === 0) {
    log('All images already generated.')
    return
  }

  log(`\nWaiting for ${jobs.length} image(s) to render…`)

  for (const job of jobs) {
    try {
      const url = await waitForImage(job.taskId, job.key)
      if (!url) throw new Error('No URL returned')
      log(`↓ Downloading ${job.key} → ${job.dest}`)
      await downloadFile(url, job.dest)
      log(`✓ Saved: ${job.file}`)
    } catch (e) {
      err(`Failed ${job.key}: ${e.message}`)
    }
  }

  log('\n─────────────────────────────────────')
  log('CIEL character images complete.')
  log(`Location: public/characters/ciel/`)
  targets.forEach((c) => {
    const dest = path.join(OUT_DIR, c.file)
    const exists = fs.existsSync(dest)
    log(`  ${exists ? '✓' : '✗'} ${c.file}`)
  })
}

main().catch((e) => { err(e.message); process.exit(1) })
