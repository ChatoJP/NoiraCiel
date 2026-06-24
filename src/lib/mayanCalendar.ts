/**
 * mayanCalendar.ts — Historical-Maya calendrical engine for NoiraCiel.
 *
 * This is a *historical-Mayan-calendar-inspired* calculation, NOT a Dreamspell /
 * "Mayan astrology" engine. It computes the three classic counts that scholars
 * reconstruct from inscriptions:
 *
 *   • The Long Count   (baktun.katun.tun.uinal.kin)
 *   • The Tzolk'in      (a 260-day count: tone 1–13 × one of 20 day-signs)
 *   • The Haab'         (a 365-day vague solar year: 18 months × 20 days + Wayeb 5)
 *
 * CORRELATION
 * ───────────
 * We use the Goodman–Martínez–Thompson (GMT) correlation constant **584283**.
 * This is the Julian Day Number (JDN) of the Maya era base date
 *   0.0.0.0.0  4 Ahau 8 Kumk'u.
 * 584283 is the most widely accepted GMT value (the "Lounsbury" variant; the
 * older 584285 is also seen). It is documented here so it can be adjusted in one
 * place if a different correlation is ever preferred.
 *
 * Dreamspell / "Galactic Signature" interpretations may be layered on top later
 * as an *optional modern reading* — they are deliberately not the primary engine.
 */

export const GMT_CORRELATION = 584283

// ── Tzolk'in day-signs, in canonical order (Imix → Ahau) ─────────────────────
// Index 0 = Imix. The era base (0.0.0.0.0) lands on Ahau (index 19).
export const TZOLKIN_SIGNS = [
  'Imix',     // 0
  'Ik',       // 1
  'Akbal',    // 2
  'Kan',      // 3
  'Chicchan', // 4
  'Cimi',     // 5
  'Manik',    // 6
  'Lamat',    // 7
  'Muluc',    // 8
  'Oc',       // 9
  'Chuen',    // 10
  'Eb',       // 11
  'Ben',      // 12
  'Ix',       // 13
  'Men',      // 14
  'Cib',      // 15
  'Caban',    // 16
  'Etznab',   // 17
  'Cauac',    // 18
  'Ahau',     // 19
] as const

// ── Haab' months, in canonical order ─────────────────────────────────────────
// 18 named 20-day months followed by Wayeb (5 "nameless" days).
export const HAAB_MONTHS = [
  'Pop',     // 0
  'Wo',      // 1
  'Sip',     // 2
  'Sotz',    // 3
  'Sek',     // 4
  'Xul',     // 5
  'Yaxkin',  // 6
  'Mol',     // 7
  'Chen',    // 8
  'Yax',     // 9
  'Sak',     // 10
  'Keh',     // 11
  'Mak',     // 12
  'Kankin',  // 13
  'Muwan',   // 14
  'Pax',     // 15
  'Kayab',   // 16
  'Kumku',   // 17
  'Wayeb',   // 18 (only 5 days: 0–4)
] as const

export interface MayanDay {
  gregorianDate: string
  julianDayNumber: number
  longCount: {
    baktun: number
    katun: number
    tun: number
    uinal: number
    kin: number
    display: string
  }
  tzolkin: {
    tone: number        // 1–13
    signIndex: number   // 0–19
    signName: string
    signMeaning: string // short gloss; full interpretation lives in data/mayanInterpretations
    display: string     // e.g. "4 Ahau"
  }
  haab: {
    day: number         // 0-based count within the month (0–19, or 0–4 for Wayeb)
    monthIndex: number  // 0–18
    monthName: string
    display: string     // e.g. "8 Kumku"
  }
}

