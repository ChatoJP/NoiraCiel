'use client'

import { useState } from 'react'
import Link from 'next/link'

const PRESET_AMOUNTS = [10, 25, 50, 100, 250]

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(196,149,58,0.2)',
  color: '#F2EDE3',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  padding: '0.75rem 1rem',
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.6rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase' as const,
  color: 'rgba(242,237,227,0.45)',
  display: 'block',
  marginBottom: '0.5rem',
}

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25)
  const [customAmount, setCustomAmount] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [donorMessage, setDonorMessage] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const effectiveAmount = customAmount
    ? Math.round(parseFloat(customAmount) * 100)
    : selectedAmount ? selectedAmount * 100 : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!effectiveAmount || effectiveAmount < 100) {
      setError('Please select or enter a donation amount (minimum €1).')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/scholarship/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: effectiveAmount,
          currency: 'eur',
          isAnonymous,
          donorMessage,
          donorEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>

      {/* Back nav */}
      <div style={{ padding: '6rem 1.5rem 0', maxWidth: '640px', margin: '0 auto' }}>
        <Link
          href="/scholarship"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(196,149,58,0.6)',
            textDecoration: 'none',
          }}
        >
          ← The Invisible Roots Scholarship
        </Link>
      </div>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 1.5rem 8rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            color: '#F2EDE3',
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}>
            Make a contribution
          </h1>
          <p style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: '1rem',
            lineHeight: 1.8,
            color: 'rgba(242,237,227,0.5)',
          }}>
            Support a young person's next step. Every contribution, large or small,
            helps fund books, instruments, school materials, digital tools and
            creative opportunities for those who need them most.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Amount selector */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={labelStyle}>Choose an amount (€)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {PRESET_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => { setSelectedAmount(amount); setCustomAmount('') }}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    letterSpacing: '0.1em',
                    padding: '0.6rem 1.4rem',
                    border: selectedAmount === amount && !customAmount
                      ? '1px solid #C4953A'
                      : '1px solid rgba(196,149,58,0.2)',
                    background: selectedAmount === amount && !customAmount
                      ? 'rgba(196,149,58,0.12)'
                      : 'transparent',
                    color: selectedAmount === amount && !customAmount ? '#C4953A' : 'rgba(242,237,227,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  €{amount}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'rgba(242,237,227,0.4)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>€</span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Other amount"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Your email (optional)</label>
            <input
              type="email"
              placeholder="For payment receipt only"
              value={donorEmail}
              onChange={e => setDonorEmail(e.target.value)}
              disabled={isAnonymous}
              style={{ ...inputStyle, opacity: isAnonymous ? 0.4 : 1 }}
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Leave a message (optional)</label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="A note for the scholarship fund — it may be shared anonymously with scholars."
              value={donorMessage}
              onChange={e => setDonorMessage(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' as const }}
            />
          </div>

          {/* Anonymous */}
          <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => setIsAnonymous(!isAnonymous)}>
            <div style={{
              width: '16px', height: '16px', flexShrink: 0, marginTop: '1px',
              border: '1px solid rgba(196,149,58,0.4)',
              background: isAnonymous ? 'rgba(196,149,58,0.2)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isAnonymous && <div style={{ width: '8px', height: '8px', background: '#C4953A' }} />}
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.5 }}>
              Donate anonymously — your name will not be associated with this contribution
            </span>
          </div>

          {error && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: '#e07070',
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              border: '1px solid rgba(224,112,112,0.2)',
              background: 'rgba(224,112,112,0.05)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !effectiveAmount}
            style={{
              width: '100%',
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: loading || !effectiveAmount ? 'rgba(8,8,16,0.5)' : '#080810',
              background: loading || !effectiveAmount ? 'rgba(196,149,58,0.4)' : '#C4953A',
              border: 'none',
              padding: '1rem',
              cursor: loading || !effectiveAmount ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {loading ? 'Redirecting…' : `Continue to Secure Payment${effectiveAmount >= 100 ? ` · €${(effectiveAmount / 100).toFixed(0)}` : ''}`}
          </button>
        </form>

        {/* Legal */}
        <div style={{
          marginTop: '2.5rem',
          padding: '1.5rem',
          borderTop: '1px solid rgba(196,149,58,0.1)',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.6rem',
            lineHeight: 1.8,
            color: 'rgba(242,237,227,0.25)',
          }}>
            Contributions help fund The Invisible Roots Scholarship. A percentage of NoiraCiel sales
            and direct contributions will support documented scholarship awards. Payments are
            processed securely by Stripe — your card details never touch our server. We are not a
            registered charity. Tax treatment depends on your country and our legal structure.
          </p>
        </div>

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link
            href="/scholarship"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.55rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(196,149,58,0.4)',
              textDecoration: 'none',
            }}
          >
            ← Back to Scholarship
          </Link>
        </div>
      </main>
    </div>
  )
}
