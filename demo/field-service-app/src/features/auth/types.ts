import type { PersonaId } from '../registry/types'
import type { AuthConfig as ConfigAuthConfig, ConfigUser as AppConfigUser } from '../../config/types'

export interface AuthUser {
  id: string
  email: string
  name: string
  persona: PersonaId
  permissions: string[]
}

export interface AuthSession {
  sessionId: string
  user: AuthUser
  loginAt: string
  expiresAt: string | null
  deviceId: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
  error: string | null
}

// Re-export config types for use in auth module
export type ConfigUser = AppConfigUser
export type AuthConfig = ConfigAuthConfig

export interface LoginCredentials {
  email: string
  password: string
}
