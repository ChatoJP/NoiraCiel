#!/usr/bin/env node
/**
 * generate-artist-identity.js
 *
 * Generates 4 cinematic artist identity images for NoiraCiel.
 * Used in biography, hero, and press sections.
 * Output: public/Images/artist/{id}.jpg
 *
 * USAGE
 *   node scripts/generate-artist-identity.js              # dry-run
 *   node scripts/generate-artist-identity.js --execute    # submit
 *   node scripts/generate-artist-identity.js --poll       # poll + download
 *   node scripts/generate-artist-identity.js --force      # re-generate failed
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { buildArtistIdentityPrompt, ARTIST_IDENTITY } = require('./lib/prompts')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const OUTPUT_DIR  = path.join(__dirname, '..', 'public', 'Images', 'artist')
const PUBLIC_BASE = '/Images/artist'
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

const args       = process.argv.slice(2)
const EXEC_MODE  = args.includes('--execute')
const POLL_MODE  = args.includes('--poll')
const LIST_MODE  = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const FORCE      = args.includes('--force')

function writeManifest(state) {
  const entries = Object.values(state).filter((e) => (e.status === 'complete' || e.status === 'done') && e.publicUrl)
  const manifest = Object.fromEntries(entries.map((e) => [e.id, e.publicUrl]))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  log(`Manifest: ${entries.length} artist identity images.`)
}

async function runExecute() {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set'); process.exit(1) }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const state = loadState(OUTPUT_DIR)
  let submitted = 0

  for (const img of ARTIST_IDENTITY) {
    const existing = state[img.id]
    if (!FORCE && isComplete(existing)) { log(`⏭  "${img.label}" — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  "${img.label}" — already pending`); continue }

    const prompt = buildArtistIdentityPrompt(img.id)
    process.stdout.write(`  🖼  "${img.label}" (${img.aspectRatio}) — submitting… `)
    try {
      const taskId = await submitImageJob(prompt, { aspectRatio: img.aspectRatio, outputFormat: 'jpeg', model: 'flux-kontext-pro' })
      state[img.id] = { ...blankEntry(img.id, img.label), taskId, status: 'pending', submittedAt: new Date().toISOString() }
      saveState(OUTPUT_DIR, state)
      console.log(`✓ ${taskId}`)
      submitted++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[img.id] = { ...blankEntry(img.id, img.label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }
    if (submitted < ARTIST_IDENTITY.length) await sleep(RATE_LIMIT_MS)
  }
  log(`\n✅  Submitted ${submitted} artist identity job(s).`)
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
  else log('All artist identity images complete!')
  writeManifest(state)
}

async function main() {
  if (RESET_MODE) {
    const fp = path.join(OUTPUT_DIR, '.state.json')
    if (fs.existsSync(fp)) { fs.writeFileSync(fp, '{}'); log('Reset.') }
    return
  }
  if (LIST_MODE) {
    const state = loadState(OUTPUT_DIR)
    for (const img of ARTIST_IDENTITY) {
      const e = state[img.id]
      const sym = { none:'○', pending:'⏳', generating:'🔄', complete:'✅', done:'✅', failed:'✗' }[e?.status ?? 'none'] ?? '?'
      console.log(`  ${sym}  ${img.id.padEnd(36)} [${e?.status ?? 'none'}]`)
    }
    return
  }
  if (POLL_MODE)  { await runPoll(); return }
  if (EXEC_MODE)  { await runExecute(); return }

  // dry run
  console.log('\n🖼  DRY RUN — Artist identity prompts\n')
  for (const img of ARTIST_IDENTITY) {
    console.log(`\n▶  "${img.label}" (${img.aspectRatio})`)
    console.log(buildArtistIdentityPrompt(img.id).slice(0,200) + '…')
  }
  console.log(`\n📊  ${ARTIST_IDENTITY.length} image(s) — use --execute to generate.\n`)
}

main().catch(e => { err(e.message); process.exit(1) })
