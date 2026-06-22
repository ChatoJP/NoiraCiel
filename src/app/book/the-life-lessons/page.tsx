import type { Metadata } from 'next'
import BookReader from '@/components/BookReader'
import { parseBook } from '@/lib/parseBook'

export const metadata: Metadata = {
  title: 'The Life Lessons I Hope You Learn — The Book',
  description: 'A literary novella in seventeen chapters. One life, from the Atlantic shore to the last true thing. The literary companion to the NoiraCiel album.',
  alternates: { canonical: 'https://noiraciel.com/book/the-life-lessons' },
  openGraph: {
    title: 'The Life Lessons I Hope You Learn — The Book · NoiraCiel',
    description: 'A literary novella in seventeen chapters. One life, from the Atlantic shore to the last true thing.',
    url: 'https://noiraciel.com/book/the-life-lessons',
    type: 'book',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'The Life Lessons I Hope You Learn — NoiraCiel Book' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Life Lessons I Hope You Learn — The Book · NoiraCiel',
    description: 'A literary novella in seventeen chapters. One life, from the Atlantic shore to the last true thing.',
    images: ['/images/album-cover.png'],
  },
}

export default function LifeLessonsBookPage() {
  const chapters = parseBook('book.md')
  return (
    <BookReader
      chapters={chapters}
      bookMeta={{
        title: 'The Life Lessons I Hope You Learn',
        titleLine1: 'The Life Lessons',
        titleLine2: 'I Hope You Learn',
        genre: 'Atlantic Noir',
        printHref: '/book/print',
      }}
    />
  )
}
