export type PersonaId = 'technician' | 'dispatcher' | 'manager'

export interface PersonaTheme {
  id: PersonaId
  name: string
  primary: string        // Main brand color (e.g., #2563eb)
  primaryHover: string   // Darker shade for hover
  accent: string         // Lighter accent color
  gradient: string       // Tailwind gradient classes
  statusBar: string      // Tailwind bg class for status bar
  headerBg: string       // Tailwind bg class for header
  navActive: string      // Tailwind text class for active nav
}

export interface ThemeContextValue {
  theme: PersonaTheme
  personaId: PersonaId
}
