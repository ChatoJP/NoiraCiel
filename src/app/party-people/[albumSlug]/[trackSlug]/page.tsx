import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadPartyAlbum, PARTY_PEOPLE_ALBUM_SLUGS } from '@/lib/partyPeopleScanner'
import { THEMES } from '@/lib/themes'
import type { ThemeName } from '@/lib/themes'
import ApplyTheme from '@/components/ApplyTheme'
import PartyTrackBody from '@/components/party-people/PartyTrackBody'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ albumSlug: string; trackSlug: string }> }): Promise<Metadata> {
  const { albumSlug, trackSlug } = await params
  const album = loadPartyAlbum(albumSlug)
  const track = album?.tracks.find((t) => t.slug === trackSlug)
  if (!album || !track) return {}
  return {
    title: `${track.title} — ${album.title} — NoiraCiel Party People`,
    description: track.description,
    alternates: { canonical: `https://noiraciel.com/party-people/${album.slug}/${track.slug}` },
    openGraph: {
      title: track.title, description: track.description,
      url: `https://noiraciel.com/party-people/${album.slug}/${track.slug}`, type: 'music.song',
      ...(track.trackArtUrl ? { images: [{ url: track.trackArtUrl, width: 1200, height: 1200 }] } : {}),
    },
  }
}

export default async function PartyTrackPage({ params }: { params: Promise<{ albumSlug: string; trackSlug: string }> }) {
  const { albumSlug, trackSlug } = await params
  if (!PARTY_PEOPLE_ALBUM_SLUGS.includes(albumSlug as any)) notFound()
  const album = loadPartyAlbum(albumSlug)
  const track = album?.tracks.find((t) => t.slug === trackSlug)
  if (!album || !track) notFound()

  const theme = THEMES[album.theme.name as ThemeName] ?? THEMES['dark-noir']

  const trackSchema = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title,
    byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
    inAlbum: { '@type': 'MusicAlbum', name: album.title, url: `https://noiraciel.com/party-people/${album.slug}` },
    url: `https://noiraciel.com/party-people/${album.slug}/${track.slug}`,
    ...(track.duration ? { duration: `PT${Math.round(track.duration)}S` } : {}),
  }

  return (
    <>
      <JsonLd data={trackSchema} />
      <ApplyTheme theme={album.theme.name as ThemeName} />
      <PartyTrackBody
        track={track}
        allTracks={album.tracks}
        accentRgb={theme.accentRgb}
        bgTintRgb={theme.bgTintRgb}
        albumSlug={album.slug}
        albumTitle={album.title}
      />
    </>
  )
}
