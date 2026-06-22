#!/usr/bin/env node
/**
 * generate-social-assets.js
 *
 * Generates lyric card backgrounds per song (9:16 portrait) via Kie.ai Flux Kontext.
 * The website overlays lyric text on top of these dark backgrounds.
 * Output: public/images/social/{slug}.jpg
 *
 * USAGE
 *   node scripts/generate-social-assets.js              # dry-run
 *   node scripts/generate-social-assets.js --execute
 *   node scripts/generate-social-assets.js --poll
 *   node scripts/generate-social-assets.js --list
 *   node scripts/generate-social-assets.js --reset
 *   node scripts/generate-social-assets.js --track 3
 *   node scripts/generate-social-assets.js --force
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, slugify, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { buildSocialCardPrompt } = require('./lib/prompts')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

const MUSIC_DIR   = path.join(__dirname, '..', 'Music')
const OUTPUT_DIR  = path.join(__dirname, '..', 'public', 'Images', 'social')
const PUBLIC_BASE = '/images/social'
const SUPPORTED   = /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

const args      = process.argv.slice(2)
const DRY_RUN   = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE = args.includes('--execute')
const POLL_MODE = args.includes('--poll')
const LIST_MODE = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const FORCE     = args.includes('--force')
const TRACK_ARG = (() => { const i = args.indexOf('--track'); return i !== -1 ? parseInt(args[i+1],10) : null })()

function loadTracks() {
  if (!fs.existsSync(MUSIC_DIR)) { err(`Music dir not found: ${MUSIC_DIR}`); process.exit(1) }
  return fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED.test(f)).sort().map((filename) => {
    const noExt = filename.replace(SUPPORTED, '')
    const m = noExt.match(/^([a-z]+)_(\d+)\s*-\s*(.+)$/i)
    const trackNumber = m ? parseInt(m[2], 10) : null
    const title = m ? m[3].trim() : noExt.trim()
    return { id: slugify(title), trackNumber, title }
  }).sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999))
}

function runReset() {
  const fp = path.join(OUTPUT_DIR, '.state.json')
  if (!fs.existsSync(fp)) { log('Nothing to reset.'); return }
  const count = Object.keys(JSON.parse(fs.readFileSync(fp,'utf-8'))).length
  fs.writeFileSync(fp, JSON.stringify({}, null, 2))
  log(`✓ Reset ${count} entries.`)
}

function runList(tracks) {
  const state = loadState(OUTPUT_DIR)
  console.log('\n📱  Social lyric card status:\n')
  for (const t of tracks) {
    const e = state[t.id]
    const sym = { none:'○', pending:'⏳', generating:'🔄', complete:'✅', failed:'✗' }[e?.status ?? 'none'] ?? '?'
    console.log(`  ${sym}  ${String(t.trackNumber??'?').padStart(2)}. ${t.title.padEnd(42)} [${e?.status ?? 'none'}]`)
  }
  console.log()
}

async function runExecute(tracks) {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set'); process.exit(1) }
  const state = loadState(OUTPUT_DIR)
  let submitted = 0

  for (const t of tracks) {
    const existing = state[t.id]
    if (!FORCE && isComplete(existing)) { log(`⏭  "${t.title}" — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  "${t.title}" — already pending`); continue }

    const prompt = buildSocialCardPrompt(t.trackNumber, t.title)
    process.stdout.write(`  📱  "${t.title}" — submitting… `)
    try {
      const taskId = await submitImageJob(prompt, { aspectRatio: '9:16', outputFormat: 'jpeg', model: 'flux-kontext-pro' })
      state[t.id] = { ...blankEntry(t.id, t.title), taskId, status: 'pending', submittedAt: new Date().toISOString() }
      saveState(OUTPUT_DIR, state)
      console.log(`✓ taskId: ${taskId}`)
      submitted++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[t.id] = { ...blankEntry(t.id, t.title), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }
    if (submitted < tracks.length) await sleep(RATE_LIMIT_MS)
  }
  log(`\n✅  Submitted ${submitted} social card job(s). Run --poll to download.`)
}

async function runPoll() {
  const state = loadState(OUTPUT_DIR)
  const pending = Object.values(state).filter((e) => e.taskId && (e.status === 'pending' || e.status === 'generating'))
  if (pending.length === 0) { log('No pending social card jobs.'); return }

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
  else log('All social cards complete!')
  writeManifest(state)
}

function writeManifest(state) {
  const manifest = Object.fromEntries(
    Object.values(state).filter((e) => e.status === 'complete' && e.publicUrl).map((e) => [e.id, e.publicUrl])
  )
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  log(`Manifest written: ${Object.keys(manifest).length} social cards.`)
}

function runDryRun(tracks) {
  console.log('\n📱  DRY RUN — Social lyric card prompts\n')
  console.log('─'.repeat(80))
  for (const t of tracks) {
    const prompt = buildSocialCardPrompt(t.trackNumber, t.title)
    console.log(`\n▶  Track ${t.trackNumber}: "${t.title}"`)
    console.log(`\n   PROMPT:\n${prompt.split('\n').map(l=>`   ${l}`).join('\n')}`)
    console.log('\n' + '─'.repeat(80))
  }
  console.log(`\n📊  ${tracks.length} social card(s) — use --execute to generate.\n`)
}

async function main() {
  if (RESET_MODE) { runReset(); return }
  const all = loadTracks()
  const tracks = TRACK_ARG ? all.filter(t => t.trackNumber === TRACK_ARG) : all
  if (TRACK_ARG && !tracks.length) { err(`Track ${TRACK_ARG} not found`); process.exit(1) }
  if (LIST_MODE)  { runList(tracks); return }
  if (POLL_MODE)  { await runPoll(); return }
  if (EXEC_MODE)  { await runExecute(tracks); return }
  runDryRun(tracks)
}

main().catch(e => { err(e.message); process.exit(1) })
