import type { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { JsonLd } from '@/components/JsonLd'

function loadObjectsManifest(): Set<string> {
  const p = path.join(process.cwd(), 'public', 'images', 'objects', 'manifest.json')
  try {
    const list = JSON.parse(fs.readFileSync(p, 'utf-8')) as string[]
    return new Set(list)
  } catch {
    return new Set()
  }
}

const OBJECTS_MANIFEST = loadObjectsManifest()

function heroImageUrl(slug: string): string | null {
  const shots = ['hero', 'detail', 'lifestyle']
  for (const shot of shots) {
    if (OBJECTS_MANIFEST.has(`${slug}-${shot}`)) return `/images/objects/${slug}-${shot}.jpg`
  }
  return null
}

export const metadata: Metadata = {
  title: 'Objects',
  description: 'Artifacts from the world of NoiraCiel. Each piece is born from a song, named after a chapter, made to be held. Limited editions made to order.',
  alternates: { canonical: 'https://noiraciel.com/objects' },
  openGraph: {
    title: 'Objects — NoiraCiel',
    description: 'Artifacts from the world of NoiraCiel. Each piece is born from a song, named after a chapter, made to be held.',
    url: 'https://noiraciel.com/objects',
    type: 'website',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'NoiraCiel Objects — limited edition artifacts' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Objects — NoiraCiel',
    description: 'Artifacts from the world of NoiraCiel. Each piece is born from a song, named after a chapter, made to be held.',
    images: ['/images/album-cover.png'],
  },
}

interface Product {
  slug: string
  name: string
  type: string
  prose: string
  price: string
  songHref: string
  coverGradient: string
  accentColor: string
  imageUrl?: string | null
}

interface Edition {
  title: string
  tag: string
  description: string
  accentColor: string
  products: Product[]
}

const EDITIONS: Edition[] = [
  {
    title: 'The Life Lessons Edition',
    tag: 'Album I · Atlantic Noir',
    description:
      'From the record that began everything. Seventeen chapters of memory, water, and the things we carry home.',
    accentColor: '#C4953A',
    products: [
      {
        slug: 'borrowed-time',
        name: 'Borrowed Time',
        type: 'Hand Cream',
        prose: 'For the afternoons that feel unearned. Applied slowly, without reason to rush.',
        price: '€ 120',
        songHref: '/songs/borrowed-time',
        coverGradient: 'linear-gradient(160deg, #0a1628 0%, #0d2040 60%, #091014 100%)',
        accentColor: '#C4953A',
      },
      {
        slug: 'leave-a-light-on',
        name: 'Leave a Light On',
        type: 'Room Mist',
        prose: 'For the entrance hall. For the hour before they come home.',
        price: '€ 95',
        songHref: '/songs/leave-a-light-on',
        coverGradient: 'linear-gradient(160deg, #091420 0%, #0a1830 60%, #060e18 100%)',
        accentColor: '#C4953A',
      },
      {
        slug: 'the-empty-chair',
        name: 'The Empty Chair',
        type: 'Candle',
        prose: 'Cedar and cold stone. Lit on Sundays, or whenever the absent feel present.',
        price: '€ 180',
        songHref: '/songs/the-empty-chair',
        coverGradient: 'linear-gradient(160deg, #0c1822 0%, #0f2035 60%, #080f1a 100%)',
        accentColor: '#C4953A',
      },
      {
        slug: 'good-things-grow-slow',
        name: 'Good Things Grow Slow',
        type: 'Body Oil',
        prose: 'Applied after patience. After the long work. After the season finally turns.',
        price: '€ 145',
        songHref: '/songs/good-things-grow-slow',
        coverGradient: 'linear-gradient(160deg, #0a1220 0%, #0c1a30 60%, #06101a 100%)',
        accentColor: '#C4953A',
      },
    ],
  },
  {
    title: 'The Blind Angel Edition',
    tag: 'Album III · Intimate Metal',
    description:
      'From the record made in shadow. Seventeen descents. One return. Objects for those who have been through fire.',
    accentColor: '#a8a8b8',
    products: [
      {
        slug: 'crown-of-fire',
        name: 'Crown of Fire',
        type: 'Body Serum',
        prose: 'For the mornings after the fire. What was forged from suffering cannot be taken.',
        price: '€ 165',
        songHref: '/songs/crown-of-fire',
        coverGradient: 'linear-gradient(160deg, #0a0a0a 0%, #1a0a08 60%, #080404 100%)',
        accentColor: '#a8a8b8',
      },
      {
        slug: 'no-light-left',
        name: 'No Light Left',
        type: 'Candle',
        prose: 'Black amber and cold mineral. Burns longest in the quietest rooms.',
        price: '€ 210',
        songHref: '/songs/no-light-left',
        coverGradient: 'linear-gradient(160deg, #080808 0%, #100810 60%, #060606 100%)',
        accentColor: '#a8a8b8',
      },
      {
        slug: 'mercy-in-flames',
        name: 'Mercy in Flames',
        type: 'Lip Treatment',
        prose: 'Given when it cost nearly everything. Still the correct choice.',
        price: '€ 85',
        songHref: '/songs/mercy-in-flames',
        coverGradient: 'linear-gradient(160deg, #0c0808 0%, #1a0c0c 60%, #080606 100%)',
        accentColor: '#a8a8b8',
      },
      {
        slug: 'darkness-made-divine',
        name: 'Darkness Made Divine',
        type: 'Room Mist',
        prose: 'For the room after midnight. When the dark stops being absence and becomes its own light.',
        price: '€ 110',
        songHref: '/songs/darkness-made-divine',
        coverGradient: 'linear-gradient(160deg, #06060c 0%, #0c0a18 60%, #060608 100%)',
        accentColor: '#a8a8b8',
      },
    ],
  },
  {
    title: 'Jazz Sessions Edition',
    tag: 'Album II · Jazz · Atlantic Noir',
    description:
      'From the late-night recordings. Nine songs at the edge of the city. Objects made for the table, the lamp, the hour before sleep.',
    accentColor: '#9b8fc0',
    products: [
      {
        slug: 'keep-a-chair-for-you',
        name: 'Keep a Chair for You',
        type: 'Candle',
        prose: 'Tobacco and river stone. For the table set before they arrive.',
        price: '€ 175',
        songHref: '/songs/keep-a-chair-for-you',
        coverGradient: 'linear-gradient(160deg, #0d1020 0%, #181428 60%, #090c18 100%)',
        accentColor: '#9b8fc0',
      },
      {
        slug: 'carry-you-home',
        name: 'Carry You Home',
        type: 'Body Oil',
        prose: 'For the nights when the world releases its grip. Applied without explanation.',
        price: '€ 140',
        songHref: '/songs/carry-you-home',
        coverGradient: 'linear-gradient(160deg, #0a0e1c 0%, #141020 60%, #080a14 100%)',
        accentColor: '#9b8fc0',
      },
      {
        slug: 'mercy-wears-a-black-coat',
        name: 'Mercy Wears a Black Coat',
        type: 'Hand Cream',
        prose: 'For the hands that did the hard thing. Not to make clean — to make honest.',
        price: '€ 130',
        songHref: '/songs/mercy-wears-a-black-coat',
        coverGradient: 'linear-gradient(160deg, #0c0c18 0%, #16121e 60%, #080810 100%)',
        accentColor: '#9b8fc0',
      },
    ],
  },
]

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col">

      {/* Cover */}
      <div
        className="relative aspect-[3/4] mb-6 overflow-hidden border border-noir-silver/8 group-hover:border-noir-silver/20 transition-colors duration-700"
        style={{ background: product.coverGradient }}
      >
        {/* Real image or gradient placeholder */}
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Grain overlay on gradient */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />
            {/* Placeholder name */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-6 h-px mb-6" style={{ background: `${product.accentColor}40` }} />
              <p
                className="font-heading italic font-light leading-tight"
                style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: '#F2EDE3', letterSpacing: '-0.01em' }}
              >
                {product.name}
              </p>
              <div className="w-6 h-px mt-6" style={{ background: `${product.accentColor}40` }} />
            </div>
          </>
        )}

        {/* Dark overlay on real images for text legibility */}
        {product.imageUrl && (
          <div className="absolute inset-0 bg-noir-void/30" />
        )}

        {/* Product type — bottom left */}
        <div className="absolute bottom-4 left-5">
          <p
            className="font-body text-[8px] tracking-[0.4em] uppercase"
            style={{ color: `${product.accentColor}50` }}
          >
            {product.type}
          </p>
        </div>

        {/* Price — bottom right */}
        <div className="absolute bottom-4 right-5">
          <p
            className="font-body text-[9px] tracking-[0.2em]"
            style={{ color: `${product.accentColor}70` }}
          >
            {product.price}
          </p>
        </div>

        {/* Hover: Reserve overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <a
            href={`mailto:objects@noiraciel.com?subject=Reserve — ${product.name} (${product.type})`}
            className="font-body text-[10px] tracking-[0.35em] uppercase border px-7 py-3 transition-colors duration-300 hover:bg-white/5"
            style={{ color: product.accentColor, borderColor: `${product.accentColor}50` }}
          >
            Reserve
          </a>
          <Link
            href={product.songHref}
            className="font-body text-[9px] tracking-[0.25em] uppercase transition-opacity duration-300 hover:opacity-100 opacity-60"
            style={{ color: product.accentColor }}
          >
            From the song →
          </Link>
        </div>
      </div>

      {/* Below cover */}
      <div className="px-0.5">
        <h3
          className="font-heading italic font-light text-lg text-noir-ivory/80 group-hover:text-noir-ivory transition-colors duration-300 mb-1 leading-snug"
        >
          {product.name}
        </h3>
        <p
          className="font-body text-[9px] tracking-[0.3em] uppercase mb-3"
          style={{ color: `${product.accentColor}60` }}
        >
          {product.type}
        </p>
        <p className="font-heading italic text-sm text-noir-silver/40 leading-relaxed">
          {product.prose}
        </p>
      </div>
    </div>
  )
}

