#!/usr/bin/env node
'use strict'
/**
 * validate-kie-assets.js
 * Reads all manifests and produces a full readiness/gap report.
 *
 * Shows for every song and product:
 *   - which asset types are ready to generate
 *   - which are blocked (missing artwork / lyrics / context)
 *   - which have already been generated
 *   - cost estimate for all "ready" items
 *
 * Usage: node scripts/kie/validate-kie-assets.js [--json]
 *
 * --json   Output machine-readable JSON instead of terminal table
 */

const fs   = require('fs')
const path = require('path')

const ROOT     = path.join(__dirname, '..', '..')
const SONG_DIR = path.join(ROOT, 'public', 'generated', 'kie', 'songs')
const OBJ_DIR  = path.join(ROOT, 'public', 'generated', 'kie', 'objects')
const JSON_OUT = process.argv.includes('--json')

// Rough per-asset cost estimates (USD, 2026 KIE.AI pricing)
const COST = {
  cinemagraph:    { calls: 1, low: 0.08, high: 0.30 },
  songFilm:       { calls: 5, low: 1.20, high: 3.50 },
  commentary_tts: { calls: 1, low: 0.05, high: 0.20 },
  commentary_avatar: { calls: 1, low: 0.50, high: 2.00 },
  audiobook_tts:  { calls: 1, low: 0.05, high: 0.20 },
  audiobook_score:{ calls: 1, low: 0.10, high: 0.50 },
  product_photo:  { calls: 1, low: 0.03, high: 0.15 },
  product_loop:   { calls: 1, low: 0.08, high: 0.30 },
}

function readDir(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) }
      catch { return null }
    })
    .filter(Boolean)
}

function statusIcon(status) {
  switch(status) {
    case 'complete':      return '✓'
    case 'prompt_ready':  return '◎'
    case 'blocked':       return '✗'
    case 'not_started':   return '·'
    case 'generating':    return '⟳'
    default:              return '?'
  }
}

function costRange(type, count = 1) {
  const c = COST[type]
  if (!c) return ''
  return `$${(c.low * count).toFixed(2)}–$${(c.high * count).toFixed(2)}`
}

