import { Wifi, WifiOff, Globe, Server, Cloud, Building2, Link, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface LanguageOption {
  id: string
  name: string
  default?: boolean
}

interface InfrastructureOption {
  id: string
  name: string
  cost?: string
  default?: boolean
  description?: string
  users?: string
}

interface Constraint {
  id: string
  name: string
  default?: boolean | string
  type?: string
  description?: string
  options?: LanguageOption[] | InfrastructureOption[]
}

interface Ontology {
  constraints: Constraint[]
}

interface Constraints {
  offlineFirst: boolean
  languages: string[]
  infrastructure: string
  syncUrl?: string
}

interface ConstraintPanelProps {
  ontology: Ontology
  constraints: Constraints
  onConstraintsChange: (constraints: Constraints) => void
}

const INFRASTRUCTURE_ICONS: Record<string, React.ReactNode> = {
  individual: <WifiOff className="w-5 h-5" />,
  team: <Server className="w-5 h-5" />,
  department: <Cloud className="w-5 h-5" />,
  enterprise: <Building2 className="w-5 h-5" />,
}

const INFRASTRUCTURE_DESCRIPTIONS: Record<string, string> = {
  individual: 'Works completely offline. Data stored locally on device. Perfect for single users.',
  team: 'Sync via Raspberry Pi or $5 VPS. Great for small teams sharing data.',
  department: 'CouchDB server with backups. Suitable for departmental use.',
  enterprise: 'Clustered CouchDB with HA. Full enterprise deployment.',
}

// Personas available at each infrastructure level
const INFRASTRUCTURE_PERSONAS: Record<string, string[]> = {
  individual: ['Technician'],
  team: ['Technician', 'Dispatcher'],
  department: ['Technician', 'Dispatcher', 'Manager'],
  enterprise: ['Technician', 'Dispatcher', 'Manager'],
}

export default function ConstraintPanel({ ontology, constraints, onConstraintsChange }: ConstraintPanelProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)

  const languageConstraint = ontology.constraints.find(c => c.id === 'language')
  const infrastructureConstraint = ontology.constraints.find(c => c.id === 'infrastructure')

  const testSyncConnection = async () => {
    if (!constraints.syncUrl) return

    setSyncStatus('testing')
    setSyncError(null)

    try {
      const response = await fetch(`${constraints.syncUrl}/_up`, {
        method: 'GET',
        mode: 'cors',
      })

      if (response.ok) {
        setSyncStatus('success')
      } else {
        setSyncStatus('error')
        setSyncError(`Server returned ${response.status}`)
      }
    } catch (err) {
      setSyncStatus('error')
      setSyncError('Could not connect to server')
    }
  }

  const toggleLanguage = (lang: string) => {
    const current = new Set(constraints.languages)
    if (current.has(lang)) {
      if (current.size > 1) {
        current.delete(lang)
      }
    } else {
      current.add(lang)
    }
    onConstraintsChange({ ...constraints, languages: Array.from(current) })
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Deployment Settings</h2>
        <p className="text-sm text-gray-500">Configure infrastructure and deployment options</p>
      </div>

      {/* Offline-First Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              constraints.offlineFirst ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {constraints.offlineFirst ? <WifiOff className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Offline-First Mode</div>
              <div className="text-sm text-gray-500">
                {constraints.offlineFirst
                  ? 'App works without network. Data syncs when online.'
                  : 'Requires network connection for all operations.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => onConstraintsChange({ ...constraints, offlineFirst: !constraints.offlineFirst })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              constraints.offlineFirst ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                constraints.offlineFirst ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {constraints.offlineFirst && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Local-First Benefits:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Instant response - no network latency</li>
                <li>Works in airplane mode, subway, remote sites</li>
                <li>Zero server costs for individual users</li>
                <li>Data stays on device until you choose to sync</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Language Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Languages</div>
            <div className="text-sm text-gray-500">Select supported languages for the application</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {((languageConstraint?.options as LanguageOption[]) || [
            { id: 'en', name: 'English' },
            { id: 'es', name: 'Spanish' },
            { id: 'pt', name: 'Portuguese' }
          ]).map((lang) => {
            const isSelected = constraints.languages.includes(lang.id)
            return (
              <button
                key={lang.id}
                onClick={() => toggleLanguage(lang.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Infrastructure Level */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="mb-4">
          <div className="font-semibold text-gray-900">Infrastructure Level</div>
          <div className="text-sm text-gray-500">Choose your deployment scale - you can upgrade anytime</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {((infrastructureConstraint?.options as InfrastructureOption[]) || [
            { id: 'individual', name: 'Individual (No Server)', cost: '$0/mo' },
            { id: 'team', name: 'Small Team', cost: '$5-35/mo' },
            { id: 'department', name: 'Department', cost: '$50-200/mo' },
            { id: 'enterprise', name: 'Enterprise', cost: 'Custom' },
          ]).map((option) => {
            const isSelected = constraints.infrastructure === option.id
            return (
              <button
                key={option.id}
                onClick={() => onConstraintsChange({ ...constraints, infrastructure: option.id })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {INFRASTRUCTURE_ICONS[option.id]}
                  </div>
                  <div>
                    <div className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                      {option.name}
                    </div>
                    <div className={`text-sm font-semibold ${isSelected ? 'text-purple-600' : 'text-gray-500'}`}>
                      {option.cost}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {INFRASTRUCTURE_DESCRIPTIONS[option.id]}
                </p>
                <div className="flex flex-wrap gap-1">
                  {INFRASTRUCTURE_PERSONAS[option.id]?.map((persona) => (
                    <span
                      key={persona}
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        isSelected
                          ? 'bg-purple-200 text-purple-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {persona}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sync Server URL - only shown for team+ infrastructure */}
      {constraints.infrastructure !== 'individual' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Link className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Sync Server URL</div>
              <div className="text-sm text-gray-500">CouchDB server for data synchronization</div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="url"
                value={constraints.syncUrl || ''}
                onChange={(e) => {
                  setSyncStatus('idle')
                  onConstraintsChange({ ...constraints, syncUrl: e.target.value })
                }}
                placeholder="http://localhost:5984"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
              {syncStatus === 'success' && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
              {syncStatus === 'error' && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>
            <button
              onClick={testSyncConnection}
              disabled={!constraints.syncUrl || syncStatus === 'testing'}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {syncStatus === 'testing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Test'
              )}
            </button>
          </div>

          {syncStatus === 'success' && (
            <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Connection successful!
            </p>
          )}
          {syncStatus === 'error' && syncError && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              {syncError}
            </p>
          )}

          <p className="mt-3 text-xs text-gray-500">
            For local development, run: <code className="bg-gray-100 px-1 py-0.5 rounded">docker compose up</code> in the sync-server directory
          </p>
        </div>
      )}

      {/* Progressive Infrastructure Note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-blue-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-blue-800">Progressive Infrastructure</div>
            <div className="text-sm text-blue-700">
              Start with no server at all. When you need to share data with a team, just add a CouchDB URL.
              The same app code works at every scale - from individual to enterprise cluster.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
