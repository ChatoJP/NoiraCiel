import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'approved'
  | 'rejected'
  | 'funded'
  | 'paid'

export type ApplicationCategory =
  | 'education'
  | 'books'
  | 'music'
  | 'art'
  | 'laptop'
  | 'materials'
  | 'instrument'
  | 'training'
  | 'other'

export interface Application {
  id: string
  createdAt: number
  updatedAt: number
  status: ApplicationStatus
  applicantName: string
  age: number
  country: string
  city: string
  email: string
  isMinor: boolean
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  category: ApplicationCategory
  supportNeeded: string
  amountRequested: number
  personalStory: string
  amountApproved: number | null
  adminNotes: string
  privacyConsent: boolean
  guardianConsent: boolean
  allowAnonymizedStory: boolean
}

export interface Donation {
  id: string
  stripeSessionId: string
  stripePaymentIntent: string
  amountCents: number
  currency: string
  createdAt: number
  isAnonymous: boolean
  donorMessage: string
  donorEmail: string
  status: 'pending' | 'completed' | 'failed'
}

export type VolunteerType = 'mentor' | 'volunteer' | 'both'
export type VolunteerStatus = 'pending' | 'approved' | 'rejected' | 'active'

export interface Volunteer {
  id: string
  createdAt: number
  updatedAt: number
  status: VolunteerStatus
  type: VolunteerType
  name: string
  email: string
  country: string
  city: string
  bio: string
  skills: string
  availability: string
  linkedIn: string
  instagram: string
  adminNotes: string
  privacyConsent: boolean
}

export type OpenCallCategory =
  | 'music'
  | 'visual_art'
  | 'writing'
  | 'film'
  | 'photography'
  | 'dance'
  | 'other'

export type OpenCallStatus = 'submitted' | 'under_review' | 'featured' | 'rejected'

export interface OpenCallSubmission {
  id: string
  createdAt: number
  updatedAt: number
  status: OpenCallStatus
  submitterName: string
  age: number
  country: string
  email: string
  title: string
  description: string
  category: OpenCallCategory
  workUrl: string
  statement: string
  adminNotes: string
  privacyConsent: boolean
  allowPublicDisplay: boolean
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected'

export interface CommunityMessage {
  id: string
  createdAt: number
  updatedAt: number
  status: ModerationStatus
  authorName: string
  isAnonymous: boolean
  country: string
  message: string
  adminNotes: string
}

export interface FutureLetter {
  id: string
  createdAt: number
  updatedAt: number
  status: ModerationStatus
  authorName: string
  authorAge: number
  country: string
  isAnonymous: boolean
  letter: string
  adminNotes: string
}

export interface Partner {
  id: string
  createdAt: number
  name: string
  website: string
  contactEmail: string
  description: string
  type: 'institutional' | 'media' | 'corporate' | 'community' | 'other'
  status: 'inquiry' | 'active' | 'inactive'
}

// ─── File paths ───────────────────────────────────────────────────────────────

const DATA_DIR          = path.join(process.cwd(), 'data')
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json')
const DONATIONS_FILE    = path.join(DATA_DIR, 'donations.json')
const VOLUNTEERS_FILE   = path.join(DATA_DIR, 'volunteers.json')
const OPEN_CALL_FILE    = path.join(DATA_DIR, 'open-call.json')
const COMMUNITY_FILE    = path.join(DATA_DIR, 'community-messages.json')
const LETTERS_FILE      = path.join(DATA_DIR, 'future-letters.json')
const PARTNERS_FILE     = path.join(DATA_DIR, 'partners.json')

// ─── Low-level IO ─────────────────────────────────────────────────────────────

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readJSON<T>(file: string, key: string): T[] {
  ensureDir()
  if (!fs.existsSync(file)) return []
  try {
    const raw = fs.readFileSync(file, 'utf-8')
    return (JSON.parse(raw) as Record<string, T[]>)[key] ?? []
  } catch { return [] }
}

function writeJSON<T>(file: string, key: string, items: T[]) {
  ensureDir()
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify({ [key]: items }, null, 2), 'utf-8')
  fs.renameSync(tmp, file)
}

function makeId(prefix: string) {
  return prefix + '_' + crypto.randomBytes(8).toString('hex')
}

// ─── Applications ─────────────────────────────────────────────────────────────

function readApps() { return readJSON<Application>(APPLICATIONS_FILE, 'applications') }
function writeApps(items: Application[]) { writeJSON(APPLICATIONS_FILE, 'applications', items) }

