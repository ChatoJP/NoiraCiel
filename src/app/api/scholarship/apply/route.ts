import { NextResponse } from 'next/server'
import { createApplication } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = ['education', 'books', 'music', 'art', 'laptop', 'materials', 'instrument', 'training', 'other']

export async function POST(req: Request) {
  const body = await req.json()

  const {
    applicantName,
    age,
    country,
    city,
    email,
    isMinor,
    guardianName = '',
    guardianEmail = '',
    guardianPhone = '',
    category,
    supportNeeded,
    amountRequested,
    personalStory,
    privacyConsent,
    guardianConsent = false,
    allowAnonymizedStory = false,
  } = body

  // Validation
  if (!applicantName?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
  if (!age || age < 5 || age > 30)
    return NextResponse.json({ error: 'Age must be between 5 and 30.' }, { status: 400 })
  if (!country?.trim()) return NextResponse.json({ error: 'Country is required.' }, { status: 400 })
  if (!VALID_CATEGORIES.includes(category))
    return NextResponse.json({ error: 'Please select a support category.' }, { status: 400 })
  if (!supportNeeded?.trim())
    return NextResponse.json({ error: 'Please describe what support is needed.' }, { status: 400 })
  if (!amountRequested || amountRequested < 10 || amountRequested > 10000)
    return NextResponse.json({ error: 'Estimated amount must be between €10 and €10,000.' }, { status: 400 })
  if (!personalStory?.trim() || personalStory.trim().length < 50)
    return NextResponse.json({ error: 'Personal story must be at least 50 characters.' }, { status: 400 })
  if (!privacyConsent)
    return NextResponse.json({ error: 'Privacy consent is required to submit.' }, { status: 400 })
  if (isMinor && !guardianConsent)
    return NextResponse.json({ error: 'Parent/guardian consent is required for applicants under 18.' }, { status: 400 })
  if (isMinor && !guardianEmail?.trim())
    return NextResponse.json({ error: 'Parent/guardian email is required for applicants under 18.' }, { status: 400 })

  try {
    const app = createApplication({
      applicantName: applicantName.trim().slice(0, 200),
      age: Math.round(age),
      country: country.trim().slice(0, 100),
      city: (city ?? '').trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 200),
      isMinor: Boolean(isMinor),
      guardianName: guardianName.trim().slice(0, 200),
      guardianEmail: guardianEmail.trim().toLowerCase().slice(0, 200),
      guardianPhone: guardianPhone.trim().slice(0, 50),
      category,
      supportNeeded: supportNeeded.trim().slice(0, 2000),
      amountRequested: Math.round(amountRequested),
      personalStory: personalStory.trim().slice(0, 5000),
      privacyConsent: Boolean(privacyConsent),
      guardianConsent: Boolean(guardianConsent),
      allowAnonymizedStory: Boolean(allowAnonymizedStory),
    })

    // TODO: Send confirmation email via Resend
    // await sendApplicationConfirmation({ app })

    return NextResponse.json({ success: true, id: app.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to submit'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
