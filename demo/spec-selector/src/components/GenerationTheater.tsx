import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileCode, Database, GitBranch, Cpu, Package, Check, Loader2 } from 'lucide-react'
import type { SpecState } from '../App'
import { transformSpecToConfig, postConfigToServer } from '../utils/configTransformer'

interface GenerationTheaterProps {
  spec: SpecState
  configName: string  // Required - each deployment must have a unique name
  onComplete: () => void
}

interface GenerationStep {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  duration: number
  codeSnippet: string
}

const GENERATION_STEPS: GenerationStep[] = [
  {
    id: 'parsing',
    name: 'Parsing Specifications',
    description: 'Reading functional ontology and custom configurations...',
    icon: <FileCode className="w-6 h-6" />,
    duration: 2000,
    codeSnippet: `// Parsing specification document
const spec = await parseOntology({
  personas: ['field-technician'],
  outcomes: ['complete-work-orders'],
  scenarios: selectedScenarios,
  customFields: customFieldConfig,
  customStates: workflowStates
});`
  },
  {
    id: 'schema',
    name: 'Generating Data Schema',
    description: 'Creating PouchDB collections with custom fields...',
    icon: <Database className="w-6 h-6" />,
    duration: 2500,
    codeSnippet: `// Generated PouchDB Schema
const workOrderSchema = {
  title: 'WorkOrder',
  type: 'object',
  properties: {
    title: { type: 'string' },
    status: { type: 'string', enum: states },
    // Custom fields added from spec
    equipmentSerialNumber: { type: 'string' },
    safetyChecklistCompleted: { type: 'boolean' },
    customerSatisfaction: { type: 'number', min: 1, max: 5 }
  }
};`
  },
  {
    id: 'workflow',
    name: 'Building State Machine',
    description: 'Configuring workflow transitions and validations...',
    icon: <GitBranch className="w-6 h-6" />,
    duration: 2000,
    codeSnippet: `// Generated State Machine
const workflowMachine = createMachine({
  initial: 'new',
  states: {
    new: { on: { ASSIGN: 'assigned' } },
    assigned: { on: { START: 'in-progress' } },
    'in-progress': {
      on: {
        COMPLETE: { target: 'complete', cond: 'allChecklistsDone' },
        AWAIT_PARTS: 'awaiting-parts'
      }
    },
    'awaiting-parts': { on: { RESUME: 'in-progress' } },
    complete: { type: 'final' }
  }
});`
  },
  {
    id: 'sync',
    name: 'Configuring Sync SDK',
    description: 'Setting up PouchDB with offline-first architecture...',
    icon: <Cpu className="w-6 h-6" />,
    duration: 2500,
    codeSnippet: `// Local-First Sync Configuration
import { createSyncSDK } from '@pwa-sync/sdk';

const sdk = createSyncSDK({
  dbName: 'field-service',
  offlineFirst: true,

  collections: {
    workOrders: {
      conflictStrategy: 'last-write-wins',
      indexedFields: ['status', 'assignedTo']
    }
  },

  // Remote is optional - works offline without it
  remote: syncEnabled ? {
    url: couchdbUrl,
    auth: { type: 'jwt', tokenProvider }
  } : undefined
});`
  },
  {
    id: 'bundling',
    name: 'Bundling Application',
    description: 'Compiling React components and optimizing bundle...',
    icon: <Package className="w-6 h-6" />,
    duration: 3000,
    codeSnippet: `// Build output
✓ Compiled successfully in 2.3s

  dist/
  ├── index.html          (1.2 KB)
  ├── assets/
  │   ├── index-[hash].js (156 KB gzipped)
  │   └── index-[hash].css (12 KB gzipped)
  └── sw.js               (3.4 KB)

  Total bundle: 171.6 KB
  Service worker: Offline-ready ✓`
  }
]

