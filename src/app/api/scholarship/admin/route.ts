import { NextResponse } from 'next/server'
import { getAllApplications } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

function isAuthorized(req: Request) {
  const token = process.env.SCHOLARSHIP_ADMIN_TOKEN
  if (!token) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${token}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')
  const category = searchParams.get('category')
  const country  = searchParams.get('country')

  let apps = getAllApplications()

  if (status)   apps = apps.filter(a => a.status === status)
  if (category) apps = apps.filter(a => a.category === category)
  if (country)  apps = apps.filter(a => a.country.toLowerCase().includes(country.toLowerCase()))

  return NextResponse.json({ applications: apps })
}
