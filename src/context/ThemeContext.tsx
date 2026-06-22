'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ThemeName } from '@/lib/themes'

interface ThemeContextType {
  theme: ThemeName
  isPinned: boolean
  setTheme: (theme: ThemeName) => void
  pinTheme: (theme: ThemeName) => void
  unpinTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark-noir',
  isPinned: false,
  setTheme: () => {},
  pinTheme: () => {},
  unpinTheme: () => {},
})

function applyToDocument(theme: ThemeName) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('dark-noir')
  const [isPinned, setIsPinned] = useState(false)

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next)
    applyToDocument(next)
  }, [])

  const pinTheme = useCallback((next: ThemeName) => {
    setThemeState(next)
    setIsPinned(true)
    applyToDocument(next)
  }, [])

  const unpinTheme = useCallback(() => {
    setIsPinned(false)
    setThemeState('dark-noir')
    applyToDocument('dark-noir')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, isPinned, setTheme, pinTheme, unpinTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
