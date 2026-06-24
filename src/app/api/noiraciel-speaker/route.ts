/**
 * /api/noiraciel-speaker — the Speaker chat endpoint.
 *
 * Accepts a conversation, grounds it in today's Daily Glyph and a content
 * recommendation, and streams back the Speaker's response.
 *
 * Security / safety:
 *   • The API key never leaves the server (ANTHROPIC_API_KEY env var).
 *   • Validates that there is a non-empty, reasonably sized latest user message.
 *   • Caps conversation history and per-message length to keep cost bounded.
 *
 * Env:
 *   ANTHROPIC_API_KEY            — required (already used by /api/chat).
 *   NOIRACIEL_SPEAKER_MODEL      — optional; defaults to claude-haiku-4-5.
 */

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { getDailyGlyph, getCurrentWave } from '@/data/mayanInterpretations'
import { recommend, recommendForWave } from '@/lib/noiracielRecommendationEngine'
import { buildSpeakerSystemPrompt } from '@/lib/noiracielSpeakerPrompt'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.NOIRACIEL_SPEAKER_MODEL || 'claude-haiku-4-5-20251001'

const MAX_MESSAGES = 24          // keep history lightweight
const MAX_MESSAGE_CHARS = 4000   // per-message ceiling

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError('The Speaker is resting — no voice is configured.', 503)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid request body.', 400)
  }

  const rawMessages = (body as { messages?: unknown })?.messages
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return jsonError('No message provided.', 400)
  }

  // Normalise, validate and clamp the conversation.
  const messages: ChatMessage[] = rawMessages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-MAX_MESSAGES)

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser || lastUser.content.trim().length === 0) {
    return jsonError('Say something to the Speaker first.', 400)
  }

  // Live grounding: today's glyph, the current 13-day wave, and recommendations.
  const glyph = getDailyGlyph()
  const wave = getCurrentWave()
  const recommendation = recommend(lastUser.content, glyph)
  const waveRecommendation = recommendForWave(wave)
  const system = buildSpeakerSystemPrompt({ glyph, recommendation, wave, waveRecommendation })

  let stream
  try {
    stream = await client.messages.stream({
      model: MODEL,
      max_tokens: 700,
      system,
      messages,
    })
  } catch (err) {
    console.error('Speaker stream init failed:', err)
    return jsonError('The Speaker went quiet. Try again in a moment.', 502)
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let emittedAny = false
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            emittedAny = true
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        console.error('Speaker stream error:', err)
        // Headers are already sent (200), so we cannot change the status. If we
        // never emitted any text, surface a graceful, in-voice fallback instead
        // of returning a blank reply.
        if (!emittedAny) {
          controller.enqueue(
            encoder.encode('The Speaker has gone quiet for a moment. Try again shortly.'),
          )
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
