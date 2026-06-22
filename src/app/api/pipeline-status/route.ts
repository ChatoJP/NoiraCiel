import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ROOT      = process.cwd()
const LOGS_ROOT = path.join(ROOT, 'data', 'pipeline-logs')

// Albums with rich, per-stage production tracking (from the original content
// pipeline) — surfaced alongside the universal asset-coverage view below,
// not replaced by it.
const DETAILED_ALBUMS = [
  { id: 'The_Velvet_Machine', label: 'The Velvet Machine' },
  { id: 'Still_We_Sail',      label: 'Still We Sail' },
]

const DETAILED_STAGES = [
  { key: 'lyricsStatus',    label: 'Lyrics'     },
  { key: 'musicStatus',     label: 'Music'      },
  { key: 'storiesStatus',   label: 'Stories'    },
  { key: 'scoresStatus',    label: 'Scores'     },
  { key: 'visualsStatus',   label: 'Visuals'    },
  { key: 'bookStatus',      label: 'Book'       },
  { key: 'transcribeStatus',label: 'Transcribe' },
  { key: 'karaokeStatus',   label: 'Karaoke'    },
  { key: 'publishStatus',   label: 'Publish'    },
]

export const dynamic = 'force-dynamic'

function isAuthorized(req: Request) {
  const token = process.env.PIPELINE_ADMIN_TOKEN
  if (!token) return false
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${token}`
}

function loadManifest(relPath: string): Set<string> {
  try {
    const list = JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf-8')) as string[]
    return new Set(list)
  } catch {
    return new Set()
  }
}

function loadJSON<T>(relPath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf-8')) as T
  } catch {
    return fallback
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const catalogue = loadJSON<{ tracks: Array<Record<string, unknown>> }>('public/music-catalogue.json', { tracks: [] })
  const audiobookSlugs   = loadManifest('public/Audio/audiobook-manifest.json')
  const storyPdfSlugs    = loadManifest('public/Books/stories-manifest.json')
  const cinemagraphSlugs = loadManifest('public/generated/kie/cinemagraphs-manifest.json')
  const commentary       = loadJSON<Record<string, string>>('public/directors-cut-commentary.json', {})

  // Universal asset-coverage view — every album, every track, same checks
  // audit-song-pages.js uses.
  const albumGroups = new Map<string, Array<Record<string, unknown>>>()
  for (const t of catalogue.tracks) {
    const key = (t.albumSlug as string) || 'main'
    if (!albumGroups.has(key)) albumGroups.set(key, [])
    albumGroups.get(key)!.push(t)
  }

  const coverage = Array.from(albumGroups.entries()).map(([albumSlug, tracks]) => ({
    albumSlug,
    trackCount: tracks.length,
    tracks: tracks.map((t) => {
      const slug = t.slug as string
      return {
        slug,
        title: t.title,
        trackNumber: t.trackNumber,
        songArt:       Boolean(t.songArtUrl),
        chapterBanner: Boolean(t.chapterBannerUrl),
        lyricVideo:    Boolean(t.lyricVideoUrl),
        musicVideo:    Boolean(t.musicVideoUrl),
        cinemagraph:   cinemagraphSlugs.has(slug),
        ghostPerformance: Boolean(t.ghostPerformance),
        story:         fs.existsSync(path.join(ROOT, 'content/stories', `${slug}.md`)),
        storyPdf:      storyPdfSlugs.has(slug),
        audiobook:     audiobookSlugs.has(slug),
        score:         fs.existsSync(path.join(ROOT, 'public/Books/scores', slug, 'manifest.json')),
        commentary:    Boolean(commentary[slug]),
      }
    }),
  }))

  // Detailed per-stage view for the 2 albums that still have it — additive,
  // keyed by track slug so the UI can merge it into the coverage rows above.
  const detailed = DETAILED_ALBUMS.map(({ id, label }) => {
    const statePath = path.join(LOGS_ROOT, id, 'pipeline_state.json')
    let tracks: Record<string, unknown>[] = []
    if (fs.existsSync(statePath)) {
      const raw = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as Record<string, Record<string, unknown>>
      tracks = Object.entries(raw).map(([slug, entry]) => ({
        slug,
        number: entry.number,
        title:  entry.title,
        stages: Object.fromEntries(DETAILED_STAGES.map((s) => [s.key, entry[s.key] ?? 'none'])),
      }))
    }
    return { id, label, tracks }
  })

  return NextResponse.json({
    coverage,
    detailed,
    detailedStages: DETAILED_STAGES,
    totalTracks: catalogue.tracks.length,
    updatedAt: new Date().toISOString(),
  })
}
