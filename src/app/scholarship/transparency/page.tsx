import type { Metadata } from 'next'
import Link from 'next/link'
import { getImpactStats } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Transparency Report — The Invisible Roots Scholarship',
}

export default function TransparencyPage() {
  const stats = getImpactStats()

  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>

      <div style={{ padding: '6rem 1.5rem 0', maxWidth: '720px', margin: '0 auto' }}>
        <Link href="/scholarship" style={{
          fontFamily: 'var(--font-body)', fontSize: '0.6rem',
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: 'rgba(196,149,58,0.6)', textDecoration: 'none',
        }}>
          ← The Invisible Roots Scholarship
        </Link>
      </div>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem 8rem' }}>

        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
          fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#F2EDE3',
          lineHeight: 1.15, marginBottom: '0.75rem',
        }}>
          Transparency Report
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.6rem',
          letterSpacing: '0.2em', color: 'rgba(242,237,227,0.25)',
          marginBottom: '3rem',
        }}>
          Live figures · Updated in real time
        </p>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1px', background: 'rgba(196,149,58,0.1)',
          marginBottom: '4rem',
        }}>
          {[
            { label: 'Total contributed', value: stats.totalRaisedFormatted },
            { label: 'Total awarded', value: `€${stats.totalAwarded.toFixed(0)}` },
            { label: 'Supporters', value: String(stats.supporters) },
            { label: 'Scholarships funded', value: String(stats.scholarshipsFunded) },
            { label: 'Applications received', value: String(stats.totalApplications) },
            { label: 'Under review', value: String(stats.openApplications) },
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#080810', padding: '2rem 1.5rem', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: '#C4953A',
                lineHeight: 1, marginBottom: '0.5rem',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: '0.55rem',
                letterSpacing: '0.25em', textTransform: 'uppercase',
                color: 'rgba(242,237,227,0.35)',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
            fontSize: '1.3rem', color: '#F2EDE3', marginBottom: '1.25rem',
            paddingBottom: '0.75rem', borderBottom: '1px solid rgba(196,149,58,0.12)',
          }}>
            How contributions are used
          </h2>
          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300,
            fontSize: '1rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)',
            marginBottom: '1rem',
          }}>
            Direct contributions and a portion of NoiraCiel sales fund documented scholarship
            awards. Each award is tied to a specific applicant and a specific need —
            books, instruments, school materials, digital tools or creative opportunities.
          </p>
          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300,
            fontSize: '1rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)',
          }}>
            Payments are made directly to suppliers, institutions or families where possible,
            rather than as cash transfers, to ensure funds reach their intended purpose.
          </p>
        </section>

        {/* Platform fees note */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
            fontSize: '1.3rem', color: '#F2EDE3', marginBottom: '1.25rem',
            paddingBottom: '0.75rem', borderBottom: '1px solid rgba(196,149,58,0.12)',
          }}>
            Fees and deductions
          </h2>
          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300,
            fontSize: '1rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)',
            marginBottom: '1rem',
          }}>
            Stripe payment processing fees are approximately 1.4–2.9% + 30c per transaction
            and are deducted before funds reach the scholarship pool. The figures above
            represent total amounts received before fee deduction.
          </p>
          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300,
            fontSize: '1rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)',
          }}>
            NoiraCiel does not take an administrative fee or commission from scholarship
            contributions. Website and operational costs are covered separately.
          </p>
        </section>

        {/* Legal */}
        <section style={{ marginBottom: '3.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
            fontSize: '1.3rem', color: '#F2EDE3', marginBottom: '1.25rem',
            paddingBottom: '0.75rem', borderBottom: '1px solid rgba(196,149,58,0.12)',
          }}>
            Legal status
          </h2>
          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300,
            fontSize: '1rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)',
            marginBottom: '1rem',
          }}>
            The Invisible Roots Scholarship is not a registered charity or foundation.
            Contributions are not tax-deductible unless specifically permitted by
            your local jurisdiction. We do not make claims about tax treatment.
          </p>
          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300,
            fontSize: '1rem', lineHeight: 1.85, color: 'rgba(242,237,227,0.55)',
          }}>
            As the initiative grows, we intend to formalise its legal structure to enable
            greater accountability, tax efficiency and governance. Updates will be
            published here.
          </p>
        </section>

        {/* Privacy */}
        <section style={{
          padding: '2rem',
          border: '1px solid rgba(196,149,58,0.1)',
          background: 'rgba(196,149,58,0.02)',
          marginBottom: '3rem',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
            fontSize: '1.1rem', color: '#C4953A', marginBottom: '1rem',
          }}>
            Applicant privacy
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '0.72rem',
            lineHeight: 1.8, color: 'rgba(242,237,227,0.4)',
          }}>
            Applicant names, personal details and stories are never published without
            explicit consent. Any impact stories shared publicly are anonymised by default.
            Application data is retained for a maximum of 3 years and is accessible only
            to the scholarship review team. To request deletion of your data, email
            scholarship@noiraciel.com.
          </p>
        </section>

        <div style={{ textAlign: 'center' }}>
          <Link href="/scholarship/donate" style={{
            fontFamily: 'var(--font-body)', fontSize: '0.65rem',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#080810', background: '#C4953A',
            padding: '0.9rem 2.5rem', textDecoration: 'none', display: 'inline-block',
          }}>
            Support the Scholarship
          </Link>
        </div>
      </main>
    </div>
  )
}
