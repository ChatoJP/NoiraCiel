#!/usr/bin/env node
'use strict'
/**
 * generate-cinemagraph-prompts.js
 * Generates Kling 2.6 image-to-video prompts for every song that has artwork.
 *
 * Result: updates generatedAssets.cinemagraph.prompt in each manifest.
 *
 * Usage: node scripts/kie/generate-cinemagraph-prompts.js [--slug why]
 */

const fs   = require('fs')
const path = require('path')

const ROOT     = path.join(__dirname, '..', '..')
const SONG_DIR = path.join(ROOT, 'public', 'generated', 'kie', 'songs')
const TARGET   = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null

// ─── Animation archetypes ─────────────────────────────────────────────────────
// Maps mood/symbol keywords to a subtle animation type.
// Keeps every cinemagraph purposeful, not arbitrary.
const ANIMATION_TYPES = [
  { key: 'ocean',  words: ['ocean','sea','atlantic','wave','water','current','coastal'],     type: 'ocean_breathing',   motion: 'the water surface breathes slowly, near-imperceptible swells, foam edge dissolves and returns, horizon steady' },
  { key: 'fog',    words: ['fog','mist','vapour','smoke','haze','drift'],                    type: 'fog_drift',         motion: 'thin fog rolls slowly across the mid-ground, barely visible, the background untouched and still' },
  { key: 'light',  words: ['light','candle','lamp','flame','fire','glow','ember','gold'],    type: 'light_flicker',     motion: 'a single light source pulses with slow organic warmth, a breath-like rhythm, surrounding darkness unchanged' },
  { key: 'leaves', words: ['garden','tree','leaves','branch','roots','earth','seed'],        type: 'leaf_breath',       motion: 'one or two leaves at the edge of frame shift imperceptibly in a slow unseen wind, the rest perfectly still' },
  { key: 'rain',   words: ['rain','storm','tears','window','glass'],                        type: 'rain_on_glass',     motion: 'a single droplet traces down a glass surface, slowly, one at a time, the rest of the frame absolutely still' },
  { key: 'shadow', words: ['shadow','dark','darkness','void','absence','silence','night'],   type: 'shadow_breathe',    motion: 'deep shadows at the edges pulse with a slow breath, darkness contracting and expanding barely perceptibly' },
  { key: 'road',   words: ['road','path','walk','journey','horizon','distance'],             type: 'heat_shimmer',      motion: 'the air above the distant road shimmers slightly with heat, a barely visible atmospheric distortion' },
  { key: 'face',   words: ['face','figure','person','woman','man','child','hands'],          type: 'subtle_breath',     motion: 'the figure\'s clothing shifts almost imperceptibly with a slow breath, the rest of the scene frozen in dignity' },
  { key: 'sky',    words: ['sky','cloud','star','heaven','heaven burns','night sky'],        type: 'cloud_slow_drift',  motion: 'clouds drift with glacial slowness across the frame, stars barely pulse, a breath-scale movement only' },
  { key: 'wing',   words: ['wing','wings','angel','feather','flight','fall','rise'],         type: 'feather_fall',      motion: 'a single feather or the hem of a garment shifts at the very edge of stillness, everything else motionless' },
]

const DEFAULT_MOTION = 'the scene breathes almost imperceptibly — a single element at the edge of stillness moves with glacial slowness while the rest of the image remains an absolute painting'
const DEFAULT_TYPE   = 'atmospheric_breath'

function detectAnimation(symbols, emotion, scene) {
  const text = [symbols, emotion, scene].filter(Boolean).join(' ').toLowerCase()
  for (const anim of ANIMATION_TYPES) {
    if (anim.words.some(w => text.includes(w))) {
      return { type: anim.type, motion: anim.motion }
    }
  }
  return { type: DEFAULT_TYPE, motion: DEFAULT_MOTION }
}

