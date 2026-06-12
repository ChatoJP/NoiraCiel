import { ALBUM_META } from '@/lib/musicScanner'

const STREAMING = [
  {
    label: 'Spotify',
    href: ALBUM_META.spotifyUrl,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    color: '#1DB954',
  },
  {
    label: 'Apple Music',
    href: ALBUM_META.appleMusicUrl,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.916.195 1.815.59 2.65.522 1.078 1.32 1.86 2.46 2.286.84.313 1.705.43 2.59.43H17.282c.97 0 1.89-.136 2.77-.49 1.247-.496 2.115-1.36 2.59-2.598.19-.488.292-.997.354-1.516.048-.43.074-.86.074-1.293V6.124zM9.23 17.44V8.52l8.192 4.458-8.193 4.463z" />
      </svg>
    ),
    color: '#fc3c44',
  },
  {
    label: 'YouTube',
    href: ALBUM_META.youtubeUrl,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
    color: '#FF0000',
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-noir-silver/8 py-20 px-6 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 120% at 50% 100%, rgba(13,27,42,0.4) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-5xl mx-auto relative">

        {/* Large centred wordmark */}
        <div className="flex flex-col items-center mb-16 text-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mb-5 opacity-50">
            <polygon points="16,2 30,16 16,30 2,16" stroke="#C4953A" strokeWidth="1" fill="none"/>
            <circle cx="16" cy="16" r="1.8" fill="#C4953A"/>
          </svg>
          <p className="font-heading text-3xl md:text-4xl tracking-[0.3em] text-noir-ivory/80 mb-2 uppercase">NoiraCiel</p>
          <p className="font-body text-[10px] tracking-[0.45em] text-noir-silver/30 uppercase">
            Atlantic Noir · Sea-Soul
          </p>
          <p className="font-heading italic text-sm text-noir-silver/25 mt-3 max-w-xs">
            Songs from the dark edge of memory.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-14">
          <div className="flex-1 h-px bg-noir-silver/8" />
          <div className="w-1 h-1 rounded-full bg-noir-gold/30" />
          <div className="flex-1 h-px bg-noir-silver/8" />
        </div>

        {/* 3-col grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">

          {/* Album */}
          <div>
            <p className="font-body text-[9px] tracking-[0.45em] text-noir-silver/25 uppercase mb-5">The Album</p>
            <div className="flex items-start gap-4 mb-4">
              {/* Album cover thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Images/album-cover.png"
                alt="The Life Lessons I Hope You Learn"
                className="w-14 h-14 object-cover border border-noir-gold/15 flex-shrink-0"
              />
              <div>
                <p className="font-heading text-base text-noir-ivory/60 italic leading-snug mb-1">
                  The Life Lessons<br />I Hope You Learn
                </p>
                <p className="font-body text-xs text-noir-silver/30">17 songs · {year}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-body text-[9px] tracking-[0.45em] text-noir-silver/25 uppercase mb-5">Navigate</p>
            <ul className="space-y-2.5">
              {[
                ['Music',      '#music'],
                ['Gallery',    '#gallery'],
                ['Videos',     '#videos'],
                ['Merch',      '#merch'],
                ['The World',  '#world'],
                ['Biography',  '#biography'],
                ['Press Kit',  '#press'],
                ['Contact',    '#contact'],
              ].map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="font-body text-xs text-noir-silver/40 hover:text-noir-ivory transition-colors tracking-wide"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Listen Now */}
          <div>
            <p className="font-body text-[9px] tracking-[0.45em] text-noir-silver/25 uppercase mb-5">Listen Now</p>
            <p className="font-heading italic text-sm text-noir-ivory/35 leading-snug mb-5">
              Now available on all<br />major platforms.
            </p>
            <div className="space-y-3">
              {STREAMING.map(({ label, href, icon, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group"
                >
                  <span
                    className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ color }}
                  >
                    {icon}
                  </span>
                  <span className="font-body text-xs text-noir-silver/40 group-hover:text-noir-ivory transition-colors tracking-wide">
                    {label}
                  </span>
                  <span className="text-noir-silver/20 text-xs ml-auto group-hover:text-noir-gold/50 transition-colors">↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-noir-silver/6 gap-4">
          <p className="font-body text-[9px] text-noir-silver/20 tracking-wide">
            © {year} NoiraCiel. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-noir-gold/35 animate-pulse-gold" />
            <span className="font-body text-[9px] tracking-[0.3em] text-noir-silver/18 uppercase">
              Atlantic Noir · Digital Art Universe
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
