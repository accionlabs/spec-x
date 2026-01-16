import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home, ClipboardList, Wrench, Settings, Wifi, WifiOff, RefreshCw, Check, Plus,
  ClipboardCheck, Map, BarChart3, Users, AlertTriangle
} from 'lucide-react'
import { initializeDB, setupSync, stopSync, subscribeSyncState } from '../../db'
import { useConfig, useConstraints, useEnabledScenarios } from '../../config'
import { parsePathInfo } from '../../config/loader'
import { usePersonaTheme, usePersonaId } from '../theme'
import type { PersonaId } from '../theme/types'
import { getRoutesForPersona } from './routes'

// Import existing components
import TechnicianDashboard from '../../components/dashboards/TechnicianDashboard'
import DispatcherDashboard from '../../components/dashboards/DispatcherDashboard'
import ManagerDashboard from '../../components/dashboards/ManagerDashboard'
import WorkOrderList from '../../components/WorkOrderList'
import WorkOrderDetail from '../../components/WorkOrderDetail'
import NewWorkOrder from '../../components/NewWorkOrder'
import EquipmentList from '../../components/EquipmentList'
import SettingsPanel from '../../components/SettingsPanel'
import AssignmentView from '../../components/dispatcher/AssignmentView'
import TechnicianMap from '../../components/dispatcher/TechnicianMap'
import ReportsView from '../../components/manager/ReportsView'
import TeamPerformance from '../../components/manager/TeamPerformance'
import type { WorkOrder } from '../../db'

// Staleness Banner Component
function StalenessBanner() {
  const { isStale } = useConfig()

  if (!isStale) return null

  return (
    <div className="bg-amber-500 text-amber-900 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
      <AlertTriangle className="w-4 h-4" />
      <span>New configuration available. Restart the app to apply changes.</span>
    </div>
  )
}

