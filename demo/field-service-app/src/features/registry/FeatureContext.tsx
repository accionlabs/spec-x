import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { PersonaId } from '../theme/types'
import type {
  FeatureId,
  FeatureContextValue,
  FeatureConfig,
  PersonaFeature,
  OutcomeFeature,
  ScenarioFeature,
  NavItemConfig,
  WidgetConfig,
} from './types'
import { featureRegistry } from './FeatureRegistry'

const FeatureContext = createContext<FeatureContextValue | null>(null)

interface FeatureProviderProps {
  children: ReactNode
  personaId: PersonaId
  config?: FeatureConfig
}

export function FeatureProvider({
  children,
  personaId,
  config,
}: FeatureProviderProps) {
  // Compute enabled features from config
  const enabledFeatures = useMemo(() => {
    if (config) {
      return featureRegistry.getEnabledFeatures(config)
    }
    // Default: enable all features for the current persona
    return featureRegistry.getEnabledFeatures({
      personas: [personaId],
    })
  }, [personaId, config])

  // Build context value
  const contextValue = useMemo<FeatureContextValue>(() => ({
    currentPersonaId: personaId,
    enabledFeatures,

    isFeatureEnabled: (featureId: FeatureId) => {
      return enabledFeatures.has(featureId)
    },

    getPersona: (pid: PersonaId) => {
      return featureRegistry.getPersona(pid)
    },

    getOutcome: (pid: PersonaId, outcomeId: string) => {
      return featureRegistry.getOutcome(pid, outcomeId)
    },

    getScenario: (pid: PersonaId, outcomeId: string, scenarioId: string) => {
      return featureRegistry.getScenario(pid, outcomeId, scenarioId)
    },

    getNavigation: () => {
      return featureRegistry.getNavigation(personaId, enabledFeatures)
    },

    getDashboardWidgets: () => {
      return featureRegistry.getDashboardWidgets(personaId, enabledFeatures)
    },
  }), [personaId, enabledFeatures])

  return (
    <FeatureContext.Provider value={contextValue}>
      {children}
    </FeatureContext.Provider>
  )
}

// Hook to access the feature context
export function useFeatures(): FeatureContextValue {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider')
  }
  return context
}

// Convenience hook to check if a feature is enabled
export function useFeatureEnabled(featureId: FeatureId): boolean {
  const { isFeatureEnabled } = useFeatures()
  return isFeatureEnabled(featureId)
}

// Convenience hook to get navigation for current persona
export function useNavigation(): NavItemConfig[] {
  const { getNavigation } = useFeatures()
  return getNavigation()
}

// Convenience hook to get dashboard widgets for current persona
export function useDashboardWidgets(): WidgetConfig[] {
  const { getDashboardWidgets } = useFeatures()
  return getDashboardWidgets()
}

// Convenience hook to get current persona feature
export function useCurrentPersona(): PersonaFeature | undefined {
  const { currentPersonaId, getPersona } = useFeatures()
  return getPersona(currentPersonaId)
}

// Convenience hook to get outcomes for current persona
export function useOutcomes(): OutcomeFeature[] {
  const { currentPersonaId, enabledFeatures } = useFeatures()
  const persona = featureRegistry.getPersona(currentPersonaId)
  if (!persona) return []

  return persona.outcomes.filter(o => enabledFeatures.has(o.id))
}

// Convenience hook to get scenarios for an outcome
export function useScenarios(outcomeId: string): ScenarioFeature[] {
  const { currentPersonaId, enabledFeatures } = useFeatures()
  const outcome = featureRegistry.getOutcome(currentPersonaId, outcomeId)
  if (!outcome) return []

  return outcome.scenarios.filter(s => enabledFeatures.has(s.id))
}
