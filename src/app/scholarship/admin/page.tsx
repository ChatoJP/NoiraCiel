'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  Application, ApplicationStatus, ApplicationCategory,
  Volunteer, VolunteerStatus, VolunteerType,
  OpenCallSubmission, OpenCallStatus,
  CommunityMessage, FutureLetter, ModerationStatus,
} from '@/lib/scholarshipStore'

// ─── Status / label maps ───────────────────────────────────────────────────────

const APP_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: 'Submitted', under_review: 'Under Review', shortlisted: 'Shortlisted',
  approved: 'Approved', rejected: 'Rejected', funded: 'Funded', paid: 'Paid / Complete',
}
const APP_STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted: 'rgba(196,149,58,0.7)', under_review: 'rgba(100,160,220,0.7)',
  shortlisted: 'rgba(130,200,130,0.7)', approved: 'rgba(80,200,120,0.9)',
  rejected: 'rgba(200,80,80,0.7)', funded: 'rgba(196,149,58,1)', paid: 'rgba(130,200,130,1)',
}
const CATEGORY_LABELS: Record<ApplicationCategory, string> = {
  education: 'Education', books: 'Books', music: 'Music', art: 'Art',
  laptop: 'Laptop', materials: 'Materials', instrument: 'Instrument',
  training: 'Training', other: 'Other',
}
const VOL_STATUS_LABELS: Record<VolunteerStatus, string> = {
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected', active: 'Active',
}
const VOL_STATUS_COLORS: Record<VolunteerStatus, string> = {
  pending: 'rgba(196,149,58,0.7)', approved: 'rgba(80,200,120,0.9)',
  rejected: 'rgba(200,80,80,0.7)', active: 'rgba(130,200,130,1)',
}
const VOL_TYPE_LABELS: Record<VolunteerType, string> = {
  mentor: 'Mentor', volunteer: 'Volunteer', both: 'Both',
}
const OC_STATUS_LABELS: Record<OpenCallStatus, string> = {
  submitted: 'Submitted', under_review: 'Under Review', featured: 'Featured', rejected: 'Rejected',
}
const OC_STATUS_COLORS: Record<OpenCallStatus, string> = {
  submitted: 'rgba(196,149,58,0.7)', under_review: 'rgba(100,160,220,0.7)',
  featured: 'rgba(196,149,58,1)', rejected: 'rgba(200,80,80,0.7)',
}
const MOD_STATUS_LABELS: Record<ModerationStatus, string> = {
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
}
const MOD_STATUS_COLORS: Record<ModerationStatus, string> = {
  pending: 'rgba(196,149,58,0.7)', approved: 'rgba(80,200,120,0.9)', rejected: 'rgba(200,80,80,0.7)',
}

type Tab = 'applications' | 'volunteers' | 'open-call' | 'community' | 'letters'

