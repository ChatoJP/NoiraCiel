import Link from 'next/link'

/**
 * EntangledLinks — the "next doors" of NoiraCiel.
 *
 * A reusable rail of contextual next steps so every page offers a beautiful next
 * door: a related song, a story, a chapter, a world, the Speaker. Drop it at the
 * foot of any page with a small set of links.
 */

export interface EntangledLink {
  href: string
  label: string          // the door, e.g. "Listen to the connected track"
  sublabel?: string      // a short line under it
  kind?: string          // tiny uppercase tag, e.g. "Music", "Story", "Speaker"
  external?: boolean
}

export default function EntangledLinks({
  title = 'A beautiful next door',
  links,
  className = '',
}: {
  title?: string
  links: EntangledLink[]
  className?: string
}) {
  if (!links.length) return null
  return (
    <section className={`${className}`}>
      <p className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/45 mb-5 text-center">
        {title}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((l) => {
          const body = (
            <div className="group h-full border border-noir-silver/10 bg-noir-void/50 hover:border-noir-gold/35 hover:bg-noir-gold/[0.03] transition-all px-5 py-4">
              {l.kind && (
                <p className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35 mb-1.5">{l.kind}</p>
              )}
              <p className="font-heading italic text-[15px] text-noir-ivory/80 group-hover:text-noir-gold/90 transition-colors leading-snug">
                {l.label}
              </p>
              {l.sublabel && (
                <p className="font-body text-[11px] text-noir-silver/45 mt-1 leading-relaxed">{l.sublabel}</p>
              )}
              <span className="inline-flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-0.5 group-hover:translate-y-0">
                <span className="w-4 h-px bg-noir-gold/60" />
                <span className="font-body text-[7px] tracking-[0.35em] uppercase text-noir-gold/70">Open</span>
              </span>
            </div>
          )
          return l.external ? (
            <a key={l.href + l.label} href={l.href} className="block h-full">{body}</a>
          ) : (
            <Link key={l.href + l.label} href={l.href} className="block h-full">{body}</Link>
          )
        })}
      </div>
    </section>
  )
}
