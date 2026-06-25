import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import Hero from '@/components/Hero'
import ChooseYourDoor from '@/components/ChooseYourDoor'
import FeaturedWorld from '@/components/FeaturedWorld'
import { JsonLd } from '@/components/JsonLd'

export const metadata: Metadata = {
  alternates: { canonical: 'https://noiraciel.com' },
}
import MusicSection from '@/components/MusicSection'
import FeaturedReleases from '@/components/FeaturedReleases'
import GallerySection, { type GalleryItem } from '@/components/GallerySection'
import WorldSection from '@/components/WorldSection'
import Videos from '@/components/Videos'
import Biography from '@/components/Biography'
import PressKit from '@/components/PressKit'
import Newsletter from '@/components/Newsletter'
import Contact from '@/components/Contact'
import MerchSection from '@/components/MerchSection'
import Footer from '@/components/Footer'
import LyricQuoteStrip from '@/components/LyricQuoteStrip'
import RotatingQuoteStrip from '@/components/RotatingQuoteStrip'
import Link from 'next/link'

// G46: Rotate featured track weekly
const WEEKLY_TRACKS = [
  { slug: 'why', title: 'Why', album: 'The Life Lessons' },
  { slug: 'always-in-your-corner', title: 'Always In Your Corner', album: 'The Life Lessons' },
  { slug: 'the-empty-chair', title: 'The Empty Chair', album: 'The Life Lessons' },
  { slug: 'free-men-tell-the-truth', title: 'Free Men Tell The Truth', album: 'The Life Lessons' },
  { slug: 'leave-a-light-on', title: 'Leave A Light On', album: 'The Life Lessons' },
  { slug: 'still-worth-it', title: 'Still Worth It', album: 'The Life Lessons' },
  { slug: 'borrowed-time', title: 'Borrowed Time', album: 'The Life Lessons' },
]
function getWeeklyTrack() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return WEEKLY_TRACKS[weekNum % WEEKLY_TRACKS.length]
}

function FeaturedTrackOfTheWeek() {
  const track = getWeeklyTrack()
  const artPath = path.join(process.cwd(), 'public', 'images', 'song-art', `${track.slug}.jpg`)
  const artUrl = fs.existsSync(artPath) ? `/images/song-art/${track.slug}.jpg` : null

  return (
    <section className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border border-noir-silver/8 p-6 md:p-8 bg-noir-deep/30">
        <div className="flex-shrink-0">
          <p className="font-body text-[9px] tracking-[0.4em] text-t-accent/50 uppercase mb-3">Track of the Week</p>
          {artUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artUrl} alt={track.title} className="w-24 h-24 object-cover border border-noir-silver/10 opacity-75" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-[9px] tracking-[0.25em] text-noir-silver/30 uppercase mb-1">{track.album}</p>
          <h2 className="font-heading italic text-2xl md:text-3xl text-noir-ivory font-light mb-3">{track.title}</h2>
          <Link
            href={`/songs/${track.slug}`}
            className="inline-flex items-center gap-2 font-body text-[10px] tracking-[0.2em] uppercase text-t-accent/70 hover:text-t-accent transition-colors"
          >
            Listen & Read →
          </Link>
        </div>
      </div>
    </section>
  )
}

const GALLERY_TITLES: Record<string, string> = {
  'the-atlantic-at-night':        'The Atlantic at Night',
  'the-inheritance':               'The Inheritance',
  'coastal-road-at-dawn':          'Coastal Road at Dawn',
  'the-kitchen-table':             'The Kitchen Table',
  'memory-of-water':               'Memory of Water',
  'the-door-not-taken':            'The Door Not Taken',
  'afternoon-light-through-lace':  'Afternoon Light Through Lace',
  'the-vigil':                     'The Vigil',
  'time-in-hands':                 'Time in Hands',
  'the-archive':                   'The Archive',
  'the-fishermans-return':         "The Fisherman's Return",
  'seeds-in-dark-earth':           'Seeds in Dark Earth',
  'the-emigrant-at-dawn':          'The Emigrant at Dawn',
  'the-harvest-table':             'The Harvest Table',
  'the-last-photograph':           'The Last Photograph',
  'the-lighthouse-at-three-am':    'The Lighthouse at Three AM',
  'the-mothers-hands':             "The Mother's Hands",
  'the-road-at-dusk':              'The Road at Dusk',
  'the-storm-that-passed':         'The Storm That Passed',
  'the-winter-sea':                'The Winter Sea',
}

