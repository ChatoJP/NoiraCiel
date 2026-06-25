import type { Metadata } from 'next'
import Link from 'next/link'
import { WORLDS } from '@/data/noiracielWorlds'
import WorldCard from '@/components/worlds/WorldCard'

export const metadata: Metadata = {
  title: 'Worlds — NoiraCiel',
  description:
    'The Worlds of NoiraCiel — where albums, books, stories, moods, symbols and the Field connect into one universe. Choose your door.',
  openGraph: {
    title: 'Worlds — NoiraCiel',
    description: 'Albums, books, stories, moods and symbolic systems, connected into worlds. Choose your door.',
  },
}

export default function WorldsPage() {
  return (
    <div className="min-h-screen bg-noir-black">
      <div className="pt-32 pb-12 px-6 text-center">
        <p className="font-body text-[10px] tracking-[0.5em] text-noir-gold/70 uppercase mb-5">
          NoiraCiel · The Universe
        </p>
        <h1 className="font-heading italic font-light text-noir-ivory mb-5" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
          Worlds
        </h1>
        <p className="font-body text-sm text-noir-silver/60 max-w-lg mx-auto leading-relaxed">
          A world is not just an album. It binds music, books, stories, mood, colour,
          symbolic time and the Field into one door. Choose where to enter.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {WORLDS.map((w) => (
            <WorldCard
              key={w.slug}
              world={{
                slug: w.slug,
                title: w.title,
                subtitle: w.subtitle,
                mood: w.mood,
                thumbnail: w.thumbnail,
                accent: w.colors[2] ?? '#C4953A',
              }}
            />
          ))}
        </div>

        <div className="text-center mt-24 pt-12 border-t border-noir-silver/10">
          <Link href="/" className="font-body text-[10px] tracking-[0.3em] uppercase text-noir-silver/40 hover:text-noir-ivory transition-colors">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  )
}
