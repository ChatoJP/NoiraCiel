'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CardSkeleton } from '@/components/Skeleton'

// G42: All songs with synced lyrics
const SONG_SLUGS = [
  'always-in-your-corner','as-long-as-youre-okay','borrowed-time','free-men-tell-the-truth',
  'good-things-grow-slow','i-never-knew-any-other-way','if-we-cant-say-the-hard-truths',
  'it-was-already-there','leave-a-light-on','maybe-i-was-wrong','side-by-side','still-worth-it',
  'the-empty-chair','the-house-we-couldnt-leave','the-roots-we-cannot-see','who-wins-if-i-win','why',
  'blood-on-the-hallelujah','carry-you-home','its-not-always-easy','keep-a-chair-for-you',
  'mercy-wears-a-black-coat','the-heart-comes-home-at-night','the-river-knows-your-name',
  'the-truth-has-teeth','the-woman-beside-the-fire',
  'noiraciel-angel-of-darkness','noiraciel-blind-halo','noiraciel-crown-of-fire',
  'noiraciel-fallen-without-fear','noiraciel-the-last-prayer','noiraciel-when-angels-go-to-war',
  'still-we-sail','the-velvet-machine',
]

// G45: Mood shortcuts
const MOOD_PILLS = [
  { label: 'Missing someone', text: "I'm missing someone I can't reach." },
  { label: 'Need courage', text: "I need the courage to keep going." },
  { label: 'Feeling lost', text: "I feel lost and I don't know which way to go." },
  { label: 'Finding peace', text: "I'm searching for some peace and quiet inside." },
  { label: 'Late night', text: "It's late and the silence is getting to me." },
  { label: 'Grateful', text: "I feel grateful for the small things today." },
]

interface SongMatch {
  slug: string
  title: string
  reason: string
}

interface DiscoverResult {
  matches: SongMatch[]
  reflection: string
}

const GOLD = '#C4953A'
const IVORY = 'rgba(242, 237, 227, 0.9)'
const BG = '#080810'

