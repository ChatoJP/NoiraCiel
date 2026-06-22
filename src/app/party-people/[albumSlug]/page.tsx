import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { loadPartyAlbum, PARTY_PEOPLE_ALBUM_SLUGS } from '@/lib/partyPeopleScanner'
import { THEMES } from '@/lib/themes'
import ApplyTheme from '@/components/ApplyTheme'
import type { ThemeName } from '@/lib/themes'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ albumSlug: string }> }): Promise<Metadata> {
  const { albumSlug } = await params
  const album = loadPartyAlbum(albumSlug)
  if (!album) return {}
  return {
    title: `${album.title} — NoiraCiel Party People`,
    description: album.concept,
    alternates: { canonical: `https://noiraciel.com/party-people/${album.slug}` },
    openGraph: { title: album.title, description: album.concept, url: `https://noiraciel.com/party-people/${album.slug}`, type: 'music.album' },
  }
}

export default async function PartyAlbumPage({ params }: { params: Promise<{ albumSlug: string }> }) {
  const { albumSlug } = await params
  if (!PARTY_PEOPLE_ALBUM_SLUGS.includes(albumSlug as any)) notFound()
  const album = loadPartyAlbum(albumSlug)
  if (!album) notFound()

  const theme = THEMES[album.theme.name as ThemeName] ?? THEMES['dark-noir']
  const banner = album.tracks.find((t) => t.bannerUrl)?.bannerUrl

  return (
    <div style={{ background: `rgb(${theme.bgTintRgb})`, color: '#F2EDE3', minHeight: '100vh' }}>
      <ApplyTheme theme={album.theme.name as ThemeName} />

      {/* Album hero */}
      <section
        style={{
          padding: '9rem 1.5rem 3rem', maxWidth: '1000px', margin: '0 auto',
          backgroundImage: banner ? `linear-gradient(180deg, rgba(0,0,0,0.3), rgb(${theme.bgTintRgb}) 90%), url(${banner})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <Link href="/party-people" className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.4)', textDecoration: 'none' }}>
          ← Party People
        </Link>
        <p className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: `rgb(${theme.accentRgb})`, margin: '1.5rem 0 0.75rem' }}>
          {album.genre}
        </p>
        <h1 className="font-heading italic" style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', marginBottom: '1rem' }}>
          {album.title}
        </h1>
        <p className="font-body" style={{ fontSize: '0.8rem', color: 'rgba(242,237,227,0.6)', maxWidth: '620px', lineHeight: 1.8, marginBottom: '1rem' }}>
          {album.concept}
        </p>
        <p className="font-body" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(242,237,227,0.35)' }}>
          {album.bpmRange[0]}–{album.bpmRange[1]} BPM · Instrumental · {album.tracks.length} tracks
        </p>
      </section>

      {/* Tracklist */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '1rem 1.5rem 6rem' }}>
        <div style={{ display: 'grid', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
          {album.tracks.map((t) => (
            <div key={t.slug} style={{ background: `rgba(${theme.bgTintRgb},0.6)`, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="font-body" style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.3)', width: '1.5rem', flexShrink: 0 }}>
                {String(t.num).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.ready ? (
                  <Link href={`/party-people/${album.slug}/${t.slug}`} style={{ textDecoration: 'none' }}>
                    <p className="font-heading italic" style={{ fontSize: '1rem', color: '#F2EDE3' }}>{t.title}</p>
                  </Link>
                ) : (
                  <p className="font-heading italic" style={{ fontSize: '1rem', color: 'rgba(242,237,227,0.3)' }}>{t.title}</p>
                )}
                <p className="font-body" style={{ fontSize: '0.6rem', color: 'rgba(242,237,227,0.35)', marginTop: '0.2rem' }}>
                  {t.bpm} BPM · {t.key} · energy {t.energyLevel}/10
                </p>
              </div>
              {t.ready ? (
                <Link
                  href={`/party-people/${album.slug}/${t.slug}`}
                  className="font-body"
                  style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: `rgb(${theme.accentRgb})`, textDecoration: 'none', flexShrink: 0 }}
                >
                  Enter Track Page →
                </Link>
              ) : (
                <span className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.25)', flexShrink: 0 }}>
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
