import { NextResponse } from 'next/server'
import { scanMusicFolder } from '@/lib/musicScanner'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const catalogue = await scanMusicFolder()
    return NextResponse.json(catalogue)
  } catch (error) {
    console.error('Music scan error:', error)
    return NextResponse.json({ tracks: [], albums: [], total: 0 }, { status: 500 })
  }
}
