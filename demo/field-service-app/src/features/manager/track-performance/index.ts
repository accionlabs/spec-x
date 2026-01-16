import { Users, Star, Clock } from 'lucide-react'
import type { OutcomeFeature, ScenarioFeature } from '../../registry/types'
import { createFeatureId } from '../../registry/types'

// Scenario: Individual Metrics
const individualMetricsScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'manager', 'track-performance', 'individual-metrics'),
  level: 'scenario',
  personaId: 'manager',
  outcomeId: 'track-performance',
  scenarioId: 'individual-metrics',
  name: 'Individual Metrics',
  description: 'View individual technician performance metrics',
  icon: Star,
  i18nKey: 'scenario.individualMetrics',
  capabilities: ['offline'],
}

// Scenario: Team Overview
const teamOverviewScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'manager', 'track-performance', 'team-overview'),
  level: 'scenario',
  personaId: 'manager',
  outcomeId: 'track-performance',
  scenarioId: 'team-overview',
  name: 'Team Overview',
  description: 'View team performance overview',
  icon: Clock,
  i18nKey: 'scenario.teamOverview',
  capabilities: ['offline'],
}

// Track Performance Outcome
export const trackPerformanceOutcome: OutcomeFeature = {
  id: createFeatureId('outcome', 'manager', 'track-performance'),
  level: 'outcome',
  personaId: 'manager',
  outcomeId: 'track-performance',
  name: 'Team Performance',
  description: 'Track team and individual performance',
  icon: Users,
  i18nKey: 'nav.team',
  navItem: {
    id: 'team',
    icon: Users,
    labelKey: 'nav.team',
    order: 2,
    path: 'team',
  },
  scenarios: [
    individualMetricsScenario,
    teamOverviewScenario,
  ],
}

export const scenarios = {
  individualMetrics: individualMetricsScenario,
  teamOverview: teamOverviewScenario,
}
