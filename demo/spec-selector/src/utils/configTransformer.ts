import bcrypt from 'bcryptjs'
import type { SpecState, CustomField, CustomState, AuthUser, AuthTier } from '../App'
import ontology from '../data/field-service-ontology.json'

const CONFIG_SERVER_URL = 'http://localhost:3002'

/**
 * Config info from the server
 */
export interface ConfigInfo {
  id: string
  name: string
  description: string
  isPreset: boolean
  personas: string[]
  generatedAt?: string
}

/**
 * Generated config structure that the field-service-app consumes
 */
export interface GeneratedConfig {
  version: string
  generatedAt: string

  features: {
    personas: string[]
    scenarios: string[]
  }

  customFields: {
    workOrder: Array<{
      id: string
      name: string
      type: string
      label: string
      required: boolean
      options?: string[]
    }>
  }

  workflowStates: Array<{
    id: string
    name: string
    color: string
    isCustom: boolean
  }>

  constraints: {
    offlineFirst: boolean
    languages: string[]
    infrastructure: string
    syncUrl?: string
  }

  authentication: {
    method: 'basic' | 'pin-device' | 'magic-link' | 'oidc'
    mfaEnabled: boolean
    userManagementEnabled: boolean
    auditLoggingEnabled: boolean
  }

  users: Array<{
    id: string
    email: string
    name: string
    passwordHash?: string
    persona: string
    permissions: string[]
  }>
}

/**
 * Maps scenario IDs to their parent persona ID
 */
function getScenarioToPersonaMap(): Map<string, string> {
  const map = new Map<string, string>()

  for (const persona of ontology.personas) {
    for (const outcome of persona.outcomes) {
      for (const scenario of outcome.scenarios) {
        map.set(scenario.id, persona.id)
      }
    }
  }

  return map
}

// Infrastructure levels that provide sync capability
const SYNC_ENABLED_INFRASTRUCTURE = ['team', 'department', 'enterprise']

/**
 * Determines which personas are enabled based on selected scenarios and infrastructure
 * Sync-required personas (dispatcher, manager) are filtered out when infrastructure is 'individual'
 */
function getEnabledPersonas(selectedScenarios: Set<string>, infrastructure: string): string[] {
  const scenarioToPersona = getScenarioToPersonaMap()
  const enabledPersonas = new Set<string>()

  for (const scenarioId of selectedScenarios) {
    const personaId = scenarioToPersona.get(scenarioId)
    if (personaId) {
      enabledPersonas.add(personaId)
    }
  }

  // Filter out sync-required personas when infrastructure doesn't support sync
  const hasSyncCapability = SYNC_ENABLED_INFRASTRUCTURE.includes(infrastructure)

  if (!hasSyncCapability) {
    const filteredPersonas = Array.from(enabledPersonas).filter(personaId => {
      const persona = ontology.personas.find(p => p.id === personaId)
      // Keep persona if it doesn't require sync (or if requiresSync is not defined)
      return !persona?.requiresSync
    })
    return filteredPersonas
  }

  // Ontology persona IDs now match app persona IDs directly
  return Array.from(enabledPersonas)
}

/**
 * Gets the default workflow states from the ontology
 */
function getDefaultWorkflowStates(): Array<{ id: string; name: string; color: string; isCustom: boolean }> {
  const workflow = ontology.workflows['work-order-status']

  // Map ontology colors to Tailwind classes
  const colorToTailwind: Record<string, string> = {
    '#6B7280': 'bg-gray-500',
    '#3B82F6': 'bg-blue-500',
    '#F59E0B': 'bg-yellow-500',
    '#10B981': 'bg-green-500',
    '#EF4444': 'bg-red-500',
    '#8B5CF6': 'bg-purple-500'
  }

  return workflow.states.map(state => ({
    id: state.id,
    name: state.name,
    color: colorToTailwind[state.color] || 'bg-gray-500',
    isCustom: false
  }))
}

/**
 * Transforms custom fields from the spec to the config format
 */
function transformCustomFields(customFields: Record<string, CustomField[]>): GeneratedConfig['customFields'] {
  const workOrderFields = customFields['work-order'] || []

  return {
    workOrder: workOrderFields.map(field => ({
      id: field.id,
      name: field.name,
      type: field.type,
      label: field.name, // Use name as label
      required: field.required,
      options: field.options
    }))
  }
}

/**
 * Transforms custom workflow states to include with defaults
 */
function transformWorkflowStates(customStates: CustomState[]): GeneratedConfig['workflowStates'] {
  const defaultStates = getDefaultWorkflowStates()

  // Add custom states after 'in-progress' but before terminal states
  const insertIndex = defaultStates.findIndex(s => s.id === 'complete')

  const customMapped = customStates.map(state => ({
    id: state.id,
    name: state.name,
    color: state.color.startsWith('bg-') ? state.color : `bg-${state.color}-500`,
    isCustom: true
  }))

  // Insert custom states before 'complete' and 'cancelled'
  const result = [
    ...defaultStates.slice(0, insertIndex),
    ...customMapped,
    ...defaultStates.slice(insertIndex)
  ]

  return result
}

/**
 * Transforms authentication settings from spec to config
 */
function transformAuthentication(spec: SpecState): GeneratedConfig['authentication'] {
  return {
    method: spec.authentication?.tier || 'basic',
    mfaEnabled: spec.authentication?.mfaEnabled || false,
    userManagementEnabled: spec.authentication?.userManagementEnabled || false,
    auditLoggingEnabled: spec.authentication?.auditLoggingEnabled || false
  }
}

/**
 * Transforms users from spec to config, hashing passwords with bcrypt
 */
