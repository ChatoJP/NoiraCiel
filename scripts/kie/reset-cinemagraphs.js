#!/usr/bin/env node
'use strict'
/**
 * reset-cinemagraphs.js
 *
 * Deletes all local cinemagraph loop.mp4 files and resets manifest status
 * to 'pending' so generate-cinemagraphs.js will regenerate them with the
 * new clean prompts.
 *
 * Usage:
 *   node scripts/kie/reset-cinemagraphs.js           # preview what will be deleted
 *   node scripts/kie/reset-cinemagraphs.js --confirm  # actually delete + reset
 */

const fs   = require('fs')
const path = require('path')

const ROOT     = path.join(__dirname, '..', '..')
const CIN_DIR  = path.join(ROOT, 'public/generated/kie/cinemagraphs')
const SONG_DIR = path.join(ROOT, 'public/generated/kie/songs')
const CONFIRM  = process.argv.includes('--confirm')

const slugs = fs.readdirSync(CIN_DIR).filter(d => {
  return fs.existsSync(path.join(CIN_DIR, d, 'loop.mp4'))
})

console.log(`\n── Cinemagraph Reset ──────────────────────────────────────────`)
console.log(`   Found: ${slugs.length} generated cinemagraphs`)
if (!CONFIRM) console.log(`   (dry-run — add --confirm to actually delete)\n`)

let deleted = 0, reset = 0, noManifest = 0

for (const slug of slugs) {
  const loopPath     = path.join(CIN_DIR, slug, 'loop.mp4')
  const manifestPath = path.join(SONG_DIR, `${slug}.json`)

  const sizeMB = (fs.statSync(loopPath).size / 1024 / 1024).toFixed(1)
  console.log(`   ${CONFIRM ? '✗ DELETE' : '  would delete'} ${slug}/loop.mp4  (${sizeMB}MB)`)

  if (CONFIRM) {
    fs.unlinkSync(loopPath)
    deleted++
  }

  // Reset manifest status
  if (fs.existsSync(manifestPath)) {
    const m = JSON.parse(fs.readFileSync(manifestPath))
    const cin = m.generatedAssets?.cinemagraph
    if (cin) {
      const oldStatus = cin.status
      if (CONFIRM) {
        cin.status      = 'pending'
        cin.taskId      = null
        cin.submittedAt = null
        cin.completedAt = null
        cin.prompt      = null
        cin.videoLoopPath = null
        cin.localPath   = null
        cin.remoteUrl   = null
        m.updatedAt     = new Date().toISOString()
        fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2))
        reset++
        console.log(`             → manifest reset (was: ${oldStatus})`)
      } else {
        console.log(`             → would reset manifest (currently: ${oldStatus})`)
      }
    }
  } else {
    noManifest++
    console.log(`             → no manifest found`)
  }
}

console.log(`\n── Summary ──────────────────────────────────────────────────`)
if (CONFIRM) {
  console.log(`   Deleted: ${deleted} loop.mp4 files`)
  console.log(`   Reset:   ${reset} manifests to 'pending'`)
  if (noManifest > 0) console.log(`   No manifest: ${noManifest} slugs`)
  console.log(`\n   Next: node scripts/kie/generate-cinemagraphs.js`)
} else {
  console.log(`   Would delete: ${slugs.length} files`)
  console.log(`\n   Run with --confirm to proceed.`)
}
