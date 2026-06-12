import type { Metadata } from 'next'
import './globals.css'
import { AudioProvider } from '@/context/AudioContext'
import Navigation from '@/components/Navigation'
import GlobalPlayer from '@/components/player/GlobalPlayer'

export const metadata: Metadata = {
  metadataBase: new URL('https://noiraciel.com'),
  title: 'NoiraCiel — Atlantic Noir. Sea-Soul.',
  description: 'Songs from the dark edge of memory. Atlantic Noir and Sea-Soul music by NoiraCiel.',
  keywords: ['NoiraCiel', 'Atlantic Noir', 'Sea-Soul', 'music', 'cinematic', 'Portuguese', 'emotional'],
  authors: [{ name: 'NoiraCiel' }],
  creator: 'NoiraCiel',
  openGraph: {
    type: 'music.song',
    locale: 'en_US',
    url: 'https://noiraciel.com',
    siteName: 'NoiraCiel',
    title: 'NoiraCiel — Atlantic Noir. Sea-Soul.',
    description: 'Songs from the dark edge of memory.',
    images: [
      {
        url: '/Images/album-cover.png',
        width: 1200,
        height: 1200,
        alt: 'NoiraCiel — The Life Lessons I Hope You Learn',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoiraCiel — Atlantic Noir. Sea-Soul.',
    description: 'Songs from the dark edge of memory.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-noir-black text-noir-ivory font-body antialiased">
        <AudioProvider>
          <Navigation />
          <main className="pb-24">
            {children}
          </main>
          <GlobalPlayer />
        </AudioProvider>
      </body>
    </html>
  )
}
