import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { updateDonationBySession } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

// Stripe requires the raw body for signature verification — do NOT parse as JSON
export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2026-05-27.dahlia' })
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid signature'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    updateDonationBySession(session.id, {
      status: 'completed',
      stripePaymentIntent: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : '',
    })

    // TODO: Send confirmation email via Resend
    // await sendDonationConfirmation({ session })
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    updateDonationBySession(session.id, { status: 'failed' })
  }

  return NextResponse.json({ received: true })
}
