#!/usr/bin/env node
/**
 * generate-song-art.js
 *
 * Generates one cinematic artwork per song via Kie.ai Flux Kontext.
 * Output: public/Images/song-art/{slug}.jpg  (1:1 square)
 *
 * USAGE
 *   node scripts/generate-song-art.js              # dry-run (default)
 *   node scripts/generate-song-art.js --execute    # submit jobs
 *   node scripts/generate-song-art.js --poll       # poll + download
 *   node scripts/generate-song-art.js --list       # status
 *   node scripts/generate-song-art.js --reset      # clear state
 *   node scripts/generate-song-art.js --track 3    # single track
 *   node scripts/generate-song-art.js --force      # re-generate existing
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, slugify, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { buildSongArtPrompt, SONG_CHAPTERS } = require('./lib/prompts')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

// ─── Config ───────────────────────────────────────────────────────────────────
const MUSIC_DIR   = path.join(__dirname, '..', 'Music')
const OUTPUT_DIR  = path.join(__dirname, '..', 'public', 'Images', 'song-art')
const PUBLIC_BASE = '/Images/song-art'
const SUPPORTED   = /\.(wav|mp3|flac|aiff|aif|m4a|ogg)$/i
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

// ─── Args ─────────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2)
const DRY_RUN   = !args.some((a) => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE = args.includes('--execute')
const POLL_MODE = args.includes('--poll')
const LIST_MODE = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const FORCE     = args.includes('--force')
const TRACK_ARG = (() => { const i = args.indexOf('--track'); return i !== -1 ? parseInt(args[i+1],10) : null })()

// ─── Load tracks ──────────────────────────────────────────────────────────────
function loadTracks() {
  if (!fs.existsSync(MUSIC_DIR)) { err(`Music dir not found: ${MUSIC_DIR}`); process.exit(1) }
  const files = fs.readdirSync(MUSIC_DIR).filter((f) => SUPPORTED.test(f)).sort()
  return files.map((filename) => {
    const noExt = filename.replace(SUPPORTED, '')
    const m = noExt.match(/^([a-z]+)_(\d+)\s*-\s*(.+)$/i)
    const trackNumber = m ? parseInt(m[2], 10) : null
    const title = m ? m[3].trim() : noExt.trim()
    return { id: slugify(title), trackNumber, title, filename }
  }).sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999))
}

// ─── --reset ─────────────────────────────────────────────────────────────────
function runReset() {
  const fp = path.join(OUTPUT_DIR, '.state.json')
  if (!fs.existsSync(fp)) { log('Nothing to reset.'); return }
  const count = Object.keys(JSON.parse(fs.readFileSync(fp,'utf-8'))).length
  fs.writeFileSync(fp, JSON.stringify({}, null, 2))
  log(`✓ Reset ${count} entries.`)
}

// ─── --list ───────────────────────────────────────────────────────────────────
function runList(tracks) {
  const state = loadState(OUTPUT_DIR)
  console.log('\n🖼  Song art status:\n')
  for (const t of tracks) {
    const e = state[t.id]
    const sym = { none:'○', pending:'⏳', generating:'🔄', complete:'✅', failed:'✗' }[e?.status ?? 'none'] ?? '?'
    const detail = e?.status === 'complete' ? `→ ${e.publicUrl}` : e?.taskId ? `taskId: ${e.taskId}` : ''
    console.log(`  ${sym}  ${String(t.trackNumber??'?').padStart(2)}. ${t.title.padEnd(42)} [${e?.status ?? 'none'}]  ${detail}`)
  }
  console.log()
}

// ─── --execute ────────────────────────────────────────────────────────────────
async function runExecute(tracks) {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set'); process.exit(1) }
  const state = loadState(OUTPUT_DIR)
  let submitted = 0

  for (const t of tracks) {
    const existing = state[t.id]
    if (!FORCE && isComplete(existing)) { log(`⏭  "${t.title}" — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  "${t.title}" — already pending (${existing.taskId})`); continue }

    const prompt = buildSongArtPrompt(t.trackNumber, t.title)
    process.stdout.write(`  🖼  "${t.title}" — submitting… `)
    try {
      const taskId = await submitImageJob(prompt, { aspectRatio: '1:1', outputFormat: 'jpeg', model: 'flux-kontext-pro' })
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
  log(`\n✅  Submitted ${submitted} image job(s). Run --poll to download.`)
}

// ─── --poll ───────────────────────────────────────────────────────────────────
async function runPoll() {
  const state = loadState(OUTPUT_DIR)
  const pending = Object.values(state).filter((e) => e.taskId && (e.status === 'pending' || e.status === 'generating'))

  if (pending.length === 0) { log('No pending image jobs.'); return }
  log(`Polling ${pending.length} image job(s)…`)

  const deadline = Date.now() + POLL_TIMEOUT_MS
  const remaining = new Set(pending.map((e) => e.id))

  while (remaining.size > 0 && Date.now() < deadline) {
    for (const id of Array.from(remaining)) {
      const entry = state[id]
      try {
        const result = await pollImageJob(entry.taskId)
        process.stdout.write(`  "${entry.label}" → flag: ${result.done ? (result.failed ? 'failed' : 'success') : 'pending'}  `)

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
          state[id] = { ...entry, status: 'failed', error: 'Kie.ai returned failed state' }
          saveState(OUTPUT_DIR, state)
          console.log('✗ failed')
          remaining.delete(id)
        } else {
          if (entry.status === 'pending') { state[id] = { ...entry, status: 'generating' }; saveState(OUTPUT_DIR, state) }
          console.log('⏳')
        }
      } catch (e) {
        console.log(`⚠  ${e.message}`)
      }
      await sleep(500)
    }
    if (remaining.size > 0) {
      log(`  ${remaining.size} still generating. Waiting ${POLL_INTERVAL_MS/1000}s…`)
      await sleep(POLL_INTERVAL_MS)
    }
  }
  if (remaining.size > 0) warn(`Timed out. ${remaining.size} still pending. Run --poll again.`)
  else log('All song art complete!')

  writeManifest(state)
}

// ─── Manifest (public/Images/song-art/manifest.json) ─────────────────────────
function writeManifest(state) {
  const entries = Object.values(state).filter((e) => e.status === 'complete' && e.publicUrl)
  const manifest = Object.fromEntries(entries.map((e) => [e.id, e.publicUrl]))
  const dest = path.join(OUTPUT_DIR, 'manifest.json')
  fs.writeFileSync(dest, JSON.stringify(manifest, null, 2), 'utf-8')
  log(`Manifest written: ${entries.length} completed artworks.`)
}

// ─── Dry run ──────────────────────────────────────────────────────────────────
function runDryRun(tracks) {
  console.log('\n🖼  DRY RUN — Song art prompts\n')
  console.log('─'.repeat(80))
  for (const t of tracks) {
    const prompt = buildSongArtPrompt(t.trackNumber, t.title)
    const ch = SONG_CHAPTERS[t.trackNumber]
    console.log(`\n▶  Track ${t.trackNumber}: "${t.title}"`)
    if (ch) console.log(`   Emotion: ${ch.emotion}`)
    console.log(`\n   PROMPT:\n${prompt.split('\n').map(l=>`   ${l}`).join('\n')}`)
    console.log('\n' + '─'.repeat(80))
  }
  console.log(`\n📊  ${tracks.length} artwork(s) — use --execute to generate.\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
