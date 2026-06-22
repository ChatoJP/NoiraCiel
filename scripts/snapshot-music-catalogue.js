#!/usr/bin/env node
'use strict'
/**
 * snapshot-music-catalogue.js
 * Regenerates public/music-catalogue.json — the static snapshot musicScanner.ts
 * reads in production (Music/ lives in R2, not on the server).
 *
 * Run this against a server that still has a local Music/ folder (so
 * scanMusicFolder()'s live-scan fallback can read titles/durations/lyrics),
 * then it rewrites any /api/audio/ URLs in the result to direct R2 URLs.
 *
 * Usage:
 *   node scripts/snapshot-music-catalogue.js [http://localhost:3000]
 */

const fs   = require('fs')
const path = require('path')
const http = require('http')

const SERVER_URL = process.argv[2] || 'http://localhost:3000'
const R2_BASE     = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'
const OUT_PATH    = path.join(__dirname, '..', 'public', 'music-catalogue.json')

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} from ${url}`))
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

async function main() {
  console.log(`Fetching catalogue from ${SERVER_URL}/api/music ...`)
  const catalogue = await fetchJson(`${SERVER_URL}/api/music`)

  let swapped = 0
  for (const t of catalogue.tracks || []) {
    if (typeof t.audioUrl === 'string' && t.audioUrl.startsWith('/api/audio/')) {
      t.audioUrl = `${R2_BASE}/music/${t.audioUrl.slice('/api/audio/'.length)}`
      swapped++
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(catalogue, null, 2))
  console.log(`Wrote ${OUT_PATH}`)
  console.log(`  tracks: ${catalogue.tracks?.length ?? 0}, audioUrls rewritten to R2: ${swapped}`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
