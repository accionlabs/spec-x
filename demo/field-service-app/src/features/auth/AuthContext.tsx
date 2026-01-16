import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import bcrypt from 'bcryptjs'
import { useConfig } from '../../config/ConfigContext'
import type { AuthState, AuthUser, LoginCredentials, ConfigUser } from './types'
import type { PersonaId } from '../registry/types'
import { createSession, loadSession, clearSession, hasPersonaAccess } from './sessionStore'

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  hasAccess: (personaId: PersonaId) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { config, isLoading: configLoading } = useConfig()
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    isLoading: true,
    error: null
  })

  // Load existing session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await loadSession()
        if (session) {
          setState({
            isAuthenticated: true,
            user: session.user,
            session,
            isLoading: false,
            error: null
          })
        } else {
          setState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error('Error loading session:', error)
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    if (!configLoading) {
      initSession()
    }
  }, [configLoading])

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Find user in config
      const configUsers = (config?.users || []) as ConfigUser[]
      const configUser = configUsers.find(u => u.email.toLowerCase() === credentials.email.toLowerCase())

      if (!configUser) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Invalid email or password' }))
        return { success: false, error: 'Invalid email or password' }
      }

      // Verify password with bcrypt
      if (!configUser.passwordHash) {
        setState(prev => ({ ...prev, isLoading: false, error: 'User has no password configured' }))
        return { success: false, error: 'User has no password configured' }
      }

      const isValid = await bcrypt.compare(credentials.password, configUser.passwordHash)
      if (!isValid) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Invalid email or password' }))
        return { success: false, error: 'Invalid email or password' }
      }

      // Create user object
      const user: AuthUser = {
        id: configUser.id,
        email: configUser.email,
        name: configUser.name,
        persona: configUser.persona as PersonaId,
        permissions: configUser.permissions
      }

      // Create session
      const session = await createSession(user)

      setState({
        isAuthenticated: true,
        user,
        session,
        isLoading: false,
        error: null
      })

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }, [config])

  const logout = useCallback(async () => {
    await clearSession()
    setState({
      isAuthenticated: false,
      user: null,
      session: null,
      isLoading: false,
      error: null
    })
  }, [])

  const hasAccess = useCallback((personaId: PersonaId): boolean => {
    return hasPersonaAccess(state.session, personaId)
  }, [state.session])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    hasAccess
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
