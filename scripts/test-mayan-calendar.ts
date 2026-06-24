/**
 * test-mayan-calendar.ts — correctness checks for the NoiraCiel Mayan calendar.
 *
 * Run: npm run test:calendar   (uses tsx)
 *
 * Strategy: one externally-verifiable golden anchor (2012-12-21, the famous end
 * of the 13th baktun) plus structural invariants that must hold for ANY correct
 * implementation — cycle lengths, per-day increments, and Long Count round-trip.
 */

import { getMayanDay, TZOLKIN_SIGNS } from '../src/lib/mayanCalendar'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  ✓ ${name}`)
  } else {
    failures++
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

console.log('Golden anchor — 2012-12-21 (end of 13th baktun):')
{
  const g = getMayanDay(utc(2012, 12, 21))
  check('Long Count = 13.0.0.0.0', g.longCount.display === '13.0.0.0.0', g.longCount.display)
  check('Tzolk\'in = 4 Ahau', g.tzolkin.display === '4 Ahau', g.tzolkin.display)
  check('Haab\' = 3 Kankin', g.haab.display === '3 Kankin', g.haab.display)
}

console.log('Cycle invariants:')
{
  const base = utc(2026, 6, 24)
  const day = (offset: number) => getMayanDay(new Date(base.getTime() + offset * 86400000))
  const a = day(0)

  // Tzolk'in repeats every 260 days.
  const t260 = day(260)
  check('Tzolk\'in repeats after 260 days', t260.tzolkin.display === a.tzolkin.display, `${a.tzolkin.display} vs ${t260.tzolkin.display}`)

  // Haab' repeats every 365 days.
  const h365 = day(365)
  check('Haab\' repeats after 365 days', h365.haab.display === a.haab.display, `${a.haab.display} vs ${h365.haab.display}`)

  // Calendar Round (Tzolk'in + Haab') repeats every 18980 days (52 years).
  const cr = day(18980)
  check(
    'Calendar Round repeats after 18980 days',
    cr.tzolkin.display === a.tzolkin.display && cr.haab.display === a.haab.display,
  )

  // Lord of the Night repeats every 9 days.
  check('Lord of the Night repeats after 9 days', day(9).lordOfNight.glyph === a.lordOfNight.glyph)

  // Per-day increments: tone +1 (mod 13), sign +1 (mod 20).
  const b = day(1)
  const toneOk = b.tzolkin.tone === (a.tzolkin.tone % 13) + 1
  const signOk = b.tzolkin.signIndex === (a.tzolkin.signIndex + 1) % 20
  check('Tone advances by 1 each day', toneOk, `${a.tzolkin.tone} -> ${b.tzolkin.tone}`)
  check('Sign advances by 1 each day', signOk, `${TZOLKIN_SIGNS[a.tzolkin.signIndex]} -> ${TZOLKIN_SIGNS[b.tzolkin.signIndex]}`)

  // Trecena: position equals the tone, and is consistent within a 13-day window.
  check('Trecena position equals tone', a.trecena.position === a.tzolkin.tone)
}

console.log('Long Count round-trip (recompute days from components):')
{
  for (const [y, m, d] of [[2026, 6, 24], [1999, 12, 31], [2040, 1, 1]] as const) {
    const g = getMayanDay(utc(y, m, d))
    const lc = g.longCount
    const daysFromLC = lc.baktun * 144000 + lc.katun * 7200 + lc.tun * 360 + lc.uinal * 20 + lc.kin
    const expectedDays = ((g.julianDayNumber - 584283) % (144000 * 20) + 144000 * 20) % (144000 * 20)
    check(`Long Count reconstructs days for ${y}-${m}-${d}`, daysFromLC === expectedDays, `${daysFromLC} vs ${expectedDays}`)
  }
}

console.log('')
if (failures === 0) {
  console.log('All Mayan calendar checks passed.')
  process.exit(0)
} else {
  console.error(`${failures} check(s) failed.`)
  process.exit(1)
}
