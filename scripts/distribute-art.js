#!/usr/bin/env node
/**
 * distribute-art.js
 *
 * After downloading images from kie.ai dashboard, drop them into the art/ folder
 * and run this script. It reads all generation state files, matches files by
 * taskId prefix, copies each to its correct destination, and writes manifests.
 *
 * USAGE
 *   node scripts/distribute-art.js           # distribute everything in art/
 *   node scripts/distribute-art.js --dry-run  # preview without copying
 *   node scripts/distribute-art.js --list     # show current status
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const ART_DIR = path.join(__dirname, '..', 'art')

// All generation categories and their output directories
const CATEGORIES = [
  { name: 'song-art',        dir: 'public/Images/song-art',        public: '/Images/song-art' },
  { name: 'backgrounds',     dir: 'public/Images/backgrounds',      public: '/Images/backgrounds' },
  { name: 'social',          dir: 'public/Images/social',           public: '/Images/social' },
  { name: 'merch',           dir: 'public/Images/merch',            public: '/Images/merch' },
  { name: 'chapter-banners', dir: 'public/Images/chapter-banners',  public: '/Images/chapter-banners' },
  { name: 'gallery',         dir: 'public/Images/gallery',          public: '/Images/gallery' },
  { name: 'artist',          dir: 'public/Images/artist',           public: '/Images/artist' },
]

const log  = (m) => console.log(m)
const warn = (m) => console.warn('⚠  ' + m)

const args    = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIST    = args.includes('--list')

// ─── Build task ID → file path index from art/ folder ─────────────────────────
function buildArtIndex() {
  if (!fs.existsSync(ART_DIR)) {
    warn(`art/ folder not found at ${ART_DIR}`)
    return {}
  }
  const files = fs.readdirSync(ART_DIR)
  const index = {}
  for (const filename of files) {
    const m = filename.match(/^(fluxkontext_[a-f0-9]+)/i)
    if (m) {
      index[m[1].toLowerCase()] = path.join(ART_DIR, filename)
    } else if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.png')) {
      // Manually named files — index by slug-like name
      const slug = filename.replace(/\.(jpg|png)$/i, '').toLowerCase()
        .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-')
      index['__named__' + slug] = path.join(ART_DIR, filename)
    }
  }
  return index
}

// ─── List status ──────────────────────────────────────────────────────────────
function runList() {
  console.log('\n📦  Distribution status:\n')
  for (const cat of CATEGORIES) {
    const stateFile = cat.dir + '/.state.json'
    if (!fs.existsSync(stateFile)) { console.log(`  ${cat.name}: no state file`); continue }
    const state = JSON.parse(fs.readFileSync(stateFile))
    const entries = Object.values(state)
    const done = entries.filter(e => e.status === 'done' || e.status === 'complete').length
    const pending = entries.filter(e => e.status === 'pending' || e.status === 'generating').length
    const failed = entries.filter(e => e.status === 'failed').length
    const imgs = fs.existsSync(cat.dir) ? fs.readdirSync(cat.dir).filter(f => /\.(jpg|png)$/.test(f)).length : 0
    console.log(`  ${cat.name.padEnd(18)}: ${String(imgs).padStart(2)} images on disk  |  state: ${done} done, ${pending} pending, ${failed} failed`)
  }
  const artFiles = fs.existsSync(ART_DIR) ? fs.readdirSync(ART_DIR).filter(f => /\.(jpg|png)$/.test(f)).length : 0
  console.log(`\n  art/ folder: ${artFiles} file(s) waiting to be distributed\n`)
}

// ─── Main distribute ──────────────────────────────────────────────────────────
function runDistribute() {
  const artIndex = buildArtIndex()
  const artFileCount = Object.keys(artIndex).length
  if (artFileCount === 0) {
    log('No files found in art/ folder. Download images from kie.ai and place them there.')
    return
  }
  log(`Found ${artFileCount} file(s) in art/\n`)

  let totalCopied = 0
  let totalSkipped = 0
  let totalUnmatched = Object.keys(artIndex).filter(k => !k.startsWith('__named__')).length

  for (const cat of CATEGORIES) {
    const stateFile = cat.dir + '/.state.json'
    if (!fs.existsSync(stateFile)) continue

    fs.mkdirSync(cat.dir, { recursive: true })
    const state = JSON.parse(fs.readFileSync(stateFile))
    const manifest = {}
    let catCopied = 0

    // Load existing done entries into manifest
    for (const entry of Object.values(state)) {
      if ((entry.status === 'done' || entry.status === 'complete') && entry.publicUrl) {
        const destFile = path.join(cat.dir, entry.id + '.jpg')
        if (fs.existsSync(destFile)) {
          manifest[entry.id] = entry.publicUrl
        }
      }
    }

    // Match new files
    for (const [key, entry] of Object.entries(state)) {
      if (!entry.taskId) continue
      const taskPrefix = entry.taskId.toLowerCase()
      const srcFile = artIndex[taskPrefix]

      if (!srcFile) continue  // not downloaded yet

      const destFile = path.join(cat.dir, entry.id + '.jpg')
      const publicUrl = `${cat.public}/${entry.id}.jpg`

      if (DRY_RUN) {
        log(`  [DRY] ${path.basename(srcFile)} → ${destFile.replace(process.cwd(), '.')}`)
      } else {
        fs.copyFileSync(srcFile, destFile)
        state[key] = { ...entry, status: 'done', localPath: destFile, publicUrl }
        log(`  ✓ ${entry.id} → ${cat.name}`)
      }
      manifest[entry.id] = publicUrl
      catCopied++
      totalCopied++
      totalUnmatched--
    }

    if (!DRY_RUN && catCopied > 0) {
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2))
      fs.writeFileSync(path.join(cat.dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    }

    if (catCopied > 0) log(`  → ${cat.name}: ${catCopied} new file(s)\n`)
  }

  // Also check for manually-named files (slug-based, not taskId-based)
  for (const cat of CATEGORIES) {
    const stateFile = cat.dir + '/.state.json'
    if (!fs.existsSync(stateFile)) continue
    const state = JSON.parse(fs.readFileSync(stateFile))
    const manifest = JSON.parse(fs.readFileSync(path.join(cat.dir, 'manifest.json'), 'utf8').catch ? '{}' : fs.readFileSync(path.join(cat.dir, 'manifest.json'), 'utf8'))

    for (const [key, entry] of Object.entries(state)) {
      const slugKey = '__named__' + entry.id
      const srcFile = artIndex[slugKey]
      if (!srcFile) continue

      const destFile = path.join(cat.dir, entry.id + '.jpg')
      if (fs.existsSync(destFile)) continue  // already there

      const publicUrl = `${cat.public}/${entry.id}.jpg`
      if (!DRY_RUN) {
        fs.copyFileSync(srcFile, destFile)
        state[key] = { ...entry, status: 'done', localPath: destFile, publicUrl }
        manifest[entry.id] = publicUrl
        log(`  ✓ ${entry.id} (named) → ${cat.name}`)
        totalCopied++
      }
    }

    if (!DRY_RUN) {
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2))
      if (Object.keys(manifest).length > 0) {
        fs.writeFileSync(path.join(cat.dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
      }
    }
  }

  console.log(`\n✅  Distributed ${totalCopied} file(s). ${totalUnmatched > 0 ? `${totalUnmatched} in art/ not yet matched (still generating?).` : 'All matched.'}`)
  if (DRY_RUN) log('\n[Dry run — no files were actually copied. Remove --dry-run to execute.]')
}

// ─── Reconcile disk → state (run this if state got corrupted) ─────────────────
function runReconcile() {
  log('\nReconciling state files against disk…\n')
  for (const cat of CATEGORIES) {
    const stateFile = cat.dir + '/.state.json'
    if (!fs.existsSync(cat.dir)) continue

    const jpgs = fs.readdirSync(cat.dir).filter(f => f.endsWith('.jpg'))
    if (jpgs.length === 0) continue

    const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile)) : {}
    const manifest = {}

    for (const jpg of jpgs) {
      const id = jpg.replace('.jpg', '')
      const publicUrl = `${cat.public}/${jpg}`
      const localPath = path.join(cat.dir, jpg)
      if (state[id]) {
        state[id] = { ...state[id], status: 'done', localPath, publicUrl }
      } else {
        state[id] = { id, label: id, status: 'done', localPath, publicUrl }
      }
      manifest[id] = publicUrl
    }

    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2))
    fs.writeFileSync(path.join(cat.dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    log(`  ${cat.name}: reconciled ${jpgs.length} image(s)`)
  }
  log('\nDone. Manifests updated.')
}

if (args.includes('--reconcile')) {
  runReconcile()
} else if (LIST) {
  runList()
} else {
  if (DRY_RUN) log('[DRY RUN — no files will be moved]\n')
  runDistribute()
}
