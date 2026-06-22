#!/usr/bin/env node
'use strict'
/**
 * generate-audiobook-prompts.js
 * Builds narration text + Suno ambient score prompts for the AI Audiobook.
 *
 * Input per song:
 *   1. Story PDF text (if available, from public/Books/stories/{slug}.pdf)
 *   2. Lyrics as fallback narration source
 *   3. Song emotional context for score prompt
 *
 * Output per song:
 *   - narrationText: ready-to-send to ElevenLabs TTS
 *   - scorePrompt:   ready-to-send to Suno V5.5
 *   - manifest updated with audiobook payload
 *
 * Usage: node scripts/kie/generate-audiobook-prompts.js [--slug why]
 */

const fs   = require('fs')
const path = require('path')

const ROOT     = path.join(__dirname, '..', '..')
const SONG_DIR = path.join(ROOT, 'public', 'generated', 'kie', 'songs')
const AB_DIR   = path.join(ROOT, 'public', 'generated', 'kie', 'audiobook')
const TARGET   = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null

const VOICE_ID = 'hpp4J3VqNfWAUOO0d1Us'

// ─── Attempt to extract text from PDF (requires pdftotext) ───────────────────
function extractPdfText(pdfPath) {
  try {
    const { execSync } = require('child_process')
    const text = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8', stdio: ['pipe','pipe','ignore'] })
    return text.trim().slice(0, 6000) // max 6k chars for TTS
  } catch {
    return null
  }
}

// ─── Score prompt builder (Suno V5.5) ────────────────────────────────────────
function buildScorePrompt(manifest) {
  const { title, album, emotion, mood, albumSlug, symbols } = manifest

  const styleMap = {
    'the-life-lessons':   'ambient piano, sparse strings, Atlantic soul, gentle breathing room',
    'blind-angel':        'dark cinematic orchestral, cello drone, minor key, sacred and powerful',
    'jazz-sessions':      'late-night jazz trio, double bass and brushed drums, warm grain',
    'world-musics':       'ambient world percussion, kora, oud, slow breathing rhythm, ceremonial',
    'funk-my-way-in':     'ambient funk undertones, soft bass groove, muted brass, meditative groove',
    'reggae-sessions':    'ambient roots reggae, organ pad, bass drone, warm coastal atmosphere',
    'the-velvet-machine': 'dark electronic ambient, industrial texture, slow pulse, machine breath',
  }
  const instrumentalStyle = styleMap[albumSlug] ?? 'cinematic ambient, piano, strings, atmospheric'

  return {
    prompt: [
      `Instrumental ambient score for narrated audiobook chapter: "${title}".`,
      `Style: ${instrumentalStyle}.`,
      `Mood: ${emotion ?? mood}.`,
      `Duration: 4 minutes. Seamless loop possible.`,
      `NO vocals. NO lyrics. NO drums that would compete with narration.`,
      `Dynamics: quiet and supportive, the narration must stay primary.`,
      `Slow evolution over 4 minutes, no sudden changes.`,
      `Emotional register: ${emotion ?? 'intimate, cinematic, searching'}.`,
    ].join(' '),
    sunoPayload: {
      model: 'suno-v5.5',
      prompt: `Instrumental ambient score, ${instrumentalStyle}. ${emotion ?? 'Cinematic and searching'}. No vocals. 4 minutes.`,
      make_instrumental: true,
      tags: [instrumentalStyle.split(',')[0], 'ambient', 'cinematic', 'atmospheric', 'NoiraCiel'].join(', '),
    },
  }
}

