import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Donation Cancelled — The Invisible Roots Scholarship' }

export default function DonateCancelPage() {
  return (
    <div style={{
      background: '#080810', color: '#F2EDE3', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.55rem',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        color: 'rgba(196,149,58,0.6)',
        marginBottom: '2rem',
      }}>
        The Invisible Roots Scholarship
      </p>

      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 300,
        fontStyle: 'italic',
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
        color: '#F2EDE3',
        lineHeight: 1.15,
        marginBottom: '1.5rem',
      }}>
        No payment was taken.
      </h1>

      <p style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 300,
        fontSize: '1rem',
        lineHeight: 1.8,
        color: 'rgba(242,237,227,0.5)',
        maxWidth: '420px',
        marginBottom: '3rem',
      }}>
        Your payment was cancelled and nothing was charged.
        If you'd like to try again, you're always welcome.
      </p>

      <Link
        href="/scholarship/donate"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.6rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#080810',
          background: '#C4953A',
          padding: '0.9rem 2.5rem',
          textDecoration: 'none',
        }}
      >
        Try Again
      </Link>

      <div style={{ marginTop: '1.5rem' }}>
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
    </div>
  )
}
