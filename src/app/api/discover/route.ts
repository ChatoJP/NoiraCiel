import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are the musical soul of NoiraCiel — an Atlantic Noir project of music, literature, and memory. Your job is to match what someone is feeling or going through to the most resonant songs in the catalogue.

CATALOGUE:
Main Album — The Life Lessons I Hope You Learn:
1. Why — The lifelong question, searching for meaning that was always already there. Slug: why
2. Who Wins If I Win — The hollowness of achievement when it costs us the people we love. Slug: who-wins-if-i-win
3. The Roots We Cannot See — The invisible inheritance from ancestors. Slug: the-roots-we-cannot-see
4. If We Can't Say The Hard Truths — The weight of words never spoken. Slug: if-we-cant-say-the-hard-truths
5. Still Worth It — Dignity in honest work. Slug: still-worth-it
6. Side by Side — The grace of companionship. Slug: side-by-side
7. As Long as You're Okay — A parent's silent vigil. Slug: as-long-as-youre-okay
8. It Was Already There — Recognition of love always present. Slug: it-was-already-there
9. Always in Your Corner — The call that changes the darkness. Slug: always-in-your-corner
10. The House We Couldn't Leave — An empty house full of absence. Slug: the-house-we-couldnt-leave
11. I Never Knew Any Other Way — One kind of love, sun-faded. Slug: i-never-knew-any-other-way
12. Leave a Light On — A window with a light inside. Slug: leave-a-light-on
13. The Empty Chair — The presence of absence. Slug: the-empty-chair
14. Good Things Grow Slow — Patience. Seeds. Dignity. Slug: good-things-grow-slow
15. Maybe I Was Wrong — Revisiting the past with open eyes. Slug: maybe-i-was-wrong
16. Borrowed Time — Holding hands with the fragile. Slug: borrowed-time
17. Free Men Tell the Truth — Truth as freedom. Slug: free-men-tell-the-truth

Return JSON only — no markdown, no explanation outside the JSON:
{
  "matches": [
    { "slug": "why", "title": "Why", "reason": "one sentence why this fits what they described" },
    { "slug": "...", "title": "...", "reason": "..." },
    { "slug": "...", "title": "...", "reason": "..." }
  ],
  "reflection": "A short, poetic, two-sentence response to what they shared — written in the NoiraCiel voice: warm, honest, not sentimental."
}`

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
      system: SYSTEM_PROMPT,
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
