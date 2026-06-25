/** Shared shape for a story in listing/card/grid views. */
export interface StoryListItem {
  slug: string
  title: string
  excerpt: string
  num: number
  readMins: number
  thumbUrl: string | null   // R2 song-art (card thumbnail)
  heroUrl: string | null    // R2 chapter-banner (wide hero)
  category: string | null
}