// ─── Narration text builder ───────────────────────────────────────────────────
function buildNarrationText(manifest, storyText) {
  const { title, album, emotion, lyricsExcerpt, trackNumber } = manifest

  if (storyText && storyText.length > 200) {
    // Story PDF is the primary source — use it directly
    return storyText.slice(0, 6000)
  }

  if (lyricsExcerpt && lyricsExcerpt.length > 100) {
    // Lyrics as narrative source — reformat as spoken prose
    const chapter = trackNumber ? `Chapter ${String(trackNumber).padStart(2, '0')}: ${title}` : title
    return [
      `${chapter}.`,
      ``,
      `From the album "${album}".`,
      ``,
      lyricsExcerpt,
      ``,
      emotion ? `— ${emotion}` : '',
    ].filter(Boolean).join('\n')
  }

  // Minimal fallback
  return [
    `${title}.`,
    `From the album "${album}".`,
    ``,
    emotion ?? 'A moment without words. Let the music speak.',
  ].join('\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(SONG_DIR)) {
    console.error('✗ Song manifests not found. Run generate-kie-manifest.js first.')
    process.exit(1)
  }
  fs.mkdirSync(AB_DIR, { recursive: true })

  const files = fs.readdirSync(SONG_DIR)
    .filter(f => f.endsWith('.json'))
    .filter(f => !TARGET || f === `${TARGET}.json`)

  console.log(`\n── Audiobook Prompt Generator ──────────────────────────────`)
  console.log(`   Processing: ${files.length} manifests\n`)

  let updated = 0, blocked = 0

  for (const file of files) {
    const fp  = path.join(SONG_DIR, file)
    const man = JSON.parse(fs.readFileSync(fp, 'utf-8'))

    // Try to get story text
    let storyText = null
    if (man.storyPath) {
      const absPdfPath = path.join(ROOT, man.storyPath)
      storyText = extractPdfText(absPdfPath)
    }

    const hasContent = storyText || man.hasLyrics || man.emotion
    if (!hasContent) {
      console.log(`  BLOCKED (no content): ${man.slug}`)
      man.generatedAssets.audiobook.status = 'blocked'
      man.generatedAssets.audiobook.error  = 'no_content'
      man.readiness.audiobook = 'missing_content'
      blocked++
    } else {
      const narrationText = buildNarrationText(man, storyText)
      const { prompt: scorePrompt, sunoPayload } = buildScorePrompt(man)

      // Save narration text
      const slugDir        = path.join(AB_DIR, man.slug)
      const narrationFile  = path.join(slugDir, 'narration.txt')
      fs.mkdirSync(slugDir, { recursive: true })
      fs.writeFileSync(narrationFile, narrationText, 'utf-8')

      const narrationPath = `public/generated/kie/audiobook/${man.slug}/narration.mp3`
      const scorePath     = `public/generated/kie/audiobook/${man.slug}/score.mp3`
      const finalPath     = `public/generated/kie/audiobook/${man.slug}/final.mp3`

      man.generatedAssets.audiobook.status         = 'prompt_ready'
      man.generatedAssets.audiobook.narrationText  = narrationText
      man.generatedAssets.audiobook.narrationPath  = narrationPath
      man.generatedAssets.audiobook.scorePath      = scorePath
      man.generatedAssets.audiobook.finalMixPath   = finalPath
      man.generatedAssets.audiobook.publicUrl      = `/generated/kie/audiobook/${man.slug}/final.mp3`
      man.generatedAssets.audiobook.scorePrompt    = scorePrompt
      man.generatedAssets.audiobook.ttsPayload     = {
        model: 'elevenlabs/text-to-dialogue-v3',
        input: {
          dialogue: [{ text: narrationText, voice: VOICE_ID }],
          stability: 0.6,
          similarity_boost: 0.78,
        },
      }
      man.generatedAssets.audiobook.sunoPayload    = sunoPayload
      man.generatedAssets.audiobook.hasStorySource = !!storyText
      man.readiness.audiobook = 'prompt_ready'

      console.log(`  ✓ ${man.slug.padEnd(45)} [${storyText ? 'story PDF' : 'lyrics'}, score prompt ready]`)
      updated++
    }

    man.updatedAt = new Date().toISOString()
    fs.writeFileSync(fp, JSON.stringify(man, null, 2), 'utf-8')
  }

  console.log(`\n── Summary ────────────────────────────────────────────────`)
  console.log(`   Audiobook prompts written: ${updated}`)
  console.log(`   Blocked:                   ${blocked}`)
  console.log(`\nNext: node scripts/kie/generate-product-prompts.js\n`)
}

main()
