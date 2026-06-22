#!/usr/bin/env node
'use strict'
/**
 * generate-cinemagraphs.js
 * Submits + polls + downloads cinemagraph (image-to-video) jobs for all approved songs.
 *
 * Uses Veo3 IMAGE_2_VIDEO endpoint (confirmed working).
 * Source: song art from R2.  Output: public/generated/kie/cinemagraphs/{slug}/loop.mp4
 *
 * Usage:
 *   node scripts/kie/generate-cinemagraphs.js            # submit + poll (full run)
 *   node scripts/kie/generate-cinemagraphs.js --submit   # submit jobs only
 *   node scripts/kie/generate-cinemagraphs.js --poll     # poll + download only
 *   node scripts/kie/generate-cinemagraphs.js --status   # show current state
 *   node scripts/kie/generate-cinemagraphs.js --slug why # single song
 */

const fs   = require('fs')
const path = require('path')
const {
  loadEnv, log, warn, err, sleep, downloadFile,
  kieRequestWithRetry, RATE_LIMIT_MS,
} = require('../lib/kie-client')

loadEnv()

const ROOT     = path.join(__dirname, '..', '..')
const SONG_DIR = path.join(ROOT, 'public', 'generated', 'kie', 'songs')
const CIN_DIR  = path.join(ROOT, 'public', 'generated', 'kie', 'cinemagraphs')
const R2_BASE  = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

const SUBMIT_MODE = process.argv.includes('--submit')
const POLL_MODE   = process.argv.includes('--poll')
const STATUS_MODE = process.argv.includes('--status')
const SLUG_ARG    = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1] : null
// No args = do both
const DO_BOTH = !SUBMIT_MODE && !POLL_MODE && !STATUS_MODE

const POLL_INTERVAL = 30_000   // 30s between polls
const POLL_TIMEOUT  = 30 * 60 * 1000  // 30 min max

// ─── Motion prompts per animation type ───────────────────────────────────────
// RULES: purely visual, no emotion/mood/lyrics text, no film grain, full frame.
const MOTION_PROMPTS = {
  ocean_breathing:    'animate only the water surface — single slow breath-like swell rising and falling, foam edge barely shifting, horizon line locked and perfectly still',
  fog_drift:          'animate only the mist in the mid-ground — a thin layer drifting left at walking pace, foreground and background absolutely frozen',
  light_flicker:      'animate only the light source — a single candle or lamp pulses with one slow organic breath, brightness +5% then back, surrounding darkness completely unchanged',
  leaf_breath:        'animate only one leaf at the very edge of frame — a single imperceptible shift sideways as if touched by unseen air, every other element frozen solid',
  rain_on_glass:      'animate only one water droplet on glass — it traces a slow vertical path downward, pauses, stops. Nothing else moves. Background sharp and still.',
  shadow_breathe:     'animate only the shadow at the edge of frame — it expands by 3% then contracts back, a single slow breath cycle, all other elements perfectly static',
  heat_shimmer:       'animate only the air above the distant ground — a barely perceptible heat distortion ripples upward once, everything closer to camera absolutely still',
  subtle_breath:      'animate one small element at the periphery of the frame — a single slow expansion and contraction like a sleeping breath, everything else a frozen photograph',
  cloud_slow_drift:   'animate only the clouds — they drift left at glacial speed, stars or sky below them perfectly fixed, no other element changes',
  feather_fall:       'animate only one piece of fabric or a single feather at the frame edge — it sways once, imperceptibly slowly, then stills. All else frozen.',
  atmospheric_breath: 'animate the subtlest element in this image — one slow breath-scale movement of a single object or texture, everything else an absolute still photograph',
}

const PROMPT_SUFFIX = [
  'Absolute camera lock — zero shake, zero zoom, zero drift.',
  'Only ONE element moves. Everything else: frozen photograph.',
  'Clean sharp digital image quality.',
  'NO film grain. NO noise. NO vignette. NO analog artifacts.',
  'NO borders. NO letterbox. NO frame lines. Full edge-to-edge image.',
  'NO text. NO watermarks. NO subtitles.',
  'Seamless 8-second loop — end frame matches start frame exactly.',
].join(' ')

function buildVeoPrompt(manifest) {
  const animType = manifest.generatedAssets.cinemagraph.animationType ?? 'atmospheric_breath'
  const motion   = MOTION_PROMPTS[animType] ?? MOTION_PROMPTS.atmospheric_breath
  return `CINEMAGRAPH: ${motion}. ${PROMPT_SUFFIX}`
}

