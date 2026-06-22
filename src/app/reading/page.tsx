'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ReadingPage() {
  const [bookmarks, setBookmarks] = useState<{ slug: string; title: string }[]>([])

  useEffect(() => {
    const items: { slug: string; title: string }[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('nr-bookmark-')) {
        const slug = key.replace('nr-bookmark-', '')
        const title = localStorage.getItem(key) ?? slug
        items.push({ slug, title })
      }
    }
    setBookmarks(items)
  }, [])

  const removeBookmark = (slug: string) => {
    localStorage.removeItem(`nr-bookmark-${slug}`)
    setBookmarks(bm => bm.filter(b => b.slug !== slug))
  }

  return (
    <div className="min-h-screen bg-noir-black">
      <div className="max-w-2xl mx-auto px-6 pt-32 pb-32">
        <p className="font-body text-[10px] tracking-[0.5em] text-noir-gold/70 uppercase mb-6">
          NoiraCiel · Your Reading List
        </p>
        <h1
          className="font-heading italic font-light text-noir-ivory mb-10"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
        >
          Bookmarked Stories
        </h1>

        {bookmarks.length === 0 ? (
          <div className="border-l border-t-accent/20 pl-6 py-4">
            <p className="font-heading italic text-base text-noir-silver/40">
              No bookmarks yet.
            </p>
            <p className="font-body text-xs text-noir-silver/25 mt-2">
              Press ◇ on any story page to save it here.
            </p>
            <Link href="/stories" className="inline-block mt-6 font-body text-[10px] tracking-[0.25em] uppercase text-t-accent/50 hover:text-t-accent transition-colors">
              Browse Stories →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map(b => (
              <div key={b.slug} className="group flex items-center justify-between gap-4 border-b border-noir-silver/8 pb-4">
                <Link
                  href={`/stories/${b.slug}`}
                  className="font-heading italic text-lg text-noir-ivory/70 hover:text-t-accent transition-colors"
                >
                  {b.title}
                </Link>
                <button
                  onClick={() => removeBookmark(b.slug)}
                  className="flex-shrink-0 font-body text-[9px] tracking-[0.2em] uppercase text-noir-silver/25 hover:text-noir-silver/60 transition-colors"
                  aria-label="Remove bookmark"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16">
          <Link href="/" className="font-body text-[10px] tracking-[0.3em] uppercase text-noir-silver/35 hover:text-noir-ivory transition-colors">
            ← Home
          </Link>
        </div>
      </div>
    </div>
  )
}
