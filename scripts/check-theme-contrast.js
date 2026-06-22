#!/usr/bin/env node
'use strict'
/**
 * check-theme-contrast.js
 * WCAG contrast check for every theme's accentRgb against its bgTintRgb —
 * the pairing actually rendered (accent-colored labels/captions on the
 * album's background tint). Re-run after editing src/lib/themes.ts.
 *
 * Usage: node scripts/check-theme-contrast.js [--strict]
 */

const fs = require('fs')
const path = require('path')

const strict = process.argv.includes('--strict')
const themesSrc = fs.readFileSync(path.join(__dirname, '../src/lib/themes.ts'), 'utf-8')

// Pull accentRgb/bgTintRgb pairs out of the TS source without a full
// TS toolchain — simple enough structure for a regex pass.
const themeBlocks = [...themesSrc.matchAll(/'([\w-]+)':\s*{([^}]+)}/g)]
const themes = {}
for (const [, name, body] of themeBlocks) {
  const accent = body.match(/accentRgb:\s*'([^']+)'/)
  const bg = body.match(/bgTintRgb:\s*'([^']+)'/)
  if (accent && bg) themes[name] = { accent: accent[1], bg: bg[1] }
}

function relLum([r, g, b]) {
  const srgb = [r, g, b].map((v) => {
    v = v / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}
function contrastRatio(rgb1, rgb2) {
  const l1 = relLum(rgb1), l2 = relLum(rgb2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
function parseRgb(s) { return s.split(',').map((n) => parseInt(n.trim(), 10)) }

const IVORY = [242, 237, 227]
const AA_SMALL = 4.5

console.log('Theme'.padEnd(18), 'Accent-on-BG'.padEnd(14), 'Ivory-on-BG'.padEnd(13), `AA-small(${AA_SMALL})`)
let failures = 0
for (const [name, t] of Object.entries(themes)) {
  const accentRatio = contrastRatio(parseRgb(t.accent), parseRgb(t.bg))
  const ivoryRatio = contrastRatio(IVORY, parseRgb(t.bg))
  const pass = accentRatio >= AA_SMALL
  if (!pass) failures++
  console.log(name.padEnd(18), accentRatio.toFixed(2).padEnd(14), ivoryRatio.toFixed(2).padEnd(13), pass ? 'PASS' : 'FAIL')
}

console.log(`\n${Object.keys(themes).length - failures}/${Object.keys(themes).length} themes pass AA for small text`)
if (strict && failures > 0) {
  console.error(`✗ --strict: ${failures} theme(s) fail WCAG AA`)
  process.exit(1)
}