function getArtUrl(manifest) {
  // Prefer R2 URL from manifest, fall back to derived R2 path
  if (manifest.artworkUrl && manifest.artworkUrl.startsWith('http')) return manifest.artworkUrl
  if (manifest.artworkPath) return `${R2_BASE}/${manifest.artworkPath.replace(/^public\//, '')}`
  return null
}

function loadManifest(slug) {
  const fp = path.join(SONG_DIR, `${slug}.json`)
  return JSON.parse(fs.readFileSync(fp, 'utf-8'))
}
function saveManifest(slug, m) {
  m.updatedAt = new Date().toISOString()
  fs.writeFileSync(path.join(SONG_DIR, `${slug}.json`), JSON.stringify(m, null, 2))
}
function logHistory(event) {
  const hf = path.join(ROOT, 'public', 'generated', 'kie', '.history.ndjson')
  fs.appendFileSync(hf, JSON.stringify({ ...event, ts: new Date().toISOString() }) + '\n')
}

// ─── Submit phase ─────────────────────────────────────────────────────────────
async function submitAll(manifests) {
  log(`\nSubmitting ${manifests.length} cinemagraph jobs...\n`)
  let submitted = 0, skipped = 0, failed = 0

  for (const m of manifests) {
    const cin = m.generatedAssets.cinemagraph

    // Skip already submitted or complete
    if (cin.status === 'complete') { log(`  skip (complete): ${m.slug}`); skipped++; continue }
    if (cin.taskId && cin.status === 'generating') { log(`  skip (in-flight): ${m.slug} [${cin.taskId}]`); skipped++; continue }

    const artUrl = getArtUrl(m)
    if (!artUrl) { warn(`  SKIP (no art URL): ${m.slug}`); skipped++; continue }

    const prompt = buildVeoPrompt(m)

    try {
      const res = await kieRequestWithRetry('POST', '/veo/generate', {
        prompt,
        model:           'veo3',
        generationType:  'IMAGE_2_VIDEO',
        aspect_ratio:    '16:9',
        resolution:      '720p',
        duration:        8,
        imageUrl:        artUrl,
      })

      const taskId = res.data?.taskId
      if (!taskId) throw new Error('No taskId in response')

      cin.taskId      = taskId
      cin.status      = 'generating'
      cin.submittedAt = new Date().toISOString()
      cin.prompt      = prompt
      cin.model       = 'veo3-image2video'
      saveManifest(m.slug, m)
      logHistory({ event: 'cinemagraph_submitted', slug: m.slug, taskId })

      log(`  ✓ submitted: ${m.slug} → ${taskId}`)
      submitted++
    } catch (e) {
      err(`  ✗ ${m.slug}: ${e.message}`)
      cin.status = 'failed'
      cin.error  = e.message
      saveManifest(m.slug, m)
      failed++
    }

    await sleep(RATE_LIMIT_MS)
  }

  log(`\nSubmit complete: ${submitted} submitted, ${skipped} skipped, ${failed} failed\n`)
  return submitted
}

