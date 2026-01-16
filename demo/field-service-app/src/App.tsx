import { ConfigProvider } from './config'
import { PersonaRouter, LandingPage, PersonaApp } from './features/routing'

// Main App component with ConfigProvider and PersonaRouter
function App() {
  return (
    <ConfigProvider>
      <PersonaRouter
        technicianApp={<PersonaApp />}
        dispatcherApp={<PersonaApp />}
        managerApp={<PersonaApp />}
        landingPage={<LandingPage />}
      />
    </ConfigProvider>
  )
}

export default App
