import { Wrench } from 'lucide-react'
import { featureRegistry } from '../registry'
import type { PersonaFeature } from '../registry/types'
import { createFeatureId } from '../registry/types'

// Import outcome definitions
import { completeWorkOrdersOutcome } from './complete-work-orders'
import { trackEquipmentOutcome } from './track-equipment'

// Technician Persona Definition
export const technicianPersona: PersonaFeature = {
  id: createFeatureId('persona', 'technician'),
  level: 'persona',
  personaId: 'technician',
  name: 'Field Technician',
  description: 'Complete work orders and track equipment in the field',
  icon: Wrench,
  i18nKey: 'persona.technician',
  outcomes: [
    completeWorkOrdersOutcome,
    trackEquipmentOutcome,
  ],
}

// Register the technician persona
export function registerTechnicianPersona() {
  featureRegistry.registerPersona(technicianPersona)
}

// Export outcome and scenario definitions for direct access
export { completeWorkOrdersOutcome } from './complete-work-orders'
export { trackEquipmentOutcome } from './track-equipment'