export function createApplication(
  data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'amountApproved' | 'adminNotes'>
): Application {
  const apps = readApps()
  const app: Application = {
    ...data,
    id: makeId('app'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'submitted',
    amountApproved: null,
    adminNotes: '',
  }
  apps.push(app)
  writeApps(apps)
  return app
}

export function getAllApplications(): Application[] {
  return readApps().sort((a, b) => b.createdAt - a.createdAt)
}

export function getApplicationById(id: string): Application | null {
  return readApps().find(a => a.id === id) ?? null
}

export function updateApplication(
  id: string,
  updates: Partial<Pick<Application, 'status' | 'amountApproved' | 'adminNotes'>>
): Application | null {
  const apps = readApps()
  const idx = apps.findIndex(a => a.id === id)
  if (idx === -1) return null
  apps[idx] = { ...apps[idx], ...updates, updatedAt: Date.now() }
  writeApps(apps)
  return apps[idx]
}

// ─── Donations ────────────────────────────────────────────────────────────────

function readDons() { return readJSON<Donation>(DONATIONS_FILE, 'donations') }
function writeDons(items: Donation[]) { writeJSON(DONATIONS_FILE, 'donations', items) }

export function createDonation(data: Omit<Donation, 'id' | 'createdAt'>): Donation {
  const dons = readDons()
  const don: Donation = {
    ...data,
    id: makeId('don'),
    createdAt: Date.now(),
  }
  dons.push(don)
  writeDons(dons)
  return don
}

export function updateDonationBySession(
  sessionId: string,
  updates: Partial<Pick<Donation, 'status' | 'stripePaymentIntent'>>
) {
  const dons = readDons()
  const idx = dons.findIndex(d => d.stripeSessionId === sessionId)
  if (idx !== -1) {
    dons[idx] = { ...dons[idx], ...updates }
    writeDons(dons)
  }
}

// ─── Volunteers ───────────────────────────────────────────────────────────────

function readVols() { return readJSON<Volunteer>(VOLUNTEERS_FILE, 'volunteers') }
function writeVols(items: Volunteer[]) { writeJSON(VOLUNTEERS_FILE, 'volunteers', items) }

export function createVolunteer(
  data: Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'adminNotes'>
): Volunteer {
  const vols = readVols()
  const vol: Volunteer = {
    ...data,
    id: makeId('vol'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'pending',
    adminNotes: '',
  }
  vols.push(vol)
  writeVols(vols)
  return vol
}

export function getAllVolunteers(): Volunteer[] {
  return readVols().sort((a, b) => b.createdAt - a.createdAt)
}

export function updateVolunteer(
  id: string,
  updates: Partial<Pick<Volunteer, 'status' | 'adminNotes'>>
): Volunteer | null {
  const vols = readVols()
  const idx = vols.findIndex(v => v.id === id)
  if (idx === -1) return null
  vols[idx] = { ...vols[idx], ...updates, updatedAt: Date.now() }
  writeVols(vols)
  return vols[idx]
}

// ─── Open Call ────────────────────────────────────────────────────────────────

function readOC() { return readJSON<OpenCallSubmission>(OPEN_CALL_FILE, 'submissions') }
function writeOC(items: OpenCallSubmission[]) { writeJSON(OPEN_CALL_FILE, 'submissions', items) }

export function createOpenCallSubmission(
  data: Omit<OpenCallSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'adminNotes'>
): OpenCallSubmission {
  const items = readOC()
  const item: OpenCallSubmission = {
    ...data,
    id: makeId('oc'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'submitted',
    adminNotes: '',
  }
  items.push(item)
  writeOC(items)
  return item
}

export function getAllOpenCallSubmissions(): OpenCallSubmission[] {
  return readOC().sort((a, b) => b.createdAt - a.createdAt)
}

export function getFeaturedSubmissions(): OpenCallSubmission[] {
  return readOC().filter(s => s.status === 'featured').sort((a, b) => b.createdAt - a.createdAt)
}

export function updateOpenCallSubmission(
  id: string,
  updates: Partial<Pick<OpenCallSubmission, 'status' | 'adminNotes'>>
): OpenCallSubmission | null {
  const items = readOC()
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updatedAt: Date.now() }
  writeOC(items)
  return items[idx]
}

// ─── Community Messages ───────────────────────────────────────────────────────

function readMsgs() { return readJSON<CommunityMessage>(COMMUNITY_FILE, 'messages') }
function writeMsgs(items: CommunityMessage[]) { writeJSON(COMMUNITY_FILE, 'messages', items) }

export function createCommunityMessage(
  data: Omit<CommunityMessage, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'adminNotes'>
): CommunityMessage {
  const items = readMsgs()
  const item: CommunityMessage = {
    ...data,
    id: makeId('msg'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'pending',
    adminNotes: '',
  }
  items.push(item)
  writeMsgs(items)
  return item
}

export function getApprovedMessages(): CommunityMessage[] {
  return readMsgs()
    .filter(m => m.status === 'approved')
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getAllMessages(): CommunityMessage[] {
  return readMsgs().sort((a, b) => b.createdAt - a.createdAt)
}

export function updateMessage(
  id: string,
  updates: Partial<Pick<CommunityMessage, 'status' | 'adminNotes'>>
): CommunityMessage | null {
  const items = readMsgs()
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updatedAt: Date.now() }
  writeMsgs(items)
  return items[idx]
}

// ─── Future Letters ───────────────────────────────────────────────────────────

function readLetters() { return readJSON<FutureLetter>(LETTERS_FILE, 'letters') }
function writeLetters(items: FutureLetter[]) { writeJSON(LETTERS_FILE, 'letters', items) }

export function createFutureLetter(
  data: Omit<FutureLetter, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'adminNotes'>
): FutureLetter {
  const items = readLetters()
  const item: FutureLetter = {
    ...data,
    id: makeId('ltr'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'pending',
    adminNotes: '',
  }
  items.push(item)
  writeLetters(items)
  return item
}

export function getApprovedLetters(): FutureLetter[] {
  return readLetters()
    .filter(l => l.status === 'approved')
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getAllLetters(): FutureLetter[] {
  return readLetters().sort((a, b) => b.createdAt - a.createdAt)
}

export function updateLetter(
  id: string,
  updates: Partial<Pick<FutureLetter, 'status' | 'adminNotes'>>
): FutureLetter | null {
  const items = readLetters()
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updatedAt: Date.now() }
  writeLetters(items)
  return items[idx]
}

// ─── Partners ─────────────────────────────────────────────────────────────────

function readPartners() { return readJSON<Partner>(PARTNERS_FILE, 'partners') }

export function getActivePartners(): Partner[] {
  return readPartners().filter(p => p.status === 'active')
}

// ─── Impact counters (public) ─────────────────────────────────────────────────

export function getImpactStats() {
  const dons = readDons()
  const apps = readApps()
  const vols = readVols()
  const msgs = readMsgs()
  const ltrs = readLetters()
  const oc   = readOC()

  const completed  = dons.filter(d => d.status === 'completed')
  const totalCents = completed.reduce((s, d) => s + d.amountCents, 0)

  return {
    totalRaisedCents: totalCents,
    totalRaisedFormatted: new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(totalCents / 100),
    supporters: completed.length,
    scholarshipsFunded: apps.filter(a => ['funded', 'paid'].includes(a.status)).length,
    openApplications: apps.filter(a => ['submitted', 'under_review'].includes(a.status)).length,
    totalApplications: apps.length,
    totalAwarded: apps
      .filter(a => a.amountApproved != null)
      .reduce((s, a) => s + (a.amountApproved ?? 0), 0),
    volunteerCount: vols.filter(v => v.status === 'approved' || v.status === 'active').length,
    communityMessages: msgs.filter(m => m.status === 'approved').length,
    futureLetters: ltrs.filter(l => l.status === 'approved').length,
    galleryCount: oc.filter(s => s.status === 'featured').length,
  }
}

// ─── Public transparency ledger ────────────────────────────────────────────────
// Line-item detail beyond the aggregate counters above — deliberately strips
// every PII field (no name/email/message/payment IDs) and rounds donation
// timestamps down to the day, so individual entries can't be cross-referenced
// back to a specific person via an exact amount + exact time.
export interface LedgerEntry {
  date: string // YYYY-MM-DD
  amountCents: number
  currency: string
  type: 'donation' | 'award'
  category?: ApplicationCategory
}

export function getLedger(): LedgerEntry[] {
  const dons = readDons()
  const apps = readApps()

  const donations: LedgerEntry[] = dons
    .filter(d => d.status === 'completed')
    .map(d => ({
      date: new Date(d.createdAt).toISOString().slice(0, 10),
      amountCents: d.amountCents,
      currency: d.currency,
      type: 'donation' as const,
    }))

  const awards: LedgerEntry[] = apps
    .filter(a => a.amountApproved != null && ['funded', 'paid'].includes(a.status))
    .map(a => ({
      date: new Date(a.updatedAt).toISOString().slice(0, 10),
      amountCents: Math.round((a.amountApproved ?? 0) * 100),
      currency: 'EUR',
      type: 'award' as const,
      category: a.category,
    }))

  return [...donations, ...awards].sort((a, b) => b.date.localeCompare(a.date))
}
