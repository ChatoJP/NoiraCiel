import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message, type } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Log the contact form submission server-side
    console.log('Contact form submission:', { name, email, subject, message, type })

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, return success
    return NextResponse.json({ success: true, message: 'Message received. We will be in touch.' })
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
