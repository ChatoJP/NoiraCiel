#!/usr/bin/env node
/**
 * generate-gallery-art.js
 *
 * Generates 12 large-format gallery art pieces for the NoiraCiel digital museum.
 * Mix of 1:1 and 16:9. Output: public/images/gallery/{id}.jpg
 *
 * USAGE
 *   node scripts/generate-gallery-art.js              # dry-run
 *   node scripts/generate-gallery-art.js --execute    # submit jobs
 *   node scripts/generate-gallery-art.js --poll       # poll + download
 *   node scripts/generate-gallery-art.js --list       # status
 *   node scripts/generate-gallery-art.js --force      # re-generate failed
 *   node scripts/generate-gallery-art.js --piece the-atlantic-at-night
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { buildGalleryArtPrompt, GALLERY_PIECES } = require('./lib/prompts')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR  = path.join(__dirname, '..', 'public', 'Images', 'gallery')
const PUBLIC_BASE = '/images/gallery'
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

const args       = process.argv.slice(2)
const DRY_RUN    = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE  = args.includes('--execute')
const POLL_MODE  = args.includes('--poll')
const LIST_MODE  = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const FORCE      = args.includes('--force')
const PIECE_ARG  = (() => { const i = args.indexOf('--piece'); return i !== -1 ? args[i+1] : null })()

function writeManifest(state) {
  const entries = Object.values(state).filter((e) => (e.status === 'complete' || e.status === 'done') && e.publicUrl)
  const manifest = Object.fromEntries(entries.map((e) => [e.id, e.publicUrl]))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  log(`Manifest: ${entries.length} gallery pieces.`)
}

async function runExecute(pieces) {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set'); process.exit(1) }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const state = loadState(OUTPUT_DIR)
  let submitted = 0

  for (const piece of pieces) {
    const existing = state[piece.id]
    if (!FORCE && isComplete(existing)) { log(`⏭  "${piece.label}" — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  "${piece.label}" — already pending`); continue }

    const prompt = buildGalleryArtPrompt(piece.id)
    process.stdout.write(`  🖼  "${piece.label}" (${piece.aspectRatio}) — submitting… `)
    try {
      const taskId = await submitImageJob(prompt, { aspectRatio: piece.aspectRatio, outputFormat: 'jpeg', model: 'flux-kontext-pro' })
      state[piece.id] = { ...blankEntry(piece.id, piece.label), taskId, status: 'pending', submittedAt: new Date().toISOString() }
      saveState(OUTPUT_DIR, state)
      console.log(`✓ ${taskId}`)
      submitted++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[piece.id] = { ...blankEntry(piece.id, piece.label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }
    if (submitted < pieces.length) await sleep(RATE_LIMIT_MS)
  }
  log(`\n✅  Submitted ${submitted} gallery job(s).`)
}

async function runPoll() {
  const state = loadState(OUTPUT_DIR)
  const pending = Object.values(state).filter((e) => e.taskId && (e.status === 'pending' || e.status === 'generating'))
  if (pending.length === 0) { log('No pending jobs.'); return }
  log(`Polling ${pending.length} job(s)…`)

  const deadline = Date.now() + POLL_TIMEOUT_MS
  const remaining = new Set(pending.map((e) => e.id))

  while (remaining.size > 0 && Date.now() < deadline) {
    for (const id of Array.from(remaining)) {
      const entry = state[id]
      try {
        const result = await pollImageJob(entry.taskId)
        process.stdout.write(`  "${entry.label}" → ${result.done ? (result.failed ? 'failed' : 'success') : 'pending'}  `)
        if (result.done && !result.failed && result.url) {
          const localPath = path.join(OUTPUT_DIR, id + '.jpg')
          process.stdout.write('downloading… ')
          await downloadFile(result.url, localPath)
          state[id] = { ...entry, status: 'complete', remoteUrl: result.url, localPath,
                        publicUrl: `${PUBLIC_BASE}/${id}.jpg`, completedAt: new Date().toISOString() }
          saveState(OUTPUT_DIR, state)
          console.log('✓')
          remaining.delete(id)
        } else if (result.done && result.failed) {
          state[id] = { ...entry, status: 'failed', error: 'Kie.ai returned failed state' }
          saveState(OUTPUT_DIR, state); console.log('✗'); remaining.delete(id)
        } else {
          if (entry.status === 'pending') { state[id] = { ...entry, status: 'generating' }; saveState(OUTPUT_DIR, state) }
          console.log('⏳')
        }
      } catch (e) { console.log(`⚠  ${e.message}`) }
      await sleep(500)
    }
    if (remaining.size > 0) { log(`  ${remaining.size} still generating. Waiting ${POLL_INTERVAL_MS/1000}s…`); await sleep(POLL_INTERVAL_MS) }
  }
  if (remaining.size > 0) warn(`Timed out. ${remaining.size} still pending.`)
  else log('All gallery art complete!')
  writeManifest(state)
}

function runList() {
  const state = loadState(OUTPUT_DIR)
  console.log('\n🖼  Gallery art status:\n')
  for (const p of GALLERY_PIECES) {
    const e = state[p.id]
    const sym = { none:'○', pending:'⏳', generating:'🔄', complete:'✅', done:'✅', failed:'✗' }[e?.status ?? 'none'] ?? '?'
    console.log(`  ${sym}  ${p.id.padEnd(36)} [${e?.status ?? 'none'}]  ${p.aspectRatio}`)
  }
  console.log()
}

function runDryRun(pieces) {
  console.log('\n🖼  DRY RUN — Gallery art prompts\n')
  for (const p of pieces) {
    const prompt = buildGalleryArtPrompt(p.id)
    console.log(`\n▶  "${p.label}" (${p.aspectRatio})\n${prompt.slice(0,200)}…`)
  }
  console.log(`\n📊  ${pieces.length} piece(s) — use --execute to generate.\n`)
}

async function main() {
  if (RESET_MODE) {
    const fp = path.join(OUTPUT_DIR, '.state.json')
    if (fs.existsSync(fp)) { fs.writeFileSync(fp, '{}'); log('Reset.') }
    return
  }
  const all = GALLERY_PIECES
  const pieces = PIECE_ARG ? all.filter(p => p.id === PIECE_ARG) : all
  if (PIECE_ARG && !pieces.length) { err(`Piece "${PIECE_ARG}" not found`); process.exit(1) }
  if (LIST_MODE)  { runList(); return }
  if (POLL_MODE)  { await runPoll(); return }
  if (EXEC_MODE)  { await runExecute(pieces); return }
  runDryRun(pieces)
}

main().catch(e => { err(e.message); process.exit(1) })
