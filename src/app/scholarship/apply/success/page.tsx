import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Application Received — The Invisible Roots Scholarship' }

export default function ApplySuccessPage() {
  return (
    <div style={{
      background: '#080810', color: '#F2EDE3', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center',
    }}>
      <div style={{ width: '1px', height: '4rem', background: 'linear-gradient(to bottom, transparent, rgba(196,149,58,0.3))', marginBottom: '3rem' }} />

      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '0.55rem',
        letterSpacing: '0.4em', textTransform: 'uppercase',
        color: '#C4953A', opacity: 0.7, marginBottom: '2rem',
      }}>
        The Invisible Roots Scholarship
      </p>

      <h1 style={{
        fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
        fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: '#F2EDE3',
        lineHeight: 1.15, marginBottom: '1.5rem', maxWidth: '600px',
      }}>
        Application received.
      </h1>

      <div style={{ width: '1.5rem', height: '1px', background: 'rgba(196,149,58,0.4)', marginBottom: '2rem' }} />

      <p style={{
        fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
        fontSize: 'clamp(1rem, 2vw, 1.15rem)', lineHeight: 1.85,
        color: 'rgba(242,237,227,0.6)', maxWidth: '520px', marginBottom: '1.5rem',
      }}>
        Your application has been recorded and will be reviewed with care.
        Every application is read by a person, not a machine.
      </p>

      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '0.7rem',
        color: 'rgba(242,237,227,0.3)', maxWidth: '480px',
        lineHeight: 1.7, marginBottom: '3rem',
      }}>
        We review applications as they arrive. You will hear back at the email address
        you provided. Due to the volume of applications, this may take some weeks.
        We read every one.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/scholarship" style={{
          fontFamily: 'var(--font-body)', fontSize: '0.6rem',
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: '#C4953A', border: '1px solid rgba(196,149,58,0.35)',
          padding: '0.75rem 2rem', textDecoration: 'none',
        }}>
          Back to Scholarship
        </Link>
        <Link href="/" style={{
          fontFamily: 'var(--font-body)', fontSize: '0.6rem',
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: 'rgba(242,237,227,0.4)', border: '1px solid rgba(242,237,227,0.12)',
          padding: '0.75rem 2rem', textDecoration: 'none',
        }}>
          Return to NoiraCiel
        </Link>
      </div>

      <div style={{ width: '1px', height: '4rem', background: 'linear-gradient(to bottom, rgba(196,149,58,0.3), transparent)', marginTop: '4rem' }} />
    </div>
  )
}
