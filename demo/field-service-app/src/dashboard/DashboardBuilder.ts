import { featureRegistry } from '../features/registry'
import type { PersonaId } from '../features/theme/types'
import type { WidgetConfig, FeatureConfig } from '../features/registry/types'

export function buildDashboard(personaId: PersonaId, config?: FeatureConfig): WidgetConfig[] {
  // Get enabled features
  const enabledFeatures = config
    ? featureRegistry.getEnabledFeatures(config)
    : featureRegistry.getEnabledFeatures({ personas: [personaId] })

  // Get dashboard widgets for the persona
  return featureRegistry.getDashboardWidgets(personaId, enabledFeatures)
}
