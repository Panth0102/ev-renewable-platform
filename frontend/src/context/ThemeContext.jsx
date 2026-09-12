import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

// Resolves 'system' → 'light' | 'dark' based on OS preference
function resolveTheme(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeRaw] = useState(() => {
    return localStorage.getItem('ev_theme') || 'light'
  })

  // Apply the resolved theme as a data attribute on <html>
  useEffect(() => {
    const resolved = resolveTheme(theme)
    document.documentElement.setAttribute('data-theme', resolved)
    localStorage.setItem('ev_theme', theme)
  }, [theme])

  // Also listen for OS preference changes when 'system' is active
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        document.documentElement.setAttribute('data-theme', resolveTheme('system'))
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((t) => setThemeRaw(t), [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved: resolveTheme(theme) }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
