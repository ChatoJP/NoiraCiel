import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Pipeline logs live outside Music/ — Music/ itself is R2-only, this status
// dashboard only ever needed the small per-album logs/*.json, not the audio.
const ROOT = path.join(process.cwd(), 'data', 'pipeline-logs')

const ALBUMS = [
  { id: 'The_Velvet_Machine', label: 'The Velvet Machine' },
  { id: 'Still_We_Sail',      label: 'Still We Sail' },
]

const STAGES = [
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

export async function GET() {
  const albums = ALBUMS.map(({ id, label }) => {
    const statePath = path.join(ROOT, id, 'pipeline_state.json')
    let tracks: Record<string, unknown>[] = []

    if (fs.existsSync(statePath)) {
      const raw = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as Record<string, Record<string, unknown>>
      tracks = Object.entries(raw).map(([slug, entry]) => ({
        slug,
        number:  entry.number,
        title:   entry.title,
        stages:  Object.fromEntries(STAGES.map(s => [s.key, entry[s.key] ?? 'none'])),
        audio:   (entry.localAudioPaths as string[] | undefined)?.length ?? 0,
      }))
    }

    return { id, label, tracks }
  })

  return NextResponse.json({ albums, stages: STAGES, updatedAt: new Date().toISOString() })
}
