import type { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import StoryControls from '@/components/StoryControls'
import StoryThumb from '@/components/stories/StoryThumb'
import EntangledLinks from '@/components/EntangledLinks'

interface Props { params: Promise<{ slug: string }> }

// Art lives on R2 (public/ emptied post-migration). Reference by convention; the
// StoryThumb client component falls back to a gradient if an asset is missing.
const R2 = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

// Ordered story slugs + titles, shared by prev/next + related (deterministic).
function storyIndex(): { slug: string; title: string }[] {
  const dir = path.join(process.cwd(), 'content', 'stories')
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const slug = f.replace('.md', '')
      const raw = fs.readFileSync(path.join(dir, f), 'utf8')
      const title = raw.split('\n').find((l) => l.startsWith('# '))?.replace(/^# /, '').trim() ?? slug
      return { slug, title }
    })
}

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

  // Images come from R2 (StoryThumb degrades gracefully if one is missing).
  const bannerUrl = `${R2}/images/chapter-banners/${slug}.jpg`
  const songArtUrl = `${R2}/images/song-art/${slug}.jpg`

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

  // Ordered neighbours for prev/next + deterministic related stories.
  const index = storyIndex()
  const pos = index.findIndex((s) => s.slug === slug)
  const prev = pos > 0 ? index[pos - 1] : null
  const next = pos >= 0 && pos < index.length - 1 ? index[pos + 1] : null
  const related = [index[pos + 1], index[pos + 2], index[pos - 1]]
    .filter((s): s is { slug: string; title: string } => !!s && s.slug !== slug)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-noir-black" style={{ paddingBottom: audiobookUrl ? '80px' : '0' }}>
      <StoryControls audiobookUrl={audiobookUrl} title={story.title} slug={slug} songAudioUrl={songAudioUrl} />

      {/* Hero */}
      <div className="relative h-screen flex items-end justify-center overflow-hidden">
        <StoryThumb src={bannerUrl} priority opacity={0.6} />
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
        <div className="my-16 -mx-6">
          <div className="relative w-full overflow-hidden" style={{ height: '420px' }}>
            <StoryThumb src={songArtUrl} opacity={0.85} />
          </div>
          <div className="mt-4 px-6">
            <div className="w-8 h-px bg-noir-gold/30" />
          </div>
        </div>

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

        {/* Previous / Next story */}
        {(prev || next) && (
          <div className="mt-20 pt-10 border-t border-noir-silver/10 grid grid-cols-2 gap-4">
            <div>
              {prev && (
                <Link href={`/stories/${prev.slug}`} className="group block">
                  <p className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35 mb-1.5">← Previous</p>
                  <p className="font-heading italic text-base text-noir-ivory/65 group-hover:text-noir-gold/85 transition-colors leading-snug">{prev.title}</p>
                </Link>
              )}
            </div>
            <div className="text-right">
              {next && (
                <Link href={`/stories/${next.slug}`} className="group block">
                  <p className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/35 mb-1.5">Next →</p>
                  <p className="font-heading italic text-base text-noir-ivory/65 group-hover:text-noir-gold/85 transition-colors leading-snug">{next.title}</p>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Related reads (deterministic — neighbouring stories) */}
        {related.length > 0 && (
          <div className="mt-16 pt-12 border-t border-noir-silver/10">
            <p className="font-body text-[9px] tracking-[0.3em] text-t-accent/40 uppercase mb-6 text-center">More Stories</p>
            <div className="space-y-3">
              {related.map((s) => (
                <Link key={s.slug} href={`/stories/${s.slug}`}
                  className="group flex items-center gap-3 font-heading italic text-base text-noir-ivory/45 hover:text-t-accent/80 transition-colors">
                  <span className="w-4 h-px bg-noir-gold/30 flex-shrink-0 group-hover:w-6 transition-all duration-300" />
                  {s.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Entangled next doors */}
        <div className="mt-20 pt-12 border-t border-noir-silver/10">
          <EntangledLinks
            title="A beautiful next door"
            links={[
              { href: '/speaker', label: 'Ask the Speaker about this story', sublabel: 'A private reading of what it carries', kind: 'Speaker' },
              { href: '/worlds', label: 'Enter the world it belongs to', sublabel: 'Music, books and mood, connected', kind: 'Worlds' },
              { href: '/stories', label: 'Wander to another story', kind: 'Stories' },
            ]}
          />
        </div>

        {/* Footer nav */}
        <div className="mt-20 pt-12 border-t border-noir-silver/10 text-center">
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
