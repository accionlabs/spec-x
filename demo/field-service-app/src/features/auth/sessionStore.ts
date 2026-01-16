import type { AuthSession, AuthUser } from './types'
import type { PersonaId } from '../registry/types'

const DB_NAME_PREFIX = 'fieldservice-auth-'
const STORE_NAME = 'sessions'
const SESSION_KEY = 'current'
const SESSION_EXPIRY_DAYS = 7

/**
 * Gets the database name based on config name
 */
function getDBName(): string {
  const path = window.location.pathname
  const segments = path.replace(/^\//, '').split('/').filter(Boolean)
  const configName = segments[0] || 'default'
  return `${DB_NAME_PREFIX}${configName}`
}

/**
 * Opens the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(getDBName(), 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * Generates a stable device ID based on browser fingerprint
 */
export async function getDeviceId(): Promise<string> {
  const factors = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset().toString(),
    navigator.language,
    navigator.hardwareConcurrency?.toString() || 'unknown'
  ]

  const fingerprint = factors.join('|')
  const encoder = new TextEncoder()
  const data = encoder.encode(fingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
}

/**
 * Generates a unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Calculates session expiry date
 */
function calculateExpiry(): string {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + SESSION_EXPIRY_DAYS)
  return expiry.toISOString()
}

/**
 * Creates a new session for a user
 */
export async function createSession(user: AuthUser): Promise<AuthSession> {
  const deviceId = await getDeviceId()
  const session: AuthSession = {
    sessionId: generateSessionId(),
    user,
    loginAt: new Date().toISOString(),
    expiresAt: calculateExpiry(),
    deviceId
  }

  await saveSession(session)
  return session
}

/**
 * Saves session to IndexedDB
 */
export async function saveSession(session: AuthSession): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(session, SESSION_KEY)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Loads session from IndexedDB
 */
export async function loadSession(): Promise<AuthSession | null> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(SESSION_KEY)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const session = request.result as AuthSession | undefined
        if (!session) {
          resolve(null)
          return
        }

        // Check if session has expired
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
          // Session expired, clear it
          clearSession().then(() => resolve(null))
          return
        }

        resolve(session)
      }
    })
  } catch {
    return null
  }
}

/**
 * Clears the current session
 */
export async function clearSession(): Promise<void> {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(SESSION_KEY)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch {
    // Ignore errors when clearing
  }
}

/**
 * Checks if user has permission to access a specific persona
 */
export function hasPersonaAccess(session: AuthSession | null, personaId: PersonaId): boolean {
  if (!session) return false
  return session.user.persona === personaId
}
