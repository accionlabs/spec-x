import { useState } from 'react'
import { Wrench, Radio, Briefcase, Package, ArrowRight, Settings, Server, CheckCircle, XCircle, Loader2, Users, Copy, Check } from 'lucide-react'
import { PERSONA_THEMES } from '../theme'
import { parsePathInfo } from '../../config/loader'
import { useConfig } from '../../config'

// Format config name for display
function formatConfigName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Root landing page - no config specified, redirect to onboarding
function OnboardingRedirect() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Package className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Field Service Platform</h1>
        <p className="text-gray-600 mb-6">
          Build your custom field service application with the features your team needs.
        </p>

        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Configure Your App
          <ArrowRight className="w-5 h-5" />
        </a>

        <p className="text-xs text-gray-400 mt-6">
          Already have a deployment? Contact your administrator for your app URL.
        </p>
      </div>
    </div>
  )
}

// Personas that require a sync server to function
const SYNC_REQUIRED_PERSONAS = ['dispatcher', 'manager']

// Infrastructure labels
const INFRASTRUCTURE_LABELS: Record<string, string> = {
  individual: 'Individual',
  team: 'Small Team',
  department: 'Department',
  enterprise: 'Enterprise'
}

// Config landing page - clean splash screen
function ConfigLandingPage({ configName }: { configName: string }) {
  const { config, isLoading, refreshConfig } = useConfig()
  const [syncUrl, setSyncUrl] = useState('')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [copiedCommand, setCopiedCommand] = useState(false)

  // Check which personas are enabled in the config
  const enabledPersonas = config.features?.personas || []

  // Check if sync is available (syncUrl is configured)
  const hasSyncServer = Boolean(config.constraints?.syncUrl)

  // Check if this is a team configuration (not individual)
  const infrastructure = config.constraints?.infrastructure || 'individual'
  const isTeamConfig = infrastructure !== 'individual'
  const needsSyncSetup = isTeamConfig && !hasSyncServer

  // Test sync connection
  const testSyncConnection = async () => {
    if (!syncUrl) return

    setSyncStatus('testing')
    setSyncError(null)

    try {
      const response = await fetch(`${syncUrl}/_up`, {
        method: 'GET',
        mode: 'cors',
      })

      if (response.ok) {
        setSyncStatus('success')
        // Save to config server
        await saveSyncUrl(syncUrl)
      } else {
        setSyncStatus('error')
        setSyncError(`Server returned ${response.status}`)
      }
    } catch (err) {
      setSyncStatus('error')
      setSyncError('Could not connect to server')
    }
  }

  // Save sync URL to config
  const saveSyncUrl = async (url: string) => {
    try {
      const response = await fetch(`http://localhost:3002/config/${configName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          constraints: {
            ...config.constraints,
            syncUrl: url
          }
        })
      })
      if (response.ok) {
        // Refresh config to pick up the change
        await refreshConfig()
      }
    } catch (err) {
      console.error('Failed to save sync URL:', err)
    }
  }

  const copyInstallCommand = () => {
    navigator.clipboard.writeText('curl -sL https://raw.githubusercontent.com/accionlabs/spec-x/main/demo/sync-server/install.sh | bash')
    setCopiedCommand(true)
    setTimeout(() => setCopiedCommand(false), 2000)
  }

  const personas = [
    {
      id: 'technician',
      theme: PERSONA_THEMES.technician,
      icon: Wrench,
    },
    {
      id: 'dispatcher',
      theme: PERSONA_THEMES.dispatcher,
      icon: Radio,
    },
    {
      id: 'manager',
      theme: PERSONA_THEMES.manager,
      icon: Briefcase,
    },
  ].filter(p => {
    // Must be enabled in config
    if (!enabledPersonas.includes(p.id)) return false

    // Sync-required personas need a sync server
    if (SYNC_REQUIRED_PERSONAS.includes(p.id) && !hasSyncServer) return false

    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6">
      {/* App Icon */}
      <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-slate-800" />
      </div>

      {/* App Title */}
      <h1 className="text-3xl font-bold text-white mb-1">Field Service</h1>
      <p className="text-slate-400 mb-2">{formatConfigName(configName)}</p>

      {/* Team Badge - shows infrastructure level */}
      {isTeamConfig && (
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm">
            <Users className="w-4 h-4" />
            {INFRASTRUCTURE_LABELS[infrastructure]} Mode
          </span>
          {hasSyncServer && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm">
              <CheckCircle className="w-4 h-4" />
              Sync Active
            </span>
          )}
        </div>
      )}

      {!isTeamConfig && <div className="mb-8" />}

      {/* Sync Server Setup - shown when team config but no sync */}
      {needsSyncSetup && (
        <div className="w-full max-w-sm mb-8">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Server className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Sync Server Required</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Team mode requires a sync server to share data between users.
                </p>
              </div>
            </div>

            {/* Quick Install */}
            <div className="mb-4">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Quick Install</div>
              <div className="relative">
                <div className="bg-slate-900 text-slate-300 px-3 py-2 rounded-lg font-mono text-xs overflow-x-auto">
                  curl -sL https://raw.githubusercontent.com/accionlabs/spec-x/main/demo/sync-server/install.sh | bash
                </div>
                <button
                  onClick={copyInstallCommand}
                  className="absolute top-1.5 right-1.5 p-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                >
                  {copiedCommand ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Sync URL Input */}
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Sync Server URL</div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={syncUrl}
                    onChange={(e) => {
                      setSyncUrl(e.target.value)
                      setSyncStatus('idle')
                    }}
                    placeholder="http://100.x.x.x:5984"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                  />
                  {syncStatus === 'success' && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                  )}
                  {syncStatus === 'error' && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  )}
                </div>
                <button
                  onClick={testSyncConnection}
                  disabled={!syncUrl || syncStatus === 'testing'}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {syncStatus === 'testing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>

              {syncStatus === 'success' && (
                <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Connected! Refreshing...
                </p>
              )}
              {syncStatus === 'error' && syncError && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {syncError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persona Start Buttons */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {personas.map(({ id, theme, icon: Icon }) => (
          <a
            key={id}
            href={`/${configName}/${id}`}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-xl text-white font-medium transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ backgroundColor: theme.primary }}
          >
            <Icon className="w-6 h-6" />
            <span>Start as {theme.name}</span>
            <ArrowRight className="w-5 h-5 ml-auto opacity-60" />
          </a>
        ))}
      </div>

      {/* No personas configured */}
      {personas.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center max-w-sm w-full mb-8">
          <p className="text-white font-medium mb-2">No Applications Configured</p>
          <p className="text-sm text-slate-400">
            Use the button below to configure your applications.
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-xs text-slate-500 uppercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      {/* Customize Features Button */}
      <a
        href={`${config._serverSettings?.featureEditorUrl || 'http://localhost:3000'}/${configName}`}
        className="flex items-center justify-center gap-2 w-full max-w-sm px-5 py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
      >
        <Settings className="w-5 h-5" />
        <span>Customize Features</span>
      </a>
    </div>
  )
}

export function LandingPage() {
  const { configName } = parsePathInfo()

  // If no config name, show onboarding redirect
  if (!configName) {
    return <OnboardingRedirect />
  }

  // Show config-specific landing page
  return <ConfigLandingPage configName={configName} />
}
