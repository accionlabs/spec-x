import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Database, Server, Trash2, Info, Check, WifiOff, Wifi, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useEnabledLanguages, useConstraints, useConfig } from '../config'

// All supported languages with metadata
const ALL_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
]

interface SettingsPanelProps {
  onLanguageChange: (lang: string) => void
  currentLanguage: string
}

export default function SettingsPanel({ onLanguageChange, currentLanguage }: SettingsPanelProps) {
  const { t } = useTranslation()
  const { configName, refreshConfig } = useConfig()
  const constraints = useConstraints()
  const [syncUrl, setSyncUrl] = useState('')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const enabledLanguages = useEnabledLanguages()

  // Initialize syncUrl from config
  useEffect(() => {
    if (constraints.syncUrl) {
      setSyncUrl(constraints.syncUrl)
    }
  }, [constraints.syncUrl])

  // Test and save sync connection
  const testAndSaveSyncUrl = async () => {
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
    if (!configName) return

    try {
      const response = await fetch(`http://localhost:3002/config/${configName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          constraints: {
            ...constraints,
            syncUrl: url
          }
        })
      })
      if (response.ok) {
        await refreshConfig()
        // Reload page to reinitialize sync
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err) {
      console.error('Failed to save sync URL:', err)
    }
  }

  // Check if syncUrl has changed from config
  const hasUnsavedChanges = syncUrl !== (constraints.syncUrl || '')

  // Filter to only show enabled languages
  const availableLanguages = useMemo(() => {
    return ALL_LANGUAGES.filter(lang => enabledLanguages.includes(lang.code))
  }, [enabledLanguages])

  const handleClearData = async () => {
    // Clear IndexedDB databases
    const databases = await indexedDB.databases()
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name)
      }
    }
    // Reload the page
    window.location.reload()
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Language Selection */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t('settings.language')}</h3>
            <p className="text-sm text-gray-500">Select your preferred language</p>
          </div>
        </div>
        {availableLanguages.length > 1 ? (
          <div className={`grid gap-2 ${availableLanguages.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  currentLanguage === lang.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium text-gray-700">{lang.name}</span>
                {currentLanguage === lang.code && (
                  <Check className="w-5 h-5 text-blue-600 ml-auto" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            <span className="text-2xl mr-2">{availableLanguages[0]?.flag}</span>
            {availableLanguages[0]?.name} (only language configured)
          </div>
        )}
      </div>

      {/* Sync Settings */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${constraints.syncUrl ? 'bg-green-100' : 'bg-purple-100'}`}>
            {constraints.syncUrl ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <Server className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t('settings.sync')}</h3>
            <p className="text-sm text-gray-500">
              {constraints.syncUrl ? 'Connected to sync server' : 'Configure remote sync server'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {t('settings.syncUrl')}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="url"
                  value={syncUrl}
                  onChange={(e) => {
                    setSyncUrl(e.target.value)
                    setSyncStatus('idle')
                  }}
                  placeholder="http://localhost:5984"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                {syncStatus === 'success' && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
                {syncStatus === 'error' && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                )}
              </div>
              <button
                onClick={testAndSaveSyncUrl}
                disabled={!syncUrl || syncStatus === 'testing' || !hasUnsavedChanges}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                {syncStatus === 'testing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </button>
            </div>
            {syncStatus === 'success' && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Connected! Reloading...
              </p>
            )}
            {syncStatus === 'error' && syncError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {syncError}
              </p>
            )}
          </div>

          {constraints.syncUrl ? (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Wifi className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                <strong>Team Mode:</strong> Data syncs with server for collaboration.
                <p className="mt-1 text-xs opacity-80">
                  Work orders and equipment are synced between all team members.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <WifiOff className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <strong>Local Mode:</strong> Works fully offline with local storage.
                <p className="mt-1 text-xs opacity-80">
                  Add a sync server to enable team collaboration.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Data Management</h3>
            <p className="text-sm text-gray-500">Manage local data storage</p>
          </div>
        </div>

        {showClearConfirm ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-3">
              Are you sure? This will delete all local data including work orders and equipment records.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Yes, Clear All Data
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {t('settings.clearData')}
          </button>
        )}
      </div>

      {/* About */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Info className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t('settings.about')}</h3>
            <p className="text-sm text-gray-500">Application information</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Storage</span>
            <span className="font-mono">PouchDB (IndexedDB)</span>
          </div>
          <div className="flex justify-between">
            <span>Architecture</span>
            <span className="text-green-600 font-medium">Local-First</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Generated by Specification-as-Product</strong><br />
            This app was generated from a functional specification using the Sp-a-a-S paradigm.
            Custom fields and workflow states were defined in the spec.
          </p>
        </div>
      </div>
    </div>
  )
}
