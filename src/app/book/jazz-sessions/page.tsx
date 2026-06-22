import type { Metadata } from 'next'
import BookReader from '@/components/BookReader'
import { parseBook } from '@/lib/parseBook'
export type { BookChapter } from '@/lib/parseBook'

export const metadata: Metadata = {
  title: 'NoiraCiel Jazz Sessions — The Book',
  description: 'Nine chapters at the edge of night. Jazz, Atlantic Noir, and the hidden rivers running under everything. The literary companion to the NoiraCiel Jazz Sessions album.',
  alternates: { canonical: 'https://noiraciel.com/book/jazz-sessions' },
  openGraph: {
    title: 'NoiraCiel Jazz Sessions — The Book · NoiraCiel',
    description: 'Nine chapters at the edge of night. Jazz, Atlantic Noir, and the hidden rivers running under everything.',
    url: 'https://noiraciel.com/book/jazz-sessions',
    type: 'book',
    images: [{ url: '/images/album-covers/jazz-sessions.jpg', width: 1200, height: 1200, alt: 'NoiraCiel Jazz Sessions — The Book' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoiraCiel Jazz Sessions — The Book · NoiraCiel',
    description: 'Nine chapters at the edge of night. Jazz, Atlantic Noir, and the hidden rivers running under everything.',
    images: ['/images/album-covers/jazz-sessions.jpg'],
  },
}

export default function JazzSessionsBookPage() {
  const chapters = parseBook('book-jazz-sessions.md')
  return (
    <BookReader
      chapters={chapters}
      bookMeta={{
        title: 'NoiraCiel Jazz Sessions',
        titleLine1: 'NoiraCiel',
        titleLine2: 'Jazz Sessions',
        genre: 'Jazz · Atlantic Noir',
      }}
    />
  )
}
