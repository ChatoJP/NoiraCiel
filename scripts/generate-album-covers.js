#!/usr/bin/env node
/**
 * generate-album-covers.js
 *
 * Generates cover art for NoiraCiel sub-albums that don't yet have artwork.
 * Each album gets one 1:1 cinematic cover image via Kie.ai Flux Kontext.
 *
 * Output: public/images/album-covers/{slug}.jpg
 * After successful download, automatically patches coverSrc in musicScanner.ts.
 *
 * USAGE
 *   node scripts/generate-album-covers.js              # dry-run (see prompts)
 *   node scripts/generate-album-covers.js --execute    # submit jobs to Kie.ai
 *   node scripts/generate-album-covers.js --poll       # poll + download + patch source
 *   node scripts/generate-album-covers.js --list       # show current status
 *   node scripts/generate-album-covers.js --reset      # clear state
 *   node scripts/generate-album-covers.js --force      # re-generate existing
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const { loadEnv, log, warn, err, sleep, downloadFile,
        submitImageJob, pollImageJob, RATE_LIMIT_MS } = require('./lib/kie-client')
const { loadState, saveState, isComplete, isPending, blankEntry } = require('./lib/asset-tracker')

loadEnv()

// ─── Config ───────────────────────────────────────────────────────────────────
const OUTPUT_DIR       = path.join(__dirname, '..', 'public', 'Images', 'album-covers')
const PUBLIC_BASE      = '/images/album-covers'
const SCANNER_PATH     = path.join(__dirname, '..', 'src', 'lib', 'musicScanner.ts')
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS  = 20 * 60 * 1000

// ─── Args ─────────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2)
const DRY_RUN    = !args.some(a => ['--execute','--poll','--list','--reset'].includes(a))
const EXEC_MODE  = args.includes('--execute')
const POLL_MODE  = args.includes('--poll')
const LIST_MODE  = args.includes('--list')
const RESET_MODE = args.includes('--reset')
const FORCE      = args.includes('--force')

// ─── Album definitions ────────────────────────────────────────────────────────
// To add a new album cover, add an entry here. slug must match DISCOGRAPHY in musicScanner.ts.
const ALBUMS = [
  {
    id:    'jazz-sessions',
    label: 'NoiraCiel Jazz Sessions',
    prompt: `
Album cover art for an intimate late-night jazz recording session.
A solitary upright bass leaning against a fog-lit stone wall in a small harbour-side room.
One candle burning at the base of the bass, amber light pooling across worn plaster.
A trumpet rests on a battered wooden table, half-submerged in shadow.
The single window behind reveals the Atlantic at night — dark water, faint horizon light.
The room breathes jazz: the air is thick with candlesmoke and salt.
Square composition. 16mm film grain, deep navy and warm amber palette, painterly textures,
European art cinema quality. No text. No human faces. No neon. No logos.
Mood: intimate, contemplative, after midnight.
    `.trim(),
  },
  {
    id:    'blind-angel',
    label: 'The Blind Angel — Intimate Metal Sessions',
    prompt: `
Album cover art for an intimate metal recording — raw, stripped-back, heavy but quiet.
A stone angel statue in an ancient chapel, one wing broken and collapsed on the flagstone floor.
The angel's face is turned away, not visible. A single narrow beam of cold light from a high
arched window cuts across the figure, catching dust motes in the air.
The stonework is cracked and ancient. No congregation, no candles — just the statue and the light.
The atmosphere is heavy, still, sacred without comfort.
Square composition. 16mm film grain, near-black shadows, cold pale silver and bone white,
touches of deep charcoal. Painterly, slow, cinematic. No text. No faces. No neon.
Mood: weight, silence, broken grace.
    `.trim(),
  },
]

// ─── --reset ──────────────────────────────────────────────────────────────────
function runReset() {
  const fp = path.join(OUTPUT_DIR, '.state.json')
  if (!fs.existsSync(fp)) { log('Nothing to reset.'); return }
  const count = Object.keys(JSON.parse(fs.readFileSync(fp, 'utf-8'))).length
  fs.writeFileSync(fp, JSON.stringify({}, null, 2))
  log(`✓ Reset ${count} entries.`)
}

// ─── --list ───────────────────────────────────────────────────────────────────
function runList() {
  const state = loadState(OUTPUT_DIR)
  console.log('\n🎨  Album cover status:\n')
  for (const album of ALBUMS) {
    const e = state[album.id]
    const sym = { none:'○', pending:'⏳', generating:'🔄', complete:'✅', failed:'✗' }[e?.status ?? 'none'] ?? '?'
    const detail = e?.status === 'complete' ? `→ ${e.publicUrl}` : e?.taskId ? `taskId: ${e.taskId}` : ''
    console.log(`  ${sym}  ${album.label.padEnd(50)} [${e?.status ?? 'none'}]  ${detail}`)
  }
  console.log()
}

// ─── --execute ────────────────────────────────────────────────────────────────
async function runExecute() {
  if (!process.env.KIE_API_KEY) { err('KIE_API_KEY not set — check .env.local'); process.exit(1) }

  const state = loadState(OUTPUT_DIR)
  let submitted = 0

  for (const album of ALBUMS) {
    const existing = state[album.id]
    if (!FORCE && isComplete(existing)) { log(`⏭  "${album.label}" — already complete`); continue }
    if (!FORCE && isPending(existing))  { log(`⏭  "${album.label}" — already pending (${existing.taskId})`); continue }

    process.stdout.write(`  🎨  "${album.label}" — submitting… `)
    try {
      const taskId = await submitImageJob(album.prompt, {
        aspectRatio:  '1:1',
        outputFormat: 'jpeg',
        model:        'flux-kontext-pro',
      })
      state[album.id] = {
        ...blankEntry(album.id, album.label),
        taskId,
        status:      'pending',
        submittedAt: new Date().toISOString(),
      }
      saveState(OUTPUT_DIR, state)
      console.log(`✓ taskId: ${taskId}`)
      submitted++
    } catch (e) {
      console.log(`✗ ${e.message}`)
      state[album.id] = { ...blankEntry(album.id, album.label), status: 'failed', error: e.message }
      saveState(OUTPUT_DIR, state)
    }

    if (submitted < ALBUMS.length) await sleep(RATE_LIMIT_MS)
  }

  log(`\n✅  Submitted ${submitted} job(s). Run --poll to download results.`)
}

// ─── --poll ───────────────────────────────────────────────────────────────────
async function runPoll() {
  const state = loadState(OUTPUT_DIR)
  const pending = Object.values(state).filter(e => e.taskId && (e.status === 'pending' || e.status === 'generating'))

  if (pending.length === 0) { log('No pending jobs.'); return }
  log(`Polling ${pending.length} job(s)…`)

  const deadline  = Date.now() + POLL_TIMEOUT_MS
  const remaining = new Set(pending.map(e => e.id))

  while (remaining.size > 0 && Date.now() < deadline) {
    for (const id of Array.from(remaining)) {
      const entry = state[id]
      try {
        const result = await pollImageJob(entry.taskId)
        process.stdout.write(`  "${entry.label}" → `)

        if (result.done && !result.failed && result.url) {
          const filename  = `${id}.jpg`
          const localPath = path.join(OUTPUT_DIR, filename)
          process.stdout.write('downloading… ')
          await downloadFile(result.url, localPath)
          state[id] = {
            ...entry,
            status:      'complete',
            remoteUrl:   result.url,
            localPath,
            publicUrl:   `${PUBLIC_BASE}/${filename}`,
            completedAt: new Date().toISOString(),
          }
          saveState(OUTPUT_DIR, state)
          console.log(`✓ saved to ${PUBLIC_BASE}/${filename}`)
          remaining.delete(id)
          patchScanner(id, `${PUBLIC_BASE}/${filename}`)
        } else if (result.done && result.failed) {
          state[id] = { ...entry, status: 'failed', error: 'Kie.ai returned failed state' }
          saveState(OUTPUT_DIR, state)
          console.log('✗ failed')
          remaining.delete(id)
        } else {
          if (entry.status === 'pending') {
            state[id] = { ...entry, status: 'generating' }
            saveState(OUTPUT_DIR, state)
          }
          console.log('⏳ generating…')
        }
      } catch (e) {
        console.log(`⚠  ${e.message}`)
      }
      await sleep(500)
    }

    if (remaining.size > 0) {
      log(`  ${remaining.size} still generating — waiting ${POLL_INTERVAL_MS / 1000}s…`)
      await sleep(POLL_INTERVAL_MS)
    }
  }

  if (remaining.size > 0) warn(`Timed out. ${remaining.size} still pending — run --poll again.`)
  else log('All album covers complete!')
}

// ─── Patch musicScanner.ts ────────────────────────────────────────────────────
// Updates the coverSrc field for the given album slug in the DISCOGRAPHY array.
function patchScanner(slug, publicUrl) {
  if (!fs.existsSync(SCANNER_PATH)) { warn('musicScanner.ts not found — skipping source patch'); return }

  let src = fs.readFileSync(SCANNER_PATH, 'utf-8')

  // Pattern: coverSrc: null, inside the block that also contains href: '/music/{slug}'
  // We match the href line + coverSrc: null together to be specific enough.
  const slugEscape = slug.replace(/-/g, '\\-')
  const hrefPattern = `/music/${slug}`

  // Find the DISCOGRAPHY entry for this slug and replace coverSrc: null
  // Strategy: find 'href:.*{hrefPattern}' then find the following 'coverSrc:   null,' within ~5 lines
  const lines = src.split('\n')
  let patched = false

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`href:`) && lines[i].includes(hrefPattern)) {
      // Scan forward up to 6 lines for coverSrc: null
      for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
        if (lines[j].includes('coverSrc:') && lines[j].includes('null')) {
          lines[j] = lines[j].replace('null', `'${publicUrl}'`)
          patched = true
          break
        }
      }
      if (patched) break
    }
  }

  if (patched) {
    fs.writeFileSync(SCANNER_PATH, lines.join('\n'), 'utf-8')
    log(`✓ Patched musicScanner.ts: ${slug} coverSrc → ${publicUrl}`)
  } else {
    warn(`Could not auto-patch musicScanner.ts for "${slug}" — set coverSrc manually to '${publicUrl}'`)
  }
}

// ─── Dry run ──────────────────────────────────────────────────────────────────
function runDryRun() {
  console.log('\n🎨  DRY RUN — Album cover prompts\n')
  console.log('─'.repeat(80))
  for (const album of ALBUMS) {
    console.log(`\n▶  ${album.label}  (id: ${album.id})\n`)
    console.log(album.prompt.split('\n').map(l => `   ${l}`).join('\n'))
    console.log(`\n   Output: ${PUBLIC_BASE}/${album.id}.jpg`)
    console.log('\n' + '─'.repeat(80))
  }
  console.log(`\n📊  ${ALBUMS.length} album cover(s) — use --execute to generate.\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (RESET_MODE) { runReset(); return }
  if (LIST_MODE)  { runList();  return }
  if (POLL_MODE)  { await runPoll();    return }
  if (EXEC_MODE)  { await runExecute(); return }
  runDryRun()
}

main().catch(e => { err(e.message); process.exit(1) })
