import { useState } from 'react'
import { Wifi, WifiOff, Globe, Link, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Copy, Check, Terminal, Server } from 'lucide-react'

// The install URL - update this to your actual hosted install script
const INSTALL_SCRIPT_URL = 'https://your-server.com/sync/install.sh'

interface Constraints {
  offlineFirst: boolean
  languages: string[]
  infrastructure: string
  syncUrl?: string
}

interface DeploymentStepProps {
  constraints: Constraints
  onConstraintsChange: (constraints: Constraints) => void
}

const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Spanish' },
  { id: 'pt', name: 'Portuguese' },
]

export default function DeploymentStep({ constraints, onConstraintsChange }: DeploymentStepProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const requiresSync = constraints.infrastructure !== 'individual'

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCommand(id)
      setTimeout(() => setCopiedCommand(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

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
      {/* Offline-First Toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
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
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              constraints.offlineFirst ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                constraints.offlineFirst ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {constraints.offlineFirst && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <strong>Benefits:</strong> Instant response, works in airplane mode,
              zero server costs for individual users.
            </div>
          </div>
        )}
      </div>

      {/* Language Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Languages</div>
            <div className="text-sm text-gray-500">Select supported languages for the application</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = constraints.languages.includes(lang.id)
            return (
              <button
                key={lang.id}
                onClick={() => toggleLanguage(lang.id)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
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

      {/* Sync Server URL - only shown for team+ infrastructure */}
      {requiresSync && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
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
              className="px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
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

          {/* Setup Guide Toggle */}
          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="mt-4 w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">Need to set up a sync server?</span>
            </div>
            {showSetupGuide ? (
              <ChevronUp className="w-5 h-5 text-purple-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-purple-600" />
            )}
          </button>

          {/* Expandable Setup Guide */}
          {showSetupGuide && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">One-Line Install</div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-500">
                  <Terminal className="w-3 h-3" />
                  Requires Docker
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Run this command in your terminal. It will automatically set up CouchDB with auto-restart enabled.
              </p>

              {/* Install Command */}
              <div className="relative">
                <div className="bg-gray-900 text-gray-100 px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>curl -sL {INSTALL_SCRIPT_URL} | bash</code>
                </div>
                <button
                  onClick={() => copyToClipboard(`curl -sL ${INSTALL_SCRIPT_URL} | bash`, 'install')}
                  className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedCommand === 'install' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-300" />
                  )}
                </button>
              </div>

              {/* What the script does */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="font-medium text-gray-600">The installer will:</div>
                <ul className="list-disc list-inside space-y-0.5 ml-1">
                  <li>Check for Docker (with install instructions if missing)</li>
                  <li>Set up Tailscale for remote access (no public IP needed)</li>
                  <li>Set up CouchDB with CORS enabled</li>
                  <li>Configure auto-restart on system boot</li>
                  <li>Initialize sync databases</li>
                </ul>
              </div>

              {/* Tailscale info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-500 flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-xs text-blue-700">
                    <strong>Tailscale</strong> provides a secure private network so team members can access the sync server even without a public IP. Each team member will need to install Tailscale and join the same network.
                  </div>
                </div>
              </div>

              {/* After Install */}
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="text-xs font-medium text-gray-600">After installation, use one of these Sync URLs:</div>

                {/* Local URL */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">For local testing:</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono">
                      http://localhost:5984
                    </code>
                    <button
                      onClick={() => {
                        copyToClipboard('http://localhost:5984', 'local')
                        onConstraintsChange({ ...constraints, syncUrl: 'http://localhost:5984' })
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      {copiedCommand === 'local' ? 'Applied!' : 'Use'}
                    </button>
                  </div>
                </div>

                {/* Tailscale URL */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">For team access (Tailscale IP from installer output):</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm font-mono text-purple-700">
                      http://&lt;tailscale-ip&gt;:5984
                    </code>
                    <span className="px-3 py-2 text-xs text-purple-600 font-medium">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The installer will display your Tailscale IP. Use that URL for team sync.
                  </p>
                </div>
              </div>

              {/* Admin Access - Collapsed */}
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Admin dashboard credentials
                </summary>
                <div className="mt-2 pl-4 space-y-1 text-xs text-gray-500">
                  <div>
                    Dashboard: <a href="http://localhost:5984/_utils" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">localhost:5984/_utils</a>
                  </div>
                  <div>Username: <code className="px-1 py-0.5 bg-gray-200 rounded">admin</code></div>
                  <div>Password: <code className="px-1 py-0.5 bg-gray-200 rounded">password</code></div>
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Info box */}
      {!requiresSync && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="text-blue-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-blue-800">No Server Required</div>
              <div className="text-sm text-blue-700">
                Since you selected Individual mode, your app works completely offline.
                All data is stored locally on the device. You can add a sync server later
                if you decide to scale up.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
