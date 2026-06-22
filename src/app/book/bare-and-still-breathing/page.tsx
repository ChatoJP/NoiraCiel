import type { Metadata } from 'next'
import BookReader from '@/components/BookReader'
import { parseBook } from '@/lib/parseBook'
export type { BookChapter } from '@/lib/parseBook'

export const metadata: Metadata = {
  title: 'Bare and Still Breathing — The Book',
  description: 'Fifteen chapters on survival, small graces, and the courage of continuing. The literary companion to the Bare and Still Breathing album by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/book/bare-and-still-breathing' },
  openGraph: {
    title: 'Bare and Still Breathing — The Book · NoiraCiel',
    description: 'Fifteen chapters on survival, small graces, and the courage of continuing.',
    url: 'https://noiraciel.com/book/bare-and-still-breathing',
    type: 'book',
    images: [{ url: '/images/song-art/bare-and-still-breathing.jpg', width: 1200, height: 1200, alt: 'Bare and Still Breathing — The Book' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bare and Still Breathing — The Book · NoiraCiel',
    description: 'Fifteen chapters on survival, small graces, and the courage of continuing.',
    images: ['/images/song-art/bare-and-still-breathing.jpg'],
  },
}

export default function BareAndStillBreathingBookPage() {
  const chapters = parseBook('book-bare-and-still-breathing.md')
  return (
    <BookReader
      chapters={chapters}
      bookMeta={{
        title: 'Bare and Still Breathing',
        titleLine1: 'Bare and Still',
        titleLine2: 'Breathing',
        genre: 'Unplugged · Acoustic · Guitar & Voice',
      }}
    />
  )
}
