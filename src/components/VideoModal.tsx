'use client'

import { useEffect } from 'react'

interface Props {
  url: string
  title: string
  onClose: () => void
}

export default function VideoModal({ url, title, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
      style={{ background: 'rgba(4,4,10,0.96)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-noir-silver/50 hover:text-noir-ivory transition-colors flex items-center gap-2 font-body text-[10px] tracking-[0.25em] uppercase"
          aria-label="Close"
        >
          <span>Esc</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Video */}
        <div className="aspect-video w-full border border-noir-silver/10 overflow-hidden bg-noir-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={url}
            className="w-full h-full"
            controls
            autoPlay
          />
        </div>

        {/* Title */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="font-heading italic text-lg text-noir-ivory/80">{title}</p>
          <p className="font-body text-[9px] tracking-[0.3em] text-noir-silver/25 uppercase flex-shrink-0">
            Lyric Video
          </p>
        </div>
      </div>
    </div>
  )
}
