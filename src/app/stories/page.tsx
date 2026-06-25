import type { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import FeaturedStoryHero from '@/components/stories/FeaturedStoryHero'
import StoryGrid from '@/components/stories/StoryGrid'
import type { StoryListItem } from '@/components/stories/types'

export const metadata: Metadata = {
  title: 'Stories — NoiraCiel',
  description: 'A world of short stories, each one living beneath a song. Dark, editorial, cinematic short fiction from the NoiraCiel universe.',
}

// Art lives on R2 (public/ is emptied post-migration — see next.config.ts). We
// reference R2 by convention and let the image fall back to a gradient client-side.
const R2 = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

function numberWord(n: number): string {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']
  return words[n] ?? String(n)
}

// Parse optional YAML-ish frontmatter (category/featured) if a story adds it.
// TODO: assign real categories per story (frontmatter `category:`) to populate the
// filter row; until then categories are empty and the bar shows All + sort only.
function frontmatter(raw: string): { category: string | null; featured: boolean } {
  if (!raw.startsWith('---')) return { category: null, featured: false }
  const end = raw.indexOf('\n---', 3)
  if (end < 0) return { category: null, featured: false }
  const block = raw.slice(3, end)
  const cat = block.match(/^\s*category:\s*(.+)\s*$/m)?.[1]?.trim() ?? null
  const feat = /^\s*featured:\s*true\s*$/m.test(block)
  return { category: cat, featured: feat }
}

function getStories(): { stories: StoryListItem[]; featured: StoryListItem; categories: string[] } {
  const dir = path.join(process.cwd(), 'content', 'stories')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()

  let featuredSlug: string | null = null

  const stories: StoryListItem[] = files.map((f, i) => {
    const slug = f.replace('.md', '')
    const raw = fs.readFileSync(path.join(dir, f), 'utf8')
    const fm = frontmatter(raw)
    if (fm.featured && !featuredSlug) featuredSlug = slug

    const lines = raw.split('\n')
    const title = lines.find((l) => l.startsWith('# '))?.replace(/^# /, '').trim() ?? slug
    const subtitle = lines.find((l) => /^\*.+\*$/.test(l.trim()))?.replace(/^\*|\*$/g, '').trim() ?? ''
    const firstPara =
      lines.find((l) => {
        const t = l.trim()
        return t && !t.startsWith('#') && !t.startsWith('---') && !/^\*.+\*$/.test(t)
      })?.trim() ?? ''
    const excerpt = subtitle || (firstPara.length > 160 ? firstPara.slice(0, 157) + '…' : firstPara)

    const words = raw.split(/\s+/).filter(Boolean).length
    const readMins = Math.max(1, Math.round(words / 220))

    return {
      slug,
      title,
      excerpt,
      num: i + 1,
      readMins,
      thumbUrl: `${R2}/images/song-art/${slug}.jpg`,
      heroUrl: `${R2}/images/chapter-banners/${slug}.jpg`,
      category: fm.category,
    }
  })

  const featured = stories.find((s) => s.slug === featuredSlug) ?? stories[0]
  const categories = [...new Set(stories.map((s) => s.category).filter((c): c is string => !!c))].sort()

  return { stories, featured, categories }
}

export default function StoriesPage() {
  const { stories, featured, categories } = getStories()

  return (
    <div className="min-h-screen bg-noir-black">
      {/* Header */}
      <div className="pt-32 pb-12 px-6 text-center">
        <p className="font-body text-[10px] tracking-[0.5em] text-noir-gold/70 uppercase mb-5">
          NoiraCiel · Short Fiction
        </p>
        <h1 className="font-heading italic font-light text-noir-ivory mb-5" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
          Stories
        </h1>
        <p className="font-body text-sm text-noir-silver/60 max-w-md mx-auto leading-relaxed">
          {numberWord(stories.length)} stories. One world. Each lives beneath a song —
          read alone, or alongside the music.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
        {/* Featured hero */}
        <div className="mb-14">
          <FeaturedStoryHero story={featured} />
        </div>

        {/* Filter + grid */}
        <StoryGrid stories={stories} categories={categories} />

        <div className="text-center mt-24 pt-12 border-t border-noir-silver/10">
          <Link href="/" className="font-body text-[10px] tracking-[0.3em] uppercase text-noir-silver/40 hover:text-noir-ivory transition-colors">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  )
}
