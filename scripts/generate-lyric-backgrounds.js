#!/usr/bin/env node
/**
 * generate-lyric-backgrounds.js
 *
 * Generates 6 ultra-dark atmospheric backgrounds for lyric cards (Instagram etc.)
 * Each is 1:1 square, 80-90% dark, designed to have text overlaid.
 * Output: public/Images/lyric-backgrounds/{id}.jpg
 *
 * USAGE
 *   node scripts/generate-lyric-backgrounds.js            # dry-run
 *   node scripts/generate-lyric-backgrounds.js --execute  # submit jobs
 *   node scripts/generate-lyric-backgrounds.js --poll     # poll + download
 *   node scripts/generate-lyric-backgrounds.js --list     # status
 *   node scripts/generate-lyric-backgrounds.js --force    # re-generate
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { buildLyricBackgroundPrompt, LYRIC_BACKGROUNDS } = require('./lib/prompts')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR  = path.join(__dirname, '..', 'public', 'Images', 'lyric-backgrounds')
const PUBLIC_BASE = '/Images/lyric-backgrounds'
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

const args      = process.argv.slice(2)
const DRY_RUN   = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE = args.includes('--execute')
const POLL_MODE = args.includes('--poll')
const LIST_MODE = args.includes('--list')
const FORCE     = args.includes('--force')

function writeManifest(state) {
  const entries = Object.values(state).filter((e) => (e.status === 'complete' || e.status === 'done') && e.publicUrl)
  const manifest = Object.fromEntries(entries.map((e) => [e.id, e.publicUrl]))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  log(`Manifest: ${entries.length} lyric backgrounds.`)
}

async function runExecute() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const state = loadState(OUTPUT_DIR)

  const toSubmit = LYRIC_BACKGROUNDS.filter((bg) => {
    const entry = state[bg.id]
    if (FORCE) return true
    return !entry || !isComplete(entry)
  })

  if (DRY_RUN) {
    log(`[DRY RUN] Would submit ${LYRIC_BACKGROUNDS.length} lyric background(s).\nPass --execute to submit.\n`)
    LYRIC_BACKGROUNDS.forEach((bg) => log(`  🌑  "${bg.label}"`))
    return
  }

  if (!toSubmit.length) { log('All lyric backgrounds already generated.'); return }

  log(`Submitting ${toSubmit.length} lyric background job(s)…\n`)

  for (const bg of toSubmit) {
    process.stdout.write(`  🌑  "${bg.label}" — submitting… `)
    try {
      const prompt = buildLyricBackgroundPrompt(bg.id)
      const taskId = await submitImageJob(prompt, '1:1')
      state[bg.id] = { ...blankEntry(bg.id, bg.label), taskId, status: 'pending' }
      saveState(OUTPUT_DIR, state)
      console.log(`✓ taskId: ${taskId}`)
      await sleep(RATE_LIMIT_MS)
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[bg.id] = { ...blankEntry(bg.id, bg.label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }
  }

  log(`\n✅  Submitted ${toSubmit.length} lyric background job(s). Run --poll to download.`)
}

async function runPoll() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const state = loadState(OUTPUT_DIR)
  const pending = Object.values(state).filter(isPending)

  if (!pending.length) { log('No pending lyric backgrounds to poll.'); return }
  log(`Polling ${pending.length} job(s)…`)

  const deadline = Date.now() + POLL_TIMEOUT_MS
  let remaining = [...pending]

  while (remaining.length > 0 && Date.now() < deadline) {
    const next = []
    for (const entry of remaining) {
      const result = await pollImageJob(entry.taskId)
      if (result.done) {
        if (result.url) {
          const dest = path.join(OUTPUT_DIR, `${entry.id}.jpg`)
          await downloadFile(result.url, dest)
          state[entry.id] = { ...entry, status: 'done', localPath: dest, publicUrl: `${PUBLIC_BASE}/${entry.id}.jpg` }
          saveState(OUTPUT_DIR, state)
          writeManifest(state)
          console.log(`  "${entry.label}" → ✓`)
        } else {
          state[entry.id] = { ...entry, status: 'failed' }
          saveState(OUTPUT_DIR, state)
          console.log(`  "${entry.label}" → ✗ no URL`)
        }
      } else {
        next.push(entry)
      }
    }
    remaining = next
    if (remaining.length > 0) {
      process.stdout.write(`  … ${remaining.length} still generating, waiting ${POLL_INTERVAL_MS / 1000}s\r`)
      await sleep(POLL_INTERVAL_MS)
    }
  }

  const done = Object.values(state).filter((e) => e.status === 'done' || e.status === 'complete').length
  log(`\nAll lyric backgrounds complete!\nManifest: ${done} images.`)
}

function runList() {
  const state = loadState(OUTPUT_DIR)
  console.log('\n🌑  Lyric background status:\n')
  for (const bg of LYRIC_BACKGROUNDS) {
    const entry = state[bg.id]
    const sym = !entry ? '○' : entry.status === 'done' || entry.status === 'complete' ? '✅' : entry.status === 'pending' ? '⏳' : '✗'
    console.log(`  ${sym}  ${bg.label}`)
  }
  console.log()
}

if (LIST_MODE)      runList()
else if (POLL_MODE) runPoll().catch((e) => { err(e.message); process.exit(1) })
else                runExecute().catch((e) => { err(e.message); process.exit(1) })