// Format config name for display
function formatConfigName(name: string | null): string {
  if (!name) return 'Default'
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Navigation icons per persona
const NAV_ICONS: Record<PersonaId, Record<string, typeof Home>> = {
  technician: {
    dashboard: Home,
    'work-orders': ClipboardList,
    equipment: Wrench,
    settings: Settings,
  },
  dispatcher: {
    dashboard: Home,
    assign: ClipboardCheck,
    'monitor-progress': Map,
    settings: Settings,
  },
  manager: {
    dashboard: Home,
    reports: BarChart3,
    team: Users,
    settings: Settings,
  },
}

export function PersonaApp() {
  const { t, i18n } = useTranslation()
  const { configName: loadedConfigName } = useConfig()
  const constraints = useConstraints()
  const enabledScenarios = useEnabledScenarios()
  const theme = usePersonaTheme()
  const personaId = usePersonaId()
  const navigate = useNavigate()
  const location = useLocation()

  // Check if work order creation is enabled for this persona
  const canCreateWorkOrders = (
    // Technician: needs 'create-work-orders' scenario enabled
    (personaId === 'technician' && enabledScenarios.includes('create-work-orders')) ||
    // Dispatcher: needs 'assign-to-technician' scenario (implies they can create)
    (personaId === 'dispatcher' && enabledScenarios.includes('assign-to-technician'))
  )

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [isCreatingWorkOrder, setIsCreatingWorkOrder] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [dbReady, setDbReady] = useState(false)

  // Get config name from URL path (required)
  const { configName: urlConfigName } = parsePathInfo()
  const configName = urlConfigName || loadedConfigName

  // Build base path - config name is always required
  const basePath = `/${urlConfigName}/${personaId}`

  // Get current view from URL
  // Path format: /{configName}/{personaId}/{view}
  const pathParts = location.pathname.split('/').filter(Boolean)
  const currentView = pathParts[2] || 'dashboard'

  // Initialize database
  useEffect(() => {
    initializeDB().then(() => setDbReady(true))
  }, [])

  // Set up sync when DB is ready and syncUrl is configured
  useEffect(() => {
    if (!dbReady) return

    // Subscribe to sync state changes
    const unsubscribe = subscribeSyncState((state) => {
      setIsSyncing(state.isActive && !state.isPaused)
      setLastSync(state.lastSync)
      setSyncError(state.error)
    })

    // Start sync if URL is configured
    if (constraints.syncUrl) {
      setupSync(constraints.syncUrl)
    }

    return () => {
      unsubscribe()
      stopSync()
    }
  }, [dbReady, constraints.syncUrl])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleWorkOrderChange = () => {
    // With PouchDB sync, changes are automatically synced when online
    // Trigger a refresh to update UI
    setRefreshKey(prev => prev + 1)
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const handleNavigate = (view: string) => {
    const newPath = view === 'dashboard' ? basePath : `${basePath}/${view}`
    navigate(newPath)
    setSelectedWorkOrder(null)
    setIsCreatingWorkOrder(false)
  }

  // Get navigation config based on persona - filtered by enabled scenarios
  const navConfig = getRoutesForPersona(personaId, enabledScenarios).map(route => ({
    id: route.id,
    icon: NAV_ICONS[personaId][route.id] || Home,
    label: route.id === 'dashboard' ? t('nav.dashboard') : route.label,
    path: route.path,
  }))

  // Render dashboard based on persona
  const renderDashboard = () => {
    switch (personaId) {
      case 'technician':
        return <TechnicianDashboard key={refreshKey} onNavigate={handleNavigate} onCreateWorkOrder={() => setIsCreatingWorkOrder(true)} />
      case 'dispatcher':
        return <DispatcherDashboard key={refreshKey} onNavigate={handleNavigate} />
      case 'manager':
        return <ManagerDashboard key={refreshKey} onNavigate={handleNavigate} />
    }
  }

  // Should show FAB? Only if work order creation is enabled for this persona
  const showFAB = canCreateWorkOrders &&
    !selectedWorkOrder &&
    !isCreatingWorkOrder &&
    currentView !== 'settings'

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: theme.primary }} />
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Config Staleness Banner */}
      <StalenessBanner />

      {/* Status Bar */}
      <div className={`px-4 py-2 text-white text-sm flex items-center justify-between ${theme.statusBar}`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>{t('status.online')}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>{t('status.offline')}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {syncError ? (
            <span className="text-red-200">{syncError}</span>
          ) : isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{t('status.syncing')}</span>
            </>
          ) : constraints.syncUrl ? (
            lastSync ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t('status.synced')}</span>
              </>
            ) : (
              <span className="opacity-75">Connecting...</span>
            )
          ) : (
            <span className="opacity-75">Individual mode</span>
          )}
        </div>
      </div>

      {/* Header */}
      <header className={`${theme.headerBg} text-white px-4 py-3 shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold">{theme.name}</div>
            {configName && (
              <div className="hidden sm:flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded text-xs">
                <span className="opacity-80">Build:</span>
                <span className="font-medium">{formatConfigName(configName)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-white/20 text-white text-sm rounded px-2 py-1 border-none focus:ring-2 focus:ring-white/40"
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {isCreatingWorkOrder ? (
          <NewWorkOrder
            onBack={() => setIsCreatingWorkOrder(false)}
            onCreated={() => {
              setIsCreatingWorkOrder(false)
              setRefreshKey(prev => prev + 1)
              handleWorkOrderChange()
            }}
          />
        ) : selectedWorkOrder ? (
          <WorkOrderDetail
            workOrder={selectedWorkOrder}
            onBack={() => setSelectedWorkOrder(null)}
            onChange={handleWorkOrderChange}
          />
        ) : (
          <>
            {/* Dashboard */}
            {currentView === 'dashboard' && renderDashboard()}

            {/* Settings */}
            {currentView === 'settings' && (
              <SettingsPanel
                onLanguageChange={handleLanguageChange}
                currentLanguage={i18n.language}
              />
            )}

            {/* Technician views - gated by scenarios */}
            {personaId === 'technician' && currentView === 'work-orders' && enabledScenarios.includes('view-work-orders') && (
              <WorkOrderList key={refreshKey} onSelect={setSelectedWorkOrder} />
            )}
            {personaId === 'technician' && currentView === 'equipment' &&
             (enabledScenarios.includes('view-history') || enabledScenarios.includes('scan-barcode')) && (
              <EquipmentList />
            )}

            {/* Dispatcher views - gated by scenarios */}
            {personaId === 'dispatcher' && currentView === 'assign' &&
             (enabledScenarios.includes('assign-to-technician') || enabledScenarios.includes('view-unassigned')) && (
              <AssignmentView />
            )}
            {personaId === 'dispatcher' && currentView === 'monitor-progress' &&
             (enabledScenarios.includes('track-status') || enabledScenarios.includes('view-map')) && (
              <TechnicianMap />
            )}

            {/* Manager views - gated by scenarios */}
            {personaId === 'manager' && currentView === 'reports' &&
             (enabledScenarios.includes('completion-reports') || enabledScenarios.includes('performance-trends')) && (
              <ReportsView />
            )}
            {personaId === 'manager' && currentView === 'team' &&
             (enabledScenarios.includes('individual-metrics') || enabledScenarios.includes('team-overview')) && (
              <TeamPerformance />
            )}
          </>
        )}

        {/* Floating Action Button - Only for Technician */}
        {showFAB && (
          <button
            onClick={() => setIsCreatingWorkOrder(true)}
            className="absolute bottom-20 right-4 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 active:opacity-80 transition-opacity"
            style={{ backgroundColor: theme.primary }}
            aria-label="Create new work order"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </main>

      {/* Bottom Navigation */}
      {!selectedWorkOrder && !isCreatingWorkOrder && (
        <nav className="bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
          <div className="flex justify-around">
            {navConfig.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center py-2 px-3 touch-target ${
                  currentView === item.id ? theme.navActive : 'text-gray-500'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
