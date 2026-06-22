#!/usr/bin/env node
/**
 * generate-objects-images.js
 *
 * Generates product images for the NoiraCiel Objects boutique line via Flux Kontext (Kie.ai).
 * 11 products × 3 shots = 33 images in portrait 2:3 format.
 *
 * Shots per product:
 *   hero      — full product beauty shot, minimal background
 *   detail    — close-up of texture, lid, nozzle, or surface
 *   lifestyle — product placed in its world (windowsill, table, stone shelf)
 *
 * OUTPUT: public/images/objects/{slug}-{shot}.jpg
 *
 * USAGE
 *   node scripts/generate-objects-images.js              # dry-run
 *   node scripts/generate-objects-images.js --execute    # submit to Kie.ai
 *   node scripts/generate-objects-images.js --poll       # download completed
 *   node scripts/generate-objects-images.js --list       # status table
 *   node scripts/generate-objects-images.js --reset      # clear state
 *   node scripts/generate-objects-images.js --force      # resubmit failed/all
 *   node scripts/generate-objects-images.js --product borrowed-time   # one product
 *   node scripts/generate-objects-images.js --edition blind-angel     # one edition
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep,
        submitImageJob, pollImageJob,
        downloadFile, RATE_LIMIT_MS } = require('./lib/kie-client')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR       = path.join(__dirname, '..', 'public', 'Images', 'objects')
const PUBLIC_BASE      = '/images/objects'
const POLL_INTERVAL_MS = 18_000
const POLL_TIMEOUT_MS  = 30 * 60 * 1000

const args           = process.argv.slice(2)
const DRY_RUN        = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE      = args.includes('--execute')
const POLL_MODE      = args.includes('--poll')
const LIST_MODE      = args.includes('--list')
const RESET_MODE     = args.includes('--reset')
const FORCE          = args.includes('--force')
const PRODUCT_FILTER = (() => { const i = args.indexOf('--product');  return i !== -1 ? args[i + 1] : null })()
const EDITION_FILTER = (() => { const i = args.indexOf('--edition');  return i !== -1 ? args[i + 1] : null })()

// ─── Brand style suffix ────────────────────────────────────────────────────────
// Appended to every prompt. Do NOT change without testing — this defines the look.
const STYLE = [
  'luxury product photography',
  'NoiraCiel Atlantic Noir world',
  'near-black shadows, bone-white surfaces, cold dark stone',
  'minimal matte packaging with no visible text or labels',
  'single directional light source, painterly cinematic quality',
  '16mm film grain, editorial still life',
  'no people, no faces, no logos, no text in image',
  'portrait orientation 2:3',
].join(', ')

// ─── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS = [

  // ── The Life Lessons Edition ──────────────────────────────────────────────────
  {
    slug:    'borrowed-time',
    name:    'Borrowed Time',
    type:    'Hand Cream',
    edition: 'life-lessons',
    shots: {
      hero:      'elegant hand cream jar, matte black ceramic with bone-white lid, placed on cold grey stone slab, single narrow shaft of gold afternoon light falling from upper left, deep shadow on right side, luxury minimalist still life',
      detail:    'extreme close-up of hand cream jar lid, matte black ceramic texture, thin gold band at the join, perfect soft shadow on polished dark stone, macro product photography',
      lifestyle: 'hand cream jar on worn stone windowsill, late afternoon light through tall narrow window, old open book beside it, amber glow against dark interior, Atlantic Noir home atmosphere',
    },
  },

  {
    slug:    'leave-a-light-on',
    name:    'Leave a Light On',
    type:    'Room Mist',
    edition: 'life-lessons',
    shots: {
      hero:      'tall slender room mist spray bottle, dark smoked glass with minimal matte black band, placed on cold stone surface, single warm amber lamp glowing behind the bottle creating a halo of light, deep surrounding darkness',
      detail:    'room mist spray nozzle close-up, dark smoked glass neck, fine mist particles suspended in a diagonal shaft of cold light, near-black background, macro',
      lifestyle: 'room mist bottle on stone window ledge at dusk, thin linen curtain barely moving, warm amber light inside, cold blue twilight visible through the glass behind it, intimate domestic scene',
    },
  },

  {
    slug:    'the-empty-chair',
    name:    'The Empty Chair',
    type:    'Candle',
    edition: 'life-lessons',
    shots: {
      hero:      'thick pillar candle, matte bone-white wax, single flame burning, placed on dark cold stone, absolute black background, the flame is the only warm light source, long shadow cast behind the candle, luxury candle photography',
      detail:    'close-up of candle flame and wax pool around the wick, warm amber glow radiating outward, bone-white wax texture visible, near-black background, painterly macro',
      lifestyle: 'single candle burning on old dark wooden table, an empty chair softly out of focus behind it, Sunday afternoon light entering from a distant window, feeling of sacred absence and memory',
    },
  },

  {
    slug:    'good-things-grow-slow',
    name:    'Good Things Grow Slow',
    type:    'Body Oil',
    edition: 'life-lessons',
    shots: {
      hero:      'dark amber glass body oil bottle with a minimal cork stopper, cold stone surface, warm amber light refracting through the glass and creating a soft pool of gold colour in the surrounding darkness, luxury editorial product shot',
      detail:    'close-up of amber oil inside dark glass, light passing through revealing the depth of colour, cork stopper detail at top, cold stone surface beneath, macro product photography',
      lifestyle: 'body oil bottle on a stone bathroom shelf, morning light filtering through a frosted window, a small smooth river stone beside it, patient and slow morning ritual, Atlantic Noir aesthetic',
    },
  },

  // ── The Blind Angel Edition ───────────────────────────────────────────────────
  {
    slug:    'crown-of-fire',
    name:    'Crown of Fire',
    type:    'Body Serum',
    edition: 'blind-angel',
    shots: {
      hero:      'sleek dark body serum bottle, near-black glass with a pewter and dark metal dropper top, placed on black cold stone surface, single cold silver light falling from directly above, near-absolute darkness surrounding, intimate metal aesthetic',
      detail:    'serum dropper close-up, dark near-black glass and pewter metal, a single oil droplet forming at the dropper tip, macro, near-black background, cold silver light catching the metal detail, intimate metal',
      lifestyle: 'serum bottle on a black stone shelf in near-darkness, a single candle flame in the deep background out of focus, cold dark stone room, one thread of silver light falling on the bottle surface, Blind Angel world',
    },
  },

  {
    slug:    'no-light-left',
    name:    'No Light Left',
    type:    'Candle',
    edition: 'blind-angel',
    shots: {
      hero:      'black pillar candle, matte black wax, tiny single flame burning, placed on black stone, absolute black background, flame barely a point of gold in the total surrounding darkness, haunting luxury still life, intimate metal aesthetic',
      detail:    'close-up of black wax candle texture near the base of the flame, matte carbon black wax colour with a warm amber core visible at the flame, macro, almost total surrounding darkness, cold stone surface',
      lifestyle: 'black candle burning alone on ancient stone in a dark room, the darkness consuming everything beyond one metre, the small flame the only point of orientation in the space, Blind Angel intimate metal world',
    },
  },

  {
    slug:    'mercy-in-flames',
    name:    'Mercy in Flames',
    type:    'Lip Treatment',
    edition: 'blind-angel',
    shots: {
      hero:      'small luxury lip treatment pot, matte dark metal lid with a subtle circular texture, cold stone surface, single deep red-gold warm light from behind and right creating a halo edge, deep shadows on left, intimate metal aesthetic',
      detail:    'lip treatment pot lid close-up, matte dark metal texture, light catching the very edge of the circular lid, macro, near-black background, cold dark stone surface beneath',
      lifestyle: 'small lip treatment pot on worn cold stone surface, a single candle burning beside it, warm firelight on dark stone wall behind, Blind Angel intimate metal world, warmth surviving in near-darkness',
    },
  },

  {
    slug:    'darkness-made-divine',
    name:    'Darkness Made Divine',
    type:    'Room Mist',
    edition: 'blind-angel',
    shots: {
      hero:      'dark pewter room mist bottle, almost-black metal finish, placed on cold black stone, near-total surrounding darkness, single ice-cold blue light from far left casting a long cold shadow, Blind Angel intimate metal aesthetic',
      detail:    'pewter mist bottle nozzle and neck detail, dark metal texture, ultra-fine mist particles suspended in cold blue light, macro, black background, intimate metal',
      lifestyle: 'dark mist bottle on an ancient stone ledge in near-total darkness, a single distant candle creating a minimal warm point of glow far in the background, Blind Angel sacred darkness world',
    },
  },

  // ── Jazz Sessions Edition ─────────────────────────────────────────────────────
  {
    slug:    'keep-a-chair-for-you',
    name:    'Keep a Chair for You',
    type:    'Candle',
    edition: 'jazz-sessions',
    shots: {
      hero:      'deep indigo and midnight-blue wax pillar candle with a slim brass base ring, burning on a small dark wooden table, warm amber light from the flame creating a pool of gold, jazz bar late-night atmosphere, luxury intimate still life',
      detail:    'close-up of candle flame burning in deep indigo wax, warm amber core, blue wax colour visible around the flame, macro, Lisbon jazz bar atmosphere, painterly quality',
      lifestyle: 'candle burning on a small round table in a dark jazz club interior, brass instruments softly out of focus in the background, warm amber light pooling on the table, Lisbon at night, Atlantic Noir jazz world',
    },
  },

  {
    slug:    'carry-you-home',
    name:    'Carry You Home',
    type:    'Body Oil',
    edition: 'jazz-sessions',
    shots: {
      hero:      'warm amber glass body oil bottle, thin elegant form, placed against a deep indigo dark background, warm gold light passing through the amber glass and casting a soft golden glow on the dark surface beneath, jazz sessions Atlantic Noir aesthetic',
      detail:    'warm amber oil bottle close-up, the rich amber colour of the glass, a simple cork detail at the top, warm light refracting through the glass in a warm golden arc, macro, dark background, jazz sessions world',
      lifestyle: 'body oil bottle on a dark bedside table, single lamp behind it creating a warm amber halo, late at night, faint city light visible through an open window, intimate jazz sessions Atlantic Noir atmosphere',
    },
  },

  {
    slug:    'mercy-wears-a-black-coat',
    name:    'Mercy Wears a Black Coat',
    type:    'Hand Cream',
    edition: 'jazz-sessions',
    shots: {
      hero:      'hand cream jar in matte black with a dark brass lid, placed on aged dark wood surface, single warm side-lamp light illuminating from the left, jazz sessions Atlantic Noir world, luxury editorial product photography',
      detail:    'close-up of dark brass jar lid, circular brushed texture, warm amber light catching the edge of the lid, cold dark wooden surface beneath, macro, jazz sessions intimate atmosphere',
      lifestyle: 'hand cream jar on a small round wooden table with a jazz bar atmosphere, a glass of red wine softly out of focus beside it, warm amber light, Lisbon late night, Atlantic Noir intimate luxury world',
    },
  },
]

// ─── Build job list ────────────────────────────────────────────────────────────
function buildJobs() {
  let filtered = PRODUCTS
  if (PRODUCT_FILTER) filtered = filtered.filter((p) => p.slug.includes(PRODUCT_FILTER))
  if (EDITION_FILTER) filtered = filtered.filter((p) => p.edition.includes(EDITION_FILTER))

  const jobs = []
  for (const product of filtered) {
    for (const [shot, promptBase] of Object.entries(product.shots)) {
      const id     = `${product.slug}-${shot}`
      const label  = `${product.name} · ${shot}`
      const prompt = `${promptBase}, ${STYLE}`
      jobs.push({ id, label, prompt, product: product.slug, shot, edition: product.edition })
    }
  }
  return jobs
}

// ─── List ──────────────────────────────────────────────────────────────────────
function runList() {
  const state = loadState(OUTPUT_DIR)
  const jobs  = buildJobs()

  let done = 0, pending = 0, failed = 0, none = 0

  const EDITION_LABELS = {
    'life-lessons':  'The Life Lessons Edition',
    'blind-angel':   'The Blind Angel Edition',
    'jazz-sessions': 'Jazz Sessions Edition',
  }

  console.log('\n🛍   NoiraCiel Objects — image status\n')

  let lastEdition = ''
  let filtered = PRODUCTS
  if (PRODUCT_FILTER) filtered = filtered.filter((p) => p.slug.includes(PRODUCT_FILTER))
  if (EDITION_FILTER) filtered = filtered.filter((p) => p.edition.includes(EDITION_FILTER))

  for (const product of filtered) {
    if (product.edition !== lastEdition) {
      console.log(`\n  ── ${EDITION_LABELS[product.edition] ?? product.edition} ──`)
      lastEdition = product.edition
    }
    const shots    = Object.keys(product.shots)
    const statuses = shots.map((shot) => {
      const e = state[`${product.slug}-${shot}`]
      if (isComplete(e))          { done++;    return '✅' }
      if (isPending(e))           { pending++; return '⏳' }
      if (e?.status === 'failed') { failed++;  return '✗ ' }
      none++; return '○ '
    })
    const detail = shots.map((s, i) => `${s}:${statuses[i].trim()}`).join(' · ')
    console.log(`  ${statuses.join('')}  ${product.name.padEnd(30)} [${detail}]`)
  }

  console.log(`\n  Total: ${jobs.length} images — ✅ ${done}  ⏳ ${pending}  ✗ ${failed}  ○ ${none}`)
  console.log(`  Output: public/images/objects/\n`)
}

// ─── Execute ──────────────────────────────────────────────────────────────────
async function runExecute() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const state   = loadState(OUTPUT_DIR)
  const jobs    = buildJobs()
  const toSubmit = jobs.filter((j) => {
    const e = state[j.id]
    return FORCE || (!isComplete(e) && !isPending(e))
  })

  if (!toSubmit.length) {
    log('Nothing to submit — all jobs complete or pending. Use --force to resubmit.')
    return
  }

  log(`Submitting ${toSubmit.length} image jobs to Flux Kontext…`)

  for (const job of toSubmit) {
    const e = state[job.id] ?? blankEntry(job.id, job.label)
    try {
      log(`  → [${job.edition}] ${job.label}`)
      const taskId = await submitImageJob(job.prompt, { aspectRatio: '9:16', outputFormat: 'jpeg' })
      e.taskId      = taskId
      e.status      = 'pending'
      e.submittedAt = new Date().toISOString()
      e.error       = null
      state[job.id] = e
      saveState(OUTPUT_DIR, state)
      log(`     taskId: ${taskId}`)
      await sleep(RATE_LIMIT_MS)
    } catch (error) {
      err(`  ✗ ${job.label} — ${error.message}`)
      e.status      = 'failed'
      e.error       = error.message
      state[job.id] = e
      saveState(OUTPUT_DIR, state)
    }
  }

  log(`\nDone submitting. Run: node scripts/generate-objects-images.js --poll`)
}

// ─── Poll ─────────────────────────────────────────────────────────────────────
async function runPoll() {
  const deadline = Date.now() + POLL_TIMEOUT_MS

  while (Date.now() < deadline) {
    const state   = loadState(OUTPUT_DIR)
    const pending = Object.values(state).filter(isPending)

    if (!pending.length) {
      log('All jobs complete.')
      runList()
      return
    }

    log(`Polling ${pending.length} pending job(s)…`)

    for (const e of pending) {
      try {
        const result = await pollImageJob(e.taskId)
        if (result.done && !result.failed && result.url) {
          const filename = `${e.id}.jpg`
          const destPath = path.join(OUTPUT_DIR, filename)
          log(`  ✓ ${e.label} — downloading…`)
          await downloadFile(result.url, destPath)
          e.status      = 'complete'
          e.remoteUrl   = result.url
          e.localPath   = destPath
          e.publicUrl   = `${PUBLIC_BASE}/${filename}`
          e.completedAt = new Date().toISOString()
        } else if (result.done && result.failed) {
          warn(`  ✗ ${e.label} — generation failed`)
          e.status = 'failed'
          e.error  = 'Kie.ai returned failure flag'
        }
        state[e.id] = e
        saveState(OUTPUT_DIR, state)
        await sleep(800)
      } catch (error) {
        err(`  Poll error for ${e.label}: ${error.message}`)
      }
    }

    const stillPending = Object.values(loadState(OUTPUT_DIR)).filter(isPending)
    if (!stillPending.length) {
      log('All jobs complete.')
      runList()
      return
    }

    log(`  ${stillPending.length} still pending — waiting ${POLL_INTERVAL_MS / 1000}s…\n`)
    await sleep(POLL_INTERVAL_MS)
  }

  warn('Poll timeout reached. Re-run --poll to continue.')
}

// ─── Dry-run ──────────────────────────────────────────────────────────────────
function runDryRun() {
  const jobs = buildJobs()
  const EDITION_LABELS = {
    'life-lessons':  'The Life Lessons Edition',
    'blind-angel':   'The Blind Angel Edition',
    'jazz-sessions': 'Jazz Sessions Edition',
  }

  console.log(`\n🛍   NoiraCiel Objects — image generator (DRY RUN)`)
  console.log(`     ${jobs.length} images · ${PRODUCTS.length} products · 3 shots each · 9:16 portrait\n`)

  let lastEdition = ''
  let filtered = PRODUCTS
  if (PRODUCT_FILTER) filtered = filtered.filter((p) => p.slug.includes(PRODUCT_FILTER))
  if (EDITION_FILTER) filtered = filtered.filter((p) => p.edition.includes(EDITION_FILTER))

  for (const p of filtered) {
    if (p.edition !== lastEdition) {
      console.log(`\n  ── ${EDITION_LABELS[p.edition] ?? p.edition} ──`)
      lastEdition = p.edition
    }
    console.log(`  · ${p.name.padEnd(32)} (${p.type})  →  hero · detail · lifestyle`)
  }

  console.log(`\n  node scripts/generate-objects-images.js --execute              # all 33 images`)
  console.log(`  node scripts/generate-objects-images.js --execute --edition blind-angel`)
  console.log(`  node scripts/generate-objects-images.js --execute --product borrowed-time`)
  console.log(`  node scripts/generate-objects-images.js --poll                  # download results\n`)
}

// ─── Reset ─────────────────────────────────────────────────────────────────────
function runReset() {
  const stateFile = path.join(OUTPUT_DIR, '.state.json')
  if (fs.existsSync(stateFile)) { fs.unlinkSync(stateFile); log('State cleared.') }
  else log('No state file found.')
}

// ─── Entry ────────────────────────────────────────────────────────────────────
async function main() {
  if (RESET_MODE)  { runReset();         return }
  if (LIST_MODE)   { runList();          return }
  if (DRY_RUN)     { runDryRun();        return }
  if (EXEC_MODE)   { await runExecute(); return }
  if (POLL_MODE)   { await runPoll();    return }
}

main().catch((e) => { err(e.message); process.exit(1) })
