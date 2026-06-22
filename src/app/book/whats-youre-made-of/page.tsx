import type { Metadata } from 'next'
import BookReader from '@/components/BookReader'
import { parseBook } from '@/lib/parseBook'
export type { BookChapter } from '@/lib/parseBook'

export const metadata: Metadata = {
  title: "What You're Made Of — The Book",
  description: "Fifteen chapters on resilience, self-worth, and the slow becoming. The literary companion to the What You're Made Of album by NoiraCiel.",
  alternates: { canonical: 'https://noiraciel.com/book/whats-youre-made-of' },
  openGraph: {
    title: "What You're Made Of — The Book · NoiraCiel",
    description: "Fifteen chapters on resilience, self-worth, and the slow becoming.",
    url: 'https://noiraciel.com/book/whats-youre-made-of',
    type: 'book',
    images: [{ url: '/images/song-art/whats-youre-made-of.jpg', width: 1200, height: 1200, alt: "What You're Made Of — The Book" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "What You're Made Of — The Book · NoiraCiel",
    description: "Fifteen chapters on resilience, self-worth, and the slow becoming.",
    images: ['/images/song-art/whats-youre-made-of.jpg'],
  },
}

export default function WhatsYoureMadeOfBookPage() {
  const chapters = parseBook('book-whats-youre-made-of.md')
  return (
    <BookReader
      chapters={chapters}
      bookMeta={{
        title: "What You're Made Of",
        titleLine1: "What You're",
        titleLine2: 'Made Of',
        genre: 'Hip-Hop · DnB · Soul · Trap',
      }}
    />
  )
}
