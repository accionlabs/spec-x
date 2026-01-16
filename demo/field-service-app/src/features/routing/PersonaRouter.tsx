import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ThemeProvider } from '../theme'
import { FeatureProvider } from '../registry'
import { AuthProvider, AuthGate } from '../auth'
import { useConfig } from '../../config'
import type { PersonaId } from '../theme/types'
import type { FeatureConfig } from '../registry/types'

// Inner component that uses route params
function PersonaRouteContent({
  personaId,
  children
}: {
  personaId: PersonaId
  children: ReactNode
}) {
  const { config } = useConfig()
  const { configName } = useParams<{ configName: string }>()

  // Build feature config from the loaded config
  const featureConfig: FeatureConfig = {
    personas: config.features?.personas as PersonaId[] || [personaId],
    scenarios: config.features?.scenarios || []
  }

  return (
    <ThemeProvider personaId={personaId}>
      <FeatureProvider personaId={personaId} config={featureConfig}>
        <AuthGate personaId={personaId} configName={configName || 'default'}>
          {children}
        </AuthGate>
      </FeatureProvider>
    </ThemeProvider>
  )
}

// Wrapper that provides auth context for persona routes
function PersonaRouteWrapper({
  personaId,
  children
}: {
  personaId: PersonaId
  children: ReactNode
}) {
  return (
    <AuthProvider>
      <PersonaRouteContent personaId={personaId}>
        {children}
      </PersonaRouteContent>
    </AuthProvider>
  )
}

// Landing page wrapper that handles config-prefixed routes
function LandingPageWrapper({ children }: { children: ReactNode }) {
  // Config name is parsed in the LandingPage component
  // This wrapper just renders the children
  return <>{children}</>
}

interface PersonaRouterConfig {
  technicianApp: ReactNode
  dispatcherApp: ReactNode
  managerApp: ReactNode
  landingPage?: ReactNode
}

export function PersonaRouter({
  technicianApp,
  dispatcherApp,
  managerApp,
  landingPage
}: PersonaRouterConfig) {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root - redirect to spec-selector for onboarding */}
        <Route
          path="/"
          element={landingPage}
        />

        {/* Config landing page: /{configName} - shows persona install links */}
        <Route
          path="/:configName"
          element={
            <LandingPageWrapper>
              {landingPage}
            </LandingPageWrapper>
          }
        />

        {/* Config-prefixed persona routes: /{configName}/{personaId} */}
        {/* All apps require a config name - no default configs */}
        <Route
          path="/:configName/technician/*"
          element={
            <PersonaRouteWrapper personaId="technician">
              {technicianApp}
            </PersonaRouteWrapper>
          }
        />
        <Route
          path="/:configName/dispatcher/*"
          element={
            <PersonaRouteWrapper personaId="dispatcher">
              {dispatcherApp}
            </PersonaRouteWrapper>
          }
        />
        <Route
          path="/:configName/manager/*"
          element={
            <PersonaRouteWrapper personaId="manager">
              {managerApp}
            </PersonaRouteWrapper>
          }
        />

        {/* Fallback - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

// Hook to get current route info within a persona app
export { useLocation, useNavigate, useParams } from 'react-router-dom'
