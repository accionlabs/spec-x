import { featureRegistry } from '../features/registry'
import type { PersonaId } from '../features/theme/types'
import type { NavItemConfig, FeatureConfig } from '../features/registry/types'

export function buildNavigation(personaId: PersonaId, config?: FeatureConfig): NavItemConfig[] {
  // Get enabled features
  const enabledFeatures = config
    ? featureRegistry.getEnabledFeatures(config)
    : featureRegistry.getEnabledFeatures({ personas: [personaId] })

  // Get navigation items for the persona
  return featureRegistry.getNavigation(personaId, enabledFeatures)
}

export function getOutcomeNavItems(personaId: PersonaId): NavItemConfig[] {
  const persona = featureRegistry.getPersona(personaId)
  if (!persona) return []

  return persona.outcomes
    .filter(o => o.navItem)
    .map(o => o.navItem!)
    .sort((a, b) => a.order - b.order)
}
