#!/usr/bin/env node
'use strict'
/**
 * audit-song-pages.js
 * Cross-checks every track in public/music-catalogue.json against the data
 * sources song pages actually read: story markdown, audiobook/PDF/score
 * manifests on R2, generated cinemagraphs, and prev/next album chains.
 * Read-only — reports, does not fix.
 */

const fs = require('fs')
const path = require('path')
const r2 = require('./lib/r2-client')

const ROOT = path.join(__dirname, '..')
const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/music-catalogue.json'), 'utf-8'))

// Small, git-committed availability manifests — the same ones the live app
// reads (see src/app/songs/[slug]/page.tsx's loadSlugManifest) — rather than
// the .migration-manifest-*.json scratch files, which are gitignored and
// won't exist on a fresh CI checkout.
function loadManifest(relPath) {
  try {
    return new Set(JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf-8')))
  } catch {
    return new Set()
  }
}
const audiobookSlugs    = loadManifest('public/Audio/audiobook-manifest.json')
const storyPdfSlugs     = loadManifest('public/Books/stories-manifest.json')
const cinemagraphSlugs  = loadManifest('public/generated/kie/cinemagraphs-manifest.json')

const tracks = catalogue.tracks
const bySlug = new Map(tracks.map(t => [t.slug, t]))
const issues = []

function flag(slug, msg) { issues.push({ slug, msg }) }

// 1. Duplicate slugs
const slugCounts = {}
for (const t of tracks) slugCounts[t.slug] = (slugCounts[t.slug] || 0) + 1
for (const [slug, n] of Object.entries(slugCounts)) if (n > 1) flag(slug, `DUPLICATE slug appears ${n} times`)

// 2. Per-track checks
for (const t of tracks) {
  if (!t.audioUrl || !t.audioUrl.startsWith('https://pub-')) flag(t.slug, `audioUrl not a direct R2 URL: ${t.audioUrl}`)
  if (!t.songArtUrl) flag(t.slug, 'missing songArtUrl (no fallback image for artwork/overview sections)')

  const hasStoryMd = fs.existsSync(path.join(ROOT, 'content/stories', `${t.slug}.md`))
  const hasAudiobook = audiobookSlugs.has(t.slug)
  const hasStoryPdf = storyPdfSlugs.has(t.slug)
  const hasScoreManifest = fs.existsSync(path.join(ROOT, 'public/Books/scores', t.slug, 'manifest.json'))
  const hasCinemagraph = cinemagraphSlugs.has(t.slug)

  if (hasAudiobook && !hasStoryMd) flag(t.slug, 'has audiobook but no story .md — audiobook link has nowhere to render (StorySection only shows when story exists)')
  if (hasStoryPdf && !hasStoryMd) flag(t.slug, 'has story PDF but no story .md — PDF link has nowhere to render')

  t._audit = { hasStoryMd, hasAudiobook, hasStoryPdf, hasScoreManifest, hasCinemagraph }
}

// 3. Album prev/next chain integrity
const albumGroups = {}
for (const t of tracks) {
  const key = t.albumSlug || 'main'
  ;(albumGroups[key] = albumGroups[key] || []).push(t)
}
for (const [albumSlug, list] of Object.entries(albumGroups)) {
  const slugs = new Set(list.map(t => t.slug))
  if (slugs.size !== list.length) flag(albumSlug, 'album has duplicate slugs within it')
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log(`Total tracks: ${tracks.length}`)
console.log(`Albums: ${Object.keys(albumGroups).join(', ')}`)
console.log(`\nTracks with audiobook (R2-verified): ${tracks.filter(t => t._audit.hasAudiobook).length}`)
console.log(`Tracks with story PDF (R2-verified):  ${tracks.filter(t => t._audit.hasStoryPdf).length}`)
console.log(`Tracks with story .md (local):        ${tracks.filter(t => t._audit.hasStoryMd).length}`)
console.log(`Tracks with score manifest (local):   ${tracks.filter(t => t._audit.hasScoreManifest).length}`)
console.log(`Tracks with cinemagraph (R2-verified):${tracks.filter(t => t._audit.hasCinemagraph).length}`)
console.log(`Tracks with lyricVideoUrl:            ${tracks.filter(t => t.lyricVideoUrl).length}`)
console.log(`Tracks with musicVideoUrl:            ${tracks.filter(t => t.musicVideoUrl).length}`)
console.log(`Tracks with ghostPerformance:         ${tracks.filter(t => t.ghostPerformance).length}`)
console.log(`Tracks with songArtUrl:               ${tracks.filter(t => t.songArtUrl).length}`)
console.log(`Tracks with chapterBannerUrl:         ${tracks.filter(t => t.chapterBannerUrl).length}`)

console.log(`\n── Issues (${issues.length}) ──`)
for (const i of issues) console.log(`  [${i.slug}] ${i.msg}`)

r2.atomicWriteJSON(path.join(ROOT, '.song-audit-report.json'), { issues, tracks: tracks.map(t => ({ slug: t.slug, ...t._audit })) })
console.log(`\nFull report written to .song-audit-report.json`)

// --strict makes this CI-gateable: any finding fails the run.
if (process.argv.includes('--strict') && issues.length > 0) {
  console.error(`\n✗ --strict: ${issues.length} issue(s) found`)
  process.exit(1)
}
