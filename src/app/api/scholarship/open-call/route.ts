import { NextResponse } from 'next/server'
import { createOpenCallSubmission, getFeaturedSubmissions } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = ['music', 'visual_art', 'writing', 'film', 'photography', 'dance', 'other']

export async function GET() {
  const featured = getFeaturedSubmissions()
  return NextResponse.json({ submissions: featured.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    submitterName: s.allowPublicDisplay ? s.submitterName : 'Anonymous',
    country: s.country,
    workUrl: s.workUrl,
    createdAt: s.createdAt,
  })) })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { submitterName, age, country, email, title, description, category, workUrl, statement, privacyConsent, allowPublicDisplay } = body

  if (!submitterName || submitterName.trim().length < 2)
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
  const ageNum = Number(age)
  if (!ageNum || ageNum < 5 || ageNum > 30)
    return NextResponse.json({ error: 'Age must be between 5 and 30.' }, { status: 400 })
  if (!country || typeof country !== 'string')
    return NextResponse.json({ error: 'Country is required.' }, { status: 400 })
  if (!title || title.trim().length < 3)
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
  if (!description || description.trim().length < 30)
    return NextResponse.json({ error: 'Description must be at least 30 characters.' }, { status: 400 })
  if (!VALID_CATEGORIES.includes(category))
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
  if (!workUrl || workUrl.trim().length < 5)
    return NextResponse.json({ error: 'A link to your work is required.' }, { status: 400 })
  if (!statement || statement.trim().length < 50)
    return NextResponse.json({ error: 'Artist statement must be at least 50 characters.' }, { status: 400 })
  if (!privacyConsent)
    return NextResponse.json({ error: 'Privacy consent is required.' }, { status: 400 })

  const submission = createOpenCallSubmission({
    submitterName: submitterName.trim(),
    age: ageNum,
    country: country.trim(),
    email: email.trim().toLowerCase(),
    title: title.trim(),
    description: description.trim(),
    category,
    workUrl: workUrl.trim(),
    statement: statement.trim(),
    privacyConsent: true,
    allowPublicDisplay: Boolean(allowPublicDisplay),
  })

  return NextResponse.json({ id: submission.id, message: 'Your submission has been received. Thank you for sharing your work.' }, { status: 201 })
}
