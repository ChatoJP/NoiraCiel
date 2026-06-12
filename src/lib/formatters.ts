export function formatDuration(seconds: number | null): string {
  if (!seconds || isNaN(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function parseFilename(filename: string): {
  title: string
  trackNumber: number | null
  albumCode: string | null
} {
  const withoutExt = filename.replace(/\.(wav|mp3|flac|aiff|ogg|m4a)$/i, '')

  // Pattern: hd_1 - Title or hd_6- Title (with or without space before dash)
  const prefixMatch = withoutExt.match(/^([a-z]+)_(\d+)\s*-\s*(.+)$/i)
  if (prefixMatch) {
    return {
      albumCode: prefixMatch[1].toUpperCase(),
      trackNumber: parseInt(prefixMatch[2], 10),
      title: prefixMatch[3].trim(),
    }
  }

  // Pattern: 01 - Title or 01. Title
  const numMatch = withoutExt.match(/^(\d+)[\s._-]+(.+)$/)
  if (numMatch) {
    return {
      albumCode: null,
      trackNumber: parseInt(numMatch[1], 10),
      title: numMatch[2].trim(),
    }
  }

  return { albumCode: null, trackNumber: null, title: withoutExt.trim() }
}

export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    flac: 'audio/flac',
    aiff: 'audio/aiff',
    aif: 'audio/aiff',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
  }
  return types[ext || ''] || 'audio/mpeg'
}

export function getAudioFormat(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'AUDIO'
}
