'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAudio } from '@/context/AudioContext'
import type { Track } from '@/lib/types'

// Song chapter emotional context — mirrors scripts/lib/prompts.js SONG_CHAPTERS
const CHAPTER_CONTEXT: Record<number, { emotion: string; symbols: string }> = {
  1:  { emotion: 'The lifelong question — searching for meaning that was always already there.', symbols: 'road · horizon · open book · hands · dusk light' },
  2:  { emotion: 'The hollowness of achievement when it costs us the people we love.', symbols: 'trophy · hilltop · empty valley · still water · rain' },
  3:  { emotion: 'The invisible inheritance — what our ancestors planted in us without us knowing.', symbols: 'roots · stone · garden · doorway · grandmother · seeds' },
  4:  { emotion: 'The weight of words never spoken — how silence can be its own kind of violence.', symbols: 'empty chairs · unsent letters · kitchen table · reaching hand · silence' },
  5:  { emotion: 'Dignity in honest work — the beauty of a life lived through labour and love.', symbols: 'fishing boat · harbour · weathered hands · dawn · Atlantic waves' },
  6:  { emotion: 'The grace of companionship — walking the same road without needing to speak.', symbols: 'coastal path · long shadows · two figures · late light · unhurried steps' },
  7:  { emotion: "A parent's silent vigil — the love that asks for nothing, only safety.", symbols: 'doorway silhouette · sleeping child · lamp · phone glow · 2am' },
  8:  { emotion: 'Recognition — looking back and seeing the love that was always present, just unnamed.', symbols: 'attic light · dust motes · old photographs · mirror · recognition' },
  9:  { emotion: 'The phone call that changes the quality of darkness — someone always present.', symbols: 'rain on window · single lamp · phone call · morning light · thin curtains' },
  10: { emotion: "The family home as a living thing — how spaces hold the memory of those who loved them.", symbols: 'family home · glowing windows · dark field · left-behind objects · closing door' },
  11: { emotion: 'The tenderness of simplicity — a life lived without alternatives, full of its own grace.', symbols: 'coastal village · dawn rituals · faded warmth · familiar streets · simple grace' },
  12: { emotion: "The lit window as love's most silent language — a mother's vigil made visible.", symbols: 'lit window · dark exterior · silhouette · waiting · warm light on cold stone' },
  13: { emotion: 'Grief that has found its proper place — the presence of the absent, held with dignity.', symbols: 'empty chair · Sunday table · afternoon light · place setting · sacred absence' },
  14: { emotion: 'Patience as a radical act — the dignity of slow, deliberate growth over time.', symbols: 'garden · old hands · four seasons · seeds · earth · patience' },
  15: { emotion: 'The courage of revision — the grace of returning to say what you should have said.', symbols: 'kitchen table · morning coffee · same room years later · changed light · an opening' },
  16: { emotion: 'Gratitude for the unearned gift of extra time — afternoons that feel like grace.', symbols: 'intertwined hands · afternoon light · old clock · weathered skin · borrowed grace' },
  17: { emotion: 'Freedom as clarity — the liberation that comes from speaking truthfully, whatever the cost.', symbols: 'public square · speaking · listening · changed atmosphere · conviction · open sky' },
}

// ─── Lyrics panel ─────────────────────────────────────────────────────────────
function LyricsDisplay({ lyrics }: { lyrics: string | null }) {
  if (!lyrics) return (
    <p className="font-heading italic text-sm text-noir-silver/25">— · —</p>
  )
  const stanzas = lyrics.split(/\n\s*\n/).filter((s) => s.trim())
  return (
    <div className="space-y-6">
      {stanzas.map((stanza, i) => (
        <p key={i} className="font-heading italic text-base md:text-lg text-noir-silver/80 leading-loose whitespace-pre-line">
          {stanza.trim()}
        </p>
      ))}
    </div>
  )
}

