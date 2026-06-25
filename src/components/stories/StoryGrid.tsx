'use client'

import { useMemo, useState } from 'react'
import StoryCard from './StoryCard'
import type { StoryListItem } from './types'

type Sort = 'order' | 'az' | 'short'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'order', label: 'Order' },
  { id: 'az', label: 'A–Z' },
  { id: 'short', label: 'Short reads' },
]

/**
 * StoryGrid — the filter/sort bar + responsive premium card grid.
 *
 * Category pills appear only for categories that actually exist in the content
 * (story frontmatter `category:`), so the row is honest and grows as categories
 * are added. Sort controls sit on the right.
 */
export default function StoryGrid({
  stories,
  categories,
}: {
  stories: StoryListItem[]
  categories: string[]
}) {
  const [cat, setCat] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('order')

  const visible = useMemo(() => {
    let list = cat === 'all' ? stories : stories.filter((s) => s.category === cat)
    list = [...list]
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title))
    else if (sort === 'short') list.sort((a, b) => a.readMins - b.readMins)
    else list.sort((a, b) => a.num - b.num)
    return list
  }, [stories, cat, sort])

  return (
    <div>
      {/* Filter / sort bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-noir-silver/10">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Pill active={cat === 'all'} onClick={() => setCat('all')}>All Stories</Pill>
          {categories.map((c) => (
            <Pill key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Pill>
          ))}
        </div>
        <div className="flex items-center gap-x-4">
          <span className="font-body text-[8px] tracking-[0.3em] uppercase text-noir-silver/30">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`font-body text-[9px] tracking-[0.25em] uppercase transition-colors ${
                sort === s.id ? 'text-noir-gold/90' : 'text-noir-silver/35 hover:text-noir-silver/65'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="font-body text-[9px] tracking-[0.3em] uppercase text-noir-silver/30 mb-6">
        {visible.length} {visible.length === 1 ? 'story' : 'stories'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {visible.map((s) => (
          <StoryCard key={s.slug} story={s} />
        ))}
      </div>
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`font-body text-[10px] tracking-[0.25em] uppercase transition-colors ${
        active ? 'text-noir-gold' : 'text-noir-silver/40 hover:text-noir-silver/70'
      }`}
    >
      {children}
    </button>
  )
}
