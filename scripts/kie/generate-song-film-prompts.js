#!/usr/bin/env node
'use strict'
/**
 * generate-song-film-prompts.js
 * Builds a 4–6 shot cinematic film sequence for each song.
 *
 * Each shot is 10–14 seconds. Total film: ~60–80 seconds.
 * Model recommendation: Veo 3.1 (with native audio) or Kling 3.0 (multi-shot).
 *
 * Usage: node scripts/kie/generate-song-film-prompts.js [--slug why]
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const ROOT     = path.join(__dirname, '..', '..')
const SONG_DIR = path.join(ROOT, 'public', 'generated', 'kie', 'songs')
const TARGET   = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null

const NOIR_STYLE = `16mm film grain. Deep navy, pitch black, warm amber gold. Painterly.
Slow dolly or locked off. No handheld shake. No fast cuts. No text overlays. No neon.
Premium European art cinema. Long tonal range near-black to warm amber.
Atlantic world: coastline, fog, aged stone, old boats, candlelight, weathered hands, empty chairs.
Emotional dignity. Hope inside darkness. Beauty inside struggle. No stock-video clichés.`

// ─── Shot templates per album type ───────────────────────────────────────────

const ALBUM_SHOT_TEMPLATES = {
  'the-life-lessons': [
    { role: 'opening',  camera: 'slow push-in', framing: 'wide establishing' },
    { role: 'intimate', camera: 'locked close-up', framing: 'hands or face detail' },
    { role: 'memory',   camera: 'gentle dolly or overhead', framing: 'symbolic object' },
    { role: 'turning',  camera: 'slow rack focus', framing: 'two planes of depth' },
    { role: 'closing',  camera: 'slow pull-back', framing: 'wide, figure small in frame' },
  ],
  'blind-angel': [
    { role: 'invocation',  camera: 'low angle push-up', framing: 'silhouette against sky' },
    { role: 'confrontation', camera: 'locked extreme close-up', framing: 'eyes or hands' },
    { role: 'fall',        camera: 'slow downward tilt', framing: 'descent, wings, fire' },
    { role: 'fire',        camera: 'slow orbit', framing: 'flame or burning object' },
    { role: 'rising',      camera: 'slow push-up skyward', framing: 'wide, luminous sky' },
  ],
  'jazz-sessions': [
    { role: 'atmosphere',  camera: 'slow pan', framing: 'venue or room in low light' },
    { role: 'hands',       camera: 'locked close-up', framing: 'musician\'s hands or keys' },
    { role: 'face',        camera: 'gentle push-in', framing: 'closed eyes, concentrated' },
    { role: 'breath',      camera: 'locked wide', framing: 'smoke or steam, slow motion' },
    { role: 'resolution',  camera: 'slow pull-back', framing: 'empty venue, last light' },
  ],
  'world-musics': [
    { role: 'opening',   camera: 'aerial slow drift', framing: 'landscape, wide' },
    { role: 'ceremony',  camera: 'slow push-in', framing: 'ritual or communal action' },
    { role: 'hands',     camera: 'locked close-up', framing: 'instrument or gesturing hands' },
    { role: 'gathering', camera: 'slow pan', framing: 'group in motion or stillness' },
    { role: 'horizon',   camera: 'slow pull-back', framing: 'wide, sun or sky' },
  ],
}

const DEFAULT_SHOTS = [
  { role: 'opening',  camera: 'slow push-in', framing: 'wide establishing scene' },
  { role: 'detail',   camera: 'locked close-up', framing: 'symbolic object or hands' },
  { role: 'emotion',  camera: 'gentle dolly', framing: 'environment, no visible faces' },
  { role: 'symbol',   camera: 'overhead poetic tableaux', framing: 'abstract symbolic image' },
  { role: 'closing',  camera: 'slow pull-back', framing: 'wide, figure or object small in frame' },
]

function getShotTemplates(albumSlug) {
  return ALBUM_SHOT_TEMPLATES[albumSlug] ?? DEFAULT_SHOTS
}

function buildShotPrompt(shot, manifest, index, total) {
  const { title, album, emotion, scene, symbols, mood, arc } = manifest

  // Use arc if available (pre-written scene progression from prompts.js)
  const arcDescription = arc?.[index] ?? null

  const sceneCore = arcDescription
    ? arcDescription
    : scene
    ? `${scene.split('.')[index % 3] ?? scene.split('.')[0]}`
    : `a cinematic moment from the emotional world of "${title}"`

  return {
    order:           index + 1,
    role:            shot.role,
    durationSeconds: 12,
    model:           'veo3',
    aspectRatio:     '16:9',
    prompt: [
      `Cinematic shot ${index + 1} of ${total} for song film: "${title}" from album "${album}".`,
      `Shot role: ${shot.role}.`,
      `Scene: ${sceneCore}.`,
      `Camera: ${shot.camera}. Framing: ${shot.framing}.`,
      `Mood: ${emotion ?? mood}.`,
      symbols ? `Visual symbols: ${symbols}.` : '',
      `Duration: 12 seconds. No dialogue. No text.`,
      NOIR_STYLE,
    ].filter(Boolean).join('\n'),
    status:     'not_started',
    taskId:     null,
    localPath:  `public/generated/kie/films/${manifest.slug}/shot-${String(index + 1).padStart(2, '0')}.mp4`,
    remoteUrl:  '',
    submittedAt: null,
    completedAt: null,
    error: null,
  }
}

function buildAssemblyPrompt(manifest, shots) {
  return [
    `Multi-shot cinematic film for "${manifest.title}" (${manifest.album}).`,
    `Assemble ${shots.length} shots into a continuous ~60-second film.`,
    `Transitions: slow dissolve between shots, no hard cuts.`,
    `Score: if native audio generation is available, use atmospheric ambient score.`,
    `Mood arc: ${manifest.emotion ?? manifest.mood}.`,
    `Final output: seamless cinematic experience. No end card. No credits. No text.`,
  ].join(' ')
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

  console.log(`\n── Song Film Prompt Generator ──────────────────────────────`)
  console.log(`   Processing: ${files.length} manifests\n`)

  let updated = 0, skipped = 0, blocked = 0

  for (const file of files) {
    const fp  = path.join(SONG_DIR, file)
    const man = JSON.parse(fs.readFileSync(fp, 'utf-8'))

    const hasContext = man.emotion || man.scene || man.symbols
    if (!hasContext && !man.hasLyrics) {
      console.log(`  BLOCKED (no context or lyrics): ${man.slug}`)
      man.generatedAssets.songFilm.status = 'blocked'
      man.generatedAssets.songFilm.error  = 'no_context'
      man.readiness.songFilm = 'missing_context'
      blocked++
    } else {
      const templates  = getShotTemplates(man.albumSlug)
      const shots      = templates.map((shot, i) => buildShotPrompt(shot, man, i, templates.length))
      const assembly   = buildAssemblyPrompt(man, shots)

      man.generatedAssets.songFilm.status          = 'prompt_ready'
      man.generatedAssets.songFilm.shots           = shots
      man.generatedAssets.songFilm.assemblyPrompt  = assembly
      man.generatedAssets.songFilm.finalVideoPath  = `public/generated/kie/films/${man.slug}/film.mp4`
      man.generatedAssets.songFilm.publicUrl       = `/generated/kie/films/${man.slug}/film.mp4`
      man.readiness.songFilm = 'prompt_ready'
      console.log(`  ✓ ${man.slug.padEnd(45)} [${shots.length} shots]`)
      updated++
    }

    man.updatedAt = new Date().toISOString()
    fs.writeFileSync(fp, JSON.stringify(man, null, 2), 'utf-8')
  }

  console.log(`\n── Summary ────────────────────────────────────────────────`)
  console.log(`   Film sequences written: ${updated}`)
  console.log(`   Blocked:                ${blocked}`)
  console.log(`   Skipped:                ${skipped}`)
  console.log(`\nNext: node scripts/kie/generate-commentary-prompts.js\n`)
}

main()
