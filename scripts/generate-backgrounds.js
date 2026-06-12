#!/usr/bin/env node
/**
 * generate-backgrounds.js
 *
 * Generates cinematic background images for website sections via Kie.ai Flux Kontext.
 * Output: public/Images/backgrounds/{variant}.jpg  (16:9)
 *
 * USAGE
 *   node scripts/generate-backgrounds.js              # dry-run
 *   node scripts/generate-backgrounds.js --execute
 *   node scripts/generate-backgrounds.js --poll
 *   node scripts/generate-backgrounds.js --list
 *   node scripts/generate-backgrounds.js --reset
 *   node scripts/generate-backgrounds.js --force
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { buildBackgroundPrompt, BACKGROUND_THEMES } = require('./lib/prompts')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR  = path.join(__dirname, '..', 'public', 'Images', 'backgrounds')
const PUBLIC_BASE = '/Images/backgrounds'
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

const args      = process.argv.slice(2)
const DRY_RUN   = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE = args.includes('--execute')
const POLL_MODE = args.includes('--poll')
const LIST_MODE = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const FORCE     = args.includes('--force')

const VARIANTS = Object.keys(BACKGROUND_THEMES)

function runReset() {
  const fp = path.join(OUTPUT_DIR, '.state.json')
  if (!fs.existsSync(fp)) { log('Nothing to reset.'); return }
  const count = Object.keys(JSON.parse(fs.readFileSync(fp,'utf-8'))).length
  fs.writeFileSync(fp, JSON.stringify({}, null, 2))
  log(`✓ Reset ${count} entries.`)
}

function runList() {
  const state = loadState(OUTPUT_DIR)
  console.log('\n🌄  Background image status:\n')
  for (const v of VARIANTS) {
    const e = state[v]
    const theme = BACKGROUND_THEMES[v]
    const sym = { none:'○', pending:'⏳', generating:'🔄', complete:'✅', failed:'✗' }[e?.status ?? 'none'] ?? '?'
    console.log(`  ${sym}  ${v.padEnd(14)} ${theme.label.padEnd(40)} [${e?.status ?? 'none'}]`)
  }
  console.log()
}

async function runExecute() {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set'); process.exit(1) }
  const state = loadState(OUTPUT_DIR)
  let submitted = 0

  for (const variant of VARIANTS) {
    const existing = state[variant]
    if (!FORCE && isComplete(existing)) { log(`⏭  "${variant}" — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  "${variant}" — already pending`); continue }

    const prompt = buildBackgroundPrompt(variant)
    process.stdout.write(`  🌄  "${variant}" — submitting… `)
    try {
      const taskId = await submitImageJob(prompt, { aspectRatio: '16:9', outputFormat: 'jpeg', model: 'flux-kontext-pro' })
      state[variant] = { ...blankEntry(variant, BACKGROUND_THEMES[variant].label), taskId, status: 'pending', submittedAt: new Date().toISOString() }
      saveState(OUTPUT_DIR, state)
      console.log(`✓ taskId: ${taskId}`)
      submitted++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[variant] = { ...blankEntry(variant, BACKGROUND_THEMES[variant].label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }
    if (submitted < VARIANTS.length) await sleep(RATE_LIMIT_MS)
  }
  log(`\n✅  Submitted ${submitted} background job(s). Run --poll to download.`)
}

async function runPoll() {
  const state = loadState(OUTPUT_DIR)
  const pending = Object.values(state).filter((e) => e.taskId && (e.status === 'pending' || e.status === 'generating'))
  if (pending.length === 0) { log('No pending background jobs.'); return }

  const deadline = Date.now() + POLL_TIMEOUT_MS
  const remaining = new Set(pending.map((e) => e.id))

  while (remaining.size > 0 && Date.now() < deadline) {
    for (const id of Array.from(remaining)) {
      const entry = state[id]
      try {
        const result = await pollImageJob(entry.taskId)
        process.stdout.write(`  "${id}" → ${result.done ? (result.failed ? 'failed' : 'success') : 'pending'}  `)
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
  else log('All backgrounds complete!')

  writeManifest(state)
}

function writeManifest(state) {
  const manifest = Object.fromEntries(
    Object.values(state).filter((e) => e.status === 'complete' && e.publicUrl).map((e) => [e.id, e.publicUrl])
  )
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  log(`Manifest written: ${Object.keys(manifest).length} backgrounds.`)
}

function runDryRun() {
  console.log('\n🌄  DRY RUN — Background prompts\n')
  console.log('─'.repeat(80))
  for (const v of VARIANTS) {
    const prompt = buildBackgroundPrompt(v)
    const theme = BACKGROUND_THEMES[v]
    console.log(`\n▶  ${v} — "${theme.label}"`)
    console.log(`\n   PROMPT:\n${prompt.split('\n').map(l=>`   ${l}`).join('\n')}`)
    console.log('\n' + '─'.repeat(80))
  }
  console.log(`\n📊  ${VARIANTS.length} backgrounds — use --execute to generate.\n`)
}

async function main() {
  if (RESET_MODE) { runReset(); return }
  if (LIST_MODE)  { runList(); return }
  if (POLL_MODE)  { await runPoll(); return }
  if (EXEC_MODE)  { await runExecute(); return }
  runDryRun()
}

main().catch(e => { err(e.message); process.exit(1) })
