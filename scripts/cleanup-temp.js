#!/usr/bin/env node
'use strict'
/**
 * cleanup-temp.js
 * Safely removes known temporary/scratch locations that should never
 * accumulate permanently on the server. Skips anything it can't delete
 * (e.g. permission-denied) rather than failing the whole run.
 *
 * Usage:
 *   node scripts/cleanup-temp.js            # delete
 *   node scripts/cleanup-temp.js --dry-run  # report sizes only
 */

const fs   = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')

const TARGETS = [
  path.join(ROOT, '.tmp'),               // render scratch (clips/, concat.txt, silent.mp4 — all regenerable)
  path.join(ROOT, '.next_build'),        // dead build dir — distDir is .next_out
  '/tmp/noiraciel-renders',              // standard render-intermediate location
]

function sizeOf(p) {
  try { return execSync(`du -sh "${p}" 2>/dev/null | cut -f1`).toString().trim() } catch { return '0' }
}

function removeSafely(p) {
  if (!fs.existsSync(p)) return { skipped: true }
  const size = sizeOf(p)
  if (DRY_RUN) {
    console.log(`[dry-run] would remove ${p} (${size})`)
    return { size }
  }
  // Shell out rather than fs.rmSync: rm -rf skips past individual EACCES
  // files and still removes everything it can, instead of aborting the
  // whole subtree on the first permission error.
  try {
    execSync(`rm -rf "${p}"`, { stdio: 'pipe' })
    console.log(`removed ${p} (${size})`)
    return { size }
  } catch {
    const remaining = fs.existsSync(p) ? execSync(`find "${p}" -type f 2>/dev/null | wc -l`).toString().trim() : '0'
    console.warn(`partially removed ${p} (was ${size}) — ${remaining} file(s) left, likely root-owned. Needs sudo cleanup.`)
    return { size, partial: true }
  }
}

console.log(`── Cleanup ${DRY_RUN ? '(dry run)' : ''} ──────────────────────────`)
for (const t of TARGETS) removeSafely(t)

const free = execSync("df -h / | awk 'NR==2{print $4}'").toString().trim()
console.log(`Disk free: ${free}`)
