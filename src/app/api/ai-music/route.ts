import { NextRequest, NextResponse } from 'next/server'

const KIE_BASE = 'https://api.kie.ai/api/v1'
const CALLBACK_URL = 'https://noiraciel.com/api/ai-music/callback'

async function kiePost(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${KIE_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function kieGet(endpoint: string) {
  const res = await fetch(`${KIE_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${process.env.KIE_API_KEY}` },
    cache: 'no-store',
  })
  return res.json()
}

// POST /api/ai-music  → submit generation job, return taskId
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, style, model = 'V4_5', instrumental = true, customMode = false, title = '', lyrics = '' } = body

    if (!prompt && !style) {
      return NextResponse.json({ error: 'prompt or style is required' }, { status: 400 })
    }

    const payload: Record<string, unknown> = {
      model,
      customMode,
      instrumental,
      callBackUrl: CALLBACK_URL,
    }

    if (customMode) {
      // Custom mode: user specifies style tags directly as prompt
      const tags = [style, prompt].filter(Boolean).join(', ')
      payload.prompt = tags
      if (title) payload.title = title
      if (!instrumental && lyrics) payload.mv = lyrics
    } else {
      // Description mode: natural language description
      const desc = [prompt, style ? `in the style of ${style}` : ''].filter(Boolean).join(', ')
      payload.gptDescriptionPrompt = desc
    }

    const data = await kiePost('/generate', payload)

    if (data.code !== 200) {
      return NextResponse.json({ error: data.msg ?? 'KIE API error' }, { status: 422 })
    }

    return NextResponse.json({ taskId: data.data.taskId })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET /api/ai-music?taskId=...  → poll status
export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

  try {
    const data = await kieGet(`/generate/record-info?taskId=${taskId}`)
    if (data.code !== 200) {
      return NextResponse.json({ error: data.msg ?? 'KIE API error' }, { status: 422 })
    }

    const d = data.data
    const status: string = d.status ?? 'PENDING'
    const ready = status === 'TEXT_SUCCESS' || status === 'SUCCESS'
    const failed = status === 'FAILED' || !!d.errorMessage

    const tracks = ready && d.response?.sunoData
      ? d.response.sunoData.map((t: Record<string, unknown>) => ({
          id: t.id,
          title: t.title || '',
          tags: t.tags || '',
          audioUrl: (t.streamAudioUrl || t.audioUrl || '') as string,
          coverUrl: (t.imageUrl || '') as string,
          duration: t.duration as number | null,
        }))
      : []

    return NextResponse.json({ status, ready, failed, tracks, errorMessage: d.errorMessage ?? null })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
