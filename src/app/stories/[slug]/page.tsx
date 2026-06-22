import type { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import StoryControls from '@/components/StoryControls'

interface Props { params: Promise<{ slug: string }> }

function parseStory(slug: string) {
  const filePath = path.join(process.cwd(), 'content', 'stories', `${slug}.md`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split('\n')

  const title = lines.find(l => l.startsWith('# '))?.replace(/^# /, '').trim() ?? ''
  const subtitle = lines.find(l => /^\*.+\*$/.test(l.trim()))?.replace(/^\*|\*$/g, '').trim() ?? ''

  const sepIdx = lines.findIndex(l => l.trim() === '---')
  const bodyLines = lines
    .slice(0, sepIdx > 0 ? sepIdx : undefined)
    .filter(l => !l.startsWith('#') && !/^\*.+\*$/.test(l.trim()))

  const paragraphs = bodyLines.join('\n').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)

  let closing = ''
  if (sepIdx > 0) {
    const closingLines = lines.slice(sepIdx + 1)
    const closingLine = closingLines.find(l => /^\*.+\*$/.test(l.trim()))
    closing = closingLine?.replace(/^\*|\*$/g, '').trim() ?? ''
  }

  return { title, subtitle, paragraphs, closing }
}

function imageExists(p: string) {
  return fs.existsSync(path.join(process.cwd(), 'public', p))
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), 'content', 'stories')
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({ slug: f.replace('.md', '') }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const story = parseStory(slug)
  if (!story) return {}
  return {
    title: `${story.title} — NoiraCiel`,
    description: story.subtitle,
  }
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params
  const story = parseStory(slug)
  if (!story) notFound()

  const bannerUrl = imageExists(`images/chapter-banners/${slug}.jpg`)
    ? `/images/chapter-banners/${slug}.jpg`
    : null

  const songArtUrl = imageExists(`images/song-art/${slug}.jpg`)
    ? `/images/song-art/${slug}.jpg`
    : bannerUrl

  const audiobookUrl = imageExists(`Audio/audiobook/${slug}.mp3`)
    ? `/Audio/audiobook/${slug}.mp3`
    : null

  // G39: background song audio URL
  const songAudioUrl = imageExists(`Audio/${slug}.mp3`)
    ? `/Audio/${slug}.mp3`
    : null

  const mid = Math.ceil(story.paragraphs.length / 2)
  const firstHalf = story.paragraphs.slice(0, mid)
  const secondHalf = story.paragraphs.slice(mid)

  return (
    <div className="min-h-screen bg-noir-black" style={{ paddingBottom: audiobookUrl ? '80px' : '0' }}>
      <StoryControls audiobookUrl={audiobookUrl} title={story.title} slug={slug} songAudioUrl={songAudioUrl} />

      {/* Hero */}
      <div className="relative h-screen flex items-end justify-center overflow-hidden">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a44] to-noir-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/30 to-transparent" />

        {/* Hero text */}
        <div className="relative z-10 text-center max-w-2xl px-8 pb-24">
          <p className="font-body text-[10px] tracking-[0.5em] text-noir-gold/70 uppercase mb-6">
            NoiraCiel · Short Story
          </p>
          <h1
            className="font-heading italic font-light text-noir-ivory leading-none mb-6"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)', letterSpacing: '-0.02em' }}
          >
            {story.title}
          </h1>
          {story.subtitle && (
            <p className="font-heading italic text-base text-noir-silver/60">
              {story.subtitle}
            </p>
          )}
          <div className="w-12 h-px bg-noir-gold/40 mx-auto mt-8" />
          <div className="mt-10 flex flex-col items-center gap-2 opacity-50">
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-noir-silver/70" />
          </div>
        </div>
      </div>

      {/* Prose */}
      <article className="max-w-xl mx-auto px-6 py-20">

        {/* Back link — in document flow, visible below hero */}
        <div className="mb-14 flex items-center gap-3">
          <Link
            href="/stories"
            className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/50 hover:text-noir-ivory transition-colors duration-200 flex items-center gap-2"
          >
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M11 4H1M1 4L4 1M1 4L4 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            All Stories
          </Link>
        </div>

        {/* First half */}
        {firstHalf.map((para, i) => {
          if (i === 0) {
            const first = para.charAt(0)
            const rest = para.slice(1)
            return (
              <p key={i} className="story-para font-heading text-lg text-noir-ivory/90 leading-relaxed mb-8">
                <span
                  className="float-left font-heading italic text-noir-gold leading-none mr-3 mt-1"
                  style={{ fontSize: '4.5rem', lineHeight: '3.5rem' }}
                >
                  {first}
                </span>
                {rest}
              </p>
            )
          }
          return (
            <p key={i} className="story-para font-heading text-lg text-noir-ivory/85 leading-relaxed mb-8">
              {para}
            </p>
          )
        })}

        {/* Mid-story image — contained within article width, no overflow */}
        {songArtUrl && (
          <div className="my-16 -mx-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={songArtUrl}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: '480px', opacity: 0.85 }}
            />
            <div className="mt-4 px-6">
              <div className="w-8 h-px bg-noir-gold/30" />
            </div>
          </div>
        )}

        {/* Second half */}
        {secondHalf.map((para, i) => (
          <p key={i} className="story-para font-heading text-lg text-noir-ivory/85 leading-relaxed mb-8">
            {para}
          </p>
        ))}

        {/* Closing reflection */}
        {story.closing && (
          <div className="mt-16 pt-12 border-t border-noir-silver/10 text-center">
            <div className="w-6 h-px bg-noir-gold/30 mx-auto mb-8" />
            <p className="font-heading italic text-base text-noir-gold/70 leading-relaxed max-w-sm mx-auto">
              {story.closing}
            </p>
            <div className="w-6 h-px bg-noir-gold/30 mx-auto mt-8" />
          </div>
        )}

        {/* G40: Related reads */}
        {(() => {
          const dir = require('path').join(process.cwd(), 'content', 'stories')
          const allSlugs: string[] = require('fs').readdirSync(dir)
            .filter((f: string) => f.endsWith('.md'))
            .map((f: string) => f.replace('.md', ''))
            .filter((s: string) => s !== slug)
          const related = allSlugs.sort(() => 0.5 - Math.random()).slice(0, 3)
          return related.length > 0 ? (
            <div className="mt-20 pt-12 border-t border-noir-silver/10">
              <p className="font-body text-[9px] tracking-[0.3em] text-t-accent/40 uppercase mb-6 text-center">More Stories</p>
              <div className="space-y-3">
                {related.map((s: string) => (
                  <Link key={s} href={`/stories/${s}`}
                    className="group flex items-center gap-3 font-heading italic text-base text-noir-ivory/45 hover:text-t-accent/80 transition-colors">
                    <span className="w-4 h-px bg-noir-gold/30 flex-shrink-0 group-hover:w-6 transition-all duration-300" />
                    {s.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Link>
                ))}
              </div>
            </div>
          ) : null
        })()}

        {/* Footer nav */}
        <div className="mt-24 pt-12 border-t border-noir-silver/10 text-center">
          <Link
            href="/stories"
            className="font-body text-[10px] tracking-[0.3em] uppercase text-noir-silver/40 hover:text-noir-ivory transition-colors"
          >
            ← All Stories
          </Link>
        </div>
      </article>
    </div>
  )
}
