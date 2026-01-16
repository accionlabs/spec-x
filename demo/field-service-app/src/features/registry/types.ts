import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { PersonaId } from '../theme/types'

// Re-export PersonaId so other modules can import it from registry
export type { PersonaId }

// Feature identification
export type FeatureLevel = 'persona' | 'outcome' | 'scenario'

// Feature ID format: "level.personaId.outcomeId.scenarioId"
// Examples:
// - "persona.technician"
// - "outcome.technician.complete-work-orders"
// - "scenario.technician.complete-work-orders.capture-photos"
export type FeatureId = string

// Base metadata for all features
export interface FeatureMetadata {
  id: FeatureId
  level: FeatureLevel
  name: string
  description: string
  icon: LucideIcon
  i18nKey?: string
}

// Navigation item configuration
export interface NavItemConfig {
  id: string
  icon: LucideIcon
  labelKey: string
  order: number
  path?: string
}

// Widget configuration for dashboards
export interface WidgetConfig {
  id: string
  component: ComponentType<any>
  titleKey?: string
  size: 'small' | 'medium' | 'large' | 'full'
  order: number
  showWhen?: (context: FeatureContextValue) => boolean
}

// Scenario feature - the leaf level (actual functionality)
export interface ScenarioFeature extends FeatureMetadata {
  level: 'scenario'
  personaId: PersonaId
  outcomeId: string
  scenarioId: string
  component?: ComponentType<any>
  widget?: WidgetConfig
  capabilities?: string[]  // e.g., ['camera', 'gps', 'offline']
}

// Outcome feature - groups scenarios under a nav tab
export interface OutcomeFeature extends FeatureMetadata {
  level: 'outcome'
  personaId: PersonaId
  outcomeId: string
  scenarios: ScenarioFeature[]
  navItem: NavItemConfig
  dashboardWidgets?: WidgetConfig[]
  mainComponent?: ComponentType<any>
}

// Persona feature - top level grouping
export interface PersonaFeature extends FeatureMetadata {
  level: 'persona'
  personaId: PersonaId
  outcomes: OutcomeFeature[]
}

// Union type for any feature
export type Feature = PersonaFeature | OutcomeFeature | ScenarioFeature

// Context value for feature system
export interface FeatureContextValue {
  // Current state
  currentPersonaId: PersonaId
  enabledFeatures: Set<FeatureId>

  // Feature queries
  isFeatureEnabled: (featureId: FeatureId) => boolean
  getPersona: (personaId: PersonaId) => PersonaFeature | undefined
  getOutcome: (personaId: PersonaId, outcomeId: string) => OutcomeFeature | undefined
  getScenario: (personaId: PersonaId, outcomeId: string, scenarioId: string) => ScenarioFeature | undefined

  // Navigation and widgets for current persona
  getNavigation: () => NavItemConfig[]
  getDashboardWidgets: () => WidgetConfig[]
}

// Config input for enabling features
export interface FeatureConfig {
  personas: PersonaId[]
  scenarios?: string[]  // Scenario IDs to enable (enables parent outcome/persona automatically)
}

// Helper to create feature IDs
export function createFeatureId(
  level: 'persona',
  personaId: PersonaId
): FeatureId
export function createFeatureId(
  level: 'outcome',
  personaId: PersonaId,
  outcomeId: string
): FeatureId
export function createFeatureId(
  level: 'scenario',
  personaId: PersonaId,
  outcomeId: string,
  scenarioId: string
): FeatureId
export function createFeatureId(
  level: FeatureLevel,
  personaId: PersonaId,
  outcomeId?: string,
  scenarioId?: string
): FeatureId {
  switch (level) {
    case 'persona':
      return `persona.${personaId}`
    case 'outcome':
      return `outcome.${personaId}.${outcomeId}`
    case 'scenario':
      return `scenario.${personaId}.${outcomeId}.${scenarioId}`
  }
}

// Parse a feature ID back to its components
export function parseFeatureId(featureId: FeatureId): {
  level: FeatureLevel
  personaId: PersonaId
  outcomeId?: string
  scenarioId?: string
} | null {
  const parts = featureId.split('.')
  if (parts.length < 2) return null

  const level = parts[0] as FeatureLevel
  const personaId = parts[1] as PersonaId

  switch (level) {
    case 'persona':
      return { level, personaId }
    case 'outcome':
      if (parts.length < 3) return null
      return { level, personaId, outcomeId: parts[2] }
    case 'scenario':
      if (parts.length < 4) return null
      return { level, personaId, outcomeId: parts[2], scenarioId: parts[3] }
    default:
      return null
  }
}
