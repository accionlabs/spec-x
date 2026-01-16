import type { PersonaId } from '../theme/types'

export interface PersonaRoute {
  path: string
  personaId: PersonaId
}

export const PERSONA_ROUTES: PersonaRoute[] = [
  { path: '/technician/*', personaId: 'technician' },
  { path: '/dispatcher/*', personaId: 'dispatcher' },
  { path: '/manager/*', personaId: 'manager' },
]

// Base paths for each persona
export const PERSONA_BASE_PATHS: Record<PersonaId, string> = {
  technician: '/technician',
  dispatcher: '/dispatcher',
  manager: '/manager',
}

// Sub-routes within each persona app
export interface PersonaSubRoute {
  id: string
  path: string
  label: string
  // Scenarios that enable this route - if any match, route is enabled
  // Empty array means always enabled
  requiredScenarios: string[]
}

// Map routes to their required scenarios
export const TECHNICIAN_ROUTES: PersonaSubRoute[] = [
  { id: 'dashboard', path: '', label: 'Dashboard', requiredScenarios: [] },
  { id: 'work-orders', path: 'work-orders', label: 'Work Orders', requiredScenarios: ['view-work-orders'] },
  { id: 'equipment', path: 'equipment', label: 'Equipment', requiredScenarios: ['view-history', 'scan-barcode'] },
  { id: 'settings', path: 'settings', label: 'Settings', requiredScenarios: [] },
]

export const DISPATCHER_ROUTES: PersonaSubRoute[] = [
  { id: 'dashboard', path: '', label: 'Dashboard', requiredScenarios: [] },
  { id: 'assign', path: 'assign', label: 'Assign Work Orders', requiredScenarios: ['assign-to-technician', 'view-unassigned'] },
  { id: 'monitor-progress', path: 'monitor', label: 'Monitor Progress', requiredScenarios: ['track-status', 'view-map'] },
  { id: 'settings', path: 'settings', label: 'Settings', requiredScenarios: [] },
]

export const MANAGER_ROUTES: PersonaSubRoute[] = [
  { id: 'dashboard', path: '', label: 'Dashboard', requiredScenarios: [] },
  { id: 'reports', path: 'reports', label: 'Generate Reports', requiredScenarios: ['completion-reports', 'performance-trends'] },
  { id: 'team', path: 'team', label: 'Team Performance', requiredScenarios: ['individual-metrics', 'team-overview'] },
  { id: 'settings', path: 'settings', label: 'Settings', requiredScenarios: [] },
]

// Get all routes for a persona (unfiltered)
function getAllRoutesForPersona(personaId: PersonaId): PersonaSubRoute[] {
  switch (personaId) {
    case 'technician':
      return TECHNICIAN_ROUTES
    case 'dispatcher':
      return DISPATCHER_ROUTES
    case 'manager':
      return MANAGER_ROUTES
  }
}

// Get routes filtered by enabled scenarios
export function getRoutesForPersona(personaId: PersonaId, enabledScenarios?: string[]): PersonaSubRoute[] {
  const allRoutes = getAllRoutesForPersona(personaId)

  // If no scenarios provided, return all routes (backward compatibility)
  if (!enabledScenarios) {
    return allRoutes
  }

  // Filter routes based on scenarios
  return allRoutes.filter(route => {
    // Routes with empty requiredScenarios are always enabled
    if (route.requiredScenarios.length === 0) {
      return true
    }
    // Route is enabled if ANY of its required scenarios are enabled
    return route.requiredScenarios.some(scenario => enabledScenarios.includes(scenario))
  })
}