// ─── Video player ─────────────────────────────────────────────────────────────
function VideoSection({ track }: { track: Track }) {
  const [playing, setPlaying] = useState(false)
  // Show lyric video if available, fall back to Veo3 video
  const videoUrl = track.lyricVideoUrl ?? track.videoUrl
  const videoLabel = track.lyricVideoUrl ? 'Lyric Video' : 'Music Video'
  if (!videoUrl) return null

  return (
    <div className="mt-16">
      <p className="font-body text-[10px] tracking-[0.35em] text-noir-gold/50 uppercase mb-4">{videoLabel}</p>
      <div className="aspect-video relative bg-noir-deep border border-noir-silver/10 overflow-hidden">
        {playing ? (
          <video src={videoUrl} className="absolute inset-0 w-full h-full object-cover" controls autoPlay />
        ) : (
          <>
            {track.songArtUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.songArtUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-noir-void/50">
              <button
                onClick={() => setPlaying(true)}
                className="w-20 h-20 rounded-full border border-noir-ivory/30 bg-noir-void/60 flex items-center justify-center hover:border-noir-gold/50 hover:bg-noir-gold/10 transition-all duration-300"
                aria-label={`Play ${videoLabel.toLowerCase()} for ${track.title}`}
              >
                <svg className="w-8 h-8 text-noir-ivory ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-4 left-4">
              <p className="font-body text-xs text-noir-ivory/40 tracking-wider">{videoLabel}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Chapter navigation ───────────────────────────────────────────────────────
function ChapterNav({ prev, next }: { prev: Track | null; next: Track | null }) {
  return (
    <div className="flex items-center justify-between pt-12 mt-12 border-t border-noir-silver/10">
      <div>
        {prev && (
          <Link href={`/songs/${prev.slug}`} className="group flex flex-col gap-1">
            <span className="font-body text-[10px] tracking-[0.25em] text-noir-silver/30 uppercase">Previous</span>
            <span className="font-heading italic text-lg text-noir-silver/60 group-hover:text-noir-ivory transition-colors">
              ← {prev.title}
            </span>
          </Link>
        )}
      </div>
      <div className="text-right">
        {next && (
          <Link href={`/songs/${next.slug}`} className="group flex flex-col items-end gap-1">
            <span className="font-body text-[10px] tracking-[0.25em] text-noir-silver/30 uppercase">Next</span>
            <span className="font-heading italic text-lg text-noir-silver/60 group-hover:text-noir-ivory transition-colors">
              {next.title} →
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Main chapter page ────────────────────────────────────────────────────────
interface Props {
  track: Track
  prev: Track | null
  next: Track | null
  allTracks: Track[]
}

export default function SongChapterPage({ track, prev, next, allTracks }: Props) {
  const { play, toggle, currentTrack, isPlaying } = useAudio()
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const isCurrent = currentTrack?.id === track.id
  const context = CHAPTER_CONTEXT[track.trackNumber ?? 0]

  const handlePlay = () => {
    if (isCurrent) toggle()
    else play(track, allTracks)
  }

  return (
    <div className="min-h-screen bg-noir-black">

      {/* Full-bleed artwork header */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {(track.chapterBannerUrl ?? track.songArtUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.chapterBannerUrl ?? track.songArtUrl ?? ''}
            alt={track.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-noir-navy via-noir-atlantic to-noir-void" />
        )}
        {/* Gradient overlay — darken bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-noir-black/30 to-transparent" />

        {/* Back nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 md:p-8">
          <Link
            href="/music"
            className="inline-flex items-center gap-2 font-body text-xs tracking-[0.15em] uppercase text-noir-ivory/50 hover:text-noir-ivory transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
            Album
          </Link>
          <Link href="/" className="font-heading text-sm tracking-[0.2em] text-noir-ivory/40 hover:text-noir-ivory transition-colors">
            NoiraCiel
          </Link>
        </div>

        {/* Track info overlay — bottom of artwork */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <p className="font-body text-[10px] tracking-[0.4em] text-noir-gold/60 uppercase mb-2">
            Chapter {String(track.trackNumber ?? '').padStart(2, '0')} · {track.durationFormatted}
          </p>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-noir-ivory font-light tracking-wide leading-none mb-4">
            {track.title}
          </h1>
          {context?.emotion && (
            <p className="font-heading italic text-base md:text-lg text-noir-ivory/50 max-w-xl leading-relaxed">
              {context.emotion}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 md:px-8 pb-32">

        {/* Audio controls */}
        <div className="flex items-center gap-4 py-8 border-b border-noir-silver/10">
          <button
            onClick={handlePlay}
            className={`flex items-center gap-3 px-6 py-3 font-body text-xs tracking-[0.15em] uppercase transition-all duration-300 ${
              isCurrent && isPlaying
                ? 'bg-noir-gold/10 border border-noir-gold/40 text-noir-gold'
                : 'bg-noir-gold text-noir-void hover:bg-noir-gold-light'
            }`}
          >
            {isCurrent && isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {isCurrent ? 'Resume' : 'Listen'}
              </>
            )}
          </button>

          {context?.symbols && (
            <p className="font-body text-[10px] tracking-[0.2em] text-noir-silver/30 uppercase hidden md:block">
              {context.symbols}
            </p>
          )}
        </div>

        {/* Lyrics */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <p className="font-body text-[10px] tracking-[0.35em] text-noir-gold/50 uppercase">Lyrics</p>
            <button
              onClick={() => setLyricsOpen(!lyricsOpen)}
              className="font-body text-[10px] tracking-[0.2em] text-noir-silver/40 uppercase hover:text-noir-silver transition-colors"
            >
              {lyricsOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {lyricsOpen || track.hasLyrics ? (
            <div className={`overflow-hidden transition-all duration-500 ${lyricsOpen ? 'max-h-none' : 'max-h-48'}`}>
              <div className="border-l border-noir-gold/20 pl-6">
                <LyricsDisplay lyrics={track.lyrics} />
              </div>
              {!lyricsOpen && track.hasLyrics && (
                <div className="relative h-16 -mt-16 bg-gradient-to-t from-noir-black to-transparent pointer-events-none" />
              )}
            </div>
          ) : (
            <p className="font-heading italic text-sm text-noir-silver/25">— · —</p>
          )}

          {!lyricsOpen && track.hasLyrics && (
            <button
              onClick={() => setLyricsOpen(true)}
              className="mt-3 font-body text-[10px] tracking-[0.2em] text-noir-gold/50 uppercase hover:text-noir-gold transition-colors"
            >
              Read full lyrics
            </button>
          )}
        </div>

        {/* Music video */}
        <VideoSection track={track} />

        {/* Chapter nav */}
        <ChapterNav prev={prev} next={next} />
      </div>
    </div>
  )
}