interface PendingCounts { community: number; letters: number; 'open-call': number }

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [savedToken, setSavedToken] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('applications')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<PendingCounts>({ community: 0, letters: 0, 'open-call': 0 })

  useEffect(() => {
    const t = sessionStorage.getItem('scholarship_admin_token')
    if (t) { setSavedToken(t); setToken(t) }
  }, [])

  useEffect(() => {
    if (!savedToken) return
    const headers = { Authorization: `Bearer ${savedToken}` }
    Promise.all([
      fetch('/api/scholarship/admin/community', { headers }).then(r => r.json()),
      fetch('/api/scholarship/admin/letters', { headers }).then(r => r.json()),
      fetch('/api/scholarship/admin/open-call', { headers }).then(r => r.json()),
    ]).then(([c, l, oc]) => {
      setPending({
        community: (c.messages ?? []).filter((m: { status: string }) => m.status === 'pending').length,
        letters:   (l.letters  ?? []).filter((m: { status: string }) => m.status === 'pending').length,
        'open-call': (oc.submissions ?? []).filter((m: { status: string }) => m.status === 'submitted').length,
      })
    }).catch(() => {})
  }, [savedToken])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    sessionStorage.setItem('scholarship_admin_token', token)
    setSavedToken(token)
  }

  const base: React.CSSProperties = { background: '#080810', color: '#F2EDE3', minHeight: '100vh', fontFamily: 'var(--font-body)' }

  if (!savedToken) {
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '360px', width: '100%' }}>
          <p style={{ fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', marginBottom: '1.5rem' }}>Scholarship Admin</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.8rem', marginBottom: '2rem' }}>Admin access</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password" placeholder="Admin token" value={token}
              onChange={e => setToken(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196,149,58,0.2)', color: '#F2EDE3', fontFamily: 'var(--font-body)', fontSize: '0.875rem', padding: '0.75rem 1rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }}
            />
            {error && <p style={{ fontSize: '0.7rem', color: '#e07070', marginBottom: '1rem' }}>{error}</p>}
            <button type="submit" style={{ width: '100%', background: '#C4953A', color: '#080810', border: 'none', padding: '0.9rem', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase',
    background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.75rem 1rem',
    color: tab === t ? '#C4953A' : 'rgba(242,237,227,0.35)',
    borderBottom: tab === t ? '1px solid #C4953A' : '1px solid transparent',
    transition: 'all 0.2s',
  })

  return (
    <div style={base}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(196,149,58,0.1)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {(['applications', 'volunteers', 'open-call', 'community', 'letters'] as Tab[]).map(t => {
            const count = pending[t as keyof PendingCounts] ?? 0
            const label = t === 'open-call' ? 'Open Call' : t.charAt(0).toUpperCase() + t.slice(1)
            return (
              <button key={t} onClick={() => setTab(t)} style={{ ...tabStyle(t), position: 'relative' }}>
                {label}
                {count > 0 && (
                  <span style={{
                    position: 'absolute', top: '6px', right: '2px',
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: 'rgba(220,80,80,0.85)', color: '#fff',
                    fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-body)', lineHeight: 1,
                  }}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => { sessionStorage.removeItem('scholarship_admin_token'); setSavedToken(null) }} style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.25)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            Log out
          </button>
        </div>
      </div>

      {tab === 'applications' && <ApplicationsTab token={savedToken} />}
      {tab === 'volunteers' && <VolunteersTab token={savedToken} />}
      {tab === 'open-call' && <OpenCallTab token={savedToken} />}
      {tab === 'community' && <ModerationTab token={savedToken} entity="community" />}
      {tab === 'letters' && <ModerationTab token={savedToken} entity="letters" />}
    </div>
  )
}

// ─── Applications Tab ─────────────────────────────────────────────────────────

function ApplicationsTab({ token }: { token: string }) {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [selected, setSelected] = useState<Application | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState<ApplicationStatus>('submitted')
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchApps = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterCategory) params.set('category', filterCategory)
      if (filterCountry) params.set('country', filterCountry)
      const res = await fetch(`/api/scholarship/admin?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setApps(data.applications ?? [])
    } finally { setLoading(false) }
  }, [token, filterStatus, filterCategory, filterCountry])

  useEffect(() => { fetchApps() }, [fetchApps])

  function openApp(app: Application) {
    setSelected(app)
    setEditNotes(app.adminNotes)
    setEditStatus(app.status)
    setEditAmount(app.amountApproved != null ? String(app.amountApproved) : '')
  }

  async function saveApp() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/scholarship/admin/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: editStatus, adminNotes: editNotes, amountApproved: editAmount ? parseFloat(editAmount) : null }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setApps(prev => prev.map(a => a.id === updated.id ? updated : a))
      setSelected(updated)
    } catch { alert('Failed to save.') } finally { setSaving(false) }
  }

  function exportCSV() {
    fetch('/api/scholarship/admin/export', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`
        a.click(); URL.revokeObjectURL(url)
      })
  }

  const ALL_APP_STATUSES = Object.keys(APP_STATUS_LABELS) as ApplicationStatus[]
  const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ApplicationCategory[]

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid rgba(196,149,58,0.1)' }}>
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(196,149,58,0.08)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <FilterSelect value={filterStatus} onChange={setFilterStatus} placeholder="All statuses" options={ALL_APP_STATUSES.map(s => ({ value: s, label: APP_STATUS_LABELS[s] }))} />
          <FilterSelect value={filterCategory} onChange={setFilterCategory} placeholder="All categories" options={ALL_CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABELS[c] }))} />
          <input value={filterCountry} onChange={e => setFilterCountry(e.target.value)} placeholder="Country…" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196,149,58,0.15)', color: '#F2EDE3', fontFamily: 'var(--font-body)', fontSize: '0.72rem', padding: '0.4rem 0.75rem', outline: 'none', minWidth: '140px' }} />
          <button onClick={fetchApps} style={smallBtnStyle('#C4953A')}>Refresh</button>
          <button onClick={exportCSV} style={smallBtnStyle('rgba(196,149,58,0.5)')}>Export CSV</button>
          <span style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.25)' }}>{apps.length} records</span>
        </div>
        {loading && <p style={{ padding: '2rem', fontSize: '0.7rem', color: 'rgba(242,237,227,0.3)', textAlign: 'center' }}>Loading…</p>}
        {!loading && apps.length === 0 && <p style={{ padding: '3rem', fontSize: '0.75rem', color: 'rgba(242,237,227,0.3)', textAlign: 'center' }}>No applications found.</p>}
        {!loading && apps.map(app => (
          <div key={app.id} onClick={() => openApp(app)} style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(196,149,58,0.07)', cursor: 'pointer', background: selected?.id === app.id ? 'rgba(196,149,58,0.05)' : 'transparent', transition: 'background 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.82rem', color: '#F2EDE3', marginBottom: '0.2rem' }}>
                  {app.applicantName}
                  {app.isMinor && <span style={{ marginLeft: '0.5rem', fontSize: '0.55rem', color: 'rgba(196,149,58,0.6)' }}>minor</span>}
                </p>
                <p style={{ fontSize: '0.62rem', color: 'rgba(242,237,227,0.35)' }}>
                  {app.city ? `${app.city}, ` : ''}{app.country} · Age {app.age}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <StatusBadge color={APP_STATUS_COLORS[app.status]}>{APP_STATUS_LABELS[app.status]}</StatusBadge>
                <p style={{ fontSize: '0.58rem', color: 'rgba(242,237,227,0.25)', marginTop: '0.2rem' }}>{new Date(app.createdAt).toLocaleDateString('en-IE')}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <Tag>{CATEGORY_LABELS[app.category]}</Tag>
              <Tag>€{app.amountRequested.toLocaleString()}</Tag>
              {app.amountApproved != null && <Tag gold>Approved €{app.amountApproved.toLocaleString()}</Tag>}
            </div>
          </div>
        ))}
      </div>
      {selected ? (
        <div style={{ width: '400px', flexShrink: 0, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(196,149,58,0.1)' }}>
            <p style={{ fontSize: '0.5rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '0.4rem' }}>{selected.id}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.25rem', marginBottom: '0.2rem' }}>{selected.applicantName}</h2>
            <p style={{ fontSize: '0.68rem', color: 'rgba(242,237,227,0.35)' }}>Age {selected.age} · {selected.city ? `${selected.city}, ` : ''}{selected.country}</p>
            <p style={{ fontSize: '0.68rem', color: 'rgba(242,237,227,0.3)', marginTop: '0.2rem' }}>{selected.email}</p>
            {selected.isMinor && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', border: '1px solid rgba(196,149,58,0.12)' }}>
                <p style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.45)' }}>Guardian: {selected.guardianName} · {selected.guardianEmail}</p>
              </div>
            )}
          </div>
          <DetailField label="Category">{CATEGORY_LABELS[selected.category]}</DetailField>
          <DetailField label="Requested">€{selected.amountRequested.toLocaleString()}</DetailField>
          <DetailField label="Support needed">{selected.supportNeeded}</DetailField>
          <DetailField label="Personal story">{selected.personalStory}</DetailField>
          <DetailField label="Submitted">{new Date(selected.createdAt).toLocaleDateString('en-IE', { dateStyle: 'long' })}</DetailField>
          <DetailField label="Anon story allowed">{selected.allowAnonymizedStory ? 'Yes' : 'No'}</DetailField>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(196,149,58,0.1)' }}>
            <AdminField label="Status">
              <select value={editStatus} onChange={e => setEditStatus(e.target.value as ApplicationStatus)} style={selectStyle}>
                {(Object.keys(APP_STATUS_LABELS) as ApplicationStatus[]).map(s => <option key={s} value={s}>{APP_STATUS_LABELS[s]}</option>)}
              </select>
            </AdminField>
            <AdminField label="Amount approved (€)">
              <input type="number" min="0" value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="Leave blank if not approved" style={inputStyle} />
            </AdminField>
            <AdminField label="Internal notes">
              <textarea rows={4} value={editNotes} onChange={e => setEditNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </AdminField>
            <SaveButton saving={saving} onClick={saveApp} />
          </div>
        </div>
      ) : (
        <EmptyDetail>Select an application to review</EmptyDetail>
      )}
    </div>
  )
}