// One-line glosses kept here so the calendar is self-describing even without the
// richer interpretation dataset. The poetic / NoiraCiel readings live in
// src/data/mayanInterpretations.ts.
const SIGN_GLOSS: Record<string, string> = {
  Imix:     'the primordial waters, beginnings, the source',
  Ik:       'wind, breath, spirit, communication',
  Akbal:    'night, the house, the inner dark, dreaming',
  Kan:      'the seed, ripeness, latent potential',
  Chicchan: 'the serpent, vital force, instinct',
  Cimi:     'death, transition, release, surrender',
  Manik:    'the deer, the hand, grasp, healing',
  Lamat:    'the star, Venus, abundance, harmony',
  Muluc:    'water, offering, emotion, memory',
  Oc:       'the dog, loyalty, guidance, the heart',
  Chuen:    'the monkey, the artisan, play, weaving',
  Eb:       'the road, the human, service, the journey',
  Ben:      'the reed, the pillar, the spine, integrity',
  Ix:       'the jaguar, the shaman, magic, the earth',
  Men:      'the eagle, vision, the higher view',
  Cib:      'the owl, the elder, wisdom, the inner voice',
  Caban:    'the earth, movement, synchronicity, evolution',
  Etznab:   'the flint, the mirror, the blade, clarity',
  Cauac:    'the storm, transformation, the rain, renewal',
  Ahau:     'the sun, the lord, completion, illumination',
}

/**
 * Convert a Gregorian calendar date to its Julian Day Number.
 * Uses UTC components so the result does not drift with the runtime timezone.
 * Standard Fliegel–Van Flandern algorithm (valid for the Gregorian calendar).
 */
function gregorianToJDN(date: Date): number {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1 // 1–12
  const day = date.getUTCDate()

  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

// True modulo (always returns a non-negative result for positive modulus).
function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function isoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

/**
 * getMayanDay — the single public entry point.
 *
 * @param date  A JS Date. Only its UTC calendar date is used (time is ignored).
 *              Defaults to "now" so callers never hardcode today's date.
 */
export function getMayanDay(date: Date = new Date()): MayanDay {
  const jdn = gregorianToJDN(date)

  // Days elapsed since the Maya era base (0.0.0.0.0 = JDN 584283).
  const days = jdn - GMT_CORRELATION

  // ── Long Count ──────────────────────────────────────────────────────────
  // 1 baktun = 144000 d, 1 katun = 7200 d, 1 tun = 360 d, 1 uinal = 20 d.
  let rem = mod(days, 144000 * 20) // wrap within a piktun so it stays readable
  const baktun = Math.floor(rem / 144000); rem -= baktun * 144000
  const katun = Math.floor(rem / 7200);    rem -= katun * 7200
  const tun = Math.floor(rem / 360);       rem -= tun * 360
  const uinal = Math.floor(rem / 20);      rem -= uinal * 20
  const kin = rem

  // ── Tzolk'in ────────────────────────────────────────────────────────────
  // Base date is "4 Ahau": tone 4, sign index 19.
  const tone = mod(days + 3, 13) + 1            // day 0 → 4
  const signIndex = mod(days + 19, 20)          // day 0 → 19 (Ahau)
  const signName = TZOLKIN_SIGNS[signIndex]

  // ── Haab' ───────────────────────────────────────────────────────────────
  // Base date is "8 Kumku". Kumku is month index 17; day-of-year = 17*20 + 8 = 348.
  const haabDayOfYear = mod(days + 348, 365)
  const monthIndex = Math.floor(haabDayOfYear / 20) // 0–18 (18 = Wayeb)
  const haabDay = haabDayOfYear % 20                 // 0–19 (0–4 for Wayeb)
  const monthName = HAAB_MONTHS[monthIndex]

  return {
    gregorianDate: isoDate(date),
    julianDayNumber: jdn,
    longCount: {
      baktun,
      katun,
      tun,
      uinal,
      kin,
      display: `${baktun}.${katun}.${tun}.${uinal}.${kin}`,
    },
    tzolkin: {
      tone,
      signIndex,
      signName,
      signMeaning: SIGN_GLOSS[signName],
      display: `${tone} ${signName}`,
    },
    haab: {
      day: haabDay,
      monthIndex,
      monthName,
      display: `${haabDay} ${monthName}`,
    },
  }
}
