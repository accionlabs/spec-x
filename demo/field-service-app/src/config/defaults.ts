import type { AppConfig } from './types'

/**
 * Default configuration used when no generated config is available
 */
export const DEFAULT_CONFIG: AppConfig = {
  version: '0',
  generatedAt: null,

  features: {
    personas: ['technician', 'dispatcher', 'manager'],
    scenarios: [
      // Technician default scenarios
      'create-work-orders',
      'edit-work-orders',
      'view-work-orders',
      'update-status',
      'complete-checklist',
      'view-history',
      // Dispatcher default scenarios
      'view-unassigned',
      'assign-to-technician',
      'track-status',
      // Manager default scenarios
      'completion-reports',
      'individual-metrics'
    ]
  },

  customFields: {
    workOrder: [
      {
        id: 'equipmentSerialNumber',
        name: 'equipmentSerialNumber',
        type: 'text',
        label: 'Equipment Serial #',
        required: false
      },
      {
        id: 'safetyChecklistCompleted',
        name: 'safetyChecklistCompleted',
        type: 'checkbox',
        label: 'Safety Checklist Completed',
        required: false
      },
      {
        id: 'customerSatisfaction',
        name: 'customerSatisfaction',
        type: 'rating',
        label: 'Customer Satisfaction',
        required: false
      }
    ]
  },

  workflowStates: [
    { id: 'new', name: 'New', color: 'bg-gray-500', isCustom: false },
    { id: 'assigned', name: 'Assigned', color: 'bg-blue-500', isCustom: false },
    { id: 'in-progress', name: 'In Progress', color: 'bg-yellow-500', isCustom: false },
    { id: 'awaiting-parts', name: 'Awaiting Parts', color: 'bg-purple-500', isCustom: false },
    { id: 'complete', name: 'Complete', color: 'bg-green-500', isCustom: false }
  ],

  constraints: {
    offlineFirst: true,
    languages: ['en', 'es'],
    infrastructure: 'individual'
  }
}

/**
 * Config server URL
 */
export const CONFIG_SERVER_URL = 'http://localhost:3002'