function EditionSection({ edition }: { edition: Edition }) {
  return (
    <section className="mb-32">

      {/* Edition header */}
      <div className="mb-14">
        <p
          className="font-body text-[9px] tracking-[0.45em] uppercase mb-4"
          style={{ color: `${edition.accentColor}60` }}
        >
          {edition.tag}
        </p>
        <h2
          className="font-heading italic font-light text-3xl md:text-4xl text-noir-ivory/90 mb-4 leading-snug"
        >
          {edition.title}
        </h2>
        <div className="w-12 h-px mb-5" style={{ background: `${edition.accentColor}40` }} />
        <p className="font-body text-sm text-noir-silver/40 max-w-lg leading-relaxed">
          {edition.description}
        </p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {edition.products.map((product) => (
          <ProductCard key={product.slug} product={{ ...product, imageUrl: heroImageUrl(product.slug) }} />
        ))}
      </div>
    </section>
  )
}

const objectsSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'NoiraCiel Objects',
  description: 'Artifacts from the world of NoiraCiel — born from songs, named after chapters, made to be held. Limited editions made to order.',
  url: 'https://noiraciel.com/objects',
  itemListElement: EDITIONS.flatMap((edition, ei) =>
    edition.products.map((product, pi) => ({
      '@type': 'ListItem',
      position: ei * 10 + pi + 1,
      item: {
        '@type': 'Product',
        name: `${product.name} — ${product.type}`,
        description: product.prose,
        url: `https://noiraciel.com/songs/${product.slug}`,
        brand: { '@type': 'Brand', name: 'NoiraCiel' },
        offers: {
          '@type': 'Offer',
          price: product.price.replace('€ ', ''),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/LimitedAvailability',
          seller: { '@type': 'Organization', name: 'NoiraCiel' },
        },
      },
    }))
  ),
}

