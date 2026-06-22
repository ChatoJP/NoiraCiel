import { ImageResponse } from 'next/og'

export const alt = 'NoiraCiel — Atlantic Noir. Sea-Soul.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const cover = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev/images/album-cover.png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          background: '#030507',
        }}
      >
        {/* Left: text panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 80px',
            background: 'linear-gradient(90deg, #030507 70%, rgba(3,5,7,0) 100%)',
          }}
        >
          {/* Label */}
          <div
            style={{
              color: '#C4953A',
              fontSize: 13,
              letterSpacing: '6px',
              textTransform: 'uppercase',
              fontFamily: 'Georgia, serif',
              marginBottom: 32,
              display: 'flex',
            }}
          >
            Atlantic Noir · Sea-Soul
          </div>

          {/* Name */}
          <div
            style={{
              color: '#F2EDE3',
              fontSize: 90,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              letterSpacing: '-2px',
              lineHeight: 1,
              marginBottom: 36,
              display: 'flex',
            }}
          >
            NoiraCiel
          </div>

          {/* Gold rule */}
          <div
            style={{
              width: 64,
              height: 1,
              background: '#C4953A',
              marginBottom: 32,
              display: 'flex',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              color: '#8A8C8E',
              fontSize: 17,
              letterSpacing: '2px',
              fontFamily: 'Georgia, serif',
              display: 'flex',
            }}
          >
            Songs from the dark edge of memory
          </div>
        </div>

        {/* Right: album cover */}
        <div
          style={{
            width: 420,
            height: 630,
            display: 'flex',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            width={420}
            height={420}
            style={{
              width: 420,
              height: 420,
              objectFit: 'cover',
              alignSelf: 'center',
              opacity: 0.85,
            }}
            alt=""
          />
          {/* Fade from left */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #030507 0%, rgba(3,5,7,0) 40%)',
              display: 'flex',
            }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
