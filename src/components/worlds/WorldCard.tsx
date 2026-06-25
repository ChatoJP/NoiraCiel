import Link from 'next/link'
import StoryThumb from '@/components/stories/StoryThumb'

export interface WorldCardData {
  slug: string
  title: string
  subtitle: string
  mood: string[]
  thumbnail: string
  accent: string
}

/**
 * WorldCard — an atmospheric doorway into a NoiraCiel World. Thumbnail-driven with
 * a mood line and an "Enter World" affordance on hover.
 */
export default function WorldCard({ world }: { world: WorldCardData }) {
  return (
    <Link href={`/worlds/${world.slug}`} className="group block">
      <article className="relative overflow-hidden border border-noir-silver/10 group-hover:border-noir-gold/30 transition-colors duration-500" style={{ aspectRatio: '3/4' }}>
        <StoryThumb src={world.thumbnail} imgClassName="group-hover:scale-[1.04]" opacity={0.6} />
        <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/55 to-transparent" />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(120% 80% at 50% 100%, ${world.accent}22, transparent 70%)` }}
        />

        <div className="absolute bottom-0 inset-x-0 p-6">
          <p className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-gold/70 mb-2">World</p>
          <h3 className="font-heading italic text-2xl text-noir-ivory leading-tight mb-2 group-hover:text-noir-gold/90 transition-colors">
            {world.title}
          </h3>
          <p className="font-body text-[11px] text-noir-silver/65 leading-relaxed line-clamp-2 mb-3">
            {world.subtitle}
          </p>
          <p className="font-body text-[8px] tracking-[0.25em] uppercase text-noir-silver/40 mb-3">
            {world.mood.slice(0, 3).join(' · ')}
          </p>
          <span className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <span className="w-5 h-px bg-noir-gold/70" />
            <span className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-gold/85">Enter World</span>
          </span>
        </div>
      </article>
    </Link>
  )
}
