'use client'

import { useRouter } from 'next/navigation'

const BOOK_HREFS = [
  '/book/the-life-lessons',
  '/book/jazz-sessions',
  '/book/blind-angel',
  '/book/whats-youre-made-of',
  '/book/bare-and-still-breathing',
  '/book/the-sacred-drift',
]

export default function RandomBookButton() {
  const router = useRouter()
  const go = () => {
    const href = BOOK_HREFS[Math.floor(Math.random() * BOOK_HREFS.length)]
    router.push(href)
  }
  return (
    <button
      onClick={go}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.65rem',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: 'rgba(196,149,58,0.75)',
        background: 'transparent',
        border: '1px solid rgba(196,149,58,0.25)',
        padding: '0.6rem 1.5rem',
        cursor: 'pointer',
        marginTop: '0.5rem',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,149,58,0.55)'; e.currentTarget.style.color = 'rgba(196,149,58,1)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,149,58,0.25)'; e.currentTarget.style.color = 'rgba(196,149,58,0.75)' }}
    >
      ◈ Open a Random Book
    </button>
  )
}