// ─── Poll phase ───────────────────────────────────────────────────────────────
async function pollAll() {
  log('\nPolling cinemagraph jobs...\n')
  const start = Date.now()

  while (true) {
    const files = fs.readdirSync(SONG_DIR).filter(f => f.endsWith('.json'))
    const pending = []

    for (const file of files) {
      const m = loadManifest(file.replace('.json', ''))
      if (SLUG_ARG && m.slug !== SLUG_ARG) continue
      const cin = m.generatedAssets.cinemagraph
      if (cin.status === 'generating' && cin.taskId) pending.push(m)
    }

    if (!pending.length) { log('No pending jobs. Done.'); break }
    if (Date.now() - start > POLL_TIMEOUT) { warn('Poll timeout reached. Re-run --poll to continue.'); break }

    log(`  Checking ${pending.length} pending jobs...`)

    let completed = 0
    for (const m of pending) {
      const cin = m.generatedAssets.cinemagraph
      try {
        const res  = await kieRequestWithRetry('GET', `/veo/record-info?taskId=${cin.taskId}`)
        const d    = res.data ?? {}

        if (d.successFlag === 1) {
          const videoUrl = d.response?.resultUrls?.[0] ?? null
          if (!videoUrl) { warn(`  ${m.slug}: done but no URL`); continue }

          // Download
          const outDir  = path.join(CIN_DIR, m.slug)
          const outFile = path.join(outDir, 'loop.mp4')
          fs.mkdirSync(outDir, { recursive: true })
          log(`  ↓ downloading: ${m.slug}...`)
          await downloadFile(videoUrl, outFile)

          cin.status      = 'complete'
          cin.remoteUrl   = videoUrl
          cin.localPath   = `public/generated/kie/cinemagraphs/${m.slug}/loop.mp4`
          cin.publicUrl   = `/generated/kie/cinemagraphs/${m.slug}/loop.mp4`
          cin.completedAt = new Date().toISOString()
          cin.error       = null
          saveManifest(m.slug, m)
          logHistory({ event: 'cinemagraph_complete', slug: m.slug, localPath: cin.localPath })
          log(`  ✓ complete: ${m.slug}`)
          completed++

        } else if (d.successFlag === 2 || d.successFlag === 3) {
          err(`  ✗ failed: ${m.slug} (flag=${d.successFlag})`)
          cin.status = 'failed'
          cin.error  = `successFlag=${d.successFlag}`
          saveManifest(m.slug, m)
          logHistory({ event: 'cinemagraph_failed', slug: m.slug })
        } else {
          log(`  ⟳ pending: ${m.slug}`)
        }
      } catch (e) {
        warn(`  poll error (${m.slug}): ${e.message}`)
      }
      await sleep(500)
    }

    // Check if all done
    const stillPending = pending.filter(m => m.generatedAssets.cinemagraph.status === 'generating')
    if (stillPending.length === 0) { log('\nAll jobs complete.'); break }

    log(`  ${stillPending.length} still pending. Waiting ${POLL_INTERVAL / 1000}s...`)
    await sleep(POLL_INTERVAL)
  }
}

// ─── Status ───────────────────────────────────────────────────────────────────
function showStatus() {
  const files = fs.readdirSync(SONG_DIR).filter(f => f.endsWith('.json'))
  const counts = { not_started: 0, prompt_ready: 0, generating: 0, complete: 0, failed: 0, blocked: 0 }
  console.log('\n  Slug'.padEnd(46) + 'Status       TaskId')
  console.log('  ' + '─'.repeat(80))
  for (const file of files) {
    const m   = loadManifest(file.replace('.json', ''))
    const cin = m.generatedAssets.cinemagraph
    counts[cin.status] = (counts[cin.status] ?? 0) + 1
    const icon = { complete:'✓', generating:'⟳', failed:'✗', blocked:'✗', not_started:'·', prompt_ready:'◎' }[cin.status] ?? '?'
    console.log(`  ${icon} ${m.slug.padEnd(44)} ${cin.status.padEnd(13)} ${cin.taskId ?? ''}`)
  }
  console.log('\n  ' + '─'.repeat(80))
  for (const [k, v] of Object.entries(counts)) if (v) console.log(`  ${k}: ${v}`)
  console.log()
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.KIE_API_KEY) {
    err('KIE_API_KEY not set. Check .env.local'); process.exit(1)
  }

  fs.mkdirSync(CIN_DIR, { recursive: true })

  if (STATUS_MODE) { showStatus(); return }

  // Load approved manifests
  const files = fs.readdirSync(SONG_DIR).filter(f => f.endsWith('.json'))
  const manifests = files
    .map(f => loadManifest(f.replace('.json', '')))
    .filter(m => (!SLUG_ARG || m.slug === SLUG_ARG) && m.approvals?.cinemagraph === true)

  if (!manifests.length) {
    warn('No approved cinemagraph manifests found.'); return
  }

  log(`\n── Cinemagraph Generator (Veo3 image-to-video) ─────────────────`)
  log(`   Approved: ${manifests.length} songs`)

  if (SUBMIT_MODE || DO_BOTH) {
    // Cancel the test job submitted during probing - just note it
    const testTaskId = '492bd4fe91dfe7a5c955532237da1e8e'
    log(`   (test probe job ${testTaskId} from endpoint discovery will be ignored)`)
    await submitAll(manifests)
  }

  if (POLL_MODE || DO_BOTH) {
    await pollAll()
  }

  showStatus()
}

main().catch(e => { err(e.message); process.exit(1) })
