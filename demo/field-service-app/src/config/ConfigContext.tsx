import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { AppConfig } from './types'
import { DEFAULT_CONFIG } from './defaults'
import { fetchConfig, fetchConfigVersion, getConfigNameFromPath } from './loader'

interface ConfigContextValue {
  config: AppConfig
  configName: string | null
  isLoading: boolean
  isStale: boolean
  initialVersion: string
  currentVersion: string
  refreshConfig: () => Promise<void>
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

// Poll interval for checking config staleness (30 seconds)
const POLL_INTERVAL = 30000

interface ConfigProviderProps {
  children: ReactNode
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [configName, setConfigName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialVersion, setInitialVersion] = useState<string>('')
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [isStale, setIsStale] = useState(false)

  // Load config on mount
  useEffect(() => {
    const loadInitialConfig = async () => {
      setIsLoading(true)
      const loadedConfig = await fetchConfig()
      setConfig(loadedConfig)
      setConfigName(loadedConfig._configName || null)
      setInitialVersion(loadedConfig.version)
      setCurrentVersion(loadedConfig.version)
      setIsLoading(false)
    }

    loadInitialConfig()
  }, [])

  // Poll for config version changes
  // Skip polling for path-based configs (presets) since they don't change
  useEffect(() => {
    if (isLoading) return

    // If this is a path-based config (preset), skip staleness checking
    // Presets are static and don't change
    const pathConfig = getConfigNameFromPath()
    if (pathConfig) {
      return // No polling needed for presets
    }

    const checkForUpdates = async () => {
      const { version } = await fetchConfigVersion()
      setCurrentVersion(version)

      // Only mark as stale if version changed and we had a valid initial version
      if (version !== initialVersion && initialVersion !== '0' && initialVersion !== '') {
        setIsStale(true)
      }
    }

    const intervalId = setInterval(checkForUpdates, POLL_INTERVAL)

    return () => clearInterval(intervalId)
  }, [isLoading, initialVersion])

  const refreshConfig = useCallback(async () => {
    setIsLoading(true)
    const loadedConfig = await fetchConfig()
    setConfig(loadedConfig)
    setConfigName(loadedConfig._configName || null)
    setInitialVersion(loadedConfig.version)
    setCurrentVersion(loadedConfig.version)
    setIsStale(false)
    setIsLoading(false)
  }, [])

  const value: ConfigContextValue = {
    config,
    configName,
    isLoading,
    isStale,
    initialVersion,
    currentVersion,
    refreshConfig
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

export function useWorkflowStates() {
  const { config } = useConfig()
  return config.workflowStates
}

export function useCustomFields() {
  const { config } = useConfig()
  return config.customFields
}

export function useEnabledPersonas() {
  const { config } = useConfig()
  return config.features.personas
}

export function useConstraints() {
  const { config } = useConfig()
  return config.constraints
}

export function useEnabledScenarios() {
  const { config } = useConfig()
  return config.features.scenarios || []
}

export function useIsScenarioEnabled(scenarioId: string) {
  const scenarios = useEnabledScenarios()
  return scenarios.includes(scenarioId)
}

export function useEnabledLanguages() {
  const { config } = useConfig()
  return config.constraints.languages || ['en']
}
