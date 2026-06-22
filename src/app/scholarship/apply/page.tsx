'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Category = 'education' | 'books' | 'music' | 'art' | 'laptop' | 'materials' | 'instrument' | 'training' | 'other'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'education', label: 'School fees / tuition' },
  { value: 'books', label: 'Books & study materials' },
  { value: 'music', label: 'Music lessons or recordings' },
  { value: 'art', label: 'Art supplies or classes' },
  { value: 'laptop', label: 'Laptop or device' },
  { value: 'materials', label: 'School materials' },
  { value: 'instrument', label: 'Musical instrument' },
  { value: 'training', label: 'Creative or vocational training' },
  { value: 'other', label: 'Other' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(196,149,58,0.2)',
  color: '#F2EDE3',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  padding: '0.75rem 1rem',
  outline: 'none',
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

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 300,
  fontStyle: 'italic',
  fontSize: '1.1rem',
  color: '#C4953A',
  marginBottom: '1.5rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid rgba(196,149,58,0.15)',
}

export default function ApplyPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    applicantName: '',
    age: '',
    country: '',
    city: '',
    email: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    category: '' as Category | '',
    supportNeeded: '',
    amountRequested: '',
    personalStory: '',
    privacyConsent: false,
    guardianConsent: false,
    allowAnonymizedStory: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isMinor = form.age !== '' && parseInt(form.age) < 18

  function set(key: string, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.privacyConsent) {
      setError('You must accept the privacy notice to submit your application.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/scholarship/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age) || 0,
          amountRequested: parseFloat(form.amountRequested) || 0,
          isMinor,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please check your answers and try again.')
        return
      }
      router.push('/scholarship/apply/success')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>

      <div style={{ padding: '6rem 1.5rem 0', maxWidth: '680px', margin: '0 auto' }}>
        <Link href="/scholarship" style={{
          fontFamily: 'var(--font-body)', fontSize: '0.6rem',
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: 'rgba(196,149,58,0.6)', textDecoration: 'none',
        }}>
          ← The Invisible Roots Scholarship
        </Link>
      </div>

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem 8rem' }}>

        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#F2EDE3',
            lineHeight: 1.15, marginBottom: '1rem',
          }}>
            Apply for support
          </h1>
          <p style={{
            fontFamily: 'var(--font-heading)', fontWeight: 300,
            fontSize: '1rem', lineHeight: 1.8, color: 'rgba(242,237,227,0.5)',
          }}>
            Apply for yourself, or nominate someone whose future deserves more light.
            Every application is reviewed with care, dignity and full confidentiality.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* Section 1: About You */}
          <section>
            <h2 style={sectionHeadingStyle}>About the applicant</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Full name *</label>
                <input required style={inputStyle} value={form.applicantName}
                  onChange={e => set('applicantName', e.target.value)}
                  placeholder="First and last name" />
              </div>
              <div>
                <label style={labelStyle}>Age *</label>
                <input required type="number" min="5" max="30" style={inputStyle}
                  value={form.age} onChange={e => set('age', e.target.value)}
                  placeholder="e.g. 17" />
              </div>
              <div>
                <label style={labelStyle}>Country *</label>
                <input required style={inputStyle} value={form.country}
                  onChange={e => set('country', e.target.value)}
                  placeholder="e.g. Portugal" />
              </div>
              <div>
                <label style={labelStyle}>City / town</label>
                <input style={inputStyle} value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="e.g. Porto" />
              </div>
              <div>
                <label style={labelStyle}>Email address *</label>
                <input required type="email" style={inputStyle} value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="For correspondence only" />
              </div>
            </div>
          </section>

          {/* Section 2: Guardian (if minor) */}
          {isMinor && (
            <section>
              <h2 style={sectionHeadingStyle}>Parent / guardian contact</h2>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                color: 'rgba(242,237,227,0.35)', marginBottom: '1.25rem', lineHeight: 1.7,
              }}>
                As the applicant is under 18, a parent or guardian must be listed and
                their consent is required below.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Guardian full name *</label>
                  <input required={isMinor} style={inputStyle} value={form.guardianName}
                    onChange={e => set('guardianName', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Guardian email *</label>
                  <input required={isMinor} type="email" style={inputStyle}
                    value={form.guardianEmail}
                    onChange={e => set('guardianEmail', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Guardian phone (optional)</label>
                  <input style={inputStyle} value={form.guardianPhone}
                    onChange={e => set('guardianPhone', e.target.value)} />
                </div>
              </div>
            </section>
          )}

          {/* Section 3: The request */}
          <section>
            <h2 style={sectionHeadingStyle}>What support is needed</h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => set('category', cat.value)}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.72rem',
                      padding: '0.6rem 0.75rem',
                      border: form.category === cat.value
                        ? '1px solid #C4953A'
                        : '1px solid rgba(196,149,58,0.15)',
                      background: form.category === cat.value
                        ? 'rgba(196,149,58,0.1)'
                        : 'transparent',
                      color: form.category === cat.value
                        ? '#C4953A'
                        : 'rgba(242,237,227,0.45)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Describe what is needed *</label>
              <textarea required rows={3} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' as const }}
                value={form.supportNeeded} onChange={e => set('supportNeeded', e.target.value)}
                placeholder="Specific books, an instrument, a laptop model, tuition fees — be as specific as helpful." />
            </div>

            <div>
              <label style={labelStyle}>Estimated amount needed (€) *</label>
              <input required type="number" min="10" max="10000" style={inputStyle}
                value={form.amountRequested} onChange={e => set('amountRequested', e.target.value)}
                placeholder="Your best estimate" />
            </div>
          </section>

          {/* Section 4: Story */}
          <section>
            <h2 style={sectionHeadingStyle}>Personal story</h2>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.75rem',
              color: 'rgba(242,237,227,0.35)', marginBottom: '1.25rem', lineHeight: 1.7,
            }}>
              In your own words, tell us who this person is, what they are working toward,
              and why this support would make a real difference. There is no required format —
              write honestly, briefly, from the heart.
            </p>
            <textarea required rows={8} minLength={50} maxLength={5000}
              style={{ ...inputStyle, resize: 'vertical' as const }}
              value={form.personalStory} onChange={e => set('personalStory', e.target.value)}
              placeholder="A minimum of 50 characters." />
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.6rem',
              color: 'rgba(242,237,227,0.2)', marginTop: '0.5rem', textAlign: 'right',
            }}>
              {form.personalStory.length} / 5000
            </p>
          </section>

          {/* Section 5: Documents note */}
          <section style={{
            padding: '1.25rem',
            border: '1px solid rgba(196,149,58,0.1)',
            background: 'rgba(196,149,58,0.02)',
          }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.72rem',
              color: 'rgba(242,237,227,0.4)', lineHeight: 1.7,
            }}>
              <span style={{ color: 'rgba(196,149,58,0.6)' }}>Supporting documents.</span>{' '}
              If you have supporting documents (school enrolment letter, cost estimates,
              teacher reference), you may email them to{' '}
              <span style={{ color: 'rgba(196,149,58,0.6)' }}>scholarship@noiraciel.com</span>{' '}
              after submitting this form, with your application ID in the subject line.
              Documents are optional and will only be seen by the review team.
            </p>
          </section>

          {/* Section 6: Consent */}
          <section>
            <h2 style={sectionHeadingStyle}>Consent & privacy</h2>

            <div style={{
              padding: '1.25rem',
              border: '1px solid rgba(196,149,58,0.1)',
              background: 'rgba(196,149,58,0.02)',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.7rem',
              lineHeight: 1.8,
              color: 'rgba(242,237,227,0.35)',
            }}>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: 'rgba(242,237,227,0.5)' }}>Privacy notice.</strong>{' '}
                The personal information in this application is collected solely for the purpose of
                reviewing and administering The Invisible Roots Scholarship. It will not be shared
                publicly or sold. Only the NoiraCiel scholarship review team will have access to
                individual application data.
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                Applicant names, stories and personal details will never be published without your
                explicit consent. If you choose to allow it below, anonymised versions of your story
                may be used in our public transparency reports to demonstrate impact.
              </p>
              <p>
                Data will be retained for a maximum of 3 years from the date of submission, or until
                you request deletion. To request deletion or correction of your data, email
                scholarship@noiraciel.com.
              </p>
            </div>

            {/* Privacy consent */}
            <ConsentRow
              checked={form.privacyConsent}
              onChange={v => set('privacyConsent', v)}
              required
            >
              I have read and accept the privacy notice above. I consent to my application data
              being processed for scholarship review purposes. *
            </ConsentRow>

            {/* Guardian consent */}
            {isMinor && (
              <ConsentRow
                checked={form.guardianConsent}
                onChange={v => set('guardianConsent', v)}
                required
              >
                I am the parent or guardian of the applicant and I consent to this application
                being submitted on their behalf. *
              </ConsentRow>
            )}

            {/* Anonymous story */}
            <ConsentRow
              checked={form.allowAnonymizedStory}
              onChange={v => set('allowAnonymizedStory', v)}
            >
              I allow an anonymised version of this story to be shared publicly to demonstrate
              the scholarship's impact (optional — your name will never be used).
            </ConsentRow>
          </section>

          {error && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#e07070',
              padding: '0.75rem 1rem', border: '1px solid rgba(224,112,112,0.2)',
              background: 'rgba(224,112,112,0.05)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              fontFamily: 'var(--font-body)', fontSize: '0.65rem',
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: loading ? 'rgba(8,8,16,0.5)' : '#080810',
              background: loading ? 'rgba(196,149,58,0.4)' : '#C4953A',
              border: 'none', padding: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </main>
    </div>
  )
}

function ConsentRow({
  checked,
  onChange,
  required = false,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer' }}
      onClick={() => onChange(!checked)}
    >
      <div style={{
        width: '16px', height: '16px', flexShrink: 0, marginTop: '2px',
        border: `1px solid ${required && !checked ? 'rgba(224,112,112,0.4)' : 'rgba(196,149,58,0.35)'}`,
        background: checked ? 'rgba(196,149,58,0.15)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <div style={{ width: '8px', height: '8px', background: '#C4953A' }} />}
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'rgba(242,237,227,0.5)', lineHeight: 1.65 }}>
        {children}
      </span>
    </div>
  )
}
