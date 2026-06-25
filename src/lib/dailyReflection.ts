/**
 * dailyReflection.ts — the AI-authored Daily Glyph reflection, cached per day.
 *
 * The deterministic `combineGlyph()` guidance reads a little stitched-together.
 * This module asks the Speaker to *write* the day's reflection in voice instead.
 *
 * Cost control: the result is cached in-process keyed by the NoiraCiel calendar
 * date, so the model is called at most once per day regardless of traffic (the
 * server is long-running under PM2). An in-flight guard prevents a thundering
 * herd on the first request of the day. If there is no API key, or the call
 * fails, it falls back to the deterministic guidance — the panel is never blank.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { DailyGlyph } from '@/data/mayanInterpretations'

const MODEL = process.env.NOIRACIEL_SPEAKER_MODEL || 'claude-haiku-4-5-20251001'

const REFLECTION_SYSTEM = `You are the NoiraCiel Speaker writing the Daily Glyph reflection — a short, in-voice meditation on the symbolic shape of today.

Voice: elegant, poetic, precise, calm, slightly mysterious. Warm beneath the surface, never sentimental. No exclamation marks. Never childish, never a guru, never a horoscope.

Honesty: the glyph is a symbolic, artistic interpretation inspired by Mayan calendrical traditions — never a prediction, never spiritual authority, never a historical or scientific claim. Never say a day is lucky, guaranteed, or destiny. Use invitational language ("today invites…", "the day asks…", "a good day to notice…").

Output rules: 2 to 3 short sentences, no more than ~75 words. No preamble, no title, no greeting, no sign-off, no quotation marks, no lists. Write only the reflection itself — second person, addressed gently to the reader.`

// date (YYYY-MM-DD in NoiraCiel time) → resolved reflection text
const resolved = new Map<string, string>()
// date → in-flight promise, to coalesce concurrent first-of-day requests
const inflight = new Map<string, Promise<string>>()

function buildUserPrompt(g: DailyGlyph): string {
  return [
    `Today's glyph:`,
    `• Tzolk'in: ${g.mayan.tzolkin.display} — sign ${g.sign.name} (${g.sign.keywords.join(', ')}); tone ${g.tone.number} ${g.tone.name} (${g.tone.theme})`,
    `• Lord of the Night: ${g.mayan.lordOfNight.glyph} — ${g.lord.theme}`,
    `• Trecena: ${g.mayan.trecena.display}`,
    `• Sign's emotional note: ${g.sign.emotional}`,
    `• Sign's shadow: ${g.sign.shadow}`,
    `• Tone's invitation: ${g.tone.advice}`,
    ``,
    `Write today's reflection.`,
  ].join('\n')
}

async function generate(glyph: DailyGlyph): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return glyph.guidance
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 220,
      system: REFLECTION_SYSTEM,
      messages: [{ role: 'user', content: buildUserPrompt(glyph) }],
    })
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
    return text || glyph.guidance
  } catch (err) {
    console.error('Daily reflection generation failed:', err)
    return glyph.guidance
  }
}

/**
 * getDailyReflection — the AI reflection for this glyph, cached per day.
 * Always resolves to a usable string (AI text or the deterministic fallback).
 */
export async function getDailyReflection(glyph: DailyGlyph): Promise<string> {
  const key = glyph.mayan.gregorianDate

  const cached = resolved.get(key)
  if (cached) return cached

  const flying = inflight.get(key)
  if (flying) return flying

  const p = (async () => {
    try {
      const text = await generate(glyph)
      // Only cache a genuine AI result, so a temporary outage (e.g. credits)
      // doesn't pin the fallback for the rest of the day.
      if (text && text !== glyph.guidance) resolved.set(key, text)
      return text
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}
