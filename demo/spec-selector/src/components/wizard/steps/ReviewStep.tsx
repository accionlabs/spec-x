import { useState } from 'react'
import {
  Users, Database, GitBranch, Settings, Globe, Server,
  WifiOff, Cloud, Building2, CheckCircle, Zap
} from 'lucide-react'
import type { SpecState } from '../../../App'

interface Scenario {
  id: string
  name: string
  price: number
  included?: boolean
}

interface Outcome {
  id: string
  name: string
  scenarios: Scenario[]
}

interface Persona {
  id: string
  name: string
  basePrice: number
  outcomes: Outcome[]
}

interface Ontology {
  personas: Persona[]
}

interface ReviewStepProps {
  spec: SpecState
  ontology: Ontology
  configName: string
  onConfigNameChange: (name: string) => void
  existingConfigs: string[]
}

const INFRASTRUCTURE_LABELS: Record<string, { name: string; icon: React.ReactNode }> = {
  individual: { name: 'Individual (No Server)', icon: <WifiOff className="w-5 h-5" /> },
  team: { name: 'Small Team', icon: <Server className="w-5 h-5" /> },
  department: { name: 'Department', icon: <Cloud className="w-5 h-5" /> },
  enterprise: { name: 'Enterprise', icon: <Building2 className="w-5 h-5" /> },
}

export default function ReviewStep({
  spec,
  ontology,
  configName,
  onConfigNameChange,
  existingConfigs,
}: ReviewStepProps) {
  const [nameError, setNameError] = useState<string | null>(null)

  // Get active personas (those with selected scenarios)
  const activePersonas = ontology.personas.filter(persona =>
    persona.outcomes.some(o => o.scenarios.some(s => spec.selectedScenarios.has(s.id)))
  )

  // Count selected scenarios
  const selectedScenarioCount = spec.selectedScenarios.size

  // Count custom fields
  const customFieldCount = Object.values(spec.customFields).flat().length

  // Count custom states
  const customStateCount = spec.customWorkflowStates.length

  // Get user count
  const userCount = spec.users.length

  // Infrastructure info
  const infrastructure = INFRASTRUCTURE_LABELS[spec.constraints.infrastructure]

  // Validate config name
  const handleNameChange = (name: string) => {
    onConfigNameChange(name)

    const urlSafeName = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    if (urlSafeName && existingConfigs.includes(urlSafeName)) {
      setNameError('A configuration with this name already exists')
    } else {
      setNameError(null)
    }
  }

  const urlPreview = configName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') || 'my-app'

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Team Size */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              {infrastructure.icon}
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Team Size</div>
              <div className="font-semibold text-gray-900">{infrastructure.name}</div>
            </div>
          </div>
        </div>

        {/* Personas */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Personas</div>
              <div className="font-semibold text-gray-900">{activePersonas.length} active</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {activePersonas.map(p => (
              <span key={p.id} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Features</div>
              <div className="font-semibold text-gray-900">{selectedScenarioCount} selected</div>
            </div>
          </div>
        </div>

        {/* Data Model */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Custom Fields</div>
              <div className="font-semibold text-gray-900">
                {customFieldCount === 0 ? 'None' : `${customFieldCount} fields`}
              </div>
            </div>
          </div>
        </div>

        {/* Workflow */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Custom States</div>
              <div className="font-semibold text-gray-900">
                {customStateCount === 0 ? 'None' : `${customStateCount} states`}
              </div>
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Languages</div>
              <div className="font-semibold text-gray-900">
                {spec.constraints.languages.length} selected
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {spec.constraints.languages.map(lang => (
              <span key={lang} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Users Summary */}
      {spec.constraints.infrastructure !== 'individual' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Users Configured</div>
              <div className="font-semibold text-gray-900">
                {userCount === 0 ? 'No users added yet' : `${userCount} user${userCount !== 1 ? 's' : ''}`}
              </div>
            </div>
            {userCount > 0 && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        </div>
      )}

      {/* Config Name Input */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Name Your App</h3>
        </div>
        <p className="text-sm text-blue-800 mb-4">
          This name will be used in the app URL and to identify your configuration.
        </p>
        <input
          type="text"
          value={configName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., acme-field-service"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white ${
            nameError ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {nameError && (
          <p className="text-sm text-red-600 mt-2">{nameError}</p>
        )}
        <div className="text-xs text-blue-700 mt-2">
          URL preview: <span className="font-mono bg-white/50 px-2 py-0.5 rounded">localhost:3001/{urlPreview}</span>
        </div>
      </div>

      {/* Ready to Generate */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <div className="font-medium text-green-800">Ready to Generate</div>
            <div className="text-sm text-green-700">
              Click "Generate App" below to create your custom field service application.
              After generation, you'll be able to launch and test your app immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
