import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createDonation } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  return key ? new Stripe(key, { apiVersion: '2026-05-27.dahlia' }) : null
}

export async function POST(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Payment processing is not yet configured.' }, { status: 503 })
  }

  const body = await req.json()
  const {
    amountCents,
    currency = 'eur',
    isAnonymous = false,
    donorMessage = '',
    donorEmail = '',
  } = body

  if (!amountCents || amountCents < 100) {
    return NextResponse.json({ error: 'Minimum donation is €1.' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'The Invisible Roots Scholarship',
              description:
                'Supporting young people from low-income families with education, books, instruments, digital tools, and creative opportunities.',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/scholarship/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/scholarship/donate/cancel`,
      customer_email: !isAnonymous && donorEmail ? donorEmail : undefined,
      metadata: {
        isAnonymous: String(isAnonymous),
        donorMessage: donorMessage.slice(0, 500),
        source: 'invisible_roots_scholarship',
      },
    })

    createDonation({
      stripeSessionId: session.id,
      stripePaymentIntent: '',
      amountCents,
      currency,
      isAnonymous,
      donorMessage: donorMessage.slice(0, 500),
      donorEmail: isAnonymous ? '' : donorEmail,
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
