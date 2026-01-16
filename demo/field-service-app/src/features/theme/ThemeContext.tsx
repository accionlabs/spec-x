import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { PersonaId, PersonaTheme, ThemeContextValue } from './types'
import { PERSONA_THEMES, getPersonaFromPath } from './themes'

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  children: ReactNode
  personaId?: PersonaId  // Can override from route
}

export function ThemeProvider({ children, personaId: propPersonaId }: ThemeProviderProps) {
  const location = useLocation()

  // Determine persona from route or prop
  const personaId = propPersonaId || getPersonaFromPath(location.pathname) || 'technician'
  const theme = PERSONA_THEMES[personaId]

  // Apply CSS custom properties for theme colors
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.primary)
    root.style.setProperty('--theme-primary-hover', theme.primaryHover)
    root.style.setProperty('--theme-accent', theme.accent)

    // Update meta theme-color for PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.primary)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, personaId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function usePersonaId(): PersonaId {
  return useTheme().personaId
}

export function usePersonaTheme(): PersonaTheme {
  return useTheme().theme
}
