'use client'

import { useState } from 'react'

/**
 * StoryThumb — an image that loads a NoiraCiel art asset from R2 and falls back
 * to an elegant gradient if the asset is missing.
 *
 * Story/album art lives on Cloudflare R2 (the public/ dirs are emptied after the
 * media migration — see next.config.ts redirects). So we reference R2 by URL and
 * degrade gracefully client-side rather than checking the local filesystem.
 */

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #0d1b2a 0%, #1a2a44 45%, #080810 100%)'

export default function StoryThumb({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  opacity = 0.7,
  priority = false,
}: {
  src: string | null
  alt?: string
  className?: string
  imgClassName?: string
  opacity?: number
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const showImg = src && !failed

  return (
    <div className={`absolute inset-0 ${className}`} style={!showImg ? { background: FALLBACK_GRADIENT } : undefined}>
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${imgClassName}`}
          style={{ opacity }}
        />
      )}
    </div>
  )
}
