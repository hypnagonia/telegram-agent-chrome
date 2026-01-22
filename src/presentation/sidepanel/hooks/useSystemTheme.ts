import { useState, useEffect } from 'preact/hooks'
import type { Theme } from '../styles'

export function useSystemTheme(theme: Theme): 'light' | 'dark' {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  })

  useEffect(() => {
    if (theme !== 'system') {
      setResolvedTheme(theme)
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')

    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  return resolvedTheme
}
