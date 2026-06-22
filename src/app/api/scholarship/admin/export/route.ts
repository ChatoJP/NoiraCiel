import { NextResponse } from 'next/server'
import { getAllApplications } from '@/lib/scholarshipStore'

export const dynamic = 'force-dynamic'

function isAuthorized(req: Request) {
  const token = process.env.SCHOLARSHIP_ADMIN_TOKEN
  if (!token) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${token}`
}

function escapeCSV(value: unknown): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apps = getAllApplications()

  const headers = [
    'id', 'createdAt', 'status', 'applicantName', 'age', 'country', 'city',
    'email', 'isMinor', 'guardianName', 'guardianEmail',
    'category', 'supportNeeded', 'amountRequested', 'amountApproved',
    'personalStory', 'adminNotes', 'allowAnonymizedStory',
  ]

  const rows = apps.map(a => {
    const date = new Date(a.createdAt).toISOString().slice(0, 10)
    return [
      a.id, date, a.status, a.applicantName, a.age, a.country, a.city,
      a.email, a.isMinor ? 'yes' : 'no', a.guardianName, a.guardianEmail,
      a.category, a.supportNeeded, a.amountRequested, a.amountApproved ?? '',
      a.personalStory, a.adminNotes, a.allowAnonymizedStory ? 'yes' : 'no',
    ].map(escapeCSV).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="scholarship-applications-${date}.csv"`,
    },
  })
}
