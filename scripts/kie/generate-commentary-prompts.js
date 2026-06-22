#!/usr/bin/env node
'use strict'
/**
 * generate-commentary-prompts.js
 * Builds the Director's Cut artist commentary script and narration payloads.
 *
 * Produces:
 *   - A ready-to-narrate commentary script (saved as manifest.generatedAssets.commentary.script)
 *   - ElevenLabs TTS API payload
 *   - InfiniteTalk avatar video payload (optional Phase 3+)
 *
 * Usage: node scripts/kie/generate-commentary-prompts.js [--slug why]
 */

const fs   = require('fs')
const path = require('path')

const ROOT     = path.join(__dirname, '..', '..')
const SONG_DIR = path.join(ROOT, 'public', 'generated', 'kie', 'songs')
const COM_DIR  = path.join(ROOT, 'public', 'generated', 'kie', 'commentary')
const TARGET   = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null

const VOICE_ID = 'hpp4J3VqNfWAUOO0d1Us'  // NoiraCiel ElevenLabs voice

// ─── Commentary script builder ────────────────────────────────────────────────
// This builds a structured narration script from available metadata.
// The voice of NoiraCiel: personal, precise, poetic, never pretentious.

function buildCommentaryScript(manifest) {
  const { title, album, emotion, scene, symbols, lyricsExcerpt, mood, albumSlug, trackNumber } = manifest

  const chapterRef = trackNumber ? `Chapter ${String(trackNumber).padStart(2, '0')}` : ''

  const opening = [
    `"${title}."`,
    chapterRef ? `${chapterRef} of ${album}.` : `From the album: ${album}.`,
    ``,
  ].join('\n')

  const emotionalCore = emotion
    ? `This song came from a single question I couldn't stop asking myself: ${emotion}\n\nI wasn't looking for a clean answer. I was looking for the right way to carry the question.`
    : `This is a song about what stays when everything else changes. About the things we don't have words for — until the music gives them shape.`

  const symbolLayer = symbols
    ? `When I wrote this, I kept coming back to certain images. ${symbols.replace(/·/g, ',')}. Not because they're poetic — because they're honest. These are the images that carry weight without trying to.`
    : ''

  const lyricsLayer = lyricsExcerpt
    ? `The lyrics started as a fragment: "${lyricsExcerpt.slice(0, 120).trim()}." Everything else grew from that place.`
    : ''

  const closing = [
    `If this song reaches you at the right moment — I hope it gives you permission.`,
    `Permission to ask. To sit with not knowing. To feel the weight without rushing to put it down.`,
    ``,
    `That's all any of this is for.`,
  ].join('\n')

  const script = [opening, emotionalCore, symbolLayer, lyricsLayer, closing]
    .filter(Boolean)
    .join('\n\n')

  return script
}

function buildTTSPayload(script, manifest) {
  return {
    model: 'elevenlabs/text-to-dialogue-v3',
    input: {
      dialogue: [{ text: script, voice: VOICE_ID }],
      stability: 0.55,
      similarity_boost: 0.78,
      style: 0.25,
      use_speaker_boost: true,
    },
  }
}

function buildAvatarPayload(narrationPath, manifest) {
  return {
    model: 'infinitetalk',
    input: {
      audioUrl: narrationPath,
      imagePrompt: [
        `A cinematic portrait of a solo artist, seen from slightly below eye level.`,
        `Dramatic side lighting from a single warm source. Deep shadows. Film grain.`,
        `Dark wardrobe, understated. Expression: composed, interior, present.`,
        `Atlantic European feel. Not generic. Not corporate. Genuinely present.`,
        `No background clutter. Stone wall or dark fabric behind. Cinematic still.`,
      ].join(' '),
      duration: 120,
    },
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(SONG_DIR)) {
    console.error('✗ Song manifests not found. Run generate-kie-manifest.js first.')
    process.exit(1)
  }
  fs.mkdirSync(COM_DIR, { recursive: true })

  const files = fs.readdirSync(SONG_DIR)
    .filter(f => f.endsWith('.json'))
    .filter(f => !TARGET || f === `${TARGET}.json`)

  console.log(`\n── Commentary Script Generator ─────────────────────────────`)
  console.log(`   Processing: ${files.length} manifests\n`)

  let updated = 0, blocked = 0

  for (const file of files) {
    const fp  = path.join(SONG_DIR, file)
    const man = JSON.parse(fs.readFileSync(fp, 'utf-8'))

    if (!man.hasLyrics && !man.emotion) {
      console.log(`  BLOCKED (no lyrics or context): ${man.slug}`)
      man.generatedAssets.commentary.status = 'blocked'
      man.generatedAssets.commentary.error  = 'no_content'
      man.readiness.commentary = 'missing_content'
      blocked++
    } else {
      const script = buildCommentaryScript(man)

      // Save script to file
      const slugDir    = path.join(COM_DIR, man.slug)
      const scriptPath = path.join(slugDir, 'script.txt')
      fs.mkdirSync(slugDir, { recursive: true })
      fs.writeFileSync(scriptPath, script, 'utf-8')

      const relScriptPath  = `public/generated/kie/commentary/${man.slug}/script.txt`
      const narrationPath  = `public/generated/kie/commentary/${man.slug}/narration.mp3`
      const avatarPath     = `public/generated/kie/commentary/${man.slug}/commentary.mp4`

      man.generatedAssets.commentary.status           = 'prompt_ready'
      man.generatedAssets.commentary.script           = script
      man.generatedAssets.commentary.scriptPath       = relScriptPath
      man.generatedAssets.commentary.voicePath        = narrationPath
      man.generatedAssets.commentary.avatarVideoPath  = avatarPath
      man.generatedAssets.commentary.publicUrl        = `/generated/kie/commentary/${man.slug}/commentary.mp4`
      man.generatedAssets.commentary.ttsPayload       = buildTTSPayload(script, man)
      man.generatedAssets.commentary.avatarPayload    = buildAvatarPayload(narrationPath, man)
      man.readiness.commentary = 'prompt_ready'

      console.log(`  ✓ ${man.slug.padEnd(45)} [script: ${script.length} chars]`)
      updated++
    }

    man.updatedAt = new Date().toISOString()
    fs.writeFileSync(fp, JSON.stringify(man, null, 2), 'utf-8')
  }

  console.log(`\n── Summary ────────────────────────────────────────────────`)
  console.log(`   Scripts written: ${updated}`)
  console.log(`   Blocked:         ${blocked}`)
  console.log(`\nNext: node scripts/kie/generate-audiobook-prompts.js\n`)
}

main()
