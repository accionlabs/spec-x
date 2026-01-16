import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import ontology from './data/field-service-ontology.json'
import { WizardContainer, type WizardStep } from './components/wizard'
import {
  WelcomeStep,
  TeamSizeStep,
  FeaturesStep,
  DataModelStep,
  WorkflowStep,
  DeploymentStep,
  UsersStep,
  ReviewStep,
} from './components/wizard/steps'
import GenerationTheater from './components/GenerationTheater'
import {
  fetchConfigList,
  fetchConfigByName,
  transformConfigToSpec,
  type ConfigInfo
} from './utils/configTransformer'

type AppMode = 'wizard' | 'generating' | 'complete' | 'edit'

export interface CustomField {
  id: string
  name: string
  type: string
  required: boolean
  options?: string[]
}

export interface CustomState {
  id: string
  name: string
  color: string
  // Position in workflow - the ID of the state this comes after
  insertAfter?: string
}

export type AuthTier = 'basic' | 'pin-device' | 'magic-link' | 'oidc'

export interface AuthUser {
  id: string
  email: string
  name: string
  password?: string
  persona: 'technician' | 'dispatcher' | 'manager'
  permissions: string[]
}

export interface SpecState {
  selectedScenarios: Set<string>
  customFields: Record<string, CustomField[]>
  customWorkflowStates: CustomState[]
  constraints: {
    offlineFirst: boolean
    languages: string[]
    infrastructure: string
    syncUrl?: string
  }
  authentication: {
    tier: AuthTier
    mfaEnabled: boolean
    userManagementEnabled: boolean
    auditLoggingEnabled: boolean
  }
  users: AuthUser[]
}

// Personas available at each infrastructure level
const INFRASTRUCTURE_PERSONAS: Record<string, string[]> = {
  individual: ['technician'],
  team: ['technician', 'dispatcher'],
  department: ['technician', 'dispatcher', 'manager'],
  enterprise: ['technician', 'dispatcher', 'manager'],
}

function getDefaultSpec(): SpecState {
  return {
    selectedScenarios: new Set(
      ontology.personas.flatMap(p =>
        p.outcomes.flatMap(o =>
          o.scenarios.filter(s => s.default).map(s => s.id)
        )
      )
    ),
    customFields: {},
    customWorkflowStates: [],
    constraints: {
      offlineFirst: true,
      languages: ['en'],
      infrastructure: 'individual'
    },
    authentication: {
      tier: 'basic',
      mfaEnabled: false,
      userManagementEnabled: false,
      auditLoggingEnabled: false
    },
    users: []
  }
}

