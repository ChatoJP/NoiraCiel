import { NextResponse } from 'next/server'
import { createVolunteer, getAllVolunteers } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  const vols = getAllVolunteers()
  return NextResponse.json({ count: vols.filter(v => v.status === 'approved' || v.status === 'active').length })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { type, name, email, country, city, bio, skills, availability, linkedIn, instagram, privacyConsent } = body

  if (!name || typeof name !== 'string' || name.trim().length < 2)
    return NextResponse.json({ error: 'Full name is required.' }, { status: 400 })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 })
  if (!country || typeof country !== 'string')
    return NextResponse.json({ error: 'Country is required.' }, { status: 400 })
  if (!['mentor', 'volunteer', 'both'].includes(type))
    return NextResponse.json({ error: 'Please select a volunteer type.' }, { status: 400 })
  if (!bio || bio.trim().length < 30)
    return NextResponse.json({ error: 'Please write at least 30 characters about yourself.' }, { status: 400 })
  if (!skills || skills.trim().length < 10)
    return NextResponse.json({ error: 'Please describe your skills (at least 10 characters).' }, { status: 400 })
  if (!privacyConsent)
    return NextResponse.json({ error: 'Privacy consent is required.' }, { status: 400 })

  const vol = createVolunteer({
    type,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    country: country.trim(),
    city: (city ?? '').trim(),
    bio: bio.trim(),
    skills: skills.trim(),
    availability: (availability ?? '').trim(),
    linkedIn: (linkedIn ?? '').trim(),
    instagram: (instagram ?? '').trim(),
    privacyConsent: true,
  })

  return NextResponse.json({ id: vol.id, message: 'Thank you for offering to help. We will be in touch.' }, { status: 201 })
}
