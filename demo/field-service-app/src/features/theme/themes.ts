import type { PersonaId, PersonaTheme } from './types'

export const PERSONA_THEMES: Record<PersonaId, PersonaTheme> = {
  technician: {
    id: 'technician',
    name: 'Field Technician',
    primary: '#2563eb',      // blue-600
    primaryHover: '#1d4ed8', // blue-700
    accent: '#3b82f6',       // blue-500
    gradient: 'from-blue-600 to-indigo-600',
    statusBar: 'bg-blue-600',
    headerBg: 'bg-blue-600',
    navActive: 'text-blue-600',
  },
  dispatcher: {
    id: 'dispatcher',
    name: 'Dispatcher',
    primary: '#ea580c',      // orange-600
    primaryHover: '#c2410c', // orange-700
    accent: '#f97316',       // orange-500
    gradient: 'from-orange-500 to-amber-500',
    statusBar: 'bg-orange-600',
    headerBg: 'bg-orange-600',
    navActive: 'text-orange-600',
  },
  manager: {
    id: 'manager',
    name: 'Service Manager',
    primary: '#9333ea',      // purple-600
    primaryHover: '#7e22ce', // purple-700
    accent: '#a855f7',       // purple-500
    gradient: 'from-purple-600 to-indigo-600',
    statusBar: 'bg-purple-600',
    headerBg: 'bg-purple-600',
    navActive: 'text-purple-600',
  },
}

export function getThemeForPersona(personaId: PersonaId): PersonaTheme {
  return PERSONA_THEMES[personaId]
}

export function getPersonaFromPath(pathname: string): PersonaId | null {
  if (pathname.startsWith('/technician')) return 'technician'
  if (pathname.startsWith('/dispatcher')) return 'dispatcher'
  if (pathname.startsWith('/manager')) return 'manager'
  return null
}
