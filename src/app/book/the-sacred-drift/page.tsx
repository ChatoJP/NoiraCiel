import type { Metadata } from 'next'
import BookReader from '@/components/BookReader'
import { parseBook } from '@/lib/parseBook'
export type { BookChapter } from '@/lib/parseBook'

export const metadata: Metadata = {
  title: 'The Sacred Drift — The Book',
  description: 'Fifteen chapters on consciousness, mantra, and the art of letting go. The literary companion to The Sacred Drift album by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/book/the-sacred-drift' },
  openGraph: {
    title: 'The Sacred Drift — The Book · NoiraCiel',
    description: 'Fifteen chapters on consciousness, mantra, and the art of letting go.',
    url: 'https://noiraciel.com/book/the-sacred-drift',
    type: 'book',
    images: [{ url: '/images/song-art/the-sacred-drift.jpg', width: 1200, height: 1200, alt: 'The Sacred Drift — The Book' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Sacred Drift — The Book · NoiraCiel',
    description: 'Fifteen chapters on consciousness, mantra, and the art of letting go.',
    images: ['/images/song-art/the-sacred-drift.jpg'],
  },
}

export default function TheSacredDriftBookPage() {
  const chapters = parseBook('book-the-sacred-drift.md')
  return (
    <BookReader
      chapters={chapters}
      bookMeta={{
        title: 'The Sacred Drift',
        titleLine1: 'The Sacred',
        titleLine2: 'Drift',
        genre: 'Indie Pop · R&B · DnB · Trip-Pop · Psych',
      }}
    />
  )
}