function buildCinemagraphPrompt(manifest) {
  const { title, album, emotion, symbols, scene, mood, style, animationType: existing } = manifest
  const anim = detectAnimation(symbols, emotion, scene)

  const sceneDescription = scene
    ? scene.split('.')[0]  // first sentence only
    : `a premium cinematic still image from the world of "${title}"`

  return {
    animationType: anim.type,
    prompt: [
      `Subtle cinemagraph animation from a still image.`,
      `Scene: ${sceneDescription}.`,
      anim.motion ? `Motion: ${anim.motion}.` : '',
      `Loop: seamless 4-second breathing loop. Hold on the still for 2 seconds before motion begins.`,
      `No camera movement. No subject repositioning. Single element animates only.`,
      `Mood: ${emotion ?? mood}.`,
      `Do not add: text, faces (unless already present), neon, speed, drama. Add only: time.`,
      `Visual reference: ${symbols ?? 'dark Atlantic, painterly, film grain'}.`,
      `16mm film grain texture. Deep navy and warm amber palette. Cinematic dignity.`,
      `Output: seamless MP4 loop, 4-8 seconds, ready for autoPlay muted video tag.`,
    ].filter(Boolean).join(' '),
    klingPayload: {
      model: 'kling-2.6',
      mode: 'image_to_video',
      duration: '5',
      cfg_scale: 0.5,
      prompt: `${anim.motion}. Seamless loop. Minimal motion. Dark Atlantic mood. 16mm grain. No text.`,
    },
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(SONG_DIR)) {
    console.error('✗ Song manifests not found. Run generate-kie-manifest.js first.')
    process.exit(1)
  }

  const files = fs.readdirSync(SONG_DIR)
    .filter(f => f.endsWith('.json'))
    .filter(f => !TARGET || f === `${TARGET}.json`)

  console.log(`\n── Cinemagraph Prompt Generator ────────────────────────────`)
  console.log(`   Processing: ${files.length} manifests${TARGET ? ` (--slug ${TARGET})` : ''}\n`)

  let updated = 0, skipped = 0, blocked = 0

  for (const file of files) {
    const fp  = path.join(SONG_DIR, file)
    const man = JSON.parse(fs.readFileSync(fp, 'utf-8'))

    if (!man.artworkPath && !man.artworkUrl) {
      console.log(`  BLOCKED (no artwork): ${man.slug}`)
      man.generatedAssets.cinemagraph.status = 'blocked'
      man.generatedAssets.cinemagraph.error  = 'no_artwork'
      man.readiness.cinemagraph = 'missing_artwork'
      blocked++
    } else {
      const { animationType, prompt, klingPayload } = buildCinemagraphPrompt(man)

      man.generatedAssets.cinemagraph.status        = 'prompt_ready'
      man.generatedAssets.cinemagraph.prompt        = prompt
      man.generatedAssets.cinemagraph.animationType = animationType
      man.generatedAssets.cinemagraph.sourceImagePath = man.artworkPath
      man.generatedAssets.cinemagraph.sourceImageUrl  = man.artworkUrl
      man.generatedAssets.cinemagraph.klingPayload  = klingPayload
      man.generatedAssets.cinemagraph.videoLoopPath = `public/generated/kie/cinemagraphs/${man.slug}/loop.mp4`
      man.generatedAssets.cinemagraph.publicUrl     = `/generated/kie/cinemagraphs/${man.slug}/loop.mp4`
      man.readiness.cinemagraph = 'prompt_ready'
      console.log(`  ✓ ${man.slug.padEnd(45)} [${animationType}]`)
      updated++
    }

    man.updatedAt = new Date().toISOString()
    fs.writeFileSync(fp, JSON.stringify(man, null, 2), 'utf-8')
  }

  console.log(`\n── Summary ───────────────────────────────────────────────`)
  console.log(`   Prompts written: ${updated}`)
  console.log(`   Blocked:         ${blocked} (no artwork)`)
  console.log(`   Skipped:         ${skipped}`)
  console.log(`\nNext: node scripts/kie/generate-song-film-prompts.js\n`)
}

main()
