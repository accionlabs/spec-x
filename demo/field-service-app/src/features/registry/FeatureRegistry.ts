import type { PersonaId } from '../theme/types'
import type {
  Feature,
  FeatureId,
  PersonaFeature,
  OutcomeFeature,
  ScenarioFeature,
  NavItemConfig,
  WidgetConfig,
  FeatureConfig,
} from './types'

export class FeatureRegistry {
  private features: Map<FeatureId, Feature> = new Map()
  private personas: Map<PersonaId, PersonaFeature> = new Map()

  // Register a complete persona with all its outcomes and scenarios
  registerPersona(persona: PersonaFeature): void {
    // Register the persona itself
    this.features.set(persona.id, persona)
    this.personas.set(persona.personaId, persona)

    // Register all outcomes
    for (const outcome of persona.outcomes) {
      this.features.set(outcome.id, outcome)

      // Register all scenarios
      for (const scenario of outcome.scenarios) {
        this.features.set(scenario.id, scenario)
      }
    }
  }

  // Get a feature by ID
  get(id: FeatureId): Feature | undefined {
    return this.features.get(id)
  }

  // Get all registered personas
  getPersonas(): PersonaFeature[] {
    return Array.from(this.personas.values())
  }

  // Get a specific persona
  getPersona(personaId: PersonaId): PersonaFeature | undefined {
    return this.personas.get(personaId)
  }

  // Get outcomes for a persona
  getOutcomes(personaId: PersonaId): OutcomeFeature[] {
    const persona = this.personas.get(personaId)
    return persona?.outcomes || []
  }

  // Get a specific outcome
  getOutcome(personaId: PersonaId, outcomeId: string): OutcomeFeature | undefined {
    const persona = this.personas.get(personaId)
    return persona?.outcomes.find(o => o.outcomeId === outcomeId)
  }

  // Get scenarios for an outcome
  getScenarios(personaId: PersonaId, outcomeId: string): ScenarioFeature[] {
    const outcome = this.getOutcome(personaId, outcomeId)
    return outcome?.scenarios || []
  }

  // Get a specific scenario
  getScenario(personaId: PersonaId, outcomeId: string, scenarioId: string): ScenarioFeature | undefined {
    const outcome = this.getOutcome(personaId, outcomeId)
    return outcome?.scenarios.find(s => s.scenarioId === scenarioId)
  }

  // Compute enabled features from config
  getEnabledFeatures(config: FeatureConfig): Set<FeatureId> {
    const enabled = new Set<FeatureId>()

    // Enable specified personas
    for (const personaId of config.personas) {
      const persona = this.personas.get(personaId)
      if (!persona) continue

      enabled.add(persona.id)

      // If no specific scenarios configured, enable all for this persona
      if (!config.scenarios || config.scenarios.length === 0) {
        for (const outcome of persona.outcomes) {
          enabled.add(outcome.id)
          for (const scenario of outcome.scenarios) {
            enabled.add(scenario.id)
          }
        }
      }
    }

    // Enable specific scenarios (and their parent outcomes/personas)
    if (config.scenarios && config.scenarios.length > 0) {
      for (const scenarioId of config.scenarios) {
        // Find the scenario in registered features
        for (const persona of this.personas.values()) {
          if (!config.personas.includes(persona.personaId)) continue

          for (const outcome of persona.outcomes) {
            const scenario = outcome.scenarios.find(s => s.scenarioId === scenarioId)
            if (scenario) {
              // Enable the scenario and its parents
              enabled.add(scenario.id)
              enabled.add(outcome.id)
              enabled.add(persona.id)
            }
          }
        }
      }
    }

    return enabled
  }

  // Get navigation items for a persona (filtered by enabled features)
  getNavigation(personaId: PersonaId, enabledFeatures: Set<FeatureId>): NavItemConfig[] {
    const persona = this.personas.get(personaId)
    if (!persona) return []

    // Check if persona is enabled
    if (!enabledFeatures.has(persona.id)) return []

    const navItems: NavItemConfig[] = []

    for (const outcome of persona.outcomes) {
      // Only include if outcome is enabled
      if (enabledFeatures.has(outcome.id) && outcome.navItem) {
        navItems.push(outcome.navItem)
      }
    }

    // Sort by order
    return navItems.sort((a, b) => a.order - b.order)
  }

  // Get dashboard widgets for a persona (filtered by enabled features)
  getDashboardWidgets(personaId: PersonaId, enabledFeatures: Set<FeatureId>): WidgetConfig[] {
    const persona = this.personas.get(personaId)
    if (!persona) return []

    // Check if persona is enabled
    if (!enabledFeatures.has(persona.id)) return []

    const widgets: WidgetConfig[] = []

    for (const outcome of persona.outcomes) {
      // Only include if outcome is enabled
      if (!enabledFeatures.has(outcome.id)) continue

      // Add outcome-level widgets
      if (outcome.dashboardWidgets) {
        widgets.push(...outcome.dashboardWidgets)
      }

      // Add scenario-level widgets
      for (const scenario of outcome.scenarios) {
        if (enabledFeatures.has(scenario.id) && scenario.widget) {
          widgets.push(scenario.widget)
        }
      }
    }

    // Sort by order
    return widgets.sort((a, b) => a.order - b.order)
  }

  // Check if a specific feature is enabled
  isFeatureEnabled(featureId: FeatureId, enabledFeatures: Set<FeatureId>): boolean {
    return enabledFeatures.has(featureId)
  }

  // Get all feature IDs for a persona (useful for debugging)
  getAllFeatureIds(personaId: PersonaId): FeatureId[] {
    const persona = this.personas.get(personaId)
    if (!persona) return []

    const ids: FeatureId[] = [persona.id]

    for (const outcome of persona.outcomes) {
      ids.push(outcome.id)
      for (const scenario of outcome.scenarios) {
        ids.push(scenario.id)
      }
    }

    return ids
  }
}

// Singleton instance
export const featureRegistry = new FeatureRegistry()
