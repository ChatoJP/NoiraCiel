#!/usr/bin/env node
'use strict'
/**
 * migrate-media-to-r2.js
 * Staged local → R2 migration. Processes one file at a time:
 *   check disk space → upload → verify → (optionally) delete local → next file.
 * Stops the whole batch immediately on the first failure and never deletes
 * anything from a batch that didn't fully succeed.
 *
 * Usage:
 *   node scripts/migrate-media-to-r2.js --category art [--delete] [--dry-run]
 *
 * Categories are defined in CATEGORIES below. --delete actually removes the
 * local file after a verified upload; without it, this only copies to R2 and
 * writes a manifest (safe, additive, repeatable).
 */

const fs   = require('fs')
const path = require('path')
const r2   = require('./lib/r2-client')

const ROOT = path.join(__dirname, '..')

const CATEGORIES = {
  art:      { dir: 'art',                    prefix: 'art' },
  images:   { dir: 'public/images',          prefix: 'images' },
  audio:    { dir: 'public/Audio',           prefix: 'Audio' },
  books:    { dir: 'public/Books',           prefix: 'Books' },
  generated:{ dir: 'public/generated/kie',   prefix: 'generated/kie' },
  music:    { dir: 'Music',                  prefix: 'music' },
}

const args     = process.argv.slice(2)
const category = args.includes('--category') ? args[args.indexOf('--category') + 1] : null
const DO_DELETE = args.includes('--delete')
const DRY_RUN   = args.includes('--dry-run')

if (!category || !CATEGORIES[category]) {
  console.error(`Usage: node scripts/migrate-media-to-r2.js --category <${Object.keys(CATEGORIES).join('|')}> [--delete] [--dry-run]`)
  process.exit(1)
}

const { dir, prefix } = CATEGORIES[category]
const localRoot = path.join(ROOT, dir)
const manifestPath = path.join(ROOT, `.migration-manifest-${category}.json`)

function walk(d) {
  const out = []
  if (!fs.existsSync(d)) return out
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    // Manifests/state/metadata/scripts are small text files that stay on the
    // server per architecture rules — only actual media gets migrated.
    if (entry.name.startsWith('.') || /\.(json|txt|md)$/i.test(entry.name)) continue
    const full = path.join(d, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

async function main() {
  r2.assertConfigured()

  const files = walk(localRoot)
  if (!files.length) {
    r2.log(`No files found under ${dir} — nothing to do.`)
    return
  }

  r2.log(`── Migrating "${category}" ─────────────────────────────`)
  r2.log(`  Source:  ${dir}  (${files.length} files)`)
  r2.log(`  R2 key prefix: ${prefix}/`)
  r2.log(`  Delete local after verify: ${DO_DELETE}`)
  if (DRY_RUN) r2.log(`  DRY RUN — no network calls, no deletes`)

  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) : {}
  let ok = 0, skipped = 0

  for (const [i, localPath] of files.entries()) {
    const rel = path.relative(localRoot, localPath).split(path.sep).join('/')
    const r2Key = `${prefix}/${rel}`

    if (manifest[rel] && manifest[rel].verified) {
      skipped++
      // Already uploaded+verified in a prior (upload-only) run — honor a
      // later --delete pass without re-uploading.
      if (DO_DELETE && !manifest[rel].deletedLocal && fs.existsSync(localPath)) {
        try {
          fs.unlinkSync(localPath)
          manifest[rel].deletedLocal = true
          r2.atomicWriteJSON(manifestPath, manifest)
          r2.log(`local file deleted (already verified earlier): ${localPath}`)
        } catch (e) {
          r2.warn(`  (left in place — needs sudo cleanup later: ${rel}) ${e.code || e.message}`)
        }
      }
      continue
    }

    const space = r2.checkDiskSpace(300)
    if (!space.ok) {
      r2.err(`Disk space too low (${space.freeMb}MB free) — stopping batch before file ${i + 1}/${files.length}: ${rel}`)
      process.exit(1)
    }

    if (DRY_RUN) {
      r2.log(`[dry-run] would upload ${rel} → ${r2Key}`)
      continue
    }

    try {
      const { r2Url, deletedLocal } = await r2.migrateFile(localPath, r2Key, { deleteLocal: DO_DELETE })
      manifest[rel] = { r2Key, r2Url, verified: true, deletedLocal, at: new Date().toISOString() }
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      ok++
      if (DO_DELETE && !deletedLocal) r2.warn(`  (left in place — needs sudo cleanup later: ${rel})`)
      if ((i + 1) % 25 === 0) r2.log(`  progress: ${i + 1}/${files.length}`)
    } catch (e) {
      r2.err(`Upload failed for ${rel}: ${e.message}`)
      r2.err(`Stopping batch. Local file left untouched. ${ok} file(s) succeeded before this failure.`)
      process.exit(1)
    }
  }

  r2.log(`── Done: ${ok} uploaded, ${skipped} already done, manifest: .migration-manifest-${category}.json`)
}

main().catch((e) => { r2.err(e.message); process.exit(1) })
