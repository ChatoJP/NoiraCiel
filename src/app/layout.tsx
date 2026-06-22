import type { Metadata } from 'next'
import './globals.css'
import { AudioProvider } from '@/context/AudioContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { CartProvider } from '@/context/CartContext'
import Navigation from '@/components/Navigation'
import GlobalPlayer from '@/components/player/GlobalPlayer'
import ThemeSync from '@/components/ThemeSync'
import ChatWidget from '@/components/ChatWidget'
import CartDrawer from '@/components/CartDrawer'
import { JsonLd } from '@/components/JsonLd'
import ReadingProgress from '@/components/ReadingProgress'
import PageEffects from '@/components/PageEffects'

export const metadata: Metadata = {
  metadataBase: new URL('https://noiraciel.com'),
  title: {
    default: 'NoiraCiel — Music, Literature & A Way of Living',
    template: '%s — NoiraCiel',
  },
  description: 'NoiraCiel is a human-led artistic universe of music, books, images, videos, objects and memory — where every song becomes a chapter.',
  keywords: ['NoiraCiel', 'Atlantic Noir', 'Sea-Soul', 'music', 'literature', 'books', 'cinematic', 'independent music', 'singer-songwriter', 'Portuguese'],
  authors: [{ name: 'NoiraCiel', url: 'https://noiraciel.com' }],
  creator: 'NoiraCiel',
  publisher: 'NoiraCiel',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://noiraciel.com',
    siteName: 'NoiraCiel',
    title: 'NoiraCiel — Music, Literature & A Way of Living',
    description: 'NoiraCiel is a human-led artistic universe of music, books, images, videos, objects and memory — where every song becomes a chapter.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'NoiraCiel — Atlantic Noir artistic universe' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@noiraciel',
    creator: '@noiraciel',
    title: 'NoiraCiel — Music, Literature & A Way of Living',
    description: 'NoiraCiel is a human-led artistic universe of music, books, images, videos, objects and memory — where every song becomes a chapter.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NoiraCiel',
  url: 'https://noiraciel.com',
  logo: 'https://noiraciel.com/images/album-cover.png',
  description: 'NoiraCiel is a human-led artistic universe of music, books, images, videos, objects and memory — where every song becomes a chapter.',
  sameAs: [
    'https://open.spotify.com/album/49QDSwM3584OawGtC0O7eR',
    'https://music.apple.com/us/artist/noiraciel/6776477025',
    'https://www.youtube.com/channel/UCFjqshj-v26mmHlkFNZFNMQ',
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'NoiraCiel',
  url: 'https://noiraciel.com',
  description: 'NoiraCiel is a human-led artistic universe of music, books, images, videos, objects and memory.',
  publisher: {
    '@type': 'Organization',
    name: 'NoiraCiel',
    url: 'https://noiraciel.com',
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
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className="bg-noir-black text-noir-ivory font-body antialiased">
        <ThemeProvider>
          <CartProvider>
            <AudioProvider>
              <ReadingProgress />
              <PageEffects />
              <ThemeSync />
              <Navigation />
              <main className="pb-24">
                {children}
              </main>
              <GlobalPlayer />
              <ChatWidget />
              <CartDrawer />
            </AudioProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
