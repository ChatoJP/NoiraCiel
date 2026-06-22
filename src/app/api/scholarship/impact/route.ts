import { NextResponse } from 'next/server'
import { getImpactStats } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stats = getImpactStats()
  return NextResponse.json(stats)
}
