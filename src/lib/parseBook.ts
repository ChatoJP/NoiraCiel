import fs from 'fs'
import path from 'path'

export interface BookChapter {
  number: number
  songTitle: string
  epigraph: string
  paragraphs: string[]
}

export function parseBook(bookFile = 'book.md'): BookChapter[] {
  const bookPath = path.join(process.cwd(), 'content', bookFile)
  const content = fs.readFileSync(bookPath, 'utf-8')
  const chapters: BookChapter[] = []
  const sections = content.split(/^## /m)

  for (const section of sections) {
    if (!section.startsWith('Chapter')) continue

    const lines = section.split('\n')
    const titleLine = lines[0]
    const colonIdx = titleLine.indexOf(':')
    const number = chapters.length + 1
    const songTitle =
      colonIdx !== -1 ? titleLine.slice(colonIdx + 1).trim() : titleLine.trim()

    const body = lines.slice(1).join('\n').trim()
    const epigraphMatch = body.match(/^\*"([^*]+)"\*/)
    const epigraph = epigraphMatch ? epigraphMatch[1].trim() : ''

    let bodyText = epigraphMatch ? body.slice(epigraphMatch[0].length).trim() : body
    bodyText = bodyText.replace(/\n---\s*$/, '').trim()

    const paragraphs = bodyText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(
        (p) =>
          p &&
          !p.match(/^---/) &&
          !p.startsWith('*NoiraCiel') &&
          !p.startsWith('*The Life'),
      )

    chapters.push({ number, songTitle, epigraph, paragraphs })
  }

  return chapters
}
