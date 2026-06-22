import type { Metadata } from 'next'
import BookReader from '@/components/BookReader'
import { parseBook } from '@/lib/parseBook'
export type { BookChapter } from '@/lib/parseBook'

export const metadata: Metadata = {
  title: 'The Blind Angel — The Book',
  description: 'A literary companion in seventeen chapters. One descent, one fire, one return. The Intimate Metal book by NoiraCiel.',
  alternates: { canonical: 'https://noiraciel.com/book/blind-angel' },
  openGraph: {
    title: 'The Blind Angel — The Book · NoiraCiel',
    description: 'A literary companion in seventeen chapters. One descent, one fire, one return.',
    url: 'https://noiraciel.com/book/blind-angel',
    type: 'book',
    images: [{ url: '/images/album-covers/blind-angel.jpg', width: 1200, height: 1200, alt: 'The Blind Angel — The Book by NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Blind Angel — The Book · NoiraCiel',
    description: 'A literary companion in seventeen chapters. One descent, one fire, one return.',
    images: ['/images/album-covers/blind-angel.jpg'],
  },
}

export default function BlindAngelBookPage() {
  const chapters = parseBook('book-blind-angel.md')
  return (
    <BookReader
      chapters={chapters}
      bookMeta={{
        title: 'The Blind Angel — Intimate Metal Sessions',
        titleLine1: 'The Blind Angel',
        titleLine2: 'Intimate Metal Sessions',
        genre: 'Intimate Metal',
      }}
    />
  )
}
