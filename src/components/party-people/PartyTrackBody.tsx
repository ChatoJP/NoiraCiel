'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAudio } from '@/context/AudioContext'
import { toPlayableTrack, type PartyTrack } from '@/lib/partyPeopleTypes'
import GhostPerformanceTab from '@/components/ghost-performance/GhostPerformanceTab'
import MediaProvenanceBadge from '@/components/MediaProvenanceBadge'

type Tab = 'overview' | 'visualizer' | 'film' | 'club-cut' | 'dj-notes' | 'sound-design' | 'artwork'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'visualizer', label: 'Ghost Club Performance' },
  { id: 'film', label: 'Film' },
  { id: 'artwork', label: 'Living Artwork' },
  { id: 'club-cut', label: "Producer's Cut" },
  { id: 'dj-notes', label: 'DJ Notes' },
  { id: 'sound-design', label: 'Sound Design' },
]

export default function PartyTrackBody({
  track, allTracks, accentRgb, bgTintRgb, albumSlug, albumTitle,
}: {
  track: PartyTrack
  allTracks: PartyTrack[]
  accentRgb: string
  bgTintRgb: string
  albumSlug: string
  albumTitle: string
}) {
  const { play, toggle, currentTrack, isPlaying } = useAudio()
  const [tab, setTab] = useState<Tab>('overview')

  const playable = toPlayableTrack(track)
  const isCurrent = currentTrack?.id === playable.id

  function handlePlay() {
    if (isCurrent) { toggle(); return }
    const playlist = allTracks.filter((t) => t.ready).map(toPlayableTrack)
    play(playable, playlist)
  }

  const idx = allTracks.findIndex((t) => t.slug === track.slug)
  const prev = idx > 0 ? allTracks[idx - 1] : null
  const next = idx < allTracks.length - 1 ? allTracks[idx + 1] : null

  return (
    <div style={{ background: `rgb(${bgTintRgb})`, color: '#F2EDE3', minHeight: '100vh' }}>
      {/* Hero */}
      <section
        style={{
          padding: '9rem 1.5rem 3rem', maxWidth: '900px', margin: '0 auto',
          backgroundImage: track.bannerUrl ? `linear-gradient(180deg, rgba(0,0,0,0.35), rgb(${bgTintRgb}) 92%), url(${track.bannerUrl})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <Link href={`/party-people/${albumSlug}`} className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.4)', textDecoration: 'none' }}>
          ← {albumTitle}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {track.trackArtUrl && (
            <img
              src={track.trackArtUrl}
              alt={track.title}
              style={{
                width: '160px', height: '160px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                border: `2px solid rgb(${accentRgb})`,
                animation: isCurrent && isPlaying ? 'party-vinyl-spin 8s linear infinite' : undefined,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <p className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: `rgb(${accentRgb})`, marginBottom: '0.5rem' }}>
              Track {String(track.num).padStart(2, '0')} · Instrumental
            </p>
            <h1 className="font-heading italic" style={{ fontWeight: 300, fontSize: 'clamp(1.8rem, 5vw, 3rem)', marginBottom: '0.75rem' }}>
              {track.title}
            </h1>
            <p className="font-body" style={{ fontSize: '0.7rem', color: 'rgba(242,237,227,0.45)', marginBottom: '1.25rem' }}>
              {track.bpm} BPM · {track.key} · Energy {track.energyLevel}/10{track.durationFormatted ? ` · ${track.durationFormatted}` : ''}
            </p>
            <button
              onClick={handlePlay}
              disabled={!track.ready}
              className="font-body"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                padding: '0.85rem 1.75rem', border: `1px solid rgb(${accentRgb})`,
                background: isCurrent && isPlaying ? `rgb(${accentRgb})` : 'transparent',
                color: isCurrent && isPlaying ? '#080810' : '#F2EDE3',
                cursor: track.ready ? 'pointer' : 'not-allowed', opacity: track.ready ? 1 : 0.4,
              }}
            >
              {isCurrent && isPlaying ? 'Pause' : isCurrent ? 'Resume' : 'Play'}
            </button>
          </div>
        </div>

        <p className="font-body" style={{ fontSize: '0.85rem', color: 'rgba(242,237,227,0.55)', marginTop: '1.5rem', lineHeight: 1.7, maxWidth: '600px' }}>
          {track.description}
        </p>
      </section>

      {/* Tabs */}
      <nav style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="font-body"
              style={{
                fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t.id ? `rgb(${accentRgb})` : 'rgba(242,237,227,0.4)',
                padding: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem 6rem' }}>
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1px', background: 'rgba(255,255,255,0.05)' }}>
            {[
              ['BPM', String(track.bpm)],
              ['Key', track.key],
              ['Energy', `${track.energyLevel}/10`],
              ['Tags', track.tags.join(', ')],
            ].map(([label, value]) => (
              <div key={label} style={{ background: `rgb(${bgTintRgb})`, padding: '1.25rem' }}>
                <p className="font-body" style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.35)', marginBottom: '0.4rem' }}>{label}</p>
                <p className="font-body" style={{ fontSize: '0.8rem', color: '#F2EDE3' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'visualizer' && (
          track.ready ? <GhostPerformanceTab track={playable} /> : <ComingSoon accentRgb={accentRgb} label="Ghost Club Performance" />
        )}

        {tab === 'film' && (
          <div>
            <MediaProvenanceBadge type="looping-visual" />
            <p className="font-body" style={{ fontSize: '0.8rem', color: 'rgba(242,237,227,0.5)', lineHeight: 1.8, marginTop: '1rem' }}>
              {track.filmPrompt}
            </p>
            <p className="font-body" style={{ fontSize: '0.65rem', color: 'rgba(242,237,227,0.3)', marginTop: '1rem' }}>
              Club film render pending — recorded in the generation queue.
            </p>
          </div>
        )}

        {tab === 'artwork' && (
          track.trackArtUrl ? (
            <div>
              <MediaProvenanceBadge type="ai-image" />
              <img src={track.trackArtUrl} alt={track.title} style={{ width: '100%', maxWidth: '480px', marginTop: '1rem', border: `1px solid rgba(${accentRgb},0.2)` }} />
            </div>
          ) : <ComingSoon accentRgb={accentRgb} label="Living Artwork" />
        )}

        {tab === 'club-cut' && (
          <div style={{ borderLeft: `1px solid rgba(${accentRgb},0.3)`, paddingLeft: '1.5rem', maxWidth: '600px' }}>
            <p className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: `rgb(${accentRgb})`, marginBottom: '0.75rem' }}>
              Arrangement
            </p>
            <p className="font-body" style={{ fontSize: '0.8rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.8 }}>
              {track.arrangementPrompt}
            </p>
          </div>
        )}

        {tab === 'dj-notes' && (
          <div style={{ borderLeft: `1px solid rgba(${accentRgb},0.3)`, paddingLeft: '1.5rem', maxWidth: '600px', display: 'grid', gap: '1.25rem' }}>
            <div>
              <p className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: `rgb(${accentRgb})`, marginBottom: '0.5rem' }}>Transition Notes</p>
              <p className="font-body" style={{ fontSize: '0.8rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.8 }}>{track.djTransitionNotes}</p>
            </div>
            <div>
              <p className="font-body" style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: `rgb(${accentRgb})`, marginBottom: '0.5rem' }}>Mix / Master</p>
              <p className="font-body" style={{ fontSize: '0.8rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.8 }}>{track.mixMasterNotes}</p>
            </div>
          </div>
        )}

        {tab === 'sound-design' && (
          <div style={{ borderLeft: `1px solid rgba(${accentRgb},0.3)`, paddingLeft: '1.5rem', maxWidth: '600px' }}>
            <p className="font-body" style={{ fontSize: '0.8rem', color: 'rgba(242,237,227,0.55)', lineHeight: 1.8 }}>
              {track.soundDesignPrompt}
            </p>
          </div>
        )}
      </section>

      {/* Prev/Next */}
      <nav style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 5rem', display: 'flex', justifyContent: 'space-between' }}>
        {prev ? (
          <Link href={prev.ready ? `/party-people/${albumSlug}/${prev.slug}` : `/party-people/${albumSlug}`} className="font-body" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.4)', textDecoration: 'none' }}>
            ← {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={next.ready ? `/party-people/${albumSlug}/${next.slug}` : `/party-people/${albumSlug}`} className="font-body" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.4)', textDecoration: 'none' }}>
            {next.title} →
          </Link>
        ) : <span />}
      </nav>

      <style>{`@keyframes party-vinyl-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function ComingSoon({ accentRgb, label }: { accentRgb: string; label: string }) {
  return (
    <div style={{ padding: '2rem', border: `1px dashed rgba(${accentRgb},0.25)`, textAlign: 'center' }}>
      <p className="font-body" style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(242,237,227,0.35)' }}>
        {label} — coming soon
      </p>
    </div>
  )
}
