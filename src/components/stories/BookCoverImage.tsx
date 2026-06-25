'use client'

import { useState } from 'react'

/**
 * BookCoverImage — overlays a real R2 album cover on a book card. On load it adds
 * a dark scrim so the title/meta stay legible; on error it hides itself, revealing
 * the card's gradient cover design underneath (graceful fallback, never broken).
 */
export default function BookCoverImage({ src }: { src: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setOk(false)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* scrim for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-noir-black/90 via-noir-black/45 to-noir-black/65" />
    </>
  )
}
