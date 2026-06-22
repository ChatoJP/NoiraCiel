import type { Metadata } from 'next'
import StudioApp from '@/components/studio/StudioApp'

export const metadata: Metadata = {
  title: 'Studio — NoiraCiel',
  description: 'An in-browser music studio. Play piano, build beats, slice samples from NoiraCiel songs, and generate auto mashups.',
  alternates: { canonical: 'https://noiraciel.com/studio' },
}

export default function StudioPage() {
  return <StudioApp />
}
