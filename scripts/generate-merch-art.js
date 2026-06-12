#!/usr/bin/env node
/**
 * generate-merch-art.js
 *
 * Generates t-shirt / merchandise art concepts via Kie.ai Flux Kontext.
 * Output: public/Images/merch/{concept-id}.jpg  (1:1)
 *
 * USAGE
 *   node scripts/generate-merch-art.js              # dry-run
 *   node scripts/generate-merch-art.js --execute
 *   node scripts/generate-merch-art.js --poll
 *   node scripts/generate-merch-art.js --list
 *   node scripts/generate-merch-art.js --reset
 *   node scripts/generate-merch-art.js --concept atlantic-noir-wordmark
 *   node scripts/generate-merch-art.js --force
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { buildMerchPrompt, MERCH_CONCEPTS } = require('./lib/prompts')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR  = path.join(__dirname, '..', 'public', 'Images', 'merch')
const PUBLIC_BASE = '/Images/merch'
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

const args       = process.argv.slice(2)
const DRY_RUN    = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE  = args.includes('--execute')
const POLL_MODE  = args.includes('--poll')
const LIST_MODE  = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const FORCE      = args.includes('--force')
const CONCEPT_ARG = (() => { const i = args.indexOf('--concept'); return i !== -1 ? args[i+1] : null })()

function runReset() {
  const fp = path.join(OUTPUT_DIR, '.state.json')
  if (!fs.existsSync(fp)) { log('Nothing to reset.'); return }
  const count = Object.keys(JSON.parse(fs.readFileSync(fp,'utf-8'))).length
  fs.writeFileSync(fp, JSON.stringify({}, null, 2))
  log(`✓ Reset ${count} entries.`)
}

function runList() {
  const state = loadState(OUTPUT_DIR)
  console.log('\n👕  Merch art status:\n')
  for (const c of MERCH_CONCEPTS) {
    const e = state[c.id]
    const sym = { none:'○', pending:'⏳', generating:'🔄', complete:'✅', failed:'✗' }[e?.status ?? 'none'] ?? '?'
    console.log(`  ${sym}  ${c.id.padEnd(30)} "${c.label}"  [${e?.status ?? 'none'}]`)
  }
  console.log()
}

async function runExecute(concepts) {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set'); process.exit(1) }
  const state = loadState(OUTPUT_DIR)
  let submitted = 0

  for (const c of concepts) {
    const existing = state[c.id]
    if (!FORCE && isComplete(existing)) { log(`⏭  "${c.label}" — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  "${c.label}" — already pending`); continue }

    const prompt = buildMerchPrompt(c.id)
    process.stdout.write(`  👕  "${c.label}" — submitting… `)
    try {
      const taskId = await submitImageJob(prompt, { aspectRatio: '1:1', outputFormat: 'jpeg', model: 'flux-kontext-pro' })
      state[c.id] = { ...blankEntry(c.id, c.label), taskId, status: 'pending', submittedAt: new Date().toISOString() }
      saveState(OUTPUT_DIR, state)
      console.log(`✓ taskId: ${taskId}`)
      submitted++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[c.id] = { ...blankEntry(c.id, c.label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }
    if (submitted < concepts.length) await sleep(RATE_LIMIT_MS)
  }
  log(`\n✅  Submitted ${submitted} merch job(s). Run --poll to download.`)
}

async function runPoll() {
  const state = loadState(OUTPUT_DIR)
  const pending = Object.values(state).filter((e) => e.taskId && (e.status === 'pending' || e.status === 'generating'))
  if (pending.length === 0) { log('No pending merch jobs.'); return }

  const deadline = Date.now() + POLL_TIMEOUT_MS
  const remaining = new Set(pending.map((e) => e.id))

  while (remaining.size > 0 && Date.now() < deadline) {
    for (const id of Array.from(remaining)) {
      const entry = state[id]
      try {
        const result = await pollImageJob(entry.taskId)
        process.stdout.write(`  "${entry.label}" → ${result.done ? (result.failed ? 'failed' : 'success') : 'pending'}  `)
        if (result.done && !result.failed && result.url) {
          const filename = `${id}.jpg`
          const localPath = path.join(OUTPUT_DIR, filename)
          process.stdout.write('downloading… ')
          await downloadFile(result.url, localPath)
          state[id] = { ...entry, status: 'complete', remoteUrl: result.url, localPath,
                        publicUrl: `${PUBLIC_BASE}/${filename}`, completedAt: new Date().toISOString() }
          saveState(OUTPUT_DIR, state)
          console.log('✓')
          remaining.delete(id)
        } else if (result.done && result.failed) {
          state[id] = { ...entry, status: 'failed', error: 'Kie.ai returned failed' }
          saveState(OUTPUT_DIR, state)
          console.log('✗')
          remaining.delete(id)
        } else {
          if (entry.status === 'pending') { state[id] = { ...entry, status: 'generating' }; saveState(OUTPUT_DIR, state) }
          console.log('⏳')
        }
      } catch (e) { console.log(`⚠  ${e.message}`) }
      await sleep(500)
    }
    if (remaining.size > 0) { log(`  ${remaining.size} still generating. Waiting ${POLL_INTERVAL_MS/1000}s…`); await sleep(POLL_INTERVAL_MS) }
  }
  if (remaining.size > 0) warn(`Timed out. Run --poll again.`)
  else log('All merch art complete!')
  writeManifest(state)
}

function writeManifest(state) {
  const entries = Object.values(state).filter((e) => e.status === 'complete' && e.publicUrl)
  const manifest = entries.map((e) => ({ id: e.id, label: e.label, url: e.publicUrl }))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  log(`Manifest written: ${entries.length} merch concepts.`)
}

function runDryRun(concepts) {
  console.log('\n👕  DRY RUN — Merch art prompts\n')
  console.log('─'.repeat(80))
  for (const c of concepts) {
    const prompt = buildMerchPrompt(c.id)
    console.log(`\n▶  "${c.label}" (${c.id})`)
    console.log(`\n   PROMPT:\n${prompt.split('\n').map(l=>`   ${l}`).join('\n')}`)
    console.log('\n' + '─'.repeat(80))
  }
  console.log(`\n📊  ${concepts.length} merch concept(s) — use --execute to generate.\n`)
}

async function main() {
  if (RESET_MODE) { runReset(); return }
  const concepts = CONCEPT_ARG ? MERCH_CONCEPTS.filter(c => c.id === CONCEPT_ARG) : MERCH_CONCEPTS
  if (CONCEPT_ARG && !concepts.length) { err(`Concept "${CONCEPT_ARG}" not found`); process.exit(1) }
  if (LIST_MODE)  { runList(); return }
  if (POLL_MODE)  { await runPoll(); return }
  if (EXEC_MODE)  { await runExecute(concepts); return }
  runDryRun(concepts)
}

main().catch(e => { err(e.message); process.exit(1) })
