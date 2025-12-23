// components/ThemeProvider/index.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}

// ✅ Helper: Safe localStorage operations
function getStoredTheme(): Theme | null {
  try {
    return localStorage.getItem('theme') as Theme
  } catch {
    return null
  }
}

function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Fail silently if localStorage is blocked
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // ✅ Try to get saved theme, fallback to system preference
    const saved = getStoredTheme()
    
    if (saved && (saved === 'light' || saved === 'dark')) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      // ✅ Fallback to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial = prefersDark ? 'dark' : 'light'
      setTheme(initial)
      document.documentElement.setAttribute('data-theme', initial)
      setStoredTheme(initial)
    }
    
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setStoredTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  // ✅ Prevent flash of unstyled content
  if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}