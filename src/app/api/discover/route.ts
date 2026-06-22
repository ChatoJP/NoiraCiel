import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Track {
  slug: string
  title: string
  albumSlug: string | null
  album: string | null
  trackNumber: number | null
  lyrics: string | null
}

function firstLyricLine(lyrics: string | null): string | null {
  if (!lyrics) return null
  const line = lyrics.split(/\r?\n/).map((l) => l.trim()).find((l) => l && l.toLowerCase() !== 'inspiration')
  if (!line) return null
  return line.length > 100 ? line.slice(0, 100).replace(/\s\S*$/, '') + '…' : line
}

// Builds the full-catalogue listing for the system prompt from real data —
// previously this was a hand-typed block covering only the 17 main-album
// tracks, leaving 113 tracks (87% of the catalogue) invisible to matching.
function buildCatalogueBlock(): string {
  const catalogue = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public/music-catalogue.json'), 'utf-8')
  ) as { tracks: Track[] }
  const commentary = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public/directors-cut-commentary.json'), 'utf-8')
  ) as Record<string, string>

  const byAlbum = new Map<string, Track[]>()
  for (const t of catalogue.tracks) {
    const key = t.album || t.albumSlug || 'Unsorted'
    if (!byAlbum.has(key)) byAlbum.set(key, [])
    byAlbum.get(key)!.push(t)
  }

  const sections: string[] = []
  for (const [album, tracks] of byAlbum) {
    tracks.sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999))
    const lines = tracks.map((t) => {
      const context = commentary[t.slug]
        ? commentary[t.slug].slice(0, 110).replace(/\s\S*$/, '') + (commentary[t.slug].length > 110 ? '…' : '')
        : firstLyricLine(t.lyrics) ?? t.title
      return `- ${t.title} — ${context} Slug: ${t.slug}`
    })
    sections.push(`${album}:\n${lines.join('\n')}`)
  }
  return sections.join('\n\n')
}

function buildSystemPrompt(): string {
  return `You are the musical soul of NoiraCiel — an Atlantic Noir project of music, literature, and memory. Your job is to match what someone is feeling or going through to the most resonant songs in the catalogue.

CATALOGUE:
${buildCatalogueBlock()}

Return JSON only — no markdown, no explanation outside the JSON:
{
  "matches": [
    { "slug": "why", "title": "Why", "reason": "one sentence why this fits what they described" },
    { "slug": "...", "title": "...", "reason": "..." },
    { "slug": "...", "title": "...", "reason": "..." }
  ],
  "reflection": "A short, poetic, two-sentence response to what they shared — written in the NoiraCiel voice: warm, honest, not sentimental."
}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { feeling } = body as { feeling?: string }

    if (!feeling || typeof feeling !== 'string' || feeling.trim().length === 0) {
      return NextResponse.json({ error: 'A feeling is required.' }, { status: 400 })
    }

    const userMsg = `The listener wrote: "${feeling.trim()}"\n\nMatch 3 songs and write the reflection.`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: userMsg }],
    })

    const rawText = (msg.content[0] as { type: string; text: string }).text

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```(?:json)?/g, '').trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json(data)
  } catch (err) {
    console.error('[discover] error:', err)
    return NextResponse.json(
      { error: 'Something went quiet on our end. Please try again.' },
      { status: 500 }
    )
  }
}
