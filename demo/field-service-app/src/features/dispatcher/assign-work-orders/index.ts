import { ClipboardCheck, UserCheck, AlertTriangle } from 'lucide-react'
import type { OutcomeFeature, ScenarioFeature } from '../../registry/types'
import { createFeatureId } from '../../registry/types'

// Scenario: View Unassigned
const viewUnassignedScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'dispatcher', 'assign-work-orders', 'view-unassigned'),
  level: 'scenario',
  personaId: 'dispatcher',
  outcomeId: 'assign-work-orders',
  scenarioId: 'view-unassigned',
  name: 'View Unassigned',
  description: 'View work orders that need assignment',
  icon: AlertTriangle,
  i18nKey: 'scenario.viewUnassigned',
  capabilities: ['offline'],
}

// Scenario: Assign to Technician
const assignToTechnicianScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'dispatcher', 'assign-work-orders', 'assign-to-technician'),
  level: 'scenario',
  personaId: 'dispatcher',
  outcomeId: 'assign-work-orders',
  scenarioId: 'assign-to-technician',
  name: 'Assign to Technician',
  description: 'Assign work orders to available technicians',
  icon: UserCheck,
  i18nKey: 'scenario.assignToTechnician',
  capabilities: ['offline'],
}

// Assign Work Orders Outcome
export const assignWorkOrdersOutcome: OutcomeFeature = {
  id: createFeatureId('outcome', 'dispatcher', 'assign-work-orders'),
  level: 'outcome',
  personaId: 'dispatcher',
  outcomeId: 'assign-work-orders',
  name: 'Assign Work Orders',
  description: 'Assign work orders to technicians',
  icon: ClipboardCheck,
  i18nKey: 'nav.assign',
  navItem: {
    id: 'assign',
    icon: ClipboardCheck,
    labelKey: 'nav.assign',
    order: 1,
    path: 'assign',
  },
  scenarios: [
    viewUnassignedScenario,
    assignToTechnicianScenario,
  ],
}

export const scenarios = {
  viewUnassigned: viewUnassignedScenario,
  assignToTechnician: assignToTechnicianScenario,
}
