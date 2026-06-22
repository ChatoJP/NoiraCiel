import type { Metadata } from 'next'
import JoinPage from '@/components/JoinPage'

export const metadata: Metadata = {
  title: 'Join — Musicians Wanted',
  description: 'NoiraCiel is looking for musicians, vocalists, and collaborators who feel something when they play. The session is open.',
  alternates: { canonical: 'https://noiraciel.com/join' },
  openGraph: {
    title: 'Join NoiraCiel — The Session is Open',
    description: 'We are looking for musicians, vocalists, and collaborators who understand that music is a form of truth-telling.',
    url: 'https://noiraciel.com/join',
    type: 'website',
    images: [{ url: '/images/album-cover.png', width: 1200, height: 1200, alt: 'Join NoiraCiel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join NoiraCiel — The Session is Open',
    description: 'We are looking for musicians, vocalists, and collaborators who understand that music is a form of truth-telling.',
    images: ['/images/album-cover.png'],
  },
}

export default function Page() {
  return <JoinPage />
}
