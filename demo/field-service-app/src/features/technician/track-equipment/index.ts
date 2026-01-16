import { Wrench, Barcode, History } from 'lucide-react'
import type { OutcomeFeature, ScenarioFeature } from '../../registry/types'
import { createFeatureId } from '../../registry/types'

// Scenario: Scan Barcode
const scanBarcodeScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'technician', 'track-equipment', 'scan-barcode'),
  level: 'scenario',
  personaId: 'technician',
  outcomeId: 'track-equipment',
  scenarioId: 'scan-barcode',
  name: 'Scan Barcode',
  description: 'Scan equipment barcode to look up details',
  icon: Barcode,
  i18nKey: 'scenario.scanBarcode',
  capabilities: ['camera'],
}

// Scenario: View Service History
const viewHistoryScenario: ScenarioFeature = {
  id: createFeatureId('scenario', 'technician', 'track-equipment', 'view-history'),
  level: 'scenario',
  personaId: 'technician',
  outcomeId: 'track-equipment',
  scenarioId: 'view-history',
  name: 'View Service History',
  description: 'View equipment service history',
  icon: History,
  i18nKey: 'scenario.viewHistory',
  capabilities: ['offline'],
}

// Track Equipment Outcome
export const trackEquipmentOutcome: OutcomeFeature = {
  id: createFeatureId('outcome', 'technician', 'track-equipment'),
  level: 'outcome',
  personaId: 'technician',
  outcomeId: 'track-equipment',
  name: 'Track Equipment',
  description: 'Look up and track equipment information',
  icon: Wrench,
  i18nKey: 'nav.equipment',
  navItem: {
    id: 'equipment',
    icon: Wrench,
    labelKey: 'nav.equipment',
    order: 2,
    path: 'equipment',
  },
  scenarios: [
    scanBarcodeScenario,
    viewHistoryScenario,
  ],
}

// Export individual scenarios for direct access
export const scenarios = {
  scanBarcode: scanBarcodeScenario,
  viewHistory: viewHistoryScenario,
}
