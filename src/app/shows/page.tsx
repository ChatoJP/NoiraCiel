import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import ShowCountdown from '@/components/ShowCountdown'

export const metadata: Metadata = {
  title: 'Live Shows — NoiraCiel',
  description: 'See NoiraCiel live. Upcoming concerts, intimate performances and special events.',
}

interface Show {
  id: string
  date: string
  venue: string
  city: string
  country: string
  description: string
  ticketUrl: string | null
  status: 'upcoming' | 'sold-out' | 'cancelled' | 'past'
}

function getShows(): Show[] {
  const filePath = path.join(process.cwd(), 'public', 'shows.json')
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Show[]
  } catch {
    return []
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    day: d.toLocaleDateString('en-GB', { day: '2-digit' }),
    month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    year: d.getFullYear(),
    full: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export default function ShowsPage() {
  const shows = getShows()
  const upcoming = shows.filter(s => s.status !== 'past' && s.status !== 'cancelled')
  const past = shows.filter(s => s.status === 'past')

  return (
    <main className="min-h-screen bg-[#080810] pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-20">
          <p style={{ fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.3em', fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(196,149,58,0.5)', marginBottom: '1rem' }}>
            Live
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 300, color: 'rgba(242,237,227,0.92)', lineHeight: 1.05, marginBottom: '1.5rem' }}>
            Shows
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: 'rgba(200,196,190,0.55)', maxWidth: '44ch', lineHeight: 1.7 }}>
            Intimate performances. Full-band evenings. Each show is its own chapter.
          </p>
        </div>

        {/* G70: Countdown to next show */}
        {upcoming.length > 0 && (
          <ShowCountdown
            showDate={upcoming[0].date}
            showName={`${upcoming[0].venue}, ${upcoming[0].city}`}
          />
        )}

        {/* Upcoming shows */}
        {upcoming.length === 0 ? (
          <div style={{ padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontStyle: 'italic', color: 'rgba(242,237,227,0.35)' }}>
              No upcoming shows announced yet — sign up for news below.
            </p>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {upcoming.map((show) => {
              const d = formatDate(show.date)
              const isSoldOut = show.status === 'sold-out'
              return (
                <div key={show.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '2.5rem 0', display: 'grid', gridTemplateColumns: '5rem 1fr auto', gap: '2rem', alignItems: 'start' }}>

                  {/* Date block */}
                  <div style={{ textAlign: 'center', paddingTop: '0.25rem' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2.5rem', fontWeight: 300, color: 'rgba(196,149,58,0.85)', lineHeight: 1 }}>
                      {d.day}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(196,149,58,0.5)', marginTop: '0.25rem' }}>
                      {d.month}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(200,196,190,0.3)', marginTop: '0.15rem' }}>
                      {d.year}
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.5rem', fontWeight: 400, color: 'rgba(242,237,227,0.88)', marginBottom: '0.25rem' }}>
                      {show.venue}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'rgba(196,149,58,0.6)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      {show.city}, {show.country}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(200,196,190,0.5)', lineHeight: 1.6, maxWidth: '50ch' }}>
                      {show.description}
                    </div>
                  </div>

                  {/* Ticket button */}
                  <div style={{ paddingTop: '0.25rem' }}>
                    {isSoldOut ? (
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.3)', border: '1px solid rgba(200,196,190,0.15)', padding: '0.5rem 1rem', display: 'inline-block' }}>
                        Sold Out
                      </span>
                    ) : show.ticketUrl ? (
                      <a href={show.ticketUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.9)', border: '1px solid rgba(196,149,58,0.4)', padding: '0.5rem 1rem', display: 'inline-block', textDecoration: 'none', transition: 'all 0.2s' }}>
                        Tickets →
                      </a>
                    ) : (
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.4)', border: '1px solid rgba(196,149,58,0.15)', padding: '0.5rem 1rem', display: 'inline-block' }}>
                        TBA
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stay notified */}
        <div style={{ marginTop: '5rem', padding: '2.5rem', border: '1px solid rgba(196,149,58,0.12)', background: 'rgba(196,149,58,0.03)' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontStyle: 'italic', color: 'rgba(242,237,227,0.7)', marginBottom: '1rem' }}>
            Be the first to know.
          </p>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: 'rgba(200,196,190,0.45)', marginBottom: '1.5rem' }}>
            Get show announcements, early tickets and exclusive news.
          </p>
          <a href="/join"
            style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,149,58,0.85)', borderBottom: '1px solid rgba(196,149,58,0.35)', paddingBottom: '2px', textDecoration: 'none' }}>
            Join the circle →
          </a>
        </div>

        {/* Past shows */}
        {past.length > 0 && (
          <div style={{ marginTop: '5rem' }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(200,196,190,0.25)', marginBottom: '2rem' }}>
              Past
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {past.map((show) => {
                const d = formatDate(show.date)
                return (
                  <div key={show.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '1.5rem 0', display: 'flex', gap: '2rem', alignItems: 'baseline', opacity: 0.5 }}>
                    <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: 'rgba(200,196,190,0.4)', minWidth: '7rem' }}>{d.full}</span>
                    <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', color: 'rgba(242,237,227,0.6)' }}>{show.venue}, {show.city}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