// ─── Volunteers Tab ───────────────────────────────────────────────────────────

function VolunteersTab({ token }: { token: string }) {
  const [vols, setVols] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Volunteer | null>(null)
  const [editStatus, setEditStatus] = useState<VolunteerStatus>('pending')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scholarship/admin/volunteers', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setVols(data.volunteers ?? [])
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetch_() }, [fetch_])

  function open(v: Volunteer) { setSelected(v); setEditStatus(v.status); setEditNotes(v.adminNotes) }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/scholarship/admin/volunteers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: selected.id, status: editStatus, adminNotes: editNotes }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setVols(prev => prev.map(v => v.id === updated.id ? updated : v))
      setSelected(updated)
    } catch { alert('Failed to save.') } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid rgba(196,149,58,0.1)' }}>
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(196,149,58,0.08)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={fetch_} style={smallBtnStyle('#C4953A')}>Refresh</button>
          <span style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.25)' }}>{vols.length} volunteers</span>
        </div>
        {loading && <p style={{ padding: '2rem', fontSize: '0.7rem', color: 'rgba(242,237,227,0.3)', textAlign: 'center' }}>Loading…</p>}
        {!loading && vols.length === 0 && <p style={{ padding: '3rem', fontSize: '0.75rem', color: 'rgba(242,237,227,0.3)', textAlign: 'center' }}>No volunteers yet.</p>}
        {!loading && vols.map(v => (
          <div key={v.id} onClick={() => open(v)} style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(196,149,58,0.07)', cursor: 'pointer', background: selected?.id === v.id ? 'rgba(196,149,58,0.05)' : 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.82rem', color: '#F2EDE3', marginBottom: '0.2rem' }}>{v.name}</p>
                <p style={{ fontSize: '0.62rem', color: 'rgba(242,237,227,0.35)' }}>{v.city ? `${v.city}, ` : ''}{v.country} · {VOL_TYPE_LABELS[v.type]}</p>
              </div>
              <StatusBadge color={VOL_STATUS_COLORS[v.status]}>{VOL_STATUS_LABELS[v.status]}</StatusBadge>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.3)', marginTop: '0.3rem' }}>{v.skills.slice(0, 80)}{v.skills.length > 80 ? '…' : ''}</p>
          </div>
        ))}
      </div>
      {selected ? (
        <div style={{ width: '400px', flexShrink: 0, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(196,149,58,0.1)' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{selected.name}</h2>
            <p style={{ fontSize: '0.68rem', color: 'rgba(242,237,227,0.35)' }}>{selected.email}</p>
            <p style={{ fontSize: '0.68rem', color: 'rgba(242,237,227,0.3)', marginTop: '0.2rem' }}>{VOL_TYPE_LABELS[selected.type]} · {selected.city ? `${selected.city}, ` : ''}{selected.country}</p>
          </div>
          <DetailField label="Bio">{selected.bio}</DetailField>
          <DetailField label="Skills">{selected.skills}</DetailField>
          {selected.availability && <DetailField label="Availability">{selected.availability}</DetailField>}
          {selected.linkedIn && <DetailField label="LinkedIn">{selected.linkedIn}</DetailField>}
          {selected.instagram && <DetailField label="Instagram">{selected.instagram}</DetailField>}
          <DetailField label="Submitted">{new Date(selected.createdAt).toLocaleDateString('en-IE', { dateStyle: 'long' })}</DetailField>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(196,149,58,0.1)' }}>
            <AdminField label="Status">
              <select value={editStatus} onChange={e => setEditStatus(e.target.value as VolunteerStatus)} style={selectStyle}>
                {(Object.keys(VOL_STATUS_LABELS) as VolunteerStatus[]).map(s => <option key={s} value={s}>{VOL_STATUS_LABELS[s]}</option>)}
              </select>
            </AdminField>
            <AdminField label="Notes">
              <textarea rows={4} value={editNotes} onChange={e => setEditNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </AdminField>
            <SaveButton saving={saving} onClick={save} />
          </div>
        </div>
      ) : <EmptyDetail>Select a volunteer to review</EmptyDetail>}
    </div>
  )
}

// ─── Open Call Tab ────────────────────────────────────────────────────────────

function OpenCallTab({ token }: { token: string }) {
  const [items, setItems] = useState<OpenCallSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<OpenCallSubmission | null>(null)
  const [editStatus, setEditStatus] = useState<OpenCallStatus>('submitted')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scholarship/admin/open-call', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setItems(data.submissions ?? [])
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetch_() }, [fetch_])

  function open(s: OpenCallSubmission) { setSelected(s); setEditStatus(s.status); setEditNotes(s.adminNotes) }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/scholarship/admin/open-call', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: selected.id, status: editStatus, adminNotes: editNotes }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
      setSelected(updated)
    } catch { alert('Failed to save.') } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid rgba(196,149,58,0.1)' }}>
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(196,149,58,0.08)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={fetch_} style={smallBtnStyle('#C4953A')}>Refresh</button>
          <span style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.25)' }}>{items.length} submissions</span>
        </div>
        {loading && <p style={{ padding: '2rem', fontSize: '0.7rem', color: 'rgba(242,237,227,0.3)', textAlign: 'center' }}>Loading…</p>}
        {!loading && items.length === 0 && <p style={{ padding: '3rem', fontSize: '0.75rem', color: 'rgba(242,237,227,0.3)', textAlign: 'center' }}>No submissions yet.</p>}
        {!loading && items.map(s => (
          <div key={s.id} onClick={() => open(s)} style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(196,149,58,0.07)', cursor: 'pointer', background: selected?.id === s.id ? 'rgba(196,149,58,0.05)' : 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.82rem', color: '#F2EDE3', marginBottom: '0.2rem', fontStyle: 'italic', fontFamily: 'var(--font-heading)', fontWeight: 300 }}>{s.title}</p>
                <p style={{ fontSize: '0.62rem', color: 'rgba(242,237,227,0.35)' }}>{s.submitterName} · {s.country} · Age {s.age}</p>
              </div>
              <StatusBadge color={OC_STATUS_COLORS[s.status]}>{OC_STATUS_LABELS[s.status]}</StatusBadge>
            </div>
          </div>
        ))}
      </div>
      {selected ? (
        <div style={{ width: '400px', flexShrink: 0, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(196,149,58,0.1)' }}>
            <p style={{ fontSize: '0.5rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '0.4rem' }}>{selected.category.replace('_', ' ')}</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{selected.title}</h2>
            <p style={{ fontSize: '0.68rem', color: 'rgba(242,237,227,0.35)' }}>{selected.submitterName} · Age {selected.age} · {selected.country}</p>
            <p style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.25)', marginTop: '0.25rem' }}>{selected.email}</p>
          </div>
          <DetailField label="Description">{selected.description}</DetailField>
          <DetailField label="Artist statement">{selected.statement}</DetailField>
          <DetailField label="Work URL">
            <a href={selected.workUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#C4953A', fontSize: '0.75rem', wordBreak: 'break-all' }}>{selected.workUrl}</a>
          </DetailField>
          <DetailField label="Public display">{selected.allowPublicDisplay ? 'Consented' : 'Anonymous only'}</DetailField>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(196,149,58,0.1)' }}>
            <AdminField label="Status">
              <select value={editStatus} onChange={e => setEditStatus(e.target.value as OpenCallStatus)} style={selectStyle}>
                {(Object.keys(OC_STATUS_LABELS) as OpenCallStatus[]).map(s => <option key={s} value={s}>{OC_STATUS_LABELS[s]}</option>)}
              </select>
            </AdminField>
            <AdminField label="Notes">
              <textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </AdminField>
            <SaveButton saving={saving} onClick={save} />
          </div>
        </div>
      ) : <EmptyDetail>Select a submission to review</EmptyDetail>}
    </div>
  )
}

// ─── Moderation Tab (Community / Letters) ────────────────────────────────────

function ModerationTab({ token, entity }: { token: string; entity: 'community' | 'letters' }) {
  const [items, setItems] = useState<(CommunityMessage | FutureLetter)[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<CommunityMessage | FutureLetter | null>(null)
  const [editStatus, setEditStatus] = useState<ModerationStatus>('pending')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const apiBase = entity === 'community' ? '/api/scholarship/admin/community' : '/api/scholarship/admin/letters'
  const itemKey = entity === 'community' ? 'messages' : 'letters'

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiBase, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setItems(data[itemKey] ?? [])
    } finally { setLoading(false) }
  }, [token, apiBase, itemKey])

  useEffect(() => { fetch_() }, [fetch_])

  function open(item: CommunityMessage | FutureLetter) { setSelected(item); setEditStatus(item.status); setEditNotes(item.adminNotes) }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(apiBase, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: selected.id, status: editStatus, adminNotes: editNotes }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
      setSelected(updated)
    } catch { alert('Failed to save.') } finally { setSaving(false) }
  }

  const getContent = (item: CommunityMessage | FutureLetter) =>
    entity === 'community' ? (item as CommunityMessage).message : (item as FutureLetter).letter

  const getAuthor = (item: CommunityMessage | FutureLetter) =>
    item.isAnonymous ? 'Anonymous' : item.authorName

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
      <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid rgba(196,149,58,0.1)' }}>
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid rgba(196,149,58,0.08)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={fetch_} style={smallBtnStyle('#C4953A')}>Refresh</button>
          <span style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.25)' }}>{items.length} entries</span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(196,149,58,0.5)' }}>
            {items.filter(i => i.status === 'pending').length} pending
          </span>
        </div>
        {loading && <p style={{ padding: '2rem', fontSize: '0.7rem', color: 'rgba(242,237,227,0.3)', textAlign: 'center' }}>Loading…</p>}
        {!loading && items.length === 0 && <p style={{ padding: '3rem', fontSize: '0.75rem', color: 'rgba(242,237,227,0.3)', textAlign: 'center' }}>Nothing here yet.</p>}
        {!loading && items.map(item => (
          <div key={item.id} onClick={() => open(item)} style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid rgba(196,149,58,0.07)', cursor: 'pointer', background: selected?.id === item.id ? 'rgba(196,149,58,0.05)' : 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.82rem', color: '#F2EDE3', marginBottom: '0.2rem' }}>{getAuthor(item)} · {item.country}</p>
                <p style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.35)', lineHeight: 1.5 }}>
                  {getContent(item).slice(0, 100)}{getContent(item).length > 100 ? '…' : ''}
                </p>
              </div>
              <StatusBadge color={MOD_STATUS_COLORS[item.status]}>{MOD_STATUS_LABELS[item.status]}</StatusBadge>
            </div>
          </div>
        ))}
      </div>
      {selected ? (
        <div style={{ width: '400px', flexShrink: 0, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(196,149,58,0.1)' }}>
            <p style={{ fontSize: '0.68rem', color: 'rgba(242,237,227,0.4)' }}>{getAuthor(selected)}</p>
            <p style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.25)', marginTop: '0.2rem' }}>
              {selected.country}
              {entity === 'letters' && ' · Age ' + (selected as FutureLetter).authorAge}
            </p>
          </div>
          <DetailField label={entity === 'community' ? 'Message' : 'Letter'}>{getContent(selected)}</DetailField>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(196,149,58,0.1)' }}>
            <AdminField label="Status">
              <select value={editStatus} onChange={e => setEditStatus(e.target.value as ModerationStatus)} style={selectStyle}>
                {(Object.keys(MOD_STATUS_LABELS) as ModerationStatus[]).map(s => <option key={s} value={s}>{MOD_STATUS_LABELS[s]}</option>)}
              </select>
            </AdminField>
            <AdminField label="Notes">
              <textarea rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </AdminField>
            <SaveButton saving={saving} onClick={save} />
          </div>
        </div>
      ) : <EmptyDetail>Select an entry to moderate</EmptyDetail>}
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d18', border: '1px solid rgba(196,149,58,0.2)',
  color: '#F2EDE3', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
  padding: '0.6rem 0.75rem', outline: 'none',
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d18', border: '1px solid rgba(196,149,58,0.2)',
  color: '#F2EDE3', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
  padding: '0.6rem 0.75rem', outline: 'none', boxSizing: 'border-box',
}

