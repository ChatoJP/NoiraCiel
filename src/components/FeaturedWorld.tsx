import Link from 'next/link'
import { WORLDS } from '@/data/noiracielWorlds'
import { getAlbumById } from '@/data/noiracielKnowledge'
import StoryThumb from '@/components/stories/StoryThumb'

/**
 * FeaturedWorld — a cinematic homepage band spotlighting one World and the
 * threads that run through it (music + book), with an "Enter World" CTA. Rotates
 * weekly so returning visitors meet a different door.
 */
export default function FeaturedWorld() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const world = WORLDS[weekNum % WORLDS.length]
  const album = getAlbumById(world.connectedAlbums[0] ?? '')
  const accent = world.colors[2] ?? '#C4953A'

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <Link href={`/worlds/${world.slug}`} className="group block">
        <article className="relative overflow-hidden border border-noir-silver/10 group-hover:border-noir-gold/30 transition-colors duration-500">
          <div className="relative w-full" style={{ aspectRatio: '21/9' }}>
            <StoryThumb src={world.thumbnail} imgClassName="group-hover:scale-[1.03]" opacity={0.5} />
            <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/55 to-noir-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-noir-black/75 via-transparent to-transparent" />
            <div className="absolute inset-0" style={{ background: `radial-gradient(90% 70% at 15% 100%, ${accent}22, transparent 70%)` }} />
          </div>

          <div className="absolute inset-0 flex items-end">
            <div className="p-6 sm:p-10 max-w-2xl">
              <p className="font-body text-[10px] tracking-[0.45em] uppercase text-noir-gold/70 mb-4">
                Featured World
              </p>
              <h2 className="font-heading italic font-light text-noir-ivory leading-[1.05] mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
                {world.title}
              </h2>
              <p className="font-body text-sm text-noir-silver/70 leading-relaxed max-w-xl mb-5 line-clamp-3">
                {world.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6">
                {album && (
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/45">
                    Music · {album.title}
                  </span>
                )}
                {world.connectedBooks[0] && (
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase text-noir-silver/45">
                    Book · {world.connectedBooks[0]}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-3 font-body text-[10px] tracking-[0.3em] uppercase text-noir-gold/90 border border-noir-gold/40 px-6 py-3 group-hover:border-noir-gold/80 group-hover:bg-noir-gold/5 transition-all">
                Enter World
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M0 4h12M12 4L9 1M12 4L9 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
              </span>
            </div>
          </div>
        </article>
      </Link>
    </section>
  )
}
