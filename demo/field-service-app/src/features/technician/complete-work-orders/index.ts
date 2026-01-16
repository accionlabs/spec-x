import { ClipboardList, Camera, CheckSquare, FileText } from 'lucide-react'
import type { OutcomeFeature, ScenarioFeature } from '../../registry/types'
import { createFeatureId } from '../../registry/types'

// Scenario: View Work Orders
const viewWorkOrdersScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'technician', 'complete-work-orders', 'view-work-orders'),
  level: 'scenario',
  personaId: 'technician',
  outcomeId: 'complete-work-orders',
  scenarioId: 'view-work-orders',
  name: 'View Work Orders',
  description: 'View assigned work orders and their details',
  icon: ClipboardList,
  i18nKey: 'scenario.viewWorkOrders',
  capabilities: ['offline'],
}

// Scenario: Capture Photos
const capturePhotosScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'technician', 'complete-work-orders', 'capture-photos'),
  level: 'scenario',
  personaId: 'technician',
  outcomeId: 'complete-work-orders',
  scenarioId: 'capture-photos',
  name: 'Capture Photos',
  description: 'Take site photos and attach to work orders',
  icon: Camera,
  i18nKey: 'scenario.capturePhotos',
  capabilities: ['camera', 'offline'],
}

// Scenario: Update Status
const updateStatusScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'technician', 'complete-work-orders', 'update-status'),
  level: 'scenario',
  personaId: 'technician',
  outcomeId: 'complete-work-orders',
  scenarioId: 'update-status',
  name: 'Update Status',
  description: 'Update work order status and progress',
  icon: FileText,
  i18nKey: 'scenario.updateStatus',
  capabilities: ['offline'],
}

// Scenario: Complete Checklist
const completeChecklistScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'technician', 'complete-work-orders', 'complete-checklist'),
  level: 'scenario',
  personaId: 'technician',
  outcomeId: 'complete-work-orders',
  scenarioId: 'complete-checklist',
  name: 'Complete Checklist',
  description: 'Complete service checklist for work orders',
  icon: CheckSquare,
  i18nKey: 'scenario.completeChecklist',
  capabilities: ['offline'],
}

// Complete Work Orders Outcome
export const completeWorkOrdersOutcome: OutcomeFeature = {
  id: createFeatureId('outcome', 'technician', 'complete-work-orders'),
  level: 'outcome',
  personaId: 'technician',
  outcomeId: 'complete-work-orders',
  name: 'Complete Work Orders',
  description: 'View and complete assigned work orders',
  icon: ClipboardList,
  i18nKey: 'nav.workOrders',
  navItem: {
    id: 'work-orders',
    icon: ClipboardList,
    labelKey: 'nav.workOrders',
    order: 1,
    path: 'work-orders',
  },
  scenarios: [
    viewWorkOrdersScenario,
    capturePhotosScenario,
    updateStatusScenario,
    completeChecklistScenario,
  ],
}

// Export individual scenarios for direct access
export const scenarios = {
  viewWorkOrders: viewWorkOrdersScenario,
  capturePhotos: capturePhotosScenario,
  updateStatus: updateStatusScenario,
  completeChecklist: completeChecklistScenario,
}
