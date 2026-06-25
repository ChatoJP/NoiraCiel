import Link from 'next/link'
import StoryThumb from './StoryThumb'
import type { StoryListItem } from './types'

/**
 * FeaturedStoryHero — a large, cinematic spotlight for one story at the top of
 * the Stories listing. Wide banner image, story number, title, excerpt, meta and
 * a "Read Story" CTA.
 */
export default function FeaturedStoryHero({ story }: { story: StoryListItem }) {
  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <article className="relative overflow-hidden border border-noir-silver/10 group-hover:border-noir-gold/25 transition-colors duration-500">
        <div className="relative w-full" style={{ aspectRatio: '16/7' }}>
          <StoryThumb src={story.heroUrl ?? story.thumbUrl} priority imgClassName="group-hover:scale-[1.03]" opacity={0.6} />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/60 to-noir-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-noir-black/70 via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end">
          <div className="p-6 sm:p-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-body text-[9px] tracking-[0.4em] uppercase text-noir-gold/80">
                Featured · {String(story.num).padStart(2, '0')}
              </span>
              {story.category && (
                <span className="font-body text-[8px] tracking-[0.25em] uppercase text-noir-gold/70 border border-noir-gold/30 px-2 py-0.5">
                  {story.category}
                </span>
              )}
              <span className="font-body text-[8px] tracking-[0.2em] uppercase text-noir-silver/55">~{story.readMins} min</span>
            </div>
            <h2 className="font-heading italic text-noir-ivory leading-[1.05] mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
              {story.title}
            </h2>
            {story.excerpt && (
              <p className="font-body text-sm text-noir-silver/70 leading-relaxed max-w-xl line-clamp-3 mb-6">
                {story.excerpt}
              </p>
            )}
            <span className="inline-flex items-center gap-3 font-body text-[10px] tracking-[0.3em] uppercase text-noir-gold/90 border border-noir-gold/40 px-6 py-3 group-hover:border-noir-gold/80 group-hover:bg-noir-gold/5 transition-all">
              Read Story
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M0 4h12M12 4L9 1M12 4L9 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