function App() {
  const { configName: urlConfigName } = useParams<{ configName?: string }>()
  const navigate = useNavigate()

  const [mode, setMode] = useState<AppMode>('wizard')
  const [isLoading, setIsLoading] = useState(true)
  const [configList, setConfigList] = useState<ConfigInfo[]>([])
  const [configName, setConfigName] = useState('')
  const [generatedConfigName, setGeneratedConfigName] = useState('')
  const [spec, setSpec] = useState<SpecState>(getDefaultSpec())

  // Load config list on mount
  useEffect(() => {
    const loadConfigs = async () => {
      setIsLoading(true)
      try {
        const { configs } = await fetchConfigList()
        setConfigList(configs)
      } catch (error) {
        console.error('Error loading configs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfigs()
  }, [])

  // Load config from URL if configName is present
  useEffect(() => {
    const loadConfigFromUrl = async () => {
      if (urlConfigName) {
        setIsLoading(true)
        try {
          const config = await fetchConfigByName(urlConfigName)
          if (config) {
            const specState = transformConfigToSpec(config)
            setSpec(specState)
            setGeneratedConfigName(urlConfigName)
            setConfigName(urlConfigName)
            setMode('edit')
          }
        } catch (error) {
          console.error('Error loading config from URL:', error)
          // Config not found, stay in wizard mode
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadConfigFromUrl()
  }, [urlConfigName])

  // Get available personas based on infrastructure
  const availablePersonas = useMemo(() => {
    return INFRASTRUCTURE_PERSONAS[spec.constraints.infrastructure] || ['technician']
  }, [spec.constraints.infrastructure])

  // Build wizard steps
  const wizardSteps: WizardStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: 'Welcome',
      subtitle: 'Learn what you can build with this configurator',
      component: <WelcomeStep />,
      hideInEditMode: true, // Skip welcome in edit mode
    },
    {
      id: 'team-size',
      title: 'Team Size',
      subtitle: 'How big is your team?',
      component: (
        <TeamSizeStep
          selectedSize={spec.constraints.infrastructure}
          onSizeChange={(size) => setSpec(prev => ({
            ...prev,
            constraints: { ...prev.constraints, infrastructure: size }
          }))}
        />
      ),
      validate: () => !!spec.constraints.infrastructure,
    },
    {
      id: 'features',
      title: 'Features',
      subtitle: 'What do you need to do?',
      component: (
        <FeaturesStep
          ontology={ontology}
          selectedScenarios={spec.selectedScenarios}
          onSelectionChange={(scenarios) => setSpec(prev => ({ ...prev, selectedScenarios: scenarios }))}
          infrastructure={spec.constraints.infrastructure}
        />
      ),
      validate: () => spec.selectedScenarios.size > 0,
    },
    {
      id: 'data-model',
      title: 'Data Model',
      subtitle: 'Customize your work orders',
      component: (
        <DataModelStep
          ontology={ontology}
          customFields={spec.customFields}
          onCustomFieldsChange={(fields) => setSpec(prev => ({ ...prev, customFields: fields }))}
        />
      ),
      isOptional: true,
      canSkip: true,
    },
    {
      id: 'workflow',
      title: 'Workflow',
      subtitle: 'Define your process',
      component: (
        <WorkflowStep
          ontology={ontology}
          customStates={spec.customWorkflowStates}
          onCustomStatesChange={(states) => setSpec(prev => ({ ...prev, customWorkflowStates: states }))}
        />
      ),
      isOptional: true,
      canSkip: true,
    },
    {
      id: 'deployment',
      title: 'Deployment',
      subtitle: 'Configure deployment options',
      component: (
        <DeploymentStep
          constraints={spec.constraints}
          onConstraintsChange={(constraints) => setSpec(prev => ({ ...prev, constraints }))}
        />
      ),
      validate: () => {
        // If not individual mode, sync URL should be provided
        if (spec.constraints.infrastructure !== 'individual') {
          return !!spec.constraints.syncUrl
        }
        return true
      },
    },
    {
      id: 'users',
      title: 'Users',
      subtitle: 'Set up your team',
      component: (
        <UsersStep
          users={spec.users}
          onUsersChange={(users) => setSpec(prev => ({ ...prev, users }))}
          infrastructure={spec.constraints.infrastructure}
          availablePersonas={availablePersonas}
        />
      ),
      isOptional: spec.constraints.infrastructure === 'individual',
      canSkip: true,
    },
    {
      id: 'review',
      title: 'Review',
      subtitle: 'Review and generate your app',
      component: (
        <ReviewStep
          spec={spec}
          ontology={ontology}
          configName={configName}
          onConfigNameChange={setConfigName}
          existingConfigs={configList.map(c => c.id)}
        />
      ),
      validate: () => {
        if (!configName.trim()) return false
        const urlSafeName = configName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        // In edit mode, allow same config name (we're updating)
        if (mode === 'edit' && urlSafeName === generatedConfigName) return true
        return !configList.some(c => c.id === urlSafeName)
      },
      hideInEditMode: true, // Skip review in edit mode (use save instead)
    },
  ], [spec, configName, configList, availablePersonas, mode, generatedConfigName])

  const handleWizardComplete = () => {
    const urlSafeName = configName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    setGeneratedConfigName(urlSafeName || 'custom')
    setMode('generating')
  }

  const handleGenerationComplete = () => {
    // Navigate to the config URL so it's bookmarkable
    navigate(`/${generatedConfigName}`)
    setMode('complete')
  }

  const handleLaunchApp = () => {
    const url = generatedConfigName
      ? `http://localhost:3001/${generatedConfigName}`
      : 'http://localhost:3001'
    window.open(url, '_blank')
  }

  const handleEditMode = () => {
    setMode('edit')
  }

  const handleRegenerate = () => {
    setMode('generating')
  }

  const handleSaveChanges = () => {
    // In edit mode, save changes triggers regeneration
    setMode('generating')
  }

  const handleStartOver = () => {
    setSpec(getDefaultSpec())
    setConfigName('')
    setGeneratedConfigName('')
    setMode('wizard')
    // Navigate to root to start fresh
    navigate('/')
  }

  // Loading state
  if (isLoading && configList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Generation Theater
  if (mode === 'generating' && generatedConfigName) {
    return <GenerationTheater spec={spec} configName={generatedConfigName} onComplete={handleGenerationComplete} />
  }

  // Generation Complete
  if (mode === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Generation Complete!</h1>
          <p className="text-gray-600 mb-8">
            Your custom Field Service App has been generated with all your specifications.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleLaunchApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-colors"
            >
              Launch Application
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleEditMode}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Edit Configuration
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Edit Mode - uses same wizard but with edit mode enabled
  if (mode === 'edit') {
    return (
      <WizardContainer
        steps={wizardSteps}
        onComplete={handleSaveChanges}
        spec={spec}
        ontology={ontology}
        isEditMode={true}
        configName={generatedConfigName}
        onLaunchApp={handleLaunchApp}
        onStartOver={handleStartOver}
      />
    )
  }

  // Wizard Mode (default)
  return (
    <WizardContainer
      steps={wizardSteps}
      onComplete={handleWizardComplete}
      spec={spec}
      ontology={ontology}
    />
  )
}

export default App