const OBJECT_TITLES: Record<string, string> = {
  'borrowed-time':           'Borrowed Time · Hand Cream',
  'leave-a-light-on':        'Leave a Light On · Room Mist',
  'the-empty-chair':         'The Empty Chair · Candle',
  'good-things-grow-slow':   'Good Things Grow Slow · Body Oil',
  'crown-of-fire':           'Crown of Fire · Body Serum',
  'no-light-left':           'No Light Left · Candle',
  'mercy-in-flames':         'Mercy in Flames · Lip Treatment',
  'darkness-made-divine':    'Darkness Made Divine · Room Mist',
  'keep-a-chair-for-you':    'Keep a Chair for You · Candle',
  'carry-you-home':          'Carry You Home · Body Oil',
  'mercy-wears-a-black-coat':'Mercy Wears a Black Coat · Hand Cream',
}

const SONG_TRACK_NUMBERS: Record<string, number> = {
  'why': 1, 'who-wins-if-i-win': 2, 'the-roots-we-cannot-see': 3,
  'if-we-cant-say-the-hard-truths': 4, 'still-worth-it': 5,
  'side-by-side': 6, 'as-long-as-youre-okay': 7, 'it-was-already-there': 8,
  'always-in-your-corner': 9, 'the-house-we-couldnt-leave': 10,
  'i-never-knew-any-other-way': 11, 'leave-a-light-on': 12,
  'the-empty-chair': 13, 'good-things-grow-slow': 14,
  'maybe-i-was-wrong': 15, 'borrowed-time': 16, 'free-men-tell-the-truth': 17,
}

const IMAGE_EXT = /\.(jpg|jpeg|png|webp)$/i

function scanDir(subdir: string): string[] {
  try {
    const p = path.join(process.cwd(), 'public', 'images', subdir)
    if (!fs.existsSync(p)) return []
    return fs.readdirSync(p)
      .filter((f) => IMAGE_EXT.test(f))
      .sort()
      .map((f) => `/images/${subdir}/${f}`)
  } catch { return [] }
}

