import type { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { parseBook } from '@/lib/parseBook'
import AudiobookSection from '@/components/AudiobookSection'
import { JsonLd } from '@/components/JsonLd'
import RandomBookButton from '@/components/RandomBookButton'
export type { BookChapter } from '@/lib/parseBook'

const booksSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'NoiraCiel Books',
  url: 'https://noiraciel.com/book',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Book',
        name: 'The Life Lessons I Hope You Learn',
        author: { '@type': 'Person', name: 'NoiraCiel' },
        url: 'https://noiraciel.com/book/the-life-lessons',
        genre: 'Atlantic Noir',
        description: 'A literary novella in seventeen chapters. One life, from the Atlantic shore to the last true thing.',
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Book',
        name: 'NoiraCiel Jazz Sessions',
        author: { '@type': 'Person', name: 'NoiraCiel' },
        url: 'https://noiraciel.com/book/jazz-sessions',
        genre: 'Jazz · Atlantic Noir',
        description: 'Nine chapters at the edge of night. Jazz, forgiveness, and the hidden rivers running under everything.',
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Book',
        name: 'The Blind Angel — Intimate Metal Sessions',
        author: { '@type': 'Person', name: 'NoiraCiel' },
        url: 'https://noiraciel.com/book/blind-angel',
        genre: 'Intimate Metal',
        description: 'Seventeen chapters of fire and ruin. One descent, one return — written in ash and cold pale stone.',
      },
    },
    {
      '@type': 'ListItem',
      position: 4,
      item: {
        '@type': 'Book',
        name: "What You're Made Of",
        author: { '@type': 'Person', name: 'NoiraCiel' },
        url: 'https://noiraciel.com/book/whats-youre-made-of',
        genre: 'Hip-Hop · DnB · Soul · Trap',
        description: "Fifteen chapters on resilience, self-worth, and the slow becoming.",
      },
    },
    {
      '@type': 'ListItem',
      position: 5,
      item: {
        '@type': 'Book',
        name: 'Bare and Still Breathing',
        author: { '@type': 'Person', name: 'NoiraCiel' },
        url: 'https://noiraciel.com/book/bare-and-still-breathing',
        genre: 'Unplugged · Acoustic',
        description: 'Fifteen chapters on survival, small graces, and the courage of continuing.',
      },
    },
    {
      '@type': 'ListItem',
      position: 6,
      item: {
        '@type': 'Book',
        name: 'The Sacred Drift',
        author: { '@type': 'Person', name: 'NoiraCiel' },
        url: 'https://noiraciel.com/book/the-sacred-drift',
        genre: 'Indie Pop · R&B · Psych',
        description: 'Fifteen chapters on consciousness, mantra, and the art of letting go.',
      },
    },
  ],
}

export const metadata: Metadata = {
  title: 'Books',
  description: 'Six literary companions to the NoiraCiel discography — one book per album. Atlantic Noir, Jazz, Metal, Hip-Hop, Acoustic, and Psychedelic.',
  alternates: { canonical: 'https://noiraciel.com/book' },
  openGraph: {
    title: 'Books — NoiraCiel',
    description: 'Three literary companions to the NoiraCiel discography — one book per album, seventeen chapters each.',
    url: 'https://noiraciel.com/book',
    type: 'website',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'NoiraCiel Books' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Books — NoiraCiel',
    description: 'Six literary companions to the NoiraCiel discography — one book per album.',
    images: ['/images/album-cover.png'],
  },
}

function loadStories() {
  const dir = path.join(process.cwd(), 'content', 'stories')
  const audioDir = path.join(process.cwd(), 'public', 'Audio', 'audiobook')
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const slug = f.replace('.md', '')
      if (!fs.existsSync(path.join(audioDir, `${slug}.mp3`))) return null
      const raw = fs.readFileSync(path.join(dir, f), 'utf8')
      const title = raw.split('\n')[0].replace(/^#\s*/, '').trim()
      return { slug, title, song: slug }
    })
    .filter(Boolean) as { slug: string; title: string; song: string }[]
}