function smallBtnStyle(color: string): React.CSSProperties {
  return {
    fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase',
    color, background: 'transparent', border: `1px solid ${color}`, padding: '0.35rem 0.8rem', cursor: 'pointer',
  }
}

function StatusBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ display: 'inline-block', fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', color, padding: '0.15rem 0.4rem', border: `1px solid ${color}`, flexShrink: 0 }}>
      {children}
    </span>
  )
}

function Tag({ children, gold = false }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: gold ? '#C4953A' : 'rgba(242,237,227,0.3)', border: `1px solid ${gold ? 'rgba(196,149,58,0.3)' : 'rgba(242,237,227,0.1)'}`, padding: '0.1rem 0.35rem' }}>
      {children}
    </span>
  )
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <p style={{ fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.45)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '0.78rem', color: 'rgba(242,237,227,0.6)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{children}</p>
    </div>
  )
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <label style={{ display: 'block', fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.3)', marginBottom: '0.35rem' }}>{label}</label>
      {children}
    </div>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving} style={{ width: '100%', background: '#C4953A', color: '#080810', border: 'none', padding: '0.7rem', fontFamily: 'var(--font-body)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
      {saving ? 'Saving…' : 'Save Changes'}
    </button>
  )
}

function EmptyDetail({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '400px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(242,237,227,0.15)', fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontStyle: 'italic' }}>
      {children}
    </div>
  )
}

function FilterSelect({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ background: '#0d0d18', border: '1px solid rgba(196,149,58,0.15)', color: value ? '#F2EDE3' : 'rgba(242,237,227,0.35)', fontFamily: 'var(--font-body)', fontSize: '0.72rem', padding: '0.4rem 0.75rem', outline: 'none' }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
