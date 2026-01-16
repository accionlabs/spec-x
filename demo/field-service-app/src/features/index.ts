// Feature Registry
export * from './registry'

// Theme
export * from './theme'

// Routing
export * from './routing'

// Shared widgets
export * from './shared'

// Persona modules
export { technicianPersona, registerTechnicianPersona } from './technician'
export { dispatcherPersona, registerDispatcherPersona } from './dispatcher'
export { managerPersona, registerManagerPersona } from './manager'

// Register all personas
import { registerTechnicianPersona } from './technician'
import { registerDispatcherPersona } from './dispatcher'
import { registerManagerPersona } from './manager'

export function registerAllPersonas() {
  registerTechnicianPersona()
  registerDispatcherPersona()
  registerManagerPersona()
}
