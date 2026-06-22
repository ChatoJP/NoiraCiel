import type { Metadata } from 'next'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Short Stories — NoiraCiel',
  description: 'Short stories — one for each song. Each story lives beneath the music.',
}

function getStories() {
  const dir = path.join(process.cwd(), 'content', 'stories')
  const audioDir = path.join(process.cwd(), 'public', 'Audio', 'audiobook')
  const bannerDir = path.join(process.cwd(), 'public', 'images', 'chapter-banners')
  const songArtDir = path.join(process.cwd(), 'public', 'images', 'song-art')

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map((f, i) => {
      const slug = f.replace('.md', '')
      const raw = fs.readFileSync(path.join(dir, f), 'utf8')
      const title = raw.split('\n')[0].replace(/^# /, '').trim()
      const subtitleLine = raw.split('\n').find(l => /^\*.+\*$/.test(l.trim()))
      const subtitle = subtitleLine?.replace(/^\*|\*$/g, '').trim() ?? ''
      const hasBanner = fs.existsSync(path.join(bannerDir, `${slug}.jpg`))
      const hasSongArt = fs.existsSync(path.join(songArtDir, `${slug}.jpg`))
      const hasAudio = fs.existsSync(path.join(audioDir, `${slug}.mp3`))
      const imageUrl = hasBanner
        ? `/images/chapter-banners/${slug}.jpg`
        : hasSongArt
          ? `/images/song-art/${slug}.jpg`
          : null
      // G36: estimated read time
      const wordCount = raw.split(/\s+/).filter(Boolean).length
      const readMins = Math.max(1, Math.round(wordCount / 220))
      return { slug, title, subtitle, num: i + 1, imageUrl, hasAudio, readMins }
    })
}

export default function StoriesPage() {
  const stories = getStories()

  return (
    <div className="min-h-screen bg-noir-black">

      {/* Header */}
      <div className="pt-32 pb-20 px-6 text-center">
        <p className="font-body text-[10px] tracking-[0.5em] text-noir-gold/70 uppercase mb-5">
          NoiraCiel · Short Fiction
        </p>
        <h1 className="font-heading italic font-light text-noir-ivory mb-6" style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}>
          Stories
        </h1>
        <p className="font-body text-sm text-noir-silver/60 max-w-md mx-auto leading-relaxed">
          Each story is a world that lives beneath a song.
          Read alone, or alongside the music.
        </p>
        <div className="w-px h-16 bg-gradient-to-b from-noir-gold/50 to-transparent mx-auto mt-10" />
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {stories.map((story) => (
            <Link key={story.slug} href={`/stories/${story.slug}`} className="group block">
              <article
                className="relative overflow-hidden bg-noir-deep"
                style={{ aspectRatio: '4/3' }}
              >
                {story.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={story.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                    style={{ opacity: 0.7 }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a44] to-noir-black" />
                )}

                {/* Gradient for text legibility at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-noir-black via-noir-black/55 to-transparent" />
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-noir-black/40 to-transparent" />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />

                {/* Number */}
                <div className="absolute top-4 left-4">
                  <span className="font-body text-[9px] tracking-[0.4em] text-noir-gold/80 uppercase">
                    {String(story.num).padStart(2, '0')}
                  </span>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  {/* G36: read time */}
                  <span className="font-body text-[7px] tracking-[0.2em] uppercase text-noir-silver/50 bg-noir-black/40 px-1.5 py-0.5">
                    ~{story.readMins} min
                  </span>
                  {story.hasAudio && (
                    <span className="font-body text-[7px] tracking-[0.25em] uppercase text-noir-gold border border-noir-gold/40 px-2 py-0.5">
                      Audio
                    </span>
                  )}
                </div>

                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pt-10">
                  <h2 className="font-heading italic text-xl text-noir-ivory leading-tight mb-1.5 group-hover:text-noir-gold/90 transition-colors duration-300">
                    {story.title}
                  </h2>
                  {story.subtitle && (
                    <p className="font-body text-[10px] text-noir-silver/70 leading-relaxed line-clamp-2">
                      {story.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <div className="w-5 h-px bg-noir-gold/70" />
                    <span className="font-body text-[8px] tracking-[0.35em] uppercase text-noir-gold/80">Read</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="text-center mt-24 pt-12 border-t border-noir-silver/10">
          <Link href="/" className="font-body text-[10px] tracking-[0.3em] uppercase text-noir-silver/40 hover:text-noir-ivory transition-colors">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  )
}
