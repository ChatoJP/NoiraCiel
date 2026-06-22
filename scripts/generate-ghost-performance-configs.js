#!/usr/bin/env node
'use strict'
/**
 * generate-ghost-performance-configs.js
 * Fills in public/ghost-performance/config.json for every track that doesn't
 * have a Ghost Performance entry yet, using per-album instrument pools that
 * mirror the album's genre (same spirit as the 17 hand-authored main-album
 * entries already in the file). Pure metadata — no media, no API calls.
 */

const fs = require('fs')
const path = require('path')
const r2 = require('./lib/r2-client')

const ROOT = path.join(__dirname, '..')
const CONFIG_PATH = path.join(ROOT, 'public/ghost-performance/config.json')
const CATALOGUE_PATH = path.join(ROOT, 'public/music-catalogue.json')

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf-8'))

// Per-album instrument pools (primary rotates through these; secondary picks
// the next one or two in the list) + visual identity matching genre/mood.
const ALBUM_PROFILES = {
  'jazz-sessions':       { instruments: ['piano', 'bass', 'drums', 'strings', 'guitar'], visualStyle: 'noir-cinematic', accentColors: ['gold-white', 'blue-gold'] },
  'still-we-sail':       { instruments: ['strings', 'guitar', 'piano'],                  visualStyle: 'atmospheric',    accentColors: ['blue-silver', 'blue-gold'] },
  'blind-angel':         { instruments: ['guitar', 'drums', 'bass', 'strings'],          visualStyle: 'dark-minimal',   accentColors: ['red-gold'] },
  'the-sacred-drift':    { instruments: ['strings', 'synth', 'piano', 'choir'],          visualStyle: 'atmospheric',    accentColors: ['blue-silver', 'green-blue'] },
  'the-velvet-machine':  { instruments: ['piano', 'synth', 'strings'],                  visualStyle: 'noir-cinematic', accentColors: ['blue-gold', 'gold-white'] },
  'whats-youre-made-of': { instruments: ['bass', 'drums', 'piano', 'strings'],          visualStyle: 'noir-cinematic', accentColors: ['red-gold', 'gold-white'] },
  'world-musics':        { instruments: ['strings', 'drums', 'guitar', 'piano'],         visualStyle: 'atmospheric',    accentColors: ['green-blue', 'blue-silver'] },
  'reggae-sessions':     { instruments: ['guitar', 'bass', 'drums'],                     visualStyle: 'atmospheric',    accentColors: ['green-blue'] },
}

let added = 0
for (const t of catalogue.tracks) {
  if (config[t.slug]) continue
  const profile = ALBUM_PROFILES[t.albumSlug]
  if (!profile) continue // main album already fully configured by hand

  const idx = t.trackNumber ?? 0
  const pool = profile.instruments
  const primary = pool[idx % pool.length]
  const secondary1 = pool[(idx + 1) % pool.length]
  const secondary2 = pool[(idx + 2) % pool.length]
  const accentColor = profile.accentColors[idx % profile.accentColors.length]

  config[t.slug] = {
    enabled: true,
    mode: 'auto',
    primaryInstrument: primary,
    secondaryInstruments: secondary1 === primary ? [secondary2] : [secondary1],
    inputPriority: ['midi', 'stems', 'audio'],
    visualStyle: profile.visualStyle,
    accentColor,
    showInstrument: true,
    showParticles: idx % 2 === 0,
    showWaveform: false,
    cameraMode: 'static',
  }
  added++
}

r2.atomicWriteJSON(CONFIG_PATH, config)
console.log(`Added ${added} Ghost Performance configs to public/ghost-performance/config.json`)

// Patch the catalogue snapshot too (same pattern used for lyricVideoUrl).
let patched = 0
for (const t of catalogue.tracks) {
  if (config[t.slug] && JSON.stringify(t.ghostPerformance) !== JSON.stringify(config[t.slug])) {
    t.ghostPerformance = config[t.slug]
    patched++
  }
}
r2.atomicWriteJSON(CATALOGUE_PATH, catalogue)
console.log(`Patched ghostPerformance for ${patched} tracks in music-catalogue.json`)
