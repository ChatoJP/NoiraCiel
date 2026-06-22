'use client'

import { useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { getThemeForAlbum, THEMES, type ThemeName } from '@/lib/themes'

interface Props {
  albumSlug?: string | null
  theme?: ThemeName
}

export default function ApplyTheme({ albumSlug, theme: themeProp }: Props) {
  const { pinTheme, unpinTheme } = useTheme()

  useEffect(() => {
    const resolved = themeProp ?? getThemeForAlbum(albumSlug)
    pinTheme(resolved)

    // G74: set theme-color meta to album accent
    const def = THEMES[resolved]
    const [r, g, b] = def.accentRgb.split(',').map(s => s.trim())
    const color = `rgb(${r},${g},${b})`
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const created = !meta
    if (created) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta!.content = color

    return () => {
      unpinTheme()
      if (created && meta?.parentNode) meta.parentNode.removeChild(meta)
      else if (meta) meta.content = '#080810'
    }
  }, [albumSlug, themeProp, pinTheme, unpinTheme])

  return null
}
