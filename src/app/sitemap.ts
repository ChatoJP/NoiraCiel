import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { scanMusicFolder } from '@/lib/musicScanner'

const BASE = 'https://noiraciel.com'
const NOW = new Date()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalogue = await scanMusicFolder()

  const storiesDir = path.join(process.cwd(), 'content', 'stories')
  const storySlugs: string[] = fs.existsSync(storiesDir)
    ? fs.readdirSync(storiesDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''))
    : []

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: NOW, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/music`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/music/the-life-lessons`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE}/music/jazz-sessions`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/music/blind-angel`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/book`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/book/the-life-lessons`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/book/jazz-sessions`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/book/blind-angel`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/stories`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/objects`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/scholarship`, lastModified: NOW, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/join`, lastModified: NOW, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const songRoutes: MetadataRoute.Sitemap = catalogue.tracks.map(track => ({
    url: `${BASE}/songs/${track.slug}`,
    lastModified: NOW,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const storyRoutes: MetadataRoute.Sitemap = storySlugs.map(slug => ({
    url: `${BASE}/stories/${slug}`,
    lastModified: NOW,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  return [...staticRoutes, ...songRoutes, ...storyRoutes]
}
