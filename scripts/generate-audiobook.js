#!/usr/bin/env node
/**
 * generate-audiobook.js
 * Generates narrated MP3 audio book files for each main-album song story
 * using ElevenLabs TTS via KIE.AI.
 *
 * Usage:
 *   node scripts/generate-audiobook.js --execute        # submit all pending jobs
 *   node scripts/generate-audiobook.js --poll           # download completed jobs
 *   node scripts/generate-audiobook.js --track why      # single track by slug
 *   node scripts/generate-audiobook.js --execute --track why
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const {
  loadEnv, log, warn, err, sleep,
  submitTTSJob, pollTTSJob, downloadFile,
  RATE_LIMIT_MS,
} = require('./lib/kie-client')

loadEnv()

// ─── Config ──────────────────────────────────────────────────────────────────
const STORIES_DIR  = path.join(__dirname, '..', 'content', 'stories')
const OUTPUT_DIR   = path.join(__dirname, '..', 'public', 'Audio', 'audiobook')
const STATE_FILE   = path.join(__dirname, '..', '.audiobook-state.json')
const POLL_INTERVAL_MS = 12_000
const MAX_POLL_ATTEMPTS = 60

// Narrator voice — Bella: Professional, Bright, Warm (ElevenLabs via KIE.AI)
const VOICE = 'hpp4J3VqNfWAUOO0d1Us'

// ─── State helpers ────────────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch { return {} }
}
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

// ─── Story text extraction ────────────────────────────────────────────────────
function extractNarrationText(markdown) {
  return markdown
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      if (!t) return false
      if (t.startsWith('#')) return false   // headings → skip
      if (t === '---') return false          // dividers → skip
      return true
    })
    .map((line) => {
      // Strip markdown italic markers but keep the text
      return line.replace(/^\*|\*$/g, '').trim()
    })
    .filter(Boolean)
    .join(' ')
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submitStories(slugFilter) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const storyFiles = fs.readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !slugFilter || f === `${slugFilter}.md`)

  if (storyFiles.length === 0) {
    err(slugFilter ? `No story file found for slug: ${slugFilter}` : 'No story files found in content/stories/')
    process.exit(1)
  }

  const state = loadState()
  let submitted = 0

  for (const file of storyFiles) {
    const slug = file.replace('.md', '')
    const outFile = path.join(OUTPUT_DIR, `${slug}.mp3`)

    if (fs.existsSync(outFile)) {
      log(`⏭  ${slug} — already downloaded, skipping`)
      continue
    }
    if (state[slug]?.taskId && !state[slug]?.failed) {
      log(`⏭  ${slug} — task ${state[slug].taskId} already submitted`)
      continue
    }

    const markdown = fs.readFileSync(path.join(STORIES_DIR, file), 'utf-8')
    const text = extractNarrationText(markdown)

    log(`📤 Submitting TTS for: ${slug} (${text.length} chars)`)
    try {
      const taskId = await submitTTSJob(text, { voice: VOICE })
      state[slug] = { taskId, slug, submitted: new Date().toISOString(), failed: false }
      saveState(state)
      log(`✅ ${slug} → taskId: ${taskId}`)
      submitted++
      if (submitted < storyFiles.length) await sleep(RATE_LIMIT_MS)
    } catch (e) {
      err(`Failed to submit ${slug}: ${e.message}`)
      state[slug] = { slug, failed: true, error: e.message }
      saveState(state)
    }
  }

  log(`\n📋 Submitted ${submitted} new TTS jobs. Run --poll to download results.`)
}

// ─── Poll ─────────────────────────────────────────────────────────────────────
async function pollStories(slugFilter) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  const state = loadState()

  const pending = Object.values(state).filter((s) => {
    if (!s.taskId || s.failed) return false
    if (slugFilter && s.slug !== slugFilter) return false
    const outFile = path.join(OUTPUT_DIR, `${s.slug}.mp3`)
    return !fs.existsSync(outFile)
  })

  if (pending.length === 0) {
    log('Nothing to poll — all done or no jobs submitted yet.')
    return
  }

  log(`🔄 Polling ${pending.length} TTS job(s)…\n`)

  for (const job of pending) {
    log(`⏳ Polling ${job.slug} (${job.taskId})`)
    let done = false

    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
      await sleep(POLL_INTERVAL_MS)
      try {
        const result = await pollTTSJob(job.taskId)
        if (result.done && result.url) {
          const outFile = path.join(OUTPUT_DIR, `${job.slug}.mp3`)
          log(`   ⬇  Downloading audio → ${path.relative(process.cwd(), outFile)}`)
          await downloadFile(result.url, outFile)
          log(`   ✅ ${job.slug} done`)
          done = true
          break
        }
        if (result.done && result.failed) {
          warn(`   ✗  ${job.slug} — TTS generation failed`)
          state[job.slug].failed = true
          saveState(state)
          done = true
          break
        }
        log(`   … attempt ${attempt}/${MAX_POLL_ATTEMPTS} — still generating`)
      } catch (e) {
        warn(`   Poll error for ${job.slug}: ${e.message}`)
      }
    }

    if (!done) {
      warn(`${job.slug} — timed out after ${MAX_POLL_ATTEMPTS} attempts`)
    }
  }

  const downloaded = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.mp3')).length
  log(`\n✅ Done — ${downloaded} audio book file(s) in public/Audio/audiobook/`)
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const doExecute = args.includes('--execute')
const doPoll    = args.includes('--poll')
const trackIdx  = args.indexOf('--track')
const slugFilter = trackIdx !== -1 ? args[trackIdx + 1] : null

if (!doExecute && !doPoll) {
  console.log(`
Usage:
  node scripts/generate-audiobook.js --execute          # submit TTS for all stories
  node scripts/generate-audiobook.js --poll             # download completed audio
  node scripts/generate-audiobook.js --execute --track <slug>
  node scripts/generate-audiobook.js --poll    --track <slug>
`)
  process.exit(0)
}

;(async () => {
  if (doExecute) await submitStories(slugFilter)
  if (doPoll)    await pollStories(slugFilter)
})().catch((e) => { err(e.message); process.exit(1) })
