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

const ROOT = path.join(__dirname, '..')
const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/music-catalogue.json'), 'utf-8'))
const audioManifest = JSON.parse(fs.readFileSync(path.join(ROOT, '.migration-manifest-audio.json'), 'utf-8'))
const booksManifest = JSON.parse(fs.readFileSync(path.join(ROOT, '.migration-manifest-books.json'), 'utf-8'))
const generatedManifest = JSON.parse(fs.readFileSync(path.join(ROOT, '.migration-manifest-generated.json'), 'utf-8'))

const audiobookSlugs = new Set(
  Object.keys(audioManifest).filter(k => k.startsWith('audiobook/')).map(k => k.replace(/^audiobook\//, '').replace(/\.mp3$/, ''))
)
const storyPdfSlugs = new Set(
  Object.keys(booksManifest).filter(k => k.startsWith('stories/') && k.endsWith('.pdf')).map(k => k.replace(/^stories\//, '').replace(/\.pdf$/, ''))
)
const cinemagraphSlugs = new Set(
  Object.keys(generatedManifest).filter(k => k.startsWith('cinemagraphs/') && k.endsWith('loop.mp4')).map(k => k.split('/')[1])
)

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

fs.writeFileSync(path.join(ROOT, '.song-audit-report.json'), JSON.stringify({ issues, tracks: tracks.map(t => ({ slug: t.slug, ...t._audit })) }, null, 2))
console.log(`\nFull report written to .song-audit-report.json`)
