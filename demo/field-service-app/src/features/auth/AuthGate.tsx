import type { ReactNode } from 'react'
import { useConfig } from '../../config/ConfigContext'
import { useAuth } from './AuthContext'
import { LoginScreen } from './LoginScreen'
import type { PersonaId } from '../registry/types'

interface AuthGateProps {
  children: ReactNode
  personaId: PersonaId
  configName: string
}

const PERSONA_NAMES: Record<PersonaId, string> = {
  technician: 'Technician',
  dispatcher: 'Dispatcher',
  manager: 'Manager'
}

/**
 * AuthGate wraps protected content and shows login screen if not authenticated
 * or if the user doesn't have access to the requested persona
 */
export function AuthGate({ children, personaId, configName }: AuthGateProps) {
  const { config, isLoading: configLoading } = useConfig()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()

  // Show loading state while config or auth is loading
  if (configLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if authentication is enabled for this deployment
  const hasUsers = (config?.users?.length || 0) > 0
  const authEnabled = config?.authentication?.method === 'basic' && hasUsers

  // If no authentication configured, allow access
  if (!authEnabled) {
    return <>{children}</>
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        configName={configName}
        personaName={PERSONA_NAMES[personaId]}
      />
    )
  }

  // Check if user has access to this persona
  if (user?.persona !== personaId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You are signed in as <span className="font-medium">{user?.name}</span> with{' '}
            <span className="font-medium capitalize">{user?.persona}</span> access.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            This area requires <span className="font-medium capitalize">{PERSONA_NAMES[personaId]}</span> access.
          </p>
          <a
            href={`/${configName}/${user?.persona}`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to your dashboard
          </a>
        </div>
      </div>
    )
  }

  // User is authenticated and has access
  return <>{children}</>
}
