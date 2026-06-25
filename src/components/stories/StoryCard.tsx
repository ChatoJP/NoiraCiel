import Link from 'next/link'
import StoryThumb from './StoryThumb'
import type { StoryListItem } from './types'

/**
 * StoryCard — a collectible, atmospheric story tile. Thumbnail-driven, with an
 * elegant dark image treatment, number, read time, optional category and a
 * premium hover state.
 */
export default function StoryCard({ story }: { story: StoryListItem }) {
  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <article className="relative overflow-hidden bg-noir-deep border border-noir-silver/8 group-hover:border-noir-gold/25 transition-colors duration-500" style={{ aspectRatio: '4/3' }}>
        <StoryThumb src={story.thumbUrl} imgClassName="group-hover:scale-105" opacity={0.66} />

        {/* legibility gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/55 to-transparent" />
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-noir-black/45 to-transparent" />
        <div className="absolute inset-0 bg-noir-gold/0 group-hover:bg-noir-gold/[0.04] transition-colors duration-500" />

        {/* number */}
        <div className="absolute top-4 left-4">
          <span className="font-body text-[9px] tracking-[0.4em] text-noir-gold/80 uppercase">
            {String(story.num).padStart(2, '0')}
          </span>
        </div>

        {/* read time / category */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {story.category && (
            <span className="font-body text-[7px] tracking-[0.25em] uppercase text-noir-gold/80 border border-noir-gold/30 px-2 py-0.5">
              {story.category}
            </span>
          )}
          <span className="font-body text-[7px] tracking-[0.2em] uppercase text-noir-silver/55 bg-noir-black/40 px-1.5 py-0.5">
            ~{story.readMins} min
          </span>
        </div>

        {/* title + excerpt */}
        <div className="absolute bottom-0 inset-x-0 p-5 pt-10">
          <h2 className="font-heading italic text-xl text-noir-ivory leading-tight mb-1.5 group-hover:text-noir-gold/90 transition-colors duration-300">
            {story.title}
          </h2>
          {story.excerpt && (
            <p className="font-body text-[10px] text-noir-silver/70 leading-relaxed line-clamp-2">{story.excerpt}</p>
          )}
          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <div className="w-5 h-px bg-noir-gold/70" />
            <span className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-gold/80">Read</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
