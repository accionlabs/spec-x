import { Briefcase } from 'lucide-react'
import { featureRegistry } from '../registry'
import type { PersonaFeature } from '../registry/types'
import { createFeatureId } from '../registry/types'

// Import outcome definitions
import { generateReportsOutcome } from './generate-reports'
import { trackPerformanceOutcome } from './track-performance'

// Manager Persona Definition
export const managerPersona: PersonaFeature = {
  id: createFeatureId('persona', 'manager'),
  level: 'persona',
  personaId: 'manager',
  name: 'Service Manager',
  description: 'Generate reports and track team performance',
  icon: Briefcase,
  i18nKey: 'persona.manager',
  outcomes: [
    generateReportsOutcome,
    trackPerformanceOutcome,
  ],
}

// Register the manager persona
export function registerManagerPersona() {
  featureRegistry.registerPersona(managerPersona)
}

// Export outcome definitions
export { generateReportsOutcome } from './generate-reports'
export { trackPerformanceOutcome } from './track-performance'
