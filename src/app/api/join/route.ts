import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, instrument, role, message, link } = await req.json()

    if (!name || !email || !instrument || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Log to console (visible in server output / Vercel logs)
    console.log('\n🎵 New musician enquiry from NoiraCiel.com')
    console.log('─────────────────────────────────────────')
    console.log(`Name:       ${name}`)
    console.log(`Email:      ${email}`)
    console.log(`Instrument: ${instrument}`)
    if (role) console.log(`Role tag:   ${role}`)
    if (link) console.log(`Work link:  ${link}`)
    console.log(`Message:\n${message}`)
    console.log('─────────────────────────────────────────\n')

    // ── Optional: send email via nodemailer if SMTP env vars are set ──────
    const smtpHost = process.env.SMTP_HOST
    if (smtpHost) {
      try {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport({
          host:   smtpHost,
          port:   Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
        await transporter.sendMail({
          from:    `"NoiraCiel" <${process.env.SMTP_USER}>`,
          to:      process.env.JOIN_EMAIL ?? 'jorge.manuel.granja@gmail.com',
          replyTo: email,
          subject: `[NoiraCiel] Musician enquiry — ${name} (${instrument})`,
          text: [
            `Name:       ${name}`,
            `Email:      ${email}`,
            `Instrument: ${instrument}`,
            role  ? `Role:       ${role}`  : '',
            link  ? `Work:       ${link}`  : '',
            '',
            message,
          ].filter(Boolean).join('\n'),
        })
      } catch (mailErr) {
        // Email failed but we still return 200 — log is the fallback
        console.error('[join] email send failed:', mailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
