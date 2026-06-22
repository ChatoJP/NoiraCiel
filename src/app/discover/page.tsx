import type { Metadata } from 'next'
import DiscoverClient from './DiscoverClient'

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Find the right NoiraCiel song for how you feel right now — search by mood, emotion, or theme.',
  alternates: { canonical: 'https://noiraciel.com/discover' },
}

export default function DiscoverPage() {
  return <DiscoverClient />
}