async function transformUsers(users: AuthUser[]): Promise<GeneratedConfig['users']> {
  return Promise.all(users.map(async (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.password ? await bcrypt.hash(user.password, 10) : undefined,
    persona: user.persona,
    permissions: user.permissions
  })))
}

/**
 * Main transformer: converts SpecState to GeneratedConfig
 */
export async function transformSpecToConfig(spec: SpecState): Promise<GeneratedConfig> {
  const users = await transformUsers(spec.users || [])

  return {
    version: Date.now().toString(),
    generatedAt: new Date().toISOString(),

    features: {
      personas: getEnabledPersonas(spec.selectedScenarios, spec.constraints.infrastructure),
      scenarios: Array.from(spec.selectedScenarios)
    },

    customFields: transformCustomFields(spec.customFields),

    workflowStates: transformWorkflowStates(spec.customWorkflowStates),

    constraints: {
      offlineFirst: spec.constraints.offlineFirst,
      languages: spec.constraints.languages,
      infrastructure: spec.constraints.infrastructure,
      syncUrl: spec.constraints.syncUrl
    },

    authentication: transformAuthentication(spec),

    users
  }
}

/**
 * Posts the generated config to the config server
 * Config name is required - each deployment must have a unique name
 */
export async function postConfigToServer(config: GeneratedConfig, name: string): Promise<{ success: boolean; appUrl?: string }> {
  if (!name) {
    console.error('Config name is required')
    return { success: false }
  }

  try {
    const configWithName = { ...config, _name: name }
    const response = await fetch(`${CONFIG_SERVER_URL}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configWithName)
    })

    if (!response.ok) {
      console.error('Failed to post config:', response.statusText)
      return { success: false }
    }

    const result = await response.json()
    console.log('Config saved successfully:', result)
    return {
      success: true,
      appUrl: result.appUrl || `http://localhost:3001/${name}`
    }
  } catch (error) {
    console.error('Error posting config to server:', error)
    return { success: false }
  }
}

/**
 * Fetches the list of available configurations
 */
export async function fetchConfigList(): Promise<{ configs: ConfigInfo[], active: string }> {
  try {
    const response = await fetch(`${CONFIG_SERVER_URL}/configs`)
    if (!response.ok) {
      return { configs: [], active: 'default' }
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching config list:', error)
    return { configs: [], active: 'default' }
  }
}

/**
 * Fetches a specific configuration by name
 */
export async function fetchConfigByName(name: string): Promise<GeneratedConfig | null> {
  try {
    const response = await fetch(`${CONFIG_SERVER_URL}/config/${name}`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching config:', error)
    return null
  }
}

/**
 * Fetches the current active configuration
 */
export async function fetchActiveConfig(): Promise<GeneratedConfig | null> {
  try {
    const response = await fetch(`${CONFIG_SERVER_URL}/config`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching active config:', error)
    return null
  }
}

/**
 * Activates a specific configuration
 */
export async function activateConfig(name: string): Promise<boolean> {
  try {
    const response = await fetch(`${CONFIG_SERVER_URL}/config/activate/${name}`, {
      method: 'POST'
    })
    return response.ok
  } catch (error) {
    console.error('Error activating config:', error)
    return false
  }
}

/**
 * Reverse transforms: converts GeneratedConfig back to SpecState
 */
export function transformConfigToSpec(config: GeneratedConfig): SpecState {
  // Build selected scenarios from config
  const selectedScenarios = new Set<string>()

  // Add scenarios from config.features.scenarios
  if (config.features?.scenarios) {
    for (const scenarioId of config.features.scenarios) {
      selectedScenarios.add(scenarioId)
    }
  }

  // If no scenarios specified but personas are, add default scenarios for those personas
  if (selectedScenarios.size === 0 && config.features?.personas) {
    for (const personaId of config.features.personas) {
      // Persona IDs now match directly between ontology and app
      const persona = ontology.personas.find(p => p.id === personaId)
      if (persona) {
        for (const outcome of persona.outcomes) {
          for (const scenario of outcome.scenarios) {
            if (scenario.default) {
              selectedScenarios.add(scenario.id)
            }
          }
        }
      }
    }
  }

  // Transform custom fields
  const customFields: Record<string, CustomField[]> = {}
  if (config.customFields?.workOrder) {
    customFields['work-order'] = config.customFields.workOrder.map(field => ({
      id: field.id,
      name: field.name,
      type: field.type,
      required: field.required,
      options: field.options
    }))
  }

  // Transform custom workflow states (only custom ones)
  const customWorkflowStates: CustomState[] = config.workflowStates
    ?.filter(state => state.isCustom)
    .map(state => ({
      id: state.id,
      name: state.name,
      color: state.color
    })) || []

  // Transform authentication settings
  const authentication = {
    tier: (config.authentication?.method || 'basic') as AuthTier,
    mfaEnabled: config.authentication?.mfaEnabled || false,
    userManagementEnabled: config.authentication?.userManagementEnabled || false,
    auditLoggingEnabled: config.authentication?.auditLoggingEnabled || false
  }

  // Transform users (note: password hashes are not exposed back)
  const users: AuthUser[] = config.users?.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    password: undefined, // Password hash is not reversible
    persona: user.persona as 'technician' | 'dispatcher' | 'manager',
    permissions: user.permissions
  })) || []

  return {
    selectedScenarios,
    customFields,
    customWorkflowStates,
    constraints: {
      offlineFirst: config.constraints?.offlineFirst ?? true,
      languages: config.constraints?.languages ?? ['en'],
      infrastructure: config.constraints?.infrastructure ?? 'individual',
      syncUrl: config.constraints?.syncUrl
    },
    authentication,
    users
  }
}
