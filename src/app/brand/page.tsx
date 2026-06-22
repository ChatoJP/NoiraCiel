import type { Metadata } from 'next'
import Link from 'next/link'
import { THEMES, ALBUM_THEMES } from '@/lib/themes'

export const metadata: Metadata = {
  title: 'Brand & Style Guide',
  description: 'NoiraCiel visual identity — core palette, typography, and per-album themes. Press and collaborator reference.',
  alternates: { canonical: 'https://noiraciel.com/brand' },
}

const CORE_PALETTE = [
  { name: 'void',       hex: '#04040A' },
  { name: 'black',      hex: '#080810' },
  { name: 'deep',       hex: '#0D1625' },
  { name: 'navy',       hex: '#0D1B2A' },
  { name: 'atlantic',   hex: '#1B3A4B' },
  { name: 'slate',      hex: '#2C4A5E' },
  { name: 'fog',        hex: '#526E82' },
  { name: 'mist',       hex: '#7A9AAD' },
  { name: 'silver',     hex: '#B8C5D0' },
  { name: 'pearl',      hex: '#D4DDE3' },
  { name: 'ivory',      hex: '#F2EDE3' },
  { name: 'gold',       hex: '#C4953A' },
  { name: 'gold-light', hex: '#D4A84B' },
  { name: 'gold-dark',  hex: '#9A7020' },
]

function relLum(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const srgb = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}
function rgbStringLum(rgb: string): number {
  const [r, g, b] = rgb.split(',').map((s) => parseInt(s.trim(), 10))
  const srgb = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}
function contrast(l1: number, l2: number): number {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const albumsByTheme: Record<string, string[]> = {}
for (const [album, theme] of Object.entries(ALBUM_THEMES)) {
  ;(albumsByTheme[theme] = albumsByTheme[theme] || []).push(album)
}

export default function BrandPage() {
  return (
    <div style={{ background: '#080810', color: '#F2EDE3', minHeight: '100vh' }}>
      <div style={{ padding: '6rem 1.5rem 0', maxWidth: '880px', margin: '0 auto' }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-body)', fontSize: '0.6rem',
          letterSpacing: '0.25em', textTransform: 'uppercase',
          color: 'rgba(196,149,58,0.6)', textDecoration: 'none',
        }}>
          ← NoiraCiel
        </Link>
      </div>

      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.5rem 8rem' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C4953A', marginBottom: '1rem' }}>
          Brand & Style Guide
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3.2rem)', marginBottom: '0.75rem' }}>
          NoiraCiel
        </h1>
        <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.1rem', color: 'rgba(242,237,227,0.5)', maxWidth: '560px', lineHeight: 1.7, marginBottom: '4rem' }}>
          Atlantic Noir · Sea-Soul. Every palette below is contrast-checked against WCAG AA
          (4.5:1 minimum for small text) — verified by <code style={{ fontSize: '0.85em' }}>scripts/check-theme-contrast.js</code>, enforced in CI.
        </p>

        {/* Wordmark */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={sectionTitle}>Wordmark</h2>
          <div style={{ padding: '3rem 2rem', border: '1px solid rgba(196,149,58,0.12)', background: 'rgba(196,149,58,0.02)', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: '2.2rem', letterSpacing: '0.05em', color: '#F2EDE3' }}>
              NoiraCiel
            </span>
          </div>
          <p style={{ ...note, marginTop: '0.75rem' }}>
            Set in Cormorant Garamond, italic, light weight, wide letter-spacing. No separate logomark exists — the wordmark itself is the mark.
          </p>
        </section>

        {/* Typography */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={sectionTitle}>Typography</h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={swatchBox}>
              <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Heading — Cormorant Garamond
              </p>
              <p style={note}>Used italic, light weight, for titles, track names, emotional copy. Georgia/serif fallback.</p>
            </div>
            <div style={swatchBox}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                Body — DM Sans
              </p>
              <p style={note}>Used for labels, captions, UI text — almost always uppercase with wide tracking (0.2–0.45em) at small sizes. system-ui/sans-serif fallback.</p>
            </div>
          </div>
        </section>

        {/* Core palette */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={sectionTitle}>Core Palette</h2>
          <p style={{ ...note, marginBottom: '1.5rem' }}>
            The site-wide noir scale, void to ivory, plus gold as the universal accent across every album theme.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
            {CORE_PALETTE.map((c) => (
              <div key={c.name} style={{ background: '#080810' }}>
                <div style={{ height: '70px', background: c.hex }} />
                <div style={{ padding: '0.6rem' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(242,237,227,0.6)' }}>{c.name}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(242,237,227,0.3)' }}>{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Per-album themes */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={sectionTitle}>Per-Album Themes</h2>
          <p style={{ ...note, marginBottom: '1.5rem' }}>
            Each album carries its own accent + background tint, applied automatically via <code style={{ fontSize: '0.9em' }}>ApplyTheme</code>.
          </p>
          <div style={{ display: 'grid', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
            {Object.values(THEMES).map((t) => {
              const ivoryRatio = contrast(relLum('#F2EDE3'), rgbStringLum(t.bgTintRgb))
              const accentRatio = contrast(rgbStringLum(t.accentRgb), rgbStringLum(t.bgTintRgb))
              return (
                <div key={t.name} style={{ background: `rgb(${t.bgTintRgb})`, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `rgb(${t.accentRgb})`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.1rem', color: '#F2EDE3' }}>{t.label}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: `rgb(${t.accentRgb})`, marginTop: '0.25rem' }}>
                      {t.mood}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(242,237,227,0.35)', marginTop: '0.4rem' }}>
                      {(albumsByTheme[t.name] ?? []).join(', ') || 'unused'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'rgba(242,237,227,0.4)' }}>
                    <p>accent {accentRatio.toFixed(2)}:1 {accentRatio >= 4.5 ? '✓ AA' : '✗'}</p>
                    <p>ivory {ivoryRatio.toFixed(2)}:1 {ivoryRatio >= 4.5 ? '✓ AA' : '✗'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <p style={{ ...note, textAlign: 'center' }}>
          For press assets, interviews, or licensing — <a href="mailto:press@noiraciel.com" style={{ color: '#C4953A' }}>press@noiraciel.com</a>
        </p>
      </main>
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic',
  fontSize: '1.3rem', color: '#F2EDE3', marginBottom: '1.25rem',
  paddingBottom: '0.75rem', borderBottom: '1px solid rgba(196,149,58,0.12)',
}
const note: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: '0.72rem', lineHeight: 1.7, color: 'rgba(242,237,227,0.4)',
}
const swatchBox: React.CSSProperties = {
  padding: '1.5rem', border: '1px solid rgba(196,149,58,0.1)', background: 'rgba(196,149,58,0.02)',
}
