import type { Metadata } from 'next'
import BookCoverClient from '@/components/BookCover'

export const metadata: Metadata = {
  title: 'Book Cover | The Life Lessons I Hope You Learn',
}

export default function CoverPage() {
  return <BookCoverClient />
}
