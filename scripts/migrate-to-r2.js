#!/usr/bin/env node
/**
 * Migrates all local media URLs to Cloudflare R2 CDN URLs.
 * Run after rclone sync is complete.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const R2_BASE = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'
const ROOT = path.join(__dirname, '..')

// ── Helpers ──────────────────────────────────────────────────────────────────

function replaceLocalUrls(obj) {
  if (typeof obj === 'string') {
    // Replace any local /Videos/, /images/, /Audio/, /Books/ path
    if (obj.match(/^\/(Videos|images|Audio|Books)\//)) {
      return `${R2_BASE}${obj}`
    }
    return obj
  }
  if (Array.isArray(obj)) return obj.map(replaceLocalUrls)
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(obj)) out[k] = replaceLocalUrls(v)
    return out
  }
  return obj
}

function updateJson(filePath) {
  if (!fs.existsSync(filePath)) { console.log(`  SKIP (not found): ${filePath}`); return 0 }
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)
  const updated = replaceLocalUrls(data)
  const newRaw = JSON.stringify(updated, null, 2)
  if (raw === newRaw) { console.log(`  unchanged: ${path.relative(ROOT, filePath)}`); return 0 }
  fs.writeFileSync(filePath, newRaw)
  console.log(`  ✓ updated: ${path.relative(ROOT, filePath)}`)
  return 1
}

// ── JSON files to update ─────────────────────────────────────────────────────

const JSON_FILES = [
  'public/lyric-videos.json',
  'public/images/song-art/manifest.json',
  'public/images/gallery/manifest.json',
  'public/images/artist/manifest.json',
  'public/images/backgrounds/manifest.json',
  'public/images/chapter-banners/manifest.json',
  'public/images/lyric-backgrounds/manifest.json',
  'public/images/merch/manifest.json',
  'public/images/social/manifest.json',
  'public/images/album-covers/manifest.json',
]

console.log('\n── Updating JSON manifests ──────────────────────────────────')
let changed = 0
for (const rel of JSON_FILES) {
  changed += updateJson(path.join(ROOT, rel))
}
console.log(`\n${changed} file(s) updated.\n`)

// ── Verify a sample URL is reachable ────────────────────────────────────────

console.log('── Verifying R2 connectivity ────────────────────────────────')
try {
  const testUrl = `${R2_BASE}/Videos/lyrics/why.mp4`
  execSync(`curl -s -o /dev/null -w "%{http_code}" --head "${testUrl}"`, { stdio: 'pipe' })
  const code = execSync(`curl -s -o /dev/null -w "%{http_code}" --head "${testUrl}"`).toString().trim()
  if (code === '200' || code === '206') {
    console.log(`  ✓ Sample file reachable (HTTP ${code}): ${testUrl}`)
  } else {
    console.log(`  ⚠ HTTP ${code} for ${testUrl} — check bucket public access setting`)
  }
} catch {
  console.log('  ⚠ Could not verify sample URL — check connectivity')
}

console.log('\nDone. Next steps:')
console.log('  1. Run: npm run build')
console.log('  2. Run: sudo pm2 restart noiraciel')
console.log('  3. After confirming site works: rm -rf public/Videos/ public/images/ public/Audio/ public/Books/')
console.log(`  4. Freed space: ~17 GB\n`)
