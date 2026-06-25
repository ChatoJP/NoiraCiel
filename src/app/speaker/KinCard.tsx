import Link from 'next/link'
import SignGlyph from './SignGlyph'

/**
 * KinCard — a premium card for a single Kin (one day of the calendar).
 *
 * Two variants:
 *   • "mini"  — compact tile for the 13-day wave grid (glyph, Kin, stage).
 *   • "full"  — the complete daily card (glyph, tone, sign, poetic phrase,
 *               NoiraCiel mood, recommendation, date) — suitable for a hero
 *               card or, later, a generated share/OG image.
 *
 * Pure presentational (no hooks) so it is usable from server or client trees.
 * Visual language: black stone, muted gold accent, Atlantic restraint.
 */

export interface KinCardData {
  kinDisplay: string        // e.g. "11 Ix"
  tone: number
  signName: string
  position?: number         // position in the wave (1–13)
  stage?: string            // wave-stage label, e.g. "Mirror"
  shortMeaning?: string
  phrase?: string           // poetic one-liner
  mood?: string             // NoiraCiel mood word(s)
  date?: string
  albumTitle?: string | null
  albumHref?: string | null
  trackTitle?: string | null
  bookTitle?: string | null
}

export default function KinCard({
  data,
  variant = 'full',
  active = false,
}: {
  data: KinCardData
  variant?: 'full' | 'mini'
  active?: boolean
}) {
  if (variant === 'mini') {
    return (
      <div
        className={`relative flex flex-col items-center text-center px-2 py-3 border transition-all ${
          active
            ? 'border-noir-gold/45 bg-noir-gold/5 shadow-[0_0_18px_-6px_rgb(var(--t-accent-rgb))]'
            : 'border-noir-silver/10 bg-noir-void/50 hover:border-noir-silver/25'
        }`}
      >
        {data.position != null && (
          <span className="absolute top-1 left-1.5 font-body text-[8px] tabular-nums text-noir-silver/30">
            {data.position}
          </span>
        )}
        <span className={active ? 'text-t-accent' : 'text-noir-silver/45'}>
          <SignGlyph sign={data.signName} size={30} />
        </span>
        <span className="font-heading italic text-[12px] text-noir-ivory/80 mt-1.5 leading-none">
          {data.kinDisplay}
        </span>
        {data.shortMeaning && (
          <span className="font-body text-[8.5px] text-noir-silver/40 mt-1 leading-tight">
            {data.shortMeaning}
          </span>
        )}
      </div>
    )
  }

  // ── full ──────────────────────────────────────────────────────────────────
  return (
    <article
      className={`relative overflow-hidden border bg-noir-void/70 backdrop-blur-sm ${
        active ? 'border-noir-gold/40' : 'border-noir-silver/12'
      }`}
    >
      {/* soft accent glow */}
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 rounded-full blur-[70px] opacity-[0.16] bg-[radial-gradient(circle,rgb(var(--t-accent-rgb)),transparent_70%)]" />

      <div className="relative flex flex-col items-center text-center px-6 pt-7 pb-6">
        {data.date && (
          <p className="font-body text-[9px] tracking-[0.35em] uppercase text-noir-silver/35">
            {data.date}
          </p>
        )}
        <span className="text-t-accent mt-3">
          <SignGlyph sign={data.signName} size={64} />
        </span>
        <p className="font-heading italic text-3xl text-noir-ivory/90 mt-3 leading-none">
          {data.kinDisplay}
        </p>
        <p className="font-body text-[10px] tracking-[0.25em] uppercase text-noir-gold/45 mt-2">
          Tone {data.tone}
          {data.stage ? ` · ${data.stage}` : ''} · {data.signName}
        </p>

        {data.phrase && (
          <p className="font-heading italic text-[14px] text-noir-ivory/70 leading-[1.7] mt-4 max-w-xs">
            {data.phrase}
          </p>
        )}

        {data.mood && (
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/40 mt-4">
            {data.mood}
          </p>
        )}

        {(data.albumTitle || data.bookTitle) && (
          <div className="mt-5 pt-4 border-t border-noir-silver/10 w-full">
            {data.albumTitle && (
              <p className="font-body text-[11px] text-noir-silver/50">
                Listen:{' '}
                {data.albumHref ? (
                  <Link href={data.albumHref} className="text-noir-ivory/80 hover:text-noir-gold transition-colors">
                    {data.albumTitle}
                  </Link>
                ) : (
                  <span className="text-noir-ivory/80">{data.albumTitle}</span>
                )}
                {data.trackTitle && <span className="text-noir-silver/40"> · {data.trackTitle}</span>}
              </p>
            )}
            {data.bookTitle && (
              <p className="font-body text-[11px] text-noir-silver/50 mt-1">
                Read: <span className="text-noir-silver/70">{data.bookTitle}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