export default function GenerationTheater({ spec, configName, onComplete }: GenerationTheaterProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [showCode] = useState(true)
  const [typedCode, setTypedCode] = useState('')

  const currentStepData = GENERATION_STEPS[currentStep]
  const progress = ((currentStep + 1) / GENERATION_STEPS.length) * 100

  // Type out code effect
  useEffect(() => {
    if (!currentStepData) return

    setTypedCode('')
    let index = 0
    const code = currentStepData.codeSnippet

    const typeInterval = setInterval(() => {
      if (index < code.length) {
        setTypedCode(code.slice(0, index + 1))
        index++
      } else {
        clearInterval(typeInterval)
      }
    }, 15)

    return () => clearInterval(typeInterval)
  }, [currentStep])

  // Progress through steps
  useEffect(() => {
    if (currentStep >= GENERATION_STEPS.length) {
      // When generation is complete, save config to server with the custom name
      const saveConfig = async () => {
        const config = await transformSpecToConfig(spec)
        await postConfigToServer(config, configName)
        onComplete()
      }
      setTimeout(saveConfig, 1000)
      return
    }

    const timer = setTimeout(() => {
      setCompletedSteps(prev => new Set([...prev, currentStepData.id]))
      setCurrentStep(prev => prev + 1)
    }, currentStepData.duration)

    return () => clearTimeout(timer)
  }, [currentStep, onComplete, spec, configName])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Generating Your Application
          </h1>
          <p className="text-gray-400 text-lg">
            Transforming specifications into production-ready code
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>{Math.round(progress)}% Complete</span>
            <span>Step {Math.min(currentStep + 1, GENERATION_STEPS.length)} of {GENERATION_STEPS.length}</span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {GENERATION_STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = index === currentStep

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  borderColor: isCurrent ? '#8B5CF6' : isCompleted ? '#10B981' : '#374151'
                }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 text-center ${
                  isCurrent ? 'bg-purple-900/50' : isCompleted ? 'bg-green-900/30' : 'bg-gray-800/50'
                }`}
              >
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    step.icon
                  )}
                </div>
                <div className={`text-xs font-medium ${
                  isCompleted ? 'text-green-400' : isCurrent ? 'text-purple-300' : 'text-gray-500'
                }`}>
                  {step.name}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Current Step Detail */}
        <AnimatePresence mode="wait">
          {currentStepData && (
            <motion.div
              key={currentStepData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800/80 rounded-xl border border-gray-700 overflow-hidden"
            >
              {/* Step Header */}
              <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{currentStepData.name}</h3>
                    <p className="text-gray-400 text-sm">{currentStepData.description}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-purple-400"
                >
                  <Loader2 className="w-6 h-6" />
                </motion.div>
              </div>

              {/* Code Preview */}
              {showCode && (
                <div className="p-6">
                  <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm font-mono">
                      {typedCode.split('\n').map((line, i) => (
                        <div key={i} className="flex">
                          <span className="text-gray-600 w-8 select-none">{i + 1}</span>
                          <span className="text-gray-300">{highlightSyntax(line)}</span>
                        </div>
                      ))}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="inline-block w-2 h-4 bg-purple-400 ml-1"
                      />
                    </code>
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spec Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center gap-8 text-sm text-gray-500"
        >
          <div>
            <span className="text-purple-400 font-semibold">{spec.selectedScenarios.size}</span> Features
          </div>
          <div>
            <span className="text-green-400 font-semibold">
              {Object.values(spec.customFields).flat().length}
            </span> Custom Fields
          </div>
          <div>
            <span className="text-blue-400 font-semibold">{spec.customWorkflowStates.length}</span> Custom States
          </div>
          <div>
            <span className="text-orange-400 font-semibold">
              {spec.constraints.offlineFirst ? 'Offline-First' : 'Online'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Simple syntax highlighting
function highlightSyntax(line: string): React.ReactNode {
  // Keywords
  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'import', 'from', 'export', 'default', 'return', 'if', 'else', 'type', 'interface', 'on', 'target', 'cond']
  const types = ['string', 'number', 'boolean', 'object', 'array']

  let result = line

  // Highlight strings
  result = result.replace(/'([^']*)'/g, "<span class='text-green-400'>'$1'</span>")
  result = result.replace(/"([^"]*)"/g, "<span class='text-green-400'>\"$1\"</span>")

  // Highlight comments
  if (result.includes('//')) {
    const [code, comment] = result.split('//')
    result = code + "<span class='text-gray-500'>//" + comment + "</span>"
  }

  // Highlight keywords
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'g')
    result = result.replace(regex, `<span class='text-purple-400'>${kw}</span>`)
  })

  // Highlight types
  types.forEach(t => {
    const regex = new RegExp(`:\\s*${t}`, 'g')
    result = result.replace(regex, `: <span class='text-blue-400'>${t}</span>`)
  })

  // Highlight special chars
  result = result.replace(/[✓]/g, "<span class='text-green-400'>$&</span>")

  return <span dangerouslySetInnerHTML={{ __html: result }} />
}
