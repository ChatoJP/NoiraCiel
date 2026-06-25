#!/usr/bin/env node
'use strict'
/**
 * generate-local-album-covers.js
 * One-off cover generation for the 5 locally-ingested albums (Party Exploder,
 * Metal, Hardstyle, Classic, Ak96 Mixes) — they were scaffolded with the
 * generic main-album placeholder cover, never given real art.
 *
 * R2-native (unlike the older generate-album-covers.js, which predates the
 * R2-only architecture and writes to local disk): generate -> download to
 * temp -> upload to R2 -> verify -> delete temp -> patch DISCOGRAPHY +
 * the album page.tsx metadata, one album at a time.
 *
 * Usage: node scripts/generate-local-album-covers.js [--slug metal]
 */

const fs   = require('fs')
const path = require('path')
const { loadEnv, log, warn, err, downloadFile, submitImageJob, pollImageJob, sleep } = require('./lib/kie-client')
const r2 = require('./lib/r2-client')

loadEnv()
r2.loadEnv()

const ROOT = path.join(__dirname, '..')
const TMP_DIR = path.join(ROOT, '.tmp', 'local-album-covers')
const SCANNER_PATH = path.join(ROOT, 'src', 'lib', 'musicScanner.ts')

const POLL_INTERVAL_MS = 8_000
const POLL_TIMEOUT_MS = 5 * 60 * 1000

const ALBUMS = [
  {
    slug: 'party-exploder',
    pageFile: 'src/app/music/party-exploder/page.tsx',
    prompt: `
Album cover art for a premium late-night party mix compilation.
A black velvet curtain backlit by warm gold and deep violet stage light, frozen confetti and
light embers suspended mid-air as if time stopped at the peak of the night.
No people, no faces, no crowd — just the light and the velvet and the suspended motion.
Square composition. Cinematic film grain, rich black, gold, and violet palette, painterly
texture, premium editorial quality. No text. No logos. No cheap rave graphics.
Mood: explosive elegance, the night at its peak.
    `.trim(),
  },
  {
    slug: 'metal',
    pageFile: 'src/app/music/metal/page.tsx',
    prompt: `
Album cover art for a dark, intense metal session recording.
A single distorted electric guitar leaning against a scorched stone wall, fine ash drifting
through the air, a dim red ember glow from somewhere just out of frame.
No musician, no face — just the instrument and the heat and the dark.
Square composition. 16mm film grain, near-black charcoal palette with deep ember-red accents,
painterly, slow, cinematic. No text. No logos. No cheap metal-album cliches (no skulls, no
flames as cartoon graphics).
Mood: heat, weight, restrained violence.
    `.trim(),
  },
  {
    slug: 'hardstyle',
    pageFile: 'src/app/music/hardstyle/page.tsx',
    prompt: `
Album cover art for a hard-hitting electronic hardstyle session.
A single industrial warehouse interior, hard strobe-lit beams cutting through haze, sharp
geometric shadows cast by steel girders, one suspended kick-drum silhouette barely visible
in the haze.
No people. Square composition. High-contrast black and white with one sharp red accent light,
painterly texture, premium industrial-cinematic quality. No text. No logos. No cheap EDM
festival graphics, no generic rave lasers.
Mood: brutal, sharp, disciplined energy.
    `.trim(),
  },
  {
    slug: 'classic',
    pageFile: 'src/app/music/classic/page.tsx',
    prompt: `
Album cover art for a timeless, classic recording session.
An old brass gramophone horn and a stack of vinyl records resting on dark velvet cloth under
warm low lamplight, the room around it falling into soft sepia shadow.
No people. Square composition. Warm sepia and deep gold palette, painterly film-grain texture,
elegant and unhurried. No text. No logos. No kitsch antique-shop staging.
Mood: timeless, warm, unhurried elegance.
    `.trim(),
  },
  {
    slug: 'ak96-party-session-1',
    pageFile: 'src/app/music/ak96-party-session-1/page.tsx',
    prompt: `
Album cover art for a late-night DJ mix session.
A DJ mixer and turntable under moody deep-blue and violet club light, thin smoke curling
upward through the beam of a single overhead spotlight, cables and knobs catching faint
highlights.
No people, no faces. Square composition. Deep blue-violet palette with warm amber highlight,
cinematic film grain, premium club-editorial quality. No text. No logos. No cheap rave
graphics.
Mood: late night, focused, hypnotic.
    `.trim(),
  },
]

const args = process.argv.slice(2)
const onlySlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null

async function processAlbum(album) {
  log(`\n── ${album.slug} ──────────────────────────────────────────`)
  fs.mkdirSync(TMP_DIR, { recursive: true })

  log('Submitting Flux Kontext job...')
  const taskId = await submitImageJob(album.prompt, { aspectRatio: '1:1', outputFormat: 'jpeg', model: 'flux-kontext-pro' })

  const deadline = Date.now() + POLL_TIMEOUT_MS
  let result = null
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS)
    result = await pollImageJob(taskId)
    if (result.done) break
  }
  if (!result || !result.done) throw new Error('Image generation timed out')
  if (result.failed) throw new Error('Image generation job failed')

  const tempPath = path.join(TMP_DIR, `${album.slug}.jpg`)
  log('Downloading image...')
  await downloadFile(result.url, tempPath)

  const r2Key = `images/album-covers/${album.slug}.jpg`
  log(`Uploading to R2 (${r2Key})...`)
  const { r2Url, deletedLocal } = await r2.migrateFile(tempPath, r2Key, { deleteLocal: true })
  if (!deletedLocal) warn('Uploaded+verified but local temp could not be deleted')

  // Patch DISCOGRAPHY coverSrc in musicScanner.ts
  let scanner = fs.readFileSync(SCANNER_PATH, 'utf-8')
  const re = new RegExp(`(slug:\\s*'${album.slug}'[\\s\\S]*?coverSrc:\\s*)'[^']*'`)
  if (!re.test(scanner)) throw new Error(`Could not find coverSrc for slug '${album.slug}' in musicScanner.ts`)
  scanner = scanner.replace(re, `$1'${r2Url}'`)
  fs.writeFileSync(SCANNER_PATH, scanner)
  log(`Patched coverSrc in musicScanner.ts`)

  // Patch the album page.tsx's placeholder cover references — two forms
  // appear in scaffolded pages: a bare path and a full noiraciel.com URL.
  const pagePath = path.join(ROOT, album.pageFile)
  let page = fs.readFileSync(pagePath, 'utf-8')
  const before = page
  page = page
    .split("'https://noiraciel.com/images/album-cover.png'").join(`'${r2Url}'`)
    .split("'/images/album-cover.png'").join(`'${r2Url}'`)
  if (page !== before) {
    fs.writeFileSync(pagePath, page)
    log(`Patched ${album.pageFile}`)
  } else {
    warn(`No placeholder cover string found in ${album.pageFile} (may already be patched)`)
  }

  log(`Done. ${album.slug} -> ${r2Url}`)
}

async function main() {
  const targets = onlySlug ? ALBUMS.filter((a) => a.slug === onlySlug) : ALBUMS
  if (targets.length === 0) { err(`No album matches slug "${onlySlug}"`); process.exit(1) }

  for (const album of targets) {
    const space = r2.checkDiskSpace(300)
    if (!space.ok) { err(`Disk space too low (${space.freeMb}MB) — stopping`); process.exit(1) }
    await processAlbum(album)
  }
}

main().catch((e) => { err(e.message); process.exit(1) })