function toTitle(slug: string): string {
  return slug
    .replace(/^noiraciel-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildGalleryItems(): GalleryItem[] {
  const items: GalleryItem[] = []
  const seenSlugs = new Set<string>()

  // ── 1. Museum gallery pieces ──────────────────────────────────────────────
  for (const url of scanDir('gallery')) {
    const id = url.split('/').pop()!.replace(IMAGE_EXT, '')
    items.push({
      id:       `gallery-${id}`,
      title:    GALLERY_TITLES[id] ?? toTitle(id),
      imageUrl: url,
      kind:     'gallery',
    })
  }

  // ── 2. Song art — all albums (main, jazz, blind angel) ───────────────────
  for (const url of scanDir('song-art')) {
    const slug = url.split('/').pop()!.replace(IMAGE_EXT, '')
    if (seenSlugs.has(slug)) continue
    seenSlugs.add(slug)
    items.push({
      id:          `song-art-${slug}`,
      title:       toTitle(slug),
      imageUrl:    url,
      linkTo:      slug,
      trackNumber: SONG_TRACK_NUMBERS[slug],
      kind:        'song-art',
    })
  }

  // ── 3. Chapter banners — skip if song-art already covers this slug ────────
  for (const url of scanDir('chapter-banners')) {
    const slug = url.split('/').pop()!.replace(IMAGE_EXT, '')
    if (seenSlugs.has(slug)) continue
    seenSlugs.add(slug)
    items.push({
      id:          `banner-${slug}`,
      title:       toTitle(slug),
      imageUrl:    url,
      linkTo:      slug,
      trackNumber: SONG_TRACK_NUMBERS[slug],
      kind:        'song-art',
    })
  }

  // ── 4. Objects — hero shots only, link to /objects ────────────────────────
  for (const url of scanDir('objects')) {
    if (!url.includes('-hero.')) continue
    const slug = url.split('/').pop()!.replace(/-hero\..*$/, '')
    items.push({
      id:       `object-${slug}`,
      title:    OBJECT_TITLES[slug] ?? toTitle(slug),
      imageUrl: url,
      kind:     'gallery',
    })
  }

  return items
}

const musicGroupSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicGroup',
  name: 'NoiraCiel',
  url: 'https://noiraciel.com',
  image: 'https://noiraciel.com/images/album-cover.png',
  description: 'NoiraCiel is a human-led artistic universe of music, books, images, videos, objects and memory — where every song becomes a chapter.',
  genre: ['Atlantic Noir', 'Sea-Soul', 'Intimate Metal', 'Jazz'],
  album: [
    {
      '@type': 'MusicAlbum',
      name: 'The Life Lessons I Hope You Learn',
      url: 'https://noiraciel.com/music/the-life-lessons',
    },
    {
      '@type': 'MusicAlbum',
      name: 'NoiraCiel Jazz Sessions',
      url: 'https://noiraciel.com/music/jazz-sessions',
    },
    {
      '@type': 'MusicAlbum',
      name: 'The Blind Angel — Intimate Metal Sessions',
      url: 'https://noiraciel.com/music/blind-angel',
    },
  ],
  sameAs: [
    'https://open.spotify.com/album/49QDSwM3584OawGtC0O7eR',
    'https://music.apple.com/us/artist/noiraciel/6776477025',
    'https://www.youtube.com/channel/UCFjqshj-v26mmHlkFNZFNMQ',
  ],
}

function DiamondDivider({ label }: { label?: string }) {
  return (
    <div className="diamond-divider" aria-hidden="true">
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.75rem', color: 'rgba(196,149,58,0.4)', letterSpacing: '0.2em' }}>
        {label ?? '◆'}
      </span>
    </div>
  )
}

export default function Home() {
  const galleryItems = buildGalleryItems()

  return (
    <>
      <JsonLd data={musicGroupSchema} />
      <Hero />
      <ChooseYourDoor />
      <RotatingQuoteStrip />
      <FeaturedReleases />
      <FeaturedWorld />
      <FeaturedTrackOfTheWeek />
      <DiamondDivider />
      <MusicSection />
      <LyricQuoteStrip
        quote="The loudest voices in the room rarely leave the deepest mark. The people who change your life usually do it in the dark."
        song="I Never Knew Any Other Way"
        variant="side"
        align="left"
      />
      <DiamondDivider label="◈" />
      <GallerySection items={galleryItems} />
      <LyricQuoteStrip
        quote="The chair is empty but the love is not. And some things never leave, they simply change their spot."
        song="The Empty Chair"
        variant="side"
        align="right"
      />
      <DiamondDivider />
      <WorldSection />
      <Videos />
      <LyricQuoteStrip
        quote="Silence grows like ivy on a wall. And one day, it owns it all."
        song="If We Can't Say The Hard Truths"
        variant="vignette"
        align="center"
      />
      <DiamondDivider label="◈" />
      <Biography />
      <LyricQuoteStrip
        quote="Freedom is having nothing left to hide from anyone."
        song="Free Men Tell The Truth"
        variant="monumental"
        align="center"
      />
      <DiamondDivider />
      <MerchSection />
      <PressKit />
      <Newsletter />
      <Contact />
      <Footer />
    </>
  )
}
