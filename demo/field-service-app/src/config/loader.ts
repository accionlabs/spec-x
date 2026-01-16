import type { AppConfig } from './types'
import { DEFAULT_CONFIG, CONFIG_SERVER_URL } from './defaults'

// Known persona IDs - these are NOT config names
const PERSONA_IDS = ['technician', 'dispatcher', 'manager']

/**
 * Parses the URL to extract config name and persona
 *
 * URL patterns:
 *   /{configName}/{personaId}  -> config: configName, persona: personaId
 *   /{personaId}               -> config: null (use active), persona: personaId
 *   /                          -> config: null, persona: null (landing page)
 *
 * Examples:
 *   /acme-corp/technician      -> { configName: 'acme-corp', personaId: 'technician' }
 *   /full-featured/dispatcher  -> { configName: 'full-featured', personaId: 'dispatcher' }
 *   /technician                -> { configName: null, personaId: 'technician' }
 *   /                          -> { configName: null, personaId: null }
 */
export function parsePathInfo(): { configName: string | null; personaId: string | null } {
  const path = window.location.pathname
  const segments = path.replace(/^\//, '').split('/').filter(Boolean)

  if (segments.length === 0) {
    return { configName: null, personaId: null }
  }

  // Check if first segment is a persona ID
  if (PERSONA_IDS.includes(segments[0])) {
    // Pattern: /{personaId}/...
    return { configName: null, personaId: segments[0] }
  }

  // First segment is not a persona, so it's a config name
  if (segments.length >= 2 && PERSONA_IDS.includes(segments[1])) {
    // Pattern: /{configName}/{personaId}/...
    return { configName: segments[0], personaId: segments[1] }
  }

  // First segment is a config name but no persona specified
  // Pattern: /{configName} (will redirect to landing with config)
  return { configName: segments[0], personaId: null }
}

/**
 * Extracts config name from URL path
 * @deprecated Use parsePathInfo() instead for full path parsing
 */
export function getConfigNameFromPath(): string | null {
  return parsePathInfo().configName
}

/**
 * Gets the persona ID from the URL path
 */
export function getPersonaFromPath(): string | null {
  return parsePathInfo().personaId
}

/**
 * Fetches a specific configuration by name
 */
export async function fetchConfigByName(name: string): Promise<AppConfig> {
  try {
    const response = await fetch(`${CONFIG_SERVER_URL}/config/${name}`)

    if (!response.ok) {
      console.warn(`Config '${name}' not found, using defaults`)
      return DEFAULT_CONFIG
    }

    const config = await response.json()
    return { ...config, _configName: name } as AppConfig
  } catch (error) {
    console.warn(`Failed to fetch config '${name}':`, error)
    return DEFAULT_CONFIG
  }
}

/**
 * Fetches the configuration from the config server
 * Requires a config name - no default/active config fallback
 */
export async function fetchConfig(): Promise<AppConfig> {
  const configName = getConfigNameFromPath()

  // No default config - must have a config name
  if (!configName) {
    console.warn('No config name specified in URL')
    return {
      ...DEFAULT_CONFIG,
      features: { personas: [], scenarios: [] }  // Empty config
    }
  }

  return fetchConfigByName(configName)
}

/**
 * Fetches just the config version for quick staleness checks
 * If a config name is specified (or from URL path), checks that specific config
 */
export async function fetchConfigVersion(configName?: string | null): Promise<{ version: string; generatedAt: string | null }> {
  // Use the config name from path if not explicitly provided
  const name = configName ?? getConfigNameFromPath()

  try {
    // If we have a specific config name, fetch that config's version
    if (name) {
      const response = await fetch(`${CONFIG_SERVER_URL}/config/${name}`)
      if (!response.ok) {
        return { version: DEFAULT_CONFIG.version, generatedAt: null }
      }
      const config = await response.json()
      return { version: config.version, generatedAt: config.generatedAt }
    }

    // Otherwise fetch the active config's version
    const response = await fetch(`${CONFIG_SERVER_URL}/config/version`)

    if (!response.ok) {
      return { version: DEFAULT_CONFIG.version, generatedAt: null }
    }

    return await response.json()
  } catch (error) {
    console.warn('Failed to fetch config version:', error)
    return { version: DEFAULT_CONFIG.version, generatedAt: null }
  }
}
