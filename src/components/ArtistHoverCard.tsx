'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Props {
  src: string
  alt?: string
  className?: string
}

export default function ArtistHoverCard({ src, alt = 'NoiraCiel', className = '' }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={className}
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} />

      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(4,4,10,0.95)',
          border: '1px solid rgba(196,149,58,0.2)',
          backdropFilter: 'blur(8px)',
          padding: '0.75rem 1rem',
          minWidth: '180px',
          zIndex: 100,
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(242,237,227,0.88)', marginBottom: '0.25rem' }}>
            NoiraCiel
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.6)' }}>
            Atlantic Noir · Sea-Soul
          </p>
        </div>
      )}
    </div>
  )
}
