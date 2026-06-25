import Link from 'next/link'

/**
 * ChooseYourDoor — the homepage's orientation section. Right after the hero it
 * answers "where do I start?" with six elegant doors into the universe.
 */

const DOORS: { href: string; label: string; line: string }[] = [
  { href: '/music', label: 'Music', line: 'Albums from the dark edge of memory' },
  { href: '/worlds', label: 'Worlds', line: 'Where music, books and mood connect' },
  { href: '/stories', label: 'Stories', line: 'How we remember who we are' },
  { href: '/book', label: 'Books', line: 'Inner mythology, one per album' },
  { href: '/speaker', label: 'The Speaker', line: 'A private voice for the universe' },
  { href: '/field', label: 'The Field', line: 'Physics as poetic architecture' },
]

export default function ChooseYourDoor() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="text-center mb-10">
        <p className="font-body text-[10px] tracking-[0.45em] uppercase text-noir-gold/55 mb-3">
          Where to begin
        </p>
        <h2 className="font-heading italic font-light text-noir-ivory" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
          Choose your door.
        </h2>
        <p className="font-body text-sm text-noir-silver/55 mt-3 max-w-md mx-auto leading-relaxed">
          A private architecture of sound, memory and image. Enter wherever you are tonight.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {DOORS.map((d) => (
          <Link key={d.href} href={d.href} className="group block">
            <div className="h-full border border-noir-silver/10 bg-noir-void/40 hover:border-noir-gold/35 hover:bg-noir-gold/[0.03] transition-all px-5 py-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-heading italic text-xl text-noir-ivory/85 group-hover:text-noir-gold/90 transition-colors">
                  {d.label}
                </h3>
                <span className="font-body text-noir-gold/40 group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
              <p className="font-body text-[11px] text-noir-silver/50 mt-2 leading-relaxed">{d.line}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
