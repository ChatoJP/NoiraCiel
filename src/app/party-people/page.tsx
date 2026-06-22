import type { Metadata } from 'next'
import Link from 'next/link'
import { loadAllPartyAlbums } from '@/lib/partyPeopleScanner'
import { THEMES } from '@/lib/themes'
import ApplyTheme from '@/components/ApplyTheme'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'NoiraCiel Party People',
  description: 'The body side of NoiraCiel — instrumental psy-trance, hard techno, tech-house and tribal house for the floor, not the page. No vocals, no lyrics, pure rhythm.',
  alternates: { canonical: 'https://noiraciel.com/party-people' },
  openGraph: {
    title: 'NoiraCiel Party People',
    description: 'The body side of NoiraCiel — instrumental club music for dance, ritual, and night-driving.',
    url: 'https://noiraciel.com/party-people',
    type: 'website',
  },
}

export default async function PartyPeoplePage() {
  const albums = loadAllPartyAlbums()
  const allReadyTracks = albums.flatMap((a) => a.tracks.filter((t) => t.ready).map((t) => ({ ...t, albumTheme: a.theme })))
  const latest = allReadyTracks.slice(-6).reverse()

  return (
    <div style={{ background: '#070509', color: '#F2EDE3', minHeight: '100vh' }}>
      <ApplyTheme theme="ritual-voltage" />

      {/* Hero */}
      <section style={{ padding: '9rem 1.5rem 4rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <p className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)', marginBottom: '1.25rem' }}>
          NoiraCiel — The Body Side
        </p>
        <h1 className="font-heading" style={{ fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2.4rem, 7vw, 4.2rem)', marginBottom: '1.25rem', letterSpacing: '0.01em' }}>
          Party People
        </h1>
        <p className="font-heading italic" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(242,237,227,0.55)', maxWidth: '620px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Main NoiraCiel is emotion, memory, stories. Party People is movement, rhythm, sweat, lights, bass —
          collective energy with no words at all. Four instrumental club albums. No vocals. No lyrics. Just the floor.
        </p>
        <Link
          href={`#${albums[0]?.slug ?? ''}`}
          className="font-body"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase',
            padding: '0.9rem 2rem', border: '1px solid rgba(127,224,112,0.4)', color: '#F2EDE3',
            textDecoration: 'none', transition: 'all 0.3s',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7FE070' }} />
          Enter the Room
        </Link>
      </section>

      {/* Album cards */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {albums.map((album) => {
            const theme = THEMES[album.theme.name as keyof typeof THEMES] ?? THEMES['dark-noir']
            const readyCount = album.tracks.filter((t) => t.ready).length
            const cover = album.tracks.find((t) => t.trackArtUrl)?.trackArtUrl
            return (
              <Link
                key={album.slug}
                id={album.slug}
                href={`/party-people/${album.slug}`}
                style={{
                  display: 'block', position: 'relative', aspectRatio: '4/5',
                  background: cover ? `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.92)), url(${cover})` : `rgb(${theme.bgTintRgb})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  border: `1px solid rgba(${theme.accentRgb}, 0.25)`,
                  textDecoration: 'none', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem' }}>
                  <p className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: `rgb(${theme.accentRgb})`, marginBottom: '0.4rem' }}>
                    {album.genre}
                  </p>
                  <h2 className="font-heading italic" style={{ fontSize: '1.5rem', color: '#F2EDE3', marginBottom: '0.4rem' }}>
                    {album.title}
                  </h2>
                  <p className="font-body" style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.45)' }}>
                    {album.bpmRange[0]}–{album.bpmRange[1]} BPM · {readyCount}/{album.tracks.length} tracks live
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Latest tracks */}
      {latest.length > 0 && (
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem 6rem' }}>
          <h2 className="font-body" style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.4)', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
            Latest from the floor
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
            {latest.map((t) => (
              <Link key={t.slug} href={`/party-people/${t.albumSlug}/${t.slug}`} style={{ display: 'block', background: '#0A080D', padding: '1.25rem', textDecoration: 'none' }}>
                <p className="font-body" style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: `rgb(${t.albumTheme.accentRgb})`, marginBottom: '0.4rem' }}>
                  {t.albumTitle} · {t.bpm} BPM
                </p>
                <p className="font-heading italic" style={{ fontSize: '1.05rem', color: '#F2EDE3' }}>{t.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
