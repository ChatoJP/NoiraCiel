#!/usr/bin/env node
/**
 * generate-glyph-assets.js — symbolic visual assets for the NoiraCiel Speaker.
 *
 * Builds KIE.AI prompts for the 20 day-sign icons, the per-anchor 13-day wave
 * heroes, a stone/mist background texture, and (optionally) a single daily Kin
 * card. See docs/NOIRACIEL_SYMBOLIC_SYSTEM.md for the prompt templates and the
 * full design system.
 *
 * SAFE BY DEFAULT: this is dry-run unless you pass --live. Dry-run prints every
 * prompt and writes them to .tmp/glyph-asset-prompts.json — it generates nothing
 * and spends no KIE credits.
 *
 * Usage:
 *   node scripts/generate-glyph-assets.js                 # dry-run, all prompts
 *   node scripts/generate-glyph-assets.js --only signs    # signs | waves | texture
 *   node scripts/generate-glyph-assets.js --kin 2026-06-24
 *   node scripts/generate-glyph-assets.js --live --only signs   # real generation
 *
 * Live mode: submit → poll → download → upload to R2 → delete temp.
 */

const fs = require('fs')
const path = require('path')

const {
  loadEnv, log, warn, err, sleep, downloadFile,
  submitImageJob, pollImageJob, RATE_LIMIT_MS,
} = require('./lib/kie-client')
const r2 = require('./lib/r2-client')

loadEnv()
r2.loadEnv()

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const LIVE = args.includes('--live') && process.env.KIE_DRY_RUN !== 'true'
const only = (() => {
  const i = args.indexOf('--only')
  return i >= 0 ? args[i + 1] : null
})()
const kinDate = (() => {
  const i = args.indexOf('--kin')
  return i >= 0 ? args[i + 1] : null
})()

const GOLD = '#C4953A'

// Abstract cue per sign (the "idea", never a historical glyph).
const SIGN_CUES = {
  Imix: 'the primordial deep water and the source',
  Ik: 'wind, breath and spirit',
  Akbal: 'night, the inner house and a single candle',
  Kan: 'a seed and its first sprout, latent potential',
  Chicchan: 'the serpent, vital instinct',
  Cimi: 'a threshold, release and transition',
  Manik: 'an open grasping hand, healing',
  Lamat: 'a four-point star, Venus, harmony',
  Muluc: 'a falling drop and water ripples, memory',
  Oc: 'the loyal heart, guidance',
  Chuen: 'interwoven threads, the artisan at play',
  Eb: 'a rising road with footsteps, the human journey',
  Ben: 'a reed and the upright spine, integrity',
  Ix: 'the jaguar, three spots and the earth',
  Men: 'an eye within wings, the higher view',
  Cib: 'a waning crescent and the inner voice, wisdom',
  Caban: 'a spiral, movement and synchronicity',
  Etznab: 'a split mirror of flint, clarity',
  Cauac: 'a cloud and rain, storm and renewal',
  Ahau: 'a rayed sun, completion and illumination',
}

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-') }

function signPrompt(sign) {
  return (
    `A single abstract symbolic glyph representing "${sign}" — the idea of ` +
    `${SIGN_CUES[sign]}. Minimal sacred-geometry-inspired line mark, 2 to 4 ` +
    `strokes, centred, elegant, mysterious. Muted gold (${GOLD}) thin glowing ` +
    `lines on a near-black stone background (#06060C) with faint Atlantic mist. ` +
    `Ancient-future feeling, premium, restrained. Perfect symmetry softened by ` +
    `one deliberate imperfection. NOT a historical Maya glyph, NOT a copy of any ` +
    `sacred symbol. Negative: pyramids, headdresses, text, letters, neon, ` +
    `cartoon, tribal cliche, busy detail, multiple colours, 3D, photoreal.`
  )
}

function wavePrompt(anchor) {
  return (
    `Create a premium NoiraCiel 13-day wave visual for a Mayan-calendar-inspired ` +
    `symbolic cycle, anchored by "${anchor}". Compose 13 small glyph-stones in a ` +
    `gentle horizontal arc from left (seed) to right (completion); the first and ` +
    `last stones are visually distinct. The anchor sign appears as a larger ` +
    `central symbol behind the line. Dark cinematic minimalism, black stone, ` +
    `midnight blue, violet shadow, muted gold (${GOLD}) glyph lines, Atlantic ` +
    `mist, sacred-geometry inspired but not historically copied, elegant, ` +
    `mysterious, premium. Negative: pyramids, tourist Maya cliches, horoscope ` +
    `aesthetics, cartoon spirituality, neon overload, text, zodiac wheel.`
  )
}

