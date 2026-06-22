import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FanMessage {
  id: string
  name: string
  message: string
  submittedAt: string
}

interface FanWallData {
  approved: FanMessage[]
  pending: FanMessage[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function slugPath(slug: string) {
  // Sanitise slug so it can't escape the fan-wall directory
  const safe = slug.replace(/[^a-z0-9-]/g, '')
  return path.join(process.cwd(), 'public', 'fan-wall', `${safe}.json`)
}

async function readWall(slug: string): Promise<FanWallData> {
  try {
    const raw = await fs.readFile(slugPath(slug), 'utf-8')
    return JSON.parse(raw) as FanWallData
  } catch {
    return { approved: [], pending: [] }
  }
}

async function writeWall(slug: string, data: FanWallData): Promise<void> {
  const filePath = slugPath(slug)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ─── GET /api/fan-wall?slug=… ──────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = (searchParams.get('slug') ?? '').trim()

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const data = await readWall(slug)
  return NextResponse.json({ approved: data.approved })
}

// ─── POST /api/fan-wall ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slug    = typeof body.slug    === 'string' ? body.slug.trim()    : ''
  const name    = typeof body.name    === 'string' ? body.name.trim()    : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!slug)                     return NextResponse.json({ error: 'slug is required' },    { status: 400 })
  if (!name)                     return NextResponse.json({ error: 'name is required' },    { status: 400 })
  if (!message)                  return NextResponse.json({ error: 'message is required' }, { status: 400 })
  if (name.length > 40)          return NextResponse.json({ error: 'name too long' },       { status: 400 })
  if (message.length > 200)      return NextResponse.json({ error: 'message too long' },    { status: 400 })
  if (message.length < 10)       return NextResponse.json({ error: 'message too short' },   { status: 400 })

  const entry: FanMessage = {
    id: randomId(),
    name,
    message,
    submittedAt: new Date().toISOString().slice(0, 10),
  }

  const data = await readWall(slug)
  data.pending.push(entry)
  await writeWall(slug, data)

  return NextResponse.json({ ok: true })
}

// ─── DELETE /api/fan-wall?id=…&slug=…&approve=true ────────────────────────────

export async function DELETE(request: Request) {
  // Auth
  const authHeader = request.headers.get('Authorization') ?? ''
  const adminToken = process.env.ADMIN_TOKEN ?? ''
  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug    = (searchParams.get('slug')    ?? '').trim()
  const id      = (searchParams.get('id')      ?? '').trim()
  const approve = searchParams.get('approve') === 'true'

  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  if (!id)   return NextResponse.json({ error: 'id is required' },   { status: 400 })

  const data = await readWall(slug)
  const idx  = data.pending.findIndex((m) => m.id === id)

  if (idx === -1) {
    return NextResponse.json({ error: 'Message not found in pending' }, { status: 404 })
  }

  const [entry] = data.pending.splice(idx, 1)

  if (approve) {
    data.approved.push(entry)
  }

  await writeWall(slug, data)
  return NextResponse.json({ ok: true, approved: approve })
}
