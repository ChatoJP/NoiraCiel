import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Episode {
  id: string
  title: string
  slug: string
  description: string
  audioUrl: string | null
  duration: string
  publishedAt: string
  coverUrl: string
}

function getEpisodes(): Episode[] {
  const filePath = path.join(process.cwd(), 'public', 'podcast.json')
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Episode[]
  } catch {
    return []
  }
}

function durationToSeconds(dur: string): number {
  const parts = dur.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

export async function GET() {
  const episodes = getEpisodes()
  const base = 'https://noiraciel.com'

  const items = episodes.map(ep => {
    const pubDate = new Date(ep.publishedAt + 'T12:00:00Z').toUTCString()
    const audioSrc = ep.audioUrl ? `${base}${ep.audioUrl}` : ''
    const secs = durationToSeconds(ep.duration)
    return `
    <item>
      <title><![CDATA[${ep.title}]]></title>
      <description><![CDATA[${ep.description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${base}/podcast/${ep.slug}</guid>
      <link>${base}/podcast/${ep.slug}</link>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:duration>${secs}</itunes:duration>
      <itunes:image href="${base}${ep.coverUrl}" />
      ${audioSrc ? `<enclosure url="${audioSrc}" type="audio/mpeg" length="0" />` : ''}
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NoiraCiel — Audio Commentary</title>
    <link>${base}/podcast</link>
    <atom:link href="${base}/api/podcast.xml" rel="self" type="application/rss+xml" />
    <description>Song commentaries, essays and conversations from NoiraCiel. Atlantic Noir music, literature and memory.</description>
    <language>en-gb</language>
    <copyright>© 2026 NoiraCiel</copyright>
    <itunes:author>NoiraCiel</itunes:author>
    <itunes:image href="${base}/images/album-cover.png" />
    <itunes:category text="Music" />
    <itunes:explicit>false</itunes:explicit>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