function main() {
  const songs    = readDir(SONG_DIR)
  const products = readDir(OBJ_DIR).filter(p => !fs.statSync(path.join(OBJ_DIR, p.slug || '_skip_')).isDirectory().valueOf() || true)

  if (!songs.length && !products.length) {
    console.error('✗ No manifests found. Run generate-kie-manifest.js first.')
    process.exit(1)
  }

  // ── Tabulate results ──────────────────────────────────────────────────────
  const report = { songs: [], products: [], totals: {} }

  const totals = {
    ready_cinemagraph:  0,
    ready_film:         0,
    ready_commentary:   0,
    ready_audiobook:    0,
    blocked_total:      0,
    complete_total:     0,
    cost_low:           0,
    cost_high:          0,
  }

  for (const s of songs) {
    const ga   = s.generatedAssets ?? {}
    const cin  = ga.cinemagraph?.status  ?? 'not_started'
    const film = ga.songFilm?.status     ?? 'not_started'
    const com  = ga.commentary?.status   ?? 'not_started'
    const ab   = ga.audiobook?.status    ?? 'not_started'

    if (cin  === 'prompt_ready') { totals.ready_cinemagraph++; totals.cost_low += COST.cinemagraph.low;    totals.cost_high += COST.cinemagraph.high }
    if (film === 'prompt_ready') { totals.ready_film++;        totals.cost_low += COST.songFilm.low;       totals.cost_high += COST.songFilm.high }
    if (com  === 'prompt_ready') { totals.ready_commentary++;  totals.cost_low += COST.commentary_tts.low; totals.cost_high += COST.commentary_tts.high }
    if (ab   === 'prompt_ready') { totals.ready_audiobook++;   totals.cost_low += COST.audiobook_tts.low + COST.audiobook_score.low; totals.cost_high += COST.audiobook_tts.high + COST.audiobook_score.high }
    if ([cin,film,com,ab].some(x => x === 'blocked')) totals.blocked_total++
    if ([cin,film,com,ab].some(x => x === 'complete')) totals.complete_total++

    report.songs.push({
      slug:        s.slug,
      title:       s.title,
      album:       s.albumSlug,
      trackNumber: s.trackNumber,
      readiness:   s.readiness,
      status: { cinemagraph: cin, songFilm: film, commentary: com, audiobook: ab },
      approved:    s.approvals,
      hasArtwork:  !!s.artworkPath,
      hasLyrics:   s.hasLyrics,
      hasStory:    !!s.storyPath,
    })
  }

  for (const p of products) {
    if (!p.slug) continue
    const photo = p.generatedAssets?.productPhoto?.status ?? 'not_started'
    const loop  = p.generatedAssets?.animatedLoop?.status  ?? 'not_started'
    if (photo === 'prompt_ready') { totals.cost_low += COST.product_photo.low; totals.cost_high += COST.product_photo.high }
    if (loop  === 'prompt_ready') { totals.cost_low += COST.product_loop.low;  totals.cost_high += COST.product_loop.high }
    report.products.push({ slug: p.slug, title: p.title, type: p.type, status: { photo, loop } })
  }

  report.totals = totals

  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  // ── Human-readable terminal output ───────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║         KIE.AI Asset Readiness Report — NoiraCiel           ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')
  console.log('  Legend: ✓=complete  ◎=prompt_ready  ·=not_started  ✗=blocked  ⟳=generating\n')

  console.log('  SONGS (' + songs.length + ' total)')
  console.log('  ' + '─'.repeat(90))
  console.log('  Slug'.padEnd(46) + 'Cin  Film  Com  Audio  Artwork  Lyrics  Story')
  console.log('  ' + '─'.repeat(90))

  const byAlbum = {}
  for (const s of report.songs) {
    const a = s.album ?? 'unknown'
    if (!byAlbum[a]) byAlbum[a] = []
    byAlbum[a].push(s)
  }

  for (const [albumSlug, tracks] of Object.entries(byAlbum)) {
    console.log(`\n  ◆ ${albumSlug}`)
    for (const s of tracks.sort((a,b) => (a.trackNumber??99) - (b.trackNumber??99))) {
      const { status } = s
      const row = [
        `  ${s.slug.slice(0,44).padEnd(44)}`,
        statusIcon(status.cinemagraph).padEnd(5),
        statusIcon(status.songFilm).padEnd(6),
        statusIcon(status.commentary).padEnd(5),
        statusIcon(status.audiobook).padEnd(7),
        (s.hasArtwork ? '✓' : '✗').padEnd(9),
        (s.hasLyrics  ? '✓' : '✗').padEnd(8),
        (s.hasStory   ? '✓' : '✗'),
      ].join('')
      console.log(row)
    }
  }

  console.log('\n  ' + '─'.repeat(90))
  console.log('\n  PRODUCTS (' + products.length + ' total)')
  console.log('  ' + '─'.repeat(60))
  for (const p of report.products) {
    console.log(`  ${p.slug.padEnd(36)} photo:${statusIcon(p.status.photo)}  loop:${statusIcon(p.status.loop)}`)
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║  COST ESTIMATE (if all prompt_ready assets are generated)   ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')
  console.log(`  Cinemagraphs ready:   ${totals.ready_cinemagraph} songs`)
  console.log(`  Song films ready:     ${totals.ready_film} songs`)
  console.log(`  Commentary ready:     ${totals.ready_commentary} songs`)
  console.log(`  Audiobooks ready:     ${totals.ready_audiobook} songs`)
  console.log(`  Blocked total:        ${totals.blocked_total} songs (missing source data)`)
  console.log(`  Already complete:     ${totals.complete_total}`)
  console.log(``)
  console.log(`  ── If ONLY cinemagraphs generated:`)
  console.log(`     ${totals.ready_cinemagraph} × ${costRange('cinemagraph')} = $${(totals.ready_cinemagraph * COST.cinemagraph.low).toFixed(2)}–$${(totals.ready_cinemagraph * COST.cinemagraph.high).toFixed(2)}`)
  console.log(``)
  console.log(`  ── Full pipeline (all types, all songs):`)
  console.log(`     Estimated total: $${totals.cost_low.toFixed(2)} – $${totals.cost_high.toFixed(2)}`)
  console.log(``)
  console.log(`  ⚠  KIE_DRY_RUN=true — no API credits spent.`)
  console.log(`     To generate: set approvals.{type}=true in a manifest, then run kie-runner.js --generate\n`)
}

main()
