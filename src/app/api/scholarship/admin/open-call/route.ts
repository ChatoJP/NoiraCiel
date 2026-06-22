import { NextResponse } from 'next/server'
import { getAllOpenCallSubmissions, updateOpenCallSubmission } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

function authError() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function checkAuth(req: Request): boolean {
  const token = process.env.SCHOLARSHIP_ADMIN_TOKEN
  if (!token) return false
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${token}`
}

export async function GET(req: Request) {
  if (!checkAuth(req)) return authError()
  return NextResponse.json({ submissions: getAllOpenCallSubmissions() })
}

export async function PATCH(req: Request) {
  if (!checkAuth(req)) return authError()
  const { id, status, adminNotes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const updated = updateOpenCallSubmission(id, { status, adminNotes })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
