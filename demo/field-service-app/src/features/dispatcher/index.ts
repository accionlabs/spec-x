import { Radio } from 'lucide-react'
import { featureRegistry } from '../registry'
import type { PersonaFeature } from '../registry/types'
import { createFeatureId } from '../registry/types'

// Import outcome definitions
import { assignWorkOrdersOutcome } from './assign-work-orders'
import { monitorProgressOutcome } from './monitor-progress'

// Dispatcher Persona Definition
export const dispatcherPersona: PersonaFeature = {
  id: createFeatureId('persona', 'dispatcher'),
  level: 'persona',
  personaId: 'dispatcher',
  name: 'Dispatcher',
  description: 'Assign work orders and monitor technician progress',
  icon: Radio,
  i18nKey: 'persona.dispatcher',
  outcomes: [
    assignWorkOrdersOutcome,
    monitorProgressOutcome,
  ],
}

// Register the dispatcher persona
export function registerDispatcherPersona() {
  featureRegistry.registerPersona(dispatcherPersona)
}

// Export outcome definitions
export { assignWorkOrdersOutcome } from './assign-work-orders'
export { monitorProgressOutcome } from './monitor-progress'
