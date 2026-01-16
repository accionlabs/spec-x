import { BarChart3, FileText, TrendingUp } from 'lucide-react'
import type { OutcomeFeature, ScenarioFeature } from '../../registry/types'
import { createFeatureId } from '../../registry/types'

// Scenario: Completion Reports
const completionReportsScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'manager', 'generate-reports', 'completion-reports'),
  level: 'scenario',
  personaId: 'manager',
  outcomeId: 'generate-reports',
  scenarioId: 'completion-reports',
  name: 'Completion Reports',
  description: 'View work order completion metrics',
  icon: FileText,
  i18nKey: 'scenario.completionReports',
  capabilities: ['offline'],
}

// Scenario: Performance Trends
const performanceTrendsScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'manager', 'generate-reports', 'performance-trends'),
  level: 'scenario',
  personaId: 'manager',
  outcomeId: 'generate-reports',
  scenarioId: 'performance-trends',
  name: 'Performance Trends',
  description: 'Analyze performance trends over time',
  icon: TrendingUp,
  i18nKey: 'scenario.performanceTrends',
  capabilities: ['offline'],
}

// Generate Reports Outcome
export const generateReportsOutcome: OutcomeFeature = {
  id: createFeatureId('outcome', 'manager', 'generate-reports'),
  level: 'outcome',
  personaId: 'manager',
  outcomeId: 'generate-reports',
  name: 'Generate Reports',
  description: 'Generate and view performance reports',
  icon: BarChart3,
  i18nKey: 'nav.reports',
  navItem: {
    id: 'reports',
    icon: BarChart3,
    labelKey: 'nav.reports',
    order: 1,
    path: 'reports',
  },
  scenarios: [
    completionReportsScenario,
    performanceTrendsScenario,
  ],
}

export const scenarios = {
  completionReports: completionReportsScenario,
  performanceTrends: performanceTrendsScenario,
}
