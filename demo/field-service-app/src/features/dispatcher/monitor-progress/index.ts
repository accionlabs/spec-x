import { Map, MapPin, Clock } from 'lucide-react'
import type { OutcomeFeature, ScenarioFeature } from '../../registry/types'
import { createFeatureId } from '../../registry/types'

// Scenario: View Map
const viewMapScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'dispatcher', 'monitor-progress', 'view-map'),
  level: 'scenario',
  personaId: 'dispatcher',
  outcomeId: 'monitor-progress',
  scenarioId: 'view-map',
  name: 'View Map',
  description: 'View technician locations on a map',
  icon: MapPin,
  i18nKey: 'scenario.viewMap',
  capabilities: ['gps'],
}

// Scenario: Track Status
const trackStatusScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'dispatcher', 'monitor-progress', 'track-status'),
  level: 'scenario',
  personaId: 'dispatcher',
  outcomeId: 'monitor-progress',
  scenarioId: 'track-status',
  name: 'Track Status',
  description: 'Track work order status in real-time',
  icon: Clock,
  i18nKey: 'scenario.trackStatus',
  capabilities: ['offline'],
}

// Monitor Progress Outcome
export const monitorProgressOutcome: OutcomeFeature = {
  id: createFeatureId('outcome', 'dispatcher', 'monitor-progress'),
  level: 'outcome',
  personaId: 'dispatcher',
  outcomeId: 'monitor-progress',
  name: 'Monitor Progress',
  description: 'Monitor technician progress and locations',
  icon: Map,
  i18nKey: 'nav.monitorProgress',
  navItem: {
    id: 'monitor-progress',
    icon: Map,
    labelKey: 'nav.monitorProgress',
    order: 2,
    path: 'monitor',
  },
  scenarios: [
    viewMapScenario,
    trackStatusScenario,
  ],
}

export const scenarios = {
  viewMap: viewMapScenario,
  trackStatus: trackStatusScenario,
}