export default function ObjectsPage() {
  return (
    <div className="min-h-screen bg-noir-black">
      <JsonLd data={objectsSchema} />

      {/* Hero */}
      <div className="pt-36 pb-20 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="max-w-xl">
          <p className="font-body text-[9px] tracking-[0.5em] text-noir-gold/50 uppercase mb-6">
            NoiraCiel · Objects
          </p>
          <h1
            className="font-heading italic font-light text-noir-ivory leading-none mb-6"
            style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)', letterSpacing: '-0.02em' }}
          >
            Objects
          </h1>
          <div className="w-16 h-px bg-noir-gold/30 mb-8" />
          <p className="font-heading italic text-base md:text-lg text-noir-silver/50 leading-relaxed max-w-md">
            Each piece is an artifact from the world of NoiraCiel —
            born from a song, named after a chapter, made to be held.
          </p>
        </div>
      </div>

      {/* Thin divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-noir-silver/10 to-transparent mb-20" />

      {/* Editions */}
      <div className="px-6 md:px-16 max-w-7xl mx-auto">
        {EDITIONS.map((edition) => (
          <EditionSection key={edition.title} edition={edition} />
        ))}
      </div>

      {/* Reserve note */}
      <div className="border-t border-noir-silver/8 py-16 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-body text-[9px] tracking-[0.4em] text-noir-silver/30 uppercase mb-2">
              Limited Editions · Made to Order
            </p>
            <p className="font-heading italic text-sm text-noir-silver/40 max-w-sm leading-relaxed">
              Each piece is produced in small quantities. Reserve yours by writing to us directly.
            </p>
          </div>
          <a
            href="mailto:objects@noiraciel.com"
            className="flex-shrink-0 font-body text-[10px] tracking-[0.3em] uppercase border border-noir-gold/30 px-8 py-3.5 text-noir-gold hover:bg-noir-gold/8 transition-all duration-300"
          >
            objects@noiraciel.com
          </a>
        </div>
      </div>

      {/* Footer nav */}
      <div className="text-center py-12 border-t border-noir-silver/8">
        <Link
          href="/"
          className="font-body text-[10px] tracking-[0.3em] uppercase text-noir-silver/30 hover:text-noir-ivory transition-colors duration-300"
        >
          ← NoiraCiel
        </Link>
      </div>
    </div>
  )
}