export default function BooksIndexPage() {
  const stories = loadStories()
  const lifeChapters   = parseBook('book.md')
  const jazzChapters   = parseBook('book-jazz-sessions.md')
  const blindChapters  = parseBook('book-blind-angel.md')
  const wymoChapters   = parseBook('book-whats-youre-made-of.md')
  const basbChapters   = parseBook('book-bare-and-still-breathing.md')
  const tsdChapters    = parseBook('book-the-sacred-drift.md')

  const books = [
    {
      href: '/book/the-life-lessons',
      title: 'The Life Lessons I Hope You Learn',
      genre: 'Atlantic Noir · Sea-Soul',
      chapters: lifeChapters.length,
      description: 'A literary novella in seventeen chapters. One life, from the Atlantic shore to the last true thing.',
      coverBg: 'linear-gradient(135deg, #0a1628 0%, #0d2040 50%, #091522 100%)',
      accentColor: '#C4953A',
      tag: 'Album I',
    },
    {
      href: '/book/jazz-sessions',
      title: 'NoiraCiel Jazz Sessions',
      genre: 'Jazz · Atlantic Noir',
      chapters: jazzChapters.length,
      description: 'Nine chapters at the edge of night. Jazz, forgiveness, and the hidden rivers running under everything.',
      coverBg: 'linear-gradient(135deg, #0d1020 0%, #1a1430 50%, #090c18 100%)',
      accentColor: '#9b8fc0',
      tag: 'Album II',
    },
    {
      href: '/book/blind-angel',
      title: 'The Blind Angel',
      genre: 'Intimate Metal',
      chapters: blindChapters.length,
      description: 'Seventeen chapters of fire and ruin. One descent, one return — written in ash and cold pale stone.',
      coverBg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1014 50%, #080808 100%)',
      accentColor: '#a8a8b8',
      tag: 'Album III',
    },
    {
      href: '/book/whats-youre-made-of',
      title: "What You're Made Of",
      genre: 'Hip-Hop · DnB · Soul · Trap',
      chapters: wymoChapters.length,
      description: "Fifteen chapters on resilience, self-worth, and the slow becoming. Written for everyone who survived something.",
      coverBg: 'linear-gradient(135deg, #0d0a1a 0%, #1a0d2a 50%, #0a0810 100%)',
      accentColor: '#b87fd4',
      tag: 'Album IV',
    },
    {
      href: '/book/bare-and-still-breathing',
      title: 'Bare and Still Breathing',
      genre: 'Unplugged · Acoustic · Guitar & Voice',
      chapters: basbChapters.length,
      description: 'Fifteen chapters on survival, small graces, and the courage of continuing. Stripped back to what matters.',
      coverBg: 'linear-gradient(135deg, #0d120a 0%, #1a2010 50%, #080c06 100%)',
      accentColor: '#8ab87f',
      tag: 'Album V',
    },
    {
      href: '/book/the-sacred-drift',
      title: 'The Sacred Drift',
      genre: 'Indie Pop · R&B · DnB · Trip-Pop · Psych',
      chapters: tsdChapters.length,
      description: 'Fifteen chapters on consciousness, mantra, and the art of letting go. A book for the ones who are drifting toward themselves.',
      coverBg: 'linear-gradient(135deg, #08061a 0%, #160d2a 50%, #0a0818 100%)',
      accentColor: '#7b9fd4',
      tag: 'Album VI',
    },
  ]

  return (
    <div className="min-h-screen bg-noir-black">
      <JsonLd data={booksSchema} />

      {/* Header */}
      <div className="pt-28 pb-16 px-6 text-center">
        <p className="font-body text-[10px] tracking-[0.4em] text-noir-gold/65 uppercase mb-4">NoiraCiel</p>
        <h1 className="font-heading italic text-5xl md:text-6xl text-noir-ivory font-light tracking-wide mb-4">
          Books
        </h1>
        <p className="font-body text-sm text-noir-silver/50 max-w-md mx-auto">
          Literary companions to the music — one book per album.
        </p>
        <div className="flex justify-center mt-6">
          <RandomBookButton />
        </div>
        <div className="w-px h-14 bg-gradient-to-b from-noir-gold/35 to-transparent mx-auto mt-8" />
      </div>

      {/* Book cards */}
      <div className="max-w-4xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-10">
          {books.map((book) => (
            <Link
              key={book.href}
              href={book.href}
              className="group block"
            >
              {/* Book cover */}
              <div
                className="relative aspect-[2/3] mb-6 overflow-hidden border border-noir-silver/10 group-hover:border-noir-gold/30 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_32px_72px_rgba(0,0,0,0.7)]"
                style={{ background: book.coverBg }}
              >
                {/* Spine shadow */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-noir-void/80 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-between p-8 text-center">
                  <p
                    className="font-body text-[9px] tracking-[0.4em] uppercase"
                    style={{ color: `${book.accentColor}99` }}
                  >
                    NoiraCiel · {book.tag}
                  </p>

                  <div>
                    <div
                      className="w-12 h-px mx-auto mb-5"
                      style={{ background: `${book.accentColor}50` }}
                    />
                    <h2
                      className="font-heading italic font-light leading-tight mb-3"
                      style={{
                        fontSize: 'clamp(1.4rem, 3.5vw, 1.8rem)',
                        color: '#F2EDE3',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {book.title}
                    </h2>
                    <div
                      className="w-8 h-px mx-auto"
                      style={{ background: `${book.accentColor}40` }}
                    />
                  </div>

                  <div className="text-center">
                    <p
                      className="font-body text-[8px] tracking-[0.3em] uppercase mb-2"
                      style={{ color: `${book.accentColor}60` }}
                    >
                      {book.chapters} Chapters
                    </p>
                    <p
                      className="font-body text-[9px] tracking-[0.25em] uppercase"
                      style={{ color: `${book.accentColor}80` }}
                    >
                      {book.genre}
                    </p>
                  </div>
                </div>

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.45)' }}
                >
                  <span
                    className="font-body text-[10px] tracking-[0.3em] uppercase border px-7 py-3 backdrop-blur-sm"
                    style={{
                      color: book.accentColor,
                      borderColor: `${book.accentColor}70`,
                      boxShadow: `0 0 20px ${book.accentColor}20`,
                    }}
                  >
                    Read
                  </span>
                </div>
              </div>

              {/* Card meta below cover */}
              <div>
                <p
                  className="font-body text-[9px] tracking-[0.25em] uppercase mb-1.5"
                  style={{ color: `${book.accentColor}85` }}
                >
                  {book.genre}
                </p>
                <h3 className="font-heading italic text-lg text-noir-ivory/90 group-hover:text-noir-ivory transition-colors duration-300 mb-2 leading-snug">
                  {book.title}
                </h3>
                <p className="font-body text-xs text-noir-silver/50 leading-relaxed">
                  {book.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Audiobooks section */}
        <AudiobookSection stories={stories} />

        {/* Back link */}
        <div className="text-center mt-20 pt-12 border-t border-noir-silver/10">
          <Link
            href="/"
            className="font-body text-[10px] tracking-[0.3em] uppercase text-noir-silver/50 hover:text-noir-ivory transition-colors"
          >
            ← NoiraCiel
          </Link>
        </div>
      </div>
    </div>
  )
}
