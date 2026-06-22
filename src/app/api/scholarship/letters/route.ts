import { NextResponse } from 'next/server'
import { createFutureLetter, getApprovedLetters } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const letters = getApprovedLetters()
  return NextResponse.json({ letters: letters.map(l => ({
    id: l.id,
    authorName: l.isAnonymous ? 'Anonymous' : l.authorName,
    authorAge: l.authorAge,
    country: l.country,
    letter: l.letter,
    createdAt: l.createdAt,
  })) })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { authorName, authorAge, country, isAnonymous, letter } = body

  if (!isAnonymous && (!authorName || authorName.trim().length < 2))
    return NextResponse.json({ error: 'Please provide your name, or choose to be anonymous.' }, { status: 400 })
  const ageNum = Number(authorAge)
  if (!ageNum || ageNum < 5 || ageNum > 100)
    return NextResponse.json({ error: 'Please enter a valid age.' }, { status: 400 })
  if (!country || typeof country !== 'string' || country.trim().length < 2)
    return NextResponse.json({ error: 'Country is required.' }, { status: 400 })
  if (!letter || letter.trim().length < 50)
    return NextResponse.json({ error: 'Letter must be at least 50 characters.' }, { status: 400 })
  if (letter.trim().length > 3000)
    return NextResponse.json({ error: 'Letter must be 3000 characters or fewer.' }, { status: 400 })

  createFutureLetter({
    authorName: isAnonymous ? '' : authorName.trim(),
    authorAge: ageNum,
    country: country.trim(),
    isAnonymous: Boolean(isAnonymous),
    letter: letter.trim(),
  })

  return NextResponse.json({ message: 'Your letter has been received. It will be added to the archive after review.' }, { status: 201 })
}
