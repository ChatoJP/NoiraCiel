import { NextResponse } from 'next/server'
import { createCommunityMessage, getApprovedMessages } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const messages = getApprovedMessages()
  return NextResponse.json({ messages: messages.map(m => ({
    id: m.id,
    authorName: m.isAnonymous ? 'Anonymous' : m.authorName,
    country: m.country,
    message: m.message,
    createdAt: m.createdAt,
  })) })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { authorName, isAnonymous, country, message } = body

  if (!isAnonymous && (!authorName || authorName.trim().length < 2))
    return NextResponse.json({ error: 'Please provide your name, or choose to be anonymous.' }, { status: 400 })
  if (!country || typeof country !== 'string' || country.trim().length < 2)
    return NextResponse.json({ error: 'Country is required.' }, { status: 400 })
  if (!message || message.trim().length < 10)
    return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 })
  if (message.trim().length > 500)
    return NextResponse.json({ error: 'Message must be 500 characters or fewer.' }, { status: 400 })

  createCommunityMessage({
    authorName: isAnonymous ? '' : authorName.trim(),
    isAnonymous: Boolean(isAnonymous),
    country: country.trim(),
    message: message.trim(),
  })

  return NextResponse.json({ message: 'Your message has been received and will appear after moderation.' }, { status: 201 })
}
