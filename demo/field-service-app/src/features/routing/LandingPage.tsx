import { Wrench, Radio, Briefcase, Package, ArrowRight, Settings } from 'lucide-react'
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

// Config landing page - clean splash screen
function ConfigLandingPage({ configName }: { configName: string }) {
  const { config, isLoading } = useConfig()

  // Check which personas are enabled in the config
  const enabledPersonas = config.features?.personas || []

  // Check if sync is available (syncUrl is configured)
  const hasSyncServer = Boolean(config.constraints?.syncUrl)

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
      <p className="text-slate-400 mb-10">{formatConfigName(configName)}</p>

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
