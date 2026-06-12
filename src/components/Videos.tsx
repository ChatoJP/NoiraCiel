'use client'

import { useState, useEffect } from 'react'
import type { VideoEntry } from '@/lib/types'

function VideoCard({ video }: { video: VideoEntry }) {
  const [playing, setPlaying] = useState(false)

  if (video.platform === 'self-hosted' || video.platform === 'kie') {
    return (
      <div className="group relative overflow-hidden border border-noir-silver/10 hover:border-noir-gold/30 transition-all duration-500">
        <div className="aspect-video bg-noir-deep relative">
          {playing ? (
            <video
              src={video.url}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              autoPlay
            />
          ) : (
            <>
              {video.thumbnail && (
                <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-noir-navy/60 to-noir-void/80 flex items-center justify-center">
                <button
                  onClick={() => setPlaying(true)}
                  className="w-16 h-16 rounded-full border border-noir-ivory/40 bg-noir-void/40 flex items-center justify-center hover:bg-noir-gold/20 hover:border-noir-gold/60 transition-all"
                >
                  <svg className="w-6 h-6 text-noir-ivory ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
        <div className="p-4 bg-noir-deep/60">
          <p className="font-heading text-base text-noir-ivory">{video.title}</p>
          {video.description && (
            <p className="font-body text-xs text-noir-silver/50 mt-1 line-clamp-2">{video.description}</p>
          )}
        </div>
      </div>
    )
  }

  const embedUrl = video.platform === 'youtube'
    ? `https://www.youtube.com/embed/${video.url}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${video.url}?autoplay=1`

  return (
    <div className="group relative overflow-hidden border border-noir-silver/10 hover:border-noir-gold/30 transition-all duration-500">
      <div className="aspect-video bg-noir-deep relative">
        {playing ? (
          <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
        ) : (
          <>
            {video.thumbnail && (
              <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-noir-navy/60 to-noir-void/80 flex items-center justify-center">
              <button
                onClick={() => setPlaying(true)}
                className="w-16 h-16 rounded-full border border-noir-ivory/40 bg-noir-void/40 flex items-center justify-center hover:bg-noir-gold/20 hover:border-noir-gold/60 transition-all"
              >
                <svg className="w-6 h-6 text-noir-ivory ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
      <div className="p-4 bg-noir-deep/60">
        <p className="font-heading text-base text-noir-ivory">{video.title}</p>
        {video.description && (
          <p className="font-body text-xs text-noir-silver/50 mt-1 line-clamp-2">{video.description}</p>
        )}
      </div>
    </div>
  )
}

export default function Videos() {
  const [videos, setVideos] = useState<VideoEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/Videos/lyric-videos.json')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.videos)) {
          setVideos(data.videos)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section id="videos" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <p className="font-body text-xs tracking-[0.35em] text-noir-gold/60 uppercase mb-4">Visual</p>
          <h2 className="font-heading text-5xl md:text-6xl text-noir-ivory font-light tracking-wide">Videos</h2>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-video bg-noir-deep/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : !loading ? (
          <div className="border border-noir-silver/10 p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full border border-noir-silver/20 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-noir-silver/30 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="font-heading italic text-xl text-noir-silver/40 mb-3">The visuals are coming.</p>
            <p className="font-body text-sm text-noir-silver/30 max-w-sm">
              Music videos and visual experiences are in production. Subscribe to the newsletter to be the first to know.
            </p>
            <a href="#newsletter" className="mt-6 font-body text-xs tracking-[0.2em] uppercase text-noir-gold/60 hover:text-noir-gold border-b border-noir-gold/30 hover:border-noir-gold pb-0.5 transition-colors">
              Get notified
            </a>
          </div>
        ) : null}
      </div>
    </section>
  )
}
