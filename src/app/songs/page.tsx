import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { scanMusicFolder } from '@/lib/musicScanner'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All Songs',
  description: 'Every NoiraCiel song — lyrics, chapters, and the music that carries them.',
  alternates: { canonical: 'https://noiraciel.com/songs' },
}

export default async function SongsIndexPage() {
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#F2EDE3' }}>

      {/* Header */}
      <div style={{ padding: '8rem 1.5rem 4rem', maxWidth: '1100px', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '1rem' }}>
          NoiraCiel
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#F2EDE3', lineHeight: 1.1, marginBottom: '1rem' }}>
          All Songs
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(200,196,190,0.45)', marginBottom: '3rem' }}>
          {tracks.length} songs across {catalogue.albumSlugs?.length ?? 'multiple'} albums
        </p>
      </div>

      {/* Song grid */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {tracks.map((track) => (
            <Link
              key={track.slug}
              href={`/songs/${track.slug}`}
              style={{ textDecoration: 'none', display: 'block', group: 'true' } as React.CSSProperties}
            >
              <div style={{ position: 'relative', aspectRatio: '1', background: 'rgba(196,149,58,0.05)', border: '1px solid rgba(196,149,58,0.1)', overflow: 'hidden', marginBottom: '0.75rem' }}>
                {track.songArtUrl ? (
                  <Image
                    src={track.songArtUrl}
                    alt={track.title}
                    fill
                    style={{ objectFit: 'cover', opacity: 0.85 }}
                    sizes="200px"
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                      <polygon points="14,2 26,14 14,26 2,14" stroke="rgba(196,149,58,0.3)" strokeWidth="1.2" fill="none" />
                      <circle cx="14" cy="14" r="1.8" fill="rgba(196,149,58,0.4)" />
                    </svg>
                  </div>
                )}
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontStyle: 'italic', fontSize: '0.95rem', color: 'rgba(242,237,227,0.88)', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                {track.title}
              </h2>
              {track.durationFormatted && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(196,149,58,0.5)' }}>
                  {track.durationFormatted}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
