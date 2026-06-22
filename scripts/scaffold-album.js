#!/usr/bin/env node
'use strict'
/**
 * scaffold-album.js
 * Registers a new album with one command instead of hand-editing
 * musicScanner.ts in three places and writing a new page.tsx from scratch.
 *
 * Safety design: the only edit to the shared musicScanner.ts is a pure
 * append to the DISCOGRAPHY array (already exported, SUBDIR_REGISTRY already
 * derives from it automatically). The generated page.tsx looks its entry up
 * via DISCOGRAPHY.find(), so unlike the 9 existing albums it needs no new
 * per-album named export (no FOO_META/FOO_SLUG constants) — meaning none of
 * the 9 existing albums' code paths are touched at all.
 *
 * Usage:
 *   node scripts/scaffold-album.js \
 *     --slug new-album --title "New Album Title" --genre "Genre · Tags" \
 *     --subdir "New_Album_Folder_Name" [--cover /images/song-art/x.jpg]
 */

const fs   = require('fs')
const path = require('path')

const ROOT          = path.join(__dirname, '..')
const SCANNER_PATH  = path.join(ROOT, 'src/lib/musicScanner.ts')

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? def : process.argv[i + 1]
}

function toPascalCase(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

const slug   = arg('slug')
const title  = arg('title')
const genre  = arg('genre', '')
const subdir = arg('subdir')
const cover  = arg('cover', '/images/album-cover.png')

if (!slug || !title) {
  console.error('Usage: node scripts/scaffold-album.js --slug <slug> --title <title> [--genre <genre>] [--subdir <Music subfolder>] [--cover <path>]')
  process.exit(1)
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`✗ slug "${slug}" must be lowercase letters/numbers/hyphens only`)
  process.exit(1)
}

const pageDir = path.join(ROOT, 'src/app/music', slug)
if (fs.existsSync(pageDir)) {
  console.error(`✗ src/app/music/${slug}/ already exists — aborting.`)
  process.exit(1)
}

// 1. Append to DISCOGRAPHY — pure addition, no existing entries touched.
const scanner = fs.readFileSync(SCANNER_PATH, 'utf-8')
if (scanner.includes(`slug:       '${slug}'`)) {
  console.error(`✗ "${slug}" already exists in DISCOGRAPHY — aborting.`)
  process.exit(1)
}

const newEntry = `  {
    slug:       '${slug}',
    href:       '/music/${slug}',
    meta:       { title: '${title}', artist: 'NoiraCiel', spotifyUrl: '', appleMusicUrl: '', youtubeUrl: '', totalDuration: 0, totalDurationFormatted: '' },
    coverSrc:   '${cover}',
    genre:      '${genre}',
    subdirName: ${subdir ? `'${subdir}'` : 'null'},
  },
]`

const marker = '\n]\n\n// Maps subdirectory name'
if (!scanner.includes(marker)) {
  console.error('✗ Could not find the DISCOGRAPHY closing marker in musicScanner.ts — file structure may have changed, aborting without editing anything.')
  process.exit(1)
}
fs.writeFileSync(SCANNER_PATH, scanner.replace(marker, `\n${newEntry}\n\n// Maps subdirectory name`))
console.log(`✓ Appended "${slug}" to DISCOGRAPHY in src/lib/musicScanner.ts`)

// 2. Generate the new album page from a template — a brand new file/route,
//    zero risk to any existing route.
fs.mkdirSync(pageDir, { recursive: true })

const genreList = JSON.stringify(genre.split('·').map((g) => g.trim()).filter(Boolean))

const pageContent = `import type { Metadata } from 'next'
import { scanMusicFolder, DISCOGRAPHY, formatAlbumDuration } from '@/lib/musicScanner'
import AlbumPage from '@/components/AlbumPage'
import { JsonLd } from '@/components/JsonLd'

export const dynamic = 'force-dynamic'

const ALBUM_SLUG = '${slug}'

export const metadata: Metadata = {
  title: '${title}',
  description: 'TODO: write a real description for ${title}.',
  alternates: { canonical: 'https://noiraciel.com/music/${slug}' },
  openGraph: {
    title: '${title}',
    description: 'TODO: write a real description for ${title}.',
    url: 'https://noiraciel.com/music/${slug}',
    type: 'music.album',
    images: [{ url: '${cover}', width: 1200, height: 1200, alt: '${title} album cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '${title}',
    description: 'TODO: write a real description for ${title}.',
    images: ['${cover}'],
  },
}

const albumSchema = {
  '@context': 'https://schema.org',
  '@type': 'MusicAlbum',
  name: '${title}',
  byArtist: { '@type': 'MusicGroup', name: 'NoiraCiel', url: 'https://noiraciel.com' },
  url: 'https://noiraciel.com/music/${slug}',
  image: 'https://noiraciel.com${cover}',
  description: 'TODO: write a real description for ${title}.',
  genre: ${genreList},
}

export default async function ${toPascalCase(slug)}Page() {
  const entry = DISCOGRAPHY.find((e) => e.slug === ALBUM_SLUG)!
  const catalogue = await scanMusicFolder()
  const tracks = catalogue.tracks.filter((t) => t.albumSlug === ALBUM_SLUG)
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0)

  return (
    <>
      <JsonLd data={albumSchema} />
      <AlbumPage
        catalogue={{
          ...catalogue,
          tracks,
          total: tracks.length,
          albumMeta: {
            ...entry.meta,
            totalDuration,
            totalDurationFormatted: totalDuration > 0 ? formatAlbumDuration(totalDuration) : '',
          },
        }}
        albumSlug={ALBUM_SLUG}
        crossLink={{ href: '/music', label: 'All Albums' }}
      />
    </>
  )
}
`

fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageContent)
console.log(`✓ Created src/app/music/${slug}/page.tsx`)

console.log(`\nDone. Remaining steps are creative/content decisions, not mechanical ones:`)
console.log(`  1. Write a real description in src/app/music/${slug}/page.tsx (marked TODO)`)
console.log(`  2. Upload audio to R2 under music/${subdir || '<subdir>'}/ so scanMusicFolder() finds tracks`)
console.log(`  3. Generate song-art/chapter-banners/etc. for the new tracks (existing generate-*.js scripts)`)
console.log(`  4. node scripts/snapshot-music-catalogue.js   — production reads the static snapshot,`)
console.log(`     not a live scan, so the new album shows 0 tracks until this regenerates it`)
console.log(`  5. node scripts/audit-song-pages.js   — check coverage of the new tracks`)
console.log(`  6. npm run build && pm2 restart noiraciel`)
