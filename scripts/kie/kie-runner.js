#!/usr/bin/env node
'use strict'
/**
 * kie-runner.js
 * Main Phase 1 orchestrator. Runs the full dry-run pipeline.
 *
 * Modes:
 *   node scripts/kie/kie-runner.js             — full Phase 1 dry run (all generators + report)
 *   node scripts/kie/kie-runner.js --report    — validation report only
 *   node scripts/kie/kie-runner.js --slug why  — single song dry run
 *   node scripts/kie/kie-runner.js --generate  — GENERATE mode (requires approvals + KIE_DRY_RUN=false)
 *
 * Environment:
 *   KIE_DRY_RUN=true   (default, safe)
 *   KIE_DRY_RUN=false  (required to submit real API jobs)
 *   KIE_API_KEY=...    (required for --generate mode)
 */

const { execSync, spawn } = require('child_process')
const fs   = require('fs')
const path = require('path')

const ROOT    = path.join(__dirname, '..', '..')
const KIE_DIR = __dirname

const REPORT_ONLY = process.argv.includes('--report')
const GENERATE    = process.argv.includes('--generate')
const SLUG        = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null
const FORCE       = process.argv.includes('--force')

function loadEnv() {
  const p = path.join(ROOT, '.env.local')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

function run(script, extraArgs = []) {
  const args = [path.join(KIE_DIR, script)]
  if (SLUG) args.push('--slug', SLUG)
  if (FORCE) args.push('--force')
  args.push(...extraArgs)

  return new Promise((resolve, reject) => {
    const child = spawn('node', args, { stdio: 'inherit', env: process.env })
    child.on('close', code => {
      if (code !== 0) reject(new Error(`${script} exited with code ${code}`))
      else resolve()
    })
  })
}

function logHistory(event) {
  const histFile = path.join(ROOT, 'public', 'generated', 'kie', '.history.ndjson')
  fs.mkdirSync(path.dirname(histFile), { recursive: true })
  fs.appendFileSync(histFile, JSON.stringify({ ...event, ts: new Date().toISOString() }) + '\n', 'utf-8')
}

async function runPhase1() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║          KIE.AI × NoiraCiel — Phase 1 Dry Run               ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')
  console.log(`  Mode:      DRY RUN (KIE_DRY_RUN=${process.env.KIE_DRY_RUN ?? 'true'})`)
  console.log(`  Target:    ${SLUG ? `--slug ${SLUG}` : 'all songs'}`)
  console.log(`  Started:   ${new Date().toLocaleString()}\n`)

  logHistory({ event: 'phase1_start', mode: 'dry_run', slug: SLUG ?? 'all' })

  try {
    console.log('Step 1/5 — Generating manifests...')
    await run('generate-kie-manifest.js')

    console.log('Step 2/5 — Generating cinemagraph prompts...')
    await run('generate-cinemagraph-prompts.js')

    console.log('Step 3/5 — Generating song film prompts...')
    await run('generate-song-film-prompts.js')

    console.log('Step 4/5 — Generating commentary scripts...')
    await run('generate-commentary-prompts.js')

    console.log('Step 5/5 — Generating audiobook prompts...')
    await run('generate-audiobook-prompts.js')

    console.log('Products — Generating product cinematic prompts...')
    await run('generate-product-prompts.js')

    console.log('\n── Phase 1 complete. Generating final report...\n')
    await run('validate-kie-assets.js')

    logHistory({ event: 'phase1_complete', slug: SLUG ?? 'all' })

    console.log('\n╔══════════════════════════════════════════════════════════════╗')
    console.log('║  Phase 1 Done — All manifests and prompts generated         ║')
    console.log('╚══════════════════════════════════════════════════════════════╝\n')
    console.log('  Files created:')
    console.log('    public/generated/kie/songs/          ← per-song manifests')
    console.log('    public/generated/kie/objects/        ← product manifests')
    console.log('    public/generated/kie/commentary/     ← commentary scripts')
    console.log('    public/generated/kie/audiobook/      ← audiobook narration text')
    console.log('    public/generated/kie/index.json      ← master catalogue')
    console.log('    public/generated/kie/.history.ndjson ← run history')
    console.log('')
    console.log('  Next steps:')
    console.log('    1. Review manifests in public/generated/kie/songs/')
    console.log('    2. Set approvals.cinemagraph=true for songs you want to generate')
    console.log('    3. Add KIE_API_KEY to .env.local')
    console.log('    4. Set KIE_DRY_RUN=false in .env.local')
    console.log('    5. Run: node scripts/kie/kie-runner.js --generate\n')
  } catch (e) {
    console.error(`\n✗ Pipeline failed: ${e.message}`)
    logHistory({ event: 'phase1_error', error: e.message })
    process.exit(1)
  }
}

async function runGenerate() {
  loadEnv()

  if (!process.env.KIE_API_KEY) {
    console.error('✗ KIE_API_KEY not set. Add it to .env.local and try again.')
    process.exit(1)
  }
  if (process.env.KIE_DRY_RUN === 'true' || !process.env.KIE_DRY_RUN) {
    console.error('✗ KIE_DRY_RUN is still true. Set KIE_DRY_RUN=false in .env.local to enable real generation.')
    process.exit(1)
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║          KIE.AI × NoiraCiel — GENERATE MODE                 ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')
  console.log('  ⚠  Real API calls will be made. Costs will be incurred.')
  console.log('  Only assets with approvals.{type}=true will be submitted.\n')

  // Find approved assets
  const SONG_DIR = path.join(ROOT, 'public', 'generated', 'kie', 'songs')
  if (!fs.existsSync(SONG_DIR)) {
    console.error('✗ No manifests found. Run Phase 1 first.')
    process.exit(1)
  }

  const files = fs.readdirSync(SONG_DIR).filter(f => f.endsWith('.json'))
  const approved = []

  for (const file of files) {
    const man = JSON.parse(fs.readFileSync(path.join(SONG_DIR, file), 'utf-8'))
    if (SLUG && man.slug !== SLUG) continue
    const types = Object.entries(man.approvals ?? {}).filter(([, v]) => v).map(([k]) => k)
    if (types.length) approved.push({ slug: man.slug, types })
  }

  if (!approved.length) {
    console.log('  No approved assets found.')
    console.log('  Set approvals.{cinemagraph|songFilm|commentary|audiobook}=true in a manifest JSON,')
    console.log('  then run again.\n')
    return
  }

  console.log(`  Approved for generation (${approved.length} songs):\n`)
  for (const a of approved) {
    console.log(`    ${a.slug}: ${a.types.join(', ')}`)
  }
  console.log('')

  // TODO: Phase 2 — call kie-client.js for each approved asset
  // For now, print what would be generated
  console.log('  ── Phase 2 generation logic will be implemented here.')
  console.log('  ── This will call the KIE.AI API for each approved asset type.\n')
  logHistory({ event: 'generate_mode_invoked', approved: approved.map(a => a.slug) })
}

// ─── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  loadEnv()

  if (REPORT_ONLY) {
    await run('validate-kie-assets.js')
    return
  }

  if (GENERATE) {
    await runGenerate()
    return
  }

  await runPhase1()
}

main().catch(e => { console.error(e.message); process.exit(1) })
