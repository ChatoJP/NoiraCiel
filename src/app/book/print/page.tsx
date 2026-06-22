import type { Metadata } from 'next'
import { parseBook } from '@/lib/parseBook'
import BookPrint from '@/components/BookPrint'

export const metadata: Metadata = {
  title: 'Print Edition | The Life Lessons I Hope You Learn',
}

export default function PrintPage() {
  const chapters = parseBook()
  return <BookPrint chapters={chapters} />
}
