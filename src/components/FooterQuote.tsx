'use client'

import { useState, useEffect } from 'react'

const QUOTES = [
  "Every song is a letter you wrote before you knew who you were writing to.",
  "The silence between notes is where the truth lives.",
  "Atlantic Noir: the sound of memory, salt, and what we carry.",
  "Some songs don't end — they just drift below the surface.",
  "Music is the only language that doesn't require translation into feeling.",
  "The dark edge of memory is where the best songs come from.",
  "If a song makes you feel less alone, it has done its work.",
  "Every chord is a question. Every lyric is an attempt at an answer.",
]

export default function FooterQuote() {
  const [quote, setQuote] = useState(QUOTES[0])

  useEffect(() => {
    // Rotate daily based on day of year
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    setQuote(QUOTES[day % QUOTES.length])
  }, [])

  return (
    <p className="font-heading italic text-sm text-noir-silver/35 mt-3 max-w-xs">
      {quote}
    </p>
  )
}
