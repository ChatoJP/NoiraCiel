import fs from 'fs'
import path from 'path'
import Hero from '@/components/Hero'
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

// Human-readable titles for dedicated gallery pieces
const GALLERY_TITLES: Record<string, string> = {
  'the-atlantic-at-night':      'The Atlantic at Night',
  'the-inheritance':             'The Inheritance',
  'coastal-road-at-dawn':        'Coastal Road at Dawn',
  'the-kitchen-table':           'The Kitchen Table',
  'memory-of-water':             'Memory of Water',
  'the-door-not-taken':          'The Door Not Taken',
  'afternoon-light-through-lace':'Afternoon Light Through Lace',
  'the-vigil':                   'The Vigil',
  'time-in-hands':               'Time in Hands',
  'the-archive':                 'The Archive',
  'the-fishermans-return':       "The Fisherman's Return",
  'seeds-in-dark-earth':         'Seeds in Dark Earth',
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

function readManifest(subdir: string): Record<string, string> {
  try {
    const p = path.join(process.cwd(), 'public', 'Images', subdir, 'manifest.json')
    if (!fs.existsSync(p)) return {}
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return {}
  }
}

function buildGalleryItems(): GalleryItem[] {
  const galleryManifest = readManifest('gallery')
  const songArtManifest = readManifest('song-art')
  const items: GalleryItem[] = []

  // Dedicated museum pieces first
  for (const [id, imageUrl] of Object.entries(galleryManifest)) {
    items.push({
      id,
      title: GALLERY_TITLES[id] ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      imageUrl,
      kind: 'gallery',
    })
  }

  // Fill with song art (linked to chapter pages)
  for (const [slug, imageUrl] of Object.entries(songArtManifest)) {
    if (items.length >= 13) break  // cap at 13 total (1 featured + 12 grid)
    items.push({
      id: slug,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      imageUrl,
      linkTo: slug,
      trackNumber: SONG_TRACK_NUMBERS[slug],
      kind: 'song-art',
    })
  }

  return items
}

export default function Home() {
  const galleryItems = buildGalleryItems()

  return (
    <>
      <Hero />
      <FeaturedReleases />
      <MusicSection />
      <GallerySection items={galleryItems} />
      <WorldSection />
      <Videos />
      <Biography />
      <MerchSection />
      <PressKit />
      <Newsletter />
      <Contact />
      <Footer />
    </>
  )
}
