import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, User, Target, FileText, DollarSign, Navigation, Lock } from 'lucide-react'

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
}

interface FeatureSelectorProps {
  ontology: Ontology
  selectedScenarios: Set<string>
  onSelectionChange: (scenarios: Set<string>) => void
  infrastructure: string
}

// Infrastructure levels that provide sync capability
const SYNC_ENABLED_INFRASTRUCTURE = ['team', 'department', 'enterprise']

export default function FeatureSelector({ ontology, selectedScenarios, onSelectionChange, infrastructure }: FeatureSelectorProps) {
  const [expandedPersonas, setExpandedPersonas] = useState<Set<string>>(new Set(['field-tech']))
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<string>>(new Set(['complete-work-orders']))

  const togglePersona = (id: string) => {
    const next = new Set(expandedPersonas)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedPersonas(next)
  }

  const toggleOutcome = (id: string) => {
    const next = new Set(expandedOutcomes)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedOutcomes(next)
  }

  const toggleScenario = (id: string) => {
    const next = new Set(selectedScenarios)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  const getPersonaIcon = (icon: string) => {
    switch (icon) {
      case 'wrench': return <User className="w-5 h-5" />
      case 'radio': return <Target className="w-5 h-5" />
      case 'briefcase': return <FileText className="w-5 h-5" />
      default: return <User className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Select Features</h2>
        <p className="text-sm text-gray-500">Choose the capabilities your application needs</p>
      </div>

      {ontology.personas.map((persona) => {
        const isLocked = persona.requiresSync && !SYNC_ENABLED_INFRASTRUCTURE.includes(infrastructure)
        const requiredLevel = persona.id === 'manager' ? 'Department+' : 'Team+'

        return (
        <div key={persona.id} className={`border rounded-lg overflow-hidden ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`}>
          {/* Persona Header */}
          <button
            onClick={() => !isLocked && togglePersona(persona.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
              isLocked
                ? 'bg-gray-50 cursor-not-allowed'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {isLocked ? (
              <Lock className="w-5 h-5 text-gray-400" />
            ) : expandedPersonas.has(persona.id) ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLocked ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'
            }`}>
              {getPersonaIcon(persona.icon)}
            </div>
            <div className="text-left flex-1">
              <div className={`font-medium ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>{persona.name}</div>
              <div className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                {isLocked
                  ? `Requires ${requiredLevel} infrastructure (sync server)`
                  : persona.description
                }
              </div>
            </div>
            {isLocked ? (
              <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-sm font-medium">
                <Lock className="w-3 h-3" />
                <span>{requiredLevel}</span>
              </div>
            ) : persona.basePrice > 0 && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm font-medium">
                <DollarSign className="w-3 h-3" />
                <span>{persona.basePrice}/mo</span>
              </div>
            )}
          </button>

          {/* Outcomes */}
          {expandedPersonas.has(persona.id) && (
            <div className="border-t border-gray-200">
              {persona.outcomes.map((outcome) => (
                <div key={outcome.id} className="border-b border-gray-100 last:border-b-0">
                  {/* Outcome Header - becomes navigation tab in generated app */}
                  <button
                    onClick={() => toggleOutcome(outcome.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 pl-12 hover:bg-blue-50 transition-colors group"
                  >
                    {expandedOutcomes.has(outcome.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-gray-800">{outcome.name}</div>
                      <div className="text-sm text-gray-500">{outcome.description}</div>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      → Nav Tab
                    </span>
                  </button>

                  {/* Scenarios */}
                  {expandedOutcomes.has(outcome.id) && (
                    <div className="bg-white pl-20 pr-4 pb-3 space-y-2">
                      {outcome.scenarios.map((scenario) => (
                        <label
                          key={scenario.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedScenarios.has(scenario.id)
                              ? 'border-blue-300 bg-blue-50/50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                          }`}
                        >
                          <div className="relative flex items-center justify-center w-5 h-5 mt-0.5">
                            <input
                              type="checkbox"
                              checked={selectedScenarios.has(scenario.id)}
                              onChange={() => toggleScenario(scenario.id)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedScenarios.has(scenario.id)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedScenarios.has(scenario.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{scenario.name}</div>
                            <div className="text-sm text-gray-500">{scenario.description}</div>
                          </div>
                          {scenario.included ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                              Included
                            </span>
                          ) : scenario.price > 0 ? (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium flex items-center gap-0.5">
                              +${scenario.price}/mo
                            </span>
                          ) : null}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )
      })}
    </div>
  )
}
