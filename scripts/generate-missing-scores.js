#!/usr/bin/env node
/**
 * generate-missing-scores.js
 *
 * Finds all tracks that have no score (manifest.json missing or score dir absent),
 * maps each to its audio file, and invokes generate_scores.py to produce the score.
 *
 * Usage:
 *   node scripts/generate-missing-scores.js           -- dry run (prints what would run)
 *   node scripts/generate-missing-scores.js --run     -- actually execute
 *   node scripts/generate-missing-scores.js --run --slug still-worth-it  -- single track
 */

import { execSync, spawnSync } from 'child_process'
import { readdirSync, existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const SCORES    = join(ROOT, 'public', 'Books', 'scores')
const MUSIC     = join(ROOT, 'Music')
const PY_SCRIPT = join(ROOT, 'scripts', 'generate_scores.py')

const args    = process.argv.slice(2)
const DRY_RUN = !args.includes('--run')
const ONLY_SLUG = (() => { const i = args.indexOf('--slug'); return i !== -1 ? args[i + 1] : null })()

// ─── Known audio mapping for tracks that can't be auto-discovered ────────────
// Key = score slug, value = { audio: relative path from ROOT, album: album flag for batch commands }
// When album is set and --slug not specified, the full album command runs (covers all tracks in album).
const AUDIO_MAP = {
  // Jazz Sessions (9 tracks — `--album jazz` generates all)
  'blood-on-the-hallelujah':        { audio: "Music/NoiraCiel Jazz Sessions/Blood on the Hallelujah.mp3",     album: 'jazz' },
  'carry-you-home':                 { audio: "Music/NoiraCiel Jazz Sessions/Carry you Home.mp3",               album: 'jazz' },
  'its-not-always-easy':            { audio: "Music/NoiraCiel Jazz Sessions/It's not always easy.mp3",         album: 'jazz' },
  'keep-a-chair-for-you':           { audio: "Music/NoiraCiel Jazz Sessions/Keep a Chair for you.mp3",         album: 'jazz' },
  'mercy-wears-a-black-coat':       { audio: "Music/NoiraCiel Jazz Sessions/Mercy Wears a Black Coat.mp3",     album: 'jazz' },
  'the-heart-comes-home-at-night':  { audio: "Music/NoiraCiel Jazz Sessions/The Heart Comes Home At Night.mp3", album: 'jazz' },
  'the-river-knows-your-name':      { audio: "Music/NoiraCiel Jazz Sessions/The River Knows your name.mp3",    album: 'jazz' },
  'the-truth-has-teeth':            { audio: "Music/NoiraCiel Jazz Sessions/The Truth has teeth.mp3",          album: 'jazz' },
  'the-woman-beside-the-fire':      { audio: "Music/NoiraCiel Jazz Sessions/The Woman Beside the Fire.mp3",    album: 'jazz' },

  // The Sacred Drift (15 tracks — `--album tsd` generates all)
  'so-hum':                         { audio: "Music/The_Sacred_Drift/audio/01_so-hum_v1.mp3",                  album: 'tsd' },
  'the-frequency-knows':            { audio: "Music/The_Sacred_Drift/audio/02_the-frequency-knows_v1.mp3",     album: 'tsd' },
  'third-signal':                   { audio: "Music/The_Sacred_Drift/audio/03_third-signal_v1.mp3",            album: 'tsd' },
  'dissolve':                       { audio: "Music/The_Sacred_Drift/audio/04_dissolve_v1.mp3",                album: 'tsd' },
  'sat-nam':                        { audio: "Music/The_Sacred_Drift/audio/05_sat-nam_v1.mp3",                 album: 'tsd' },
  'sacred-static':                  { audio: "Music/The_Sacred_Drift/audio/06_sacred-static_v1.mp3",           album: 'tsd' },
  'the-drift':                      { audio: "Music/The_Sacred_Drift/audio/07_the-drift_v1.mp3",               album: 'tsd' },
  'all-is-one':                     { audio: "Music/The_Sacred_Drift/audio/08_all-is-one_v1.mp3",              album: 'tsd' },
  'shakti-rising':                  { audio: "Music/The_Sacred_Drift/audio/09_shakti-rising_v1.mp3",           album: 'tsd' },
  'neti-neti':                      { audio: "Music/The_Sacred_Drift/audio/10_neti-neti_v1.mp3",               album: 'tsd' },
  'between-the-worlds':             { audio: "Music/The_Sacred_Drift/audio/11_between-the-worlds_v1.mp3",      album: 'tsd' },
  'om-namah':                       { audio: "Music/The_Sacred_Drift/audio/12_om-namah_v1.mp3",                album: 'tsd' },
  'the-return':                     { audio: "Music/The_Sacred_Drift/audio/13_the-return_v1.mp3",              album: 'tsd' },
  'open-eye':                       { audio: "Music/The_Sacred_Drift/audio/14_open-eye_v1.mp3",                album: 'tsd' },
  'the-sacred-drift':               { audio: "Music/The_Sacred_Drift/audio/15_the-sacred-drift_v1.mp3",        album: 'tsd' },

  // What You're Made Of (8 tracks — `--album wymo` generates all)
  'you-were-never-broken':          { audio: "Music/What_Youre_Made_Of/audio/01_you-were-never-broken_v1.mp3", album: 'wymo' },
  'the-weight-that-taught-you':     { audio: "Music/What_Youre_Made_Of/audio/02_the-weight-that-taught-you_v1.mp3", album: 'wymo' },
  'start-somewhere':                { audio: "Music/What_Youre_Made_Of/audio/03_start-somewhere_v1.mp3",       album: 'wymo' },
  'fear-was-never-the-point':       { audio: "Music/What_Youre_Made_Of/audio/04_fear-was-never-the-point_v1.mp3", album: 'wymo' },
  'the-version-that-survived':      { audio: "Music/What_Youre_Made_Of/audio/05_the-version-that-survived_v1.mp3", album: 'wymo' },
  'nothing-needs-fixing-tonight':   { audio: "Music/What_Youre_Made_Of/audio/06_nothing-needs-fixing-tonight_v1.mp3", album: 'wymo' },
  'the-work-nobody-sees':           { audio: "Music/What_Youre_Made_Of/audio/07_the-work-nobody-sees_v1.mp3",  album: 'wymo' },
  'permission':                     { audio: "Music/What_Youre_Made_Of/audio/08_permission_v1.mp3",            album: 'wymo' },

  // Main album — hd_5 was wrongly mapped in generate_scores.py MAIN_TRACKS (5→i-never-knew), use explicit --slug
  'still-worth-it':                 { audio: "Music/hd_5 - Still Worth it.wav",                                album: null  },
}

// ─── Tracks known to have no audio file yet ──────────────────────────────────
const NO_AUDIO = new Set([
  'show-up',  // BASB album not yet on disk
])

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hasManifest(slug) {
  return existsSync(join(SCORES, slug, 'manifest.json'))
}

function scoreExists(slug) {
  return existsSync(join(SCORES, slug))
}

function audioExists(slug) {
  const entry = AUDIO_MAP[slug]
  if (!entry) return false
  return existsSync(join(ROOT, entry.audio))
}

// ─── Find all missing slugs ───────────────────────────────────────────────────
function findMissing() {
  const missing = []

  // 1. Existing score dirs with no manifest
  if (existsSync(SCORES)) {
    for (const slug of readdirSync(SCORES)) {
      if (ONLY_SLUG && slug !== ONLY_SLUG) continue
      if (!hasManifest(slug)) {
        missing.push({ slug, reason: 'empty directory (no manifest)' })
      }
    }
  }

  // 2. Tracks in AUDIO_MAP that have no score dir at all
  for (const [slug, entry] of Object.entries(AUDIO_MAP)) {
    if (ONLY_SLUG && slug !== ONLY_SLUG) continue
    if (!scoreExists(slug) && !NO_AUDIO.has(slug)) {
      missing.push({ slug, reason: 'no score directory' })
    }
  }

  // Deduplicate (a slug might appear twice if it's in AUDIO_MAP and also has an empty dir)
  const seen = new Set()
  return missing.filter(m => { if (seen.has(m.slug)) return false; seen.add(m.slug); return true })
}

// ─── Build commands ───────────────────────────────────────────────────────────
function buildCommands(missingList) {
  const albumBatches = new Map() // album key → set of slugs
  const individualCmds = []     // { slug, cmd }
  const warnings = []

  for (const { slug, reason } of missingList) {
    if (NO_AUDIO.has(slug)) {
      warnings.push(`  ⚠  ${slug} — no audio file found (${reason}). Skipping.`)
      continue
    }

    const entry = AUDIO_MAP[slug]
    if (!entry) {
      warnings.push(`  ⚠  ${slug} — not in AUDIO_MAP and (${reason}). Add it manually.`)
      continue
    }

    const audioPath = join(ROOT, entry.audio)
    if (!existsSync(audioPath)) {
      warnings.push(`  ⚠  ${slug} — audio not found at: ${entry.audio}`)
      continue
    }

    if (entry.album && !ONLY_SLUG) {
      // Batch by album: generate_scores.py will skip tracks that already have manifests
      if (!albumBatches.has(entry.album)) albumBatches.set(entry.album, new Set())
      albumBatches.get(entry.album).add(slug)
    } else {
      // Individual: explicit audio path + --slug (avoids MAIN_TRACKS mapping bugs)
      individualCmds.push({
        slug,
        cmd: `python3 "${PY_SCRIPT}" "${audioPath}" --slug ${slug}`,
      })
    }
  }

  const batchCmds = [...albumBatches.entries()].map(([album, slugs]) => ({
    album,
    slugs: [...slugs],
    cmd: `python3 "${PY_SCRIPT}" --album ${album}`,
  }))

  return { batchCmds, individualCmds, warnings }
}

// ─── Execute ──────────────────────────────────────────────────────────────────
function run() {
  console.log('\n🎼 NoiraCiel — Missing Score Generator\n')

  const missing = findMissing()

  if (missing.length === 0) {
    console.log('✅ All scores are present. Nothing to do.\n')
    return
  }

  console.log(`Found ${missing.length} missing score(s):\n`)
  for (const { slug, reason } of missing) {
    const hasAudio = audioExists(slug) || NO_AUDIO.has(slug) ? '' : ' [NO AUDIO]'
    console.log(`  • ${slug} — ${reason}${hasAudio}`)
  }

  const { batchCmds, individualCmds, warnings } = buildCommands(missing)

  if (warnings.length) {
    console.log('\nWarnings:')
    warnings.forEach(w => console.log(w))
  }

  const allCmds = [
    ...batchCmds.map(b => ({
      label: `Album: ${b.album} (covers: ${b.slugs.join(', ')})`,
      cmd: b.cmd,
    })),
    ...individualCmds.map(c => ({
      label: `Track: ${c.slug}`,
      cmd: c.cmd,
    })),
  ]

  if (allCmds.length === 0) {
    console.log('\nNo runnable commands (all missing tracks lack audio files).\n')
    return
  }

  console.log(`\n${ DRY_RUN ? '[DRY RUN] Commands that would run:' : 'Running commands:' }\n`)

  for (const { label, cmd } of allCmds) {
    console.log(`\n── ${label}`)
    console.log(`   ${cmd}`)

    if (!DRY_RUN) {
      // Ensure score dir exists for individual track
      const slugMatch = cmd.match(/--slug\s+(\S+)/)
      if (slugMatch) {
        const dir = join(SCORES, slugMatch[1])
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
          console.log(`   Created directory: public/Books/scores/${slugMatch[1]}`)
        }
      }

      console.log('   Running...')
      const result = spawnSync(
        cmd.split(' ')[0],
        cmd.split(' ').slice(1),
        { stdio: 'inherit', cwd: ROOT, shell: true }
      )

      if (result.status !== 0) {
        console.error(`\n   ❌ Failed with exit code ${result.status}`)
      } else {
        console.log(`   ✅ Done`)
      }
    }
  }

  if (DRY_RUN) {
    console.log('\n──────────────────────────────────────')
    console.log('Add --run to execute these commands.')
    console.log('Add --run --slug <name> to run a single track.\n')
  } else {
    console.log('\n✅ Score generation complete.\n')
    console.log('Reminder: run `npm run build` or restart the dev server to pick up new scores.')
  }
}

run()