const TEXTURE_PROMPT =
  `Seamless premium background texture: black stone (#06060C) with very faint ` +
  `muted gold (${GOLD}) sacred-geometry lines and Atlantic mist, extremely low ` +
  `contrast, cinematic, elegant. Negative: pyramids, text, neon, cartoon, busy ` +
  `pattern, high contrast.`

function kinPrompt(dateStr) {
  // Lazy import so dry-run without a build still works; resolves today's Kin.
  return (
    `A premium NoiraCiel "Kin card" for the date ${dateStr}, dark cinematic ` +
    `minimalism. Black stone background (#06060C), midnight-blue depth, a faint ` +
    `violet-gold glow behind a central abstract day-sign glyph in thin muted ` +
    `gold (${GOLD}) lines. Small uppercase label for the tone, an elegant serif ` +
    `Kin title, one short poetic italic line, and a tiny date caption. Atlantic ` +
    `mist, subtle film grain, ample negative space, museum-grade restraint. ` +
    `Negative: pyramids, tourist Maya, horoscope aesthetics, cartoon, neon, ` +
    `clutter, watermark, harsh contrast. Aspect 4:5.`
  )
}

// ── Build the job list ───────────────────────────────────────────────────────
const SIGNS = Object.keys(SIGN_CUES)
const jobs = []

if (!only || only === 'signs') {
  for (const s of SIGNS) {
    jobs.push({ key: `images/glyphs/signs/${slug(s)}.jpeg`, prompt: signPrompt(s), aspectRatio: '1:1' })
  }
}
if (!only || only === 'waves') {
  for (const s of SIGNS) {
    jobs.push({ key: `images/glyphs/waves/wave-${slug(s)}.jpeg`, prompt: wavePrompt(s), aspectRatio: '16:9' })
  }
}
if (!only || only === 'texture') {
  jobs.push({ key: `images/glyphs/textures/stone-mist-01.jpeg`, prompt: TEXTURE_PROMPT, aspectRatio: '16:9' })
}
if (kinDate) {
  jobs.push({ key: `images/glyphs/kin/og/${kinDate}.jpeg`, prompt: kinPrompt(kinDate), aspectRatio: '4:5' })
}

async function generateOne(job, tmpDir) {
  const taskId = await submitImageJob(job.prompt, { aspectRatio: job.aspectRatio, outputFormat: 'jpeg' })
  let result = null
  for (let i = 0; i < 60; i++) {
    await sleep(RATE_LIMIT_MS)
    const r = await pollImageJob(taskId)
    if (r.done) { result = r; break }
  }
  if (!result || result.failed || !result.url) throw new Error(`generation failed for ${job.key}`)
  const tmpPath = path.join(tmpDir, path.basename(job.key))
  await downloadFile(result.url, tmpPath)
  await r2.uploadFile(tmpPath, job.key)
  const ok = await r2.verifyUpload(tmpPath, job.key)
  if (!ok) throw new Error(`R2 verify failed for ${job.key}`)
  fs.rmSync(tmpPath, { force: true })
  return r2.publicUrlFor(job.key)
}

async function main() {
  log(`NoiraCiel glyph assets — ${jobs.length} job(s) — mode: ${LIVE ? 'LIVE' : 'DRY-RUN'}`)

  const promptsOut = jobs.map((j) => ({ key: j.key, aspectRatio: j.aspectRatio, prompt: j.prompt }))
  const tmpDir = path.join(process.cwd(), '.tmp')
  fs.mkdirSync(tmpDir, { recursive: true })
  r2.atomicWriteJSON(path.join(tmpDir, 'glyph-asset-prompts.json'), promptsOut)
  log(`Prompts written to .tmp/glyph-asset-prompts.json`)

  if (!LIVE) {
    for (const j of jobs) {
      console.log(`\n— ${j.key} (${j.aspectRatio})\n${j.prompt}`)
    }
    log(`\nDry-run complete. Re-run with --live to generate and upload to R2.`)
    return
  }

  let done = 0
  for (const j of jobs) {
    try {
      const url = await generateOne(j, tmpDir)
      done++
      log(`✓ ${j.key} → ${url}`)
    } catch (e) {
      err(`✗ ${j.key}: ${e.message}`)
    }
  }
  log(`Generated ${done}/${jobs.length} assets.`)
}

main().catch((e) => { err(e.stack || String(e)); process.exit(1) })
