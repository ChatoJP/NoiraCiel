'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function LikedPage() {
  const [slugs, setSlugs] = useState<string[]>([])

  useEffect(() => {
    const liked: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('nr-liked-')) {
        liked.push(key.replace('nr-liked-', ''))
      }
    }
    setSlugs(liked)
  }, [])

  const remove = (slug: string) => {
    localStorage.removeItem(`nr-liked-${slug}`)
    setSlugs(prev => prev.filter(s => s !== slug))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#F2EDE3', padding: '8rem 1.5rem 4rem', maxWidth: '720px', margin: '0 auto' }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.55rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '1rem' }}>
        Your Library
      </p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F2EDE3', lineHeight: 1.1, marginBottom: '3rem' }}>
        Liked Songs
      </h1>

      {slugs.length === 0 ? (
        <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', color: 'rgba(242,237,227,0.35)', fontSize: '1.1rem' }}>
          No liked songs yet — press ♡ in the player to save a song here.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {slugs.map(slug => (
            <div key={slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', border: '1px solid rgba(196,149,58,0.08)', background: 'rgba(196,149,58,0.02)' }}>
              <Link href={`/songs/${slug}`} style={{ textDecoration: 'none', fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(242,237,227,0.85)' }}>
                {slug.replace(/-/g, ' ')}
              </Link>
              <button
                onClick={() => remove(slug)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(196,149,58,0.5)', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.1em' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        <Link href="/music" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', textDecoration: 'none' }}>
          ← All Music
        </Link>
      </div>
    </div>
  )
}
