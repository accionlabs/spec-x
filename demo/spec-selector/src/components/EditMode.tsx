import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Database, GitBranch, Zap, Shield, Server,
  ChevronRight, RotateCcw, ExternalLink
} from 'lucide-react'
import FeatureSelector from './FeatureSelector'
import DataModelEditor from './DataModelEditor'
import WorkflowEditor from './WorkflowEditor'
import ConstraintPanel from './ConstraintPanel'
import AuthenticationPanel from './AuthenticationPanel'
import AgentManager from './AgentManager'
import SpecPreview from './SpecPreview'
import type { SpecState } from '../App'

type Section = 'features' | 'dataModel' | 'workflows' | 'authentication' | 'deployment' | 'agents'

interface Scenario {
  id: string
  name: string
  description: string
  default: boolean
  price: number
  included?: boolean
}

interface Outcome {
  id: string
  name: string
  description: string
  scenarios: Scenario[]
}

interface Persona {
  id: string
  name: string
  description: string
  icon: string
  basePrice: number
  requiresSync?: boolean
  outcomes: Outcome[]
}

interface Ontology {
  personas: Persona[]
  dataModel: {
    entities: Array<{
      id: string
      name: string
      description: string
      icon: string
      baseFields: Array<{
        id: string
        name: string
        type: string
        required: boolean
        description?: string
      }>
      allowCustomFields: boolean
    }>
    fieldTypes: Array<{
      id: string
      name: string
      icon: string
      description: string
    }>
  }
  workflows: Record<string, {
    id: string
    name: string
    description: string
    states: Array<{
      id: string
      name: string
      color: string
      isInitial?: boolean
      isFinal?: boolean
      description?: string
    }>
    transitions: Array<{
      from: string
      to: string
      name: string
      description?: string
    }>
    allowCustomStates: boolean
  }>
  constraints: Array<{
    id: string
    name: string
    default?: boolean | string
    type?: string
    description?: string
    options?: Array<{
      id: string
      name: string
      default?: boolean
      cost?: string
      description?: string
      users?: string
    }>
  }>
  authentication: {
    tiers: Array<{
      id: string
      name: string
      description: string
      price: number
      features: string[]
      available: boolean
    }>
    addons: Array<{
      id: string
      name: string
      description: string
      price: number
      available: boolean
    }>
  }
  pricing: {
    currency: string
    period: string
    base: {
      amount: number
      description: string
      includes: string[]
    }
    perUser: { amount: number; description: string }
    customField: { amount: number; description: string }
    customWorkflowState: { amount: number; description: string }
    additionalLanguage: { amount: number; description: string }
  }
}

interface EditModeProps {
  spec: SpecState
  ontology: Ontology
  configName: string
  onSpecChange: (spec: SpecState) => void
  onRegenerate: () => void
  onStartOver: () => void
  onLaunchApp: () => void
}

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'features', label: 'Features', icon: <Settings className="w-5 h-5" /> },
  { id: 'dataModel', label: 'Data Model', icon: <Database className="w-5 h-5" /> },
  { id: 'workflows', label: 'Workflows', icon: <GitBranch className="w-5 h-5" /> },
  { id: 'authentication', label: 'Authentication', icon: <Shield className="w-5 h-5" /> },
  { id: 'deployment', label: 'Deployment', icon: <Zap className="w-5 h-5" /> },
  { id: 'agents', label: 'Agents', icon: <Server className="w-5 h-5" /> },
]

export default function EditMode({
  spec,
  ontology,
  configName,
  onSpecChange,
  onRegenerate,
  onStartOver,
  onLaunchApp,
}: EditModeProps) {
  const [activeSection, setActiveSection] = useState<Section>('features')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="font-bold text-gray-900">{configName}</h1>
          <p className="text-sm text-gray-500">Edit Configuration</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={activeSection === section.id ? 'text-blue-600' : 'text-gray-400'}>
                {section.icon}
              </span>
              <span className="font-medium">{section.label}</span>
              {activeSection === section.id && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onLaunchApp}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Launch App
          </button>
          <button
            onClick={onRegenerate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Zap className="w-4 h-4" />
            Re-generate
          </button>
          <button
            onClick={onStartOver}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {activeSection === 'features' && (
                <motion.div
                  key="features"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FeatureSelector
                    ontology={ontology}
                    selectedScenarios={spec.selectedScenarios}
                    onSelectionChange={(scenarios) => onSpecChange({ ...spec, selectedScenarios: scenarios })}
                    infrastructure={spec.constraints.infrastructure}
                  />
                </motion.div>
              )}

              {activeSection === 'dataModel' && (
                <motion.div
                  key="dataModel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <DataModelEditor
                    ontology={ontology}
                    customFields={spec.customFields}
                    onCustomFieldsChange={(fields) => onSpecChange({ ...spec, customFields: fields })}
                  />
                </motion.div>
              )}

              {activeSection === 'workflows' && (
                <motion.div
                  key="workflows"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <WorkflowEditor
                    ontology={ontology}
                    customStates={spec.customWorkflowStates}
                    onCustomStatesChange={(states) => onSpecChange({ ...spec, customWorkflowStates: states })}
                  />
                </motion.div>
              )}

              {activeSection === 'authentication' && (
                <motion.div
                  key="authentication"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AuthenticationPanel
                    ontology={ontology}
                    spec={spec}
                    onSpecChange={onSpecChange}
                  />
                </motion.div>
              )}

              {activeSection === 'deployment' && (
                <motion.div
                  key="deployment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ConstraintPanel
                    ontology={ontology}
                    constraints={spec.constraints}
                    onConstraintsChange={(constraints) => onSpecChange({ ...spec, constraints })}
                  />
                </motion.div>
              )}

              {activeSection === 'agents' && (
                <motion.div
                  key="agents"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AgentManager />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar - Spec Preview */}
        <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white p-4 overflow-y-auto">
          <SpecPreview spec={spec} ontology={ontology} />
        </div>
      </div>
    </div>
  )
}
