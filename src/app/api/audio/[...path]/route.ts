import path from 'path'
import fs from 'fs'
import { getMimeType } from '@/lib/formatters'

const MUSIC_DIR = path.join(process.cwd(), 'Music')

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params
  const filename = decodeURIComponent(pathParts.join('/'))
  const filePath = path.resolve(path.join(MUSIC_DIR, filename))

  if (!filePath.startsWith(MUSIC_DIR)) {
    return new Response('Forbidden', { status: 403 })
  }

  if (!fs.existsSync(filePath)) {
    return new Response('Not Found', { status: 404 })
  }

  const stat = fs.statSync(filePath)
  const fileSize = stat.size
  const contentType = getMimeType(filename)
  const range = request.headers.get('range')

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunkSize = end - start + 1

    const nodeStream = fs.createReadStream(filePath, { start, end })
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk))
        nodeStream.on('end', () => controller.close())
        nodeStream.on('error', (err) => controller.error(err))
      },
      cancel() { nodeStream.destroy() },
    })

    return new Response(webStream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': contentType,
      },
    })
  }

  const nodeStream = fs.createReadStream(filePath)
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', (err) => controller.error(err))
    },
    cancel() { nodeStream.destroy() },
  })

  return new Response(webStream, {
    headers: {
      'Content-Length': fileSize.toString(),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
