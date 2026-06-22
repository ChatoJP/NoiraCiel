'use client'

import { useEffect } from 'react'
import { useAudio } from '@/context/AudioContext'
import { useTheme } from '@/context/ThemeContext'
import { getThemeForAlbum } from '@/lib/themes'

export default function ThemeSync() {
  const { currentTrack } = useAudio()
  const { setTheme, isPinned } = useTheme()

  useEffect(() => {
    if (!isPinned && currentTrack?.albumSlug) {
      setTheme(getThemeForAlbum(currentTrack.albumSlug))
    }
  }, [currentTrack?.albumSlug, isPinned, setTheme])

  return null
}