export default function DiscoverPage() {
  const [feeling, setFeeling] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiscoverResult | null>(null)
  const [error, setError] = useState(false)
  const [lyricQuery, setLyricQuery] = useState('')
  const router = useRouter()

  // G42: surprise me
  const surpriseMe = () => {
    const slug = SONG_SLUGS[Math.floor(Math.random() * SONG_SLUGS.length)]
    router.push(`/songs/${slug}`)
  }

  // G43: basic title search from slug
  const lyricResults = lyricQuery.trim().length > 1
    ? SONG_SLUGS.filter(s => s.includes(lyricQuery.toLowerCase().replace(/\s+/g, '-')))
        .map(s => ({ slug: s, title: s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }))
    : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feeling.trim()) return

    setLoading(true)
    setResult(null)
    setError(false)

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeling }),
      })

      if (!res.ok) throw new Error('Request failed')

      const data: DiscoverResult = await res.json()
      setResult(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: BG,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 24px 80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '672px' }}>
        {/* Header */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: IVORY,
            margin: '0 0 12px',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}
        >
          What are you going through?
        </h1>

        <p
          style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '0.85rem',
            color: `${GOLD}99`,
            margin: '0 0 24px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Tell us in a sentence. We&rsquo;ll find the right song.
        </p>

        {/* G45: Mood shortcuts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {MOOD_PILLS.map(pill => (
            <button
              key={pill.label}
              onClick={() => setFeeling(pill.text)}
              style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '0.75rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: feeling === pill.text ? GOLD : `${GOLD}77`,
                background: feeling === pill.text ? `${GOLD}12` : 'transparent',
                border: `1px solid ${feeling === pill.text ? `${GOLD}55` : `${GOLD}28`}`,
                borderRadius: '2px',
                padding: '5px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* G42: Surprise me + G43: Lyric search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button
            onClick={surpriseMe}
            style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: GOLD,
              background: 'transparent',
              border: `1px solid ${GOLD}44`,
              borderRadius: '2px',
              padding: '7px 18px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            ✦ Surprise Me
          </button>
          <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
            <input
              type="text"
              value={lyricQuery}
              onChange={e => setLyricQuery(e.target.value)}
              placeholder="Search by title or phrase…"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${GOLD}22`,
                padding: '7px 14px',
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '0.8rem',
                color: 'rgba(242,237,227,0.8)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {lyricResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: '#080810', border: `1px solid ${GOLD}22`,
                borderTop: 'none', maxHeight: '160px', overflowY: 'auto',
              }}>
                {lyricResults.map(r => (
                  <Link key={r.slug} href={`/songs/${r.slug}`}
                    style={{ display: 'block', padding: '8px 14px', color: 'rgba(242,237,227,0.7)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                      textDecoration: 'none', borderBottom: `1px solid ${GOLD}11` }}
                    onClick={() => setLyricQuery('')}
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            rows={7}
            placeholder="I've been thinking about my father lately..."
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid rgba(196, 149, 58, 0.25)`,
              borderRadius: '4px',
              padding: '18px 20px',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '1rem',
              color: IVORY,
              lineHeight: 1.65,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = GOLD
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(196, 149, 58, 0.25)'
            }}
          />

          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              type="submit"
              disabled={loading || !feeling.trim()}
              style={{
                fontFamily: "'DM Sans', 'Inter', sans-serif",
                fontSize: '0.875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: loading || !feeling.trim() ? `${GOLD}55` : GOLD,
                backgroundColor: 'transparent',
                border: `1px solid ${loading || !feeling.trim() ? `${GOLD}33` : GOLD}`,
                borderRadius: '2px',
                padding: '10px 24px',
                cursor: loading || !feeling.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading && feeling.trim()) {
                  e.currentTarget.style.backgroundColor = GOLD
                  e.currentTarget.style.color = BG
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = loading || !feeling.trim() ? `${GOLD}55` : GOLD
              }}
            >
              {loading ? 'Listening…' : 'Find my songs →'}
            </button>

            {/* Loading dots */}
            {loading && (
              <LoadingDots />
            )}
          </div>
        </form>

        {/* G82: Skeleton while loading */}
        {loading && (
          <div style={{ marginTop: '56px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ padding: '1rem', border: '1px solid rgba(196,149,58,0.08)', background: 'rgba(196,149,58,0.02)' }}>
                <CardSkeleton />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p
            style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '0.9rem',
              color: 'rgba(196, 149, 58, 0.55)',
              marginTop: '32px',
              fontStyle: 'italic',
            }}
          >
            Something went quiet. Try again.
          </p>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{ marginTop: '56px' }}>
            {/* Reflection */}
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.25rem',
                fontStyle: 'italic',
                color: `${IVORY.replace('0.9', '0.75')}`,
                lineHeight: 1.75,
                margin: '0 0 48px',
                paddingLeft: '16px',
                borderLeft: `1px solid ${GOLD}44`,
              }}
            >
              {result.reflection}
            </p>

            {/* Song Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {result.matches.map((song) => (
                <SongCard key={song.slug} song={song} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: GOLD,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  )
}

function SongCard({ song }: { song: SongMatch }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={`/songs/${song.slug}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '20px 24px',
          backgroundColor: hovered ? 'rgba(196, 149, 58, 0.04)' : 'rgba(255, 255, 255, 0.02)',
          borderLeft: `2px solid ${hovered ? GOLD : 'rgba(196, 149, 58, 0.2)'}`,
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          borderRight: '1px solid rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '2px',
          transition: 'all 0.22s ease',
          boxShadow: hovered ? `-3px 0 18px ${GOLD}18` : 'none',
          cursor: 'pointer',
        }}
      >
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '1.4rem',
            fontWeight: 400,
            color: IVORY,
            margin: '0 0 8px',
            letterSpacing: '0.01em',
          }}
        >
          {song.title}
        </h3>

        <p
          style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '0.78rem',
            color: 'rgba(180, 175, 168, 0.6)',
            margin: '0 0 14px',
            lineHeight: 1.6,
          }}
        >
          {song.reason}
        </p>

        <span
          style={{
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: `${GOLD}99`,
          }}
        >
          Listen →
        </span>
      </div>
    </Link>
  )
}
