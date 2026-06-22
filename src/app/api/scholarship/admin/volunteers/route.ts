import { NextResponse } from 'next/server'
import { getAllVolunteers, updateVolunteer } from '@/lib/scholarshipStore'

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
  return NextResponse.json({ volunteers: getAllVolunteers() })
}

export async function PATCH(req: Request) {
  if (!checkAuth(req)) return authError()
  const { id, status, adminNotes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const updated = updateVolunteer(id, { status, adminNotes })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
