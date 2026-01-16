import { useState } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import type { CustomState } from '../App'

interface State {
  id: string
  name: string
  color: string
  isInitial?: boolean
  isFinal?: boolean
  description?: string
  isCustom?: boolean
}

interface Transition {
  from: string
  to: string
  name: string
  description?: string
}

interface Workflow {
  id: string
  name: string
  description: string
  states: State[]
  transitions: Transition[]
  allowCustomStates: boolean
}

interface Ontology {
  workflows: Record<string, Workflow>
}

interface WorkflowEditorProps {
  ontology: Ontology
  customStates: CustomState[]
  onCustomStatesChange: (states: CustomState[]) => void
}

const COLORS = [
  { id: 'gray', name: 'Gray', value: '#6B7280' },
  { id: 'blue', name: 'Blue', value: '#3B82F6' },
  { id: 'yellow', name: 'Yellow', value: '#F59E0B' },
  { id: 'green', name: 'Green', value: '#10B981' },
  { id: 'red', name: 'Red', value: '#EF4444' },
  { id: 'purple', name: 'Purple', value: '#8B5CF6' },
  { id: 'pink', name: 'Pink', value: '#EC4899' },
  { id: 'orange', name: 'Orange', value: '#F97316' },
]

export default function WorkflowEditor({ ontology, customStates, onCustomStatesChange }: WorkflowEditorProps) {
  const [insertAfterState, setInsertAfterState] = useState<string | null>(null)
  const [newState, setNewState] = useState<Partial<CustomState>>({ name: '', color: '#8B5CF6' })

  const workflow = ontology.workflows['work-order-status']

  // Build ordered list of all states (base + custom inserted at correct positions)
  const getOrderedStates = (): State[] => {
    const result: State[] = []

    for (const baseState of workflow.states) {
      result.push(baseState)

      // Find any custom states that should be inserted after this state
      const customAfterThis = customStates.filter(cs => cs.insertAfter === baseState.id)
      for (const custom of customAfterThis) {
        result.push({
          id: custom.id,
          name: custom.name,
          color: custom.color,
          isCustom: true,
          isInitial: false,
          isFinal: false
        })

        // Also check for custom states inserted after this custom state (chaining)
        const nestedCustom = customStates.filter(cs => cs.insertAfter === custom.id)
        for (const nested of nestedCustom) {
          result.push({
            id: nested.id,
            name: nested.name,
            color: nested.color,
            isCustom: true,
            isInitial: false,
            isFinal: false
          })
        }
      }
    }

    // Add any custom states without insertAfter at the end (legacy behavior)
    const customWithoutPosition = customStates.filter(cs => !cs.insertAfter)
    for (const custom of customWithoutPosition) {
      // Insert before final states
      const lastNonFinalIndex = result.findLastIndex(s => !s.isFinal)
      if (lastNonFinalIndex >= 0) {
        result.splice(lastNonFinalIndex + 1, 0, {
          id: custom.id,
          name: custom.name,
          color: custom.color,
          isCustom: true,
          isInitial: false,
          isFinal: false
        })
      }
    }

    return result
  }

  const orderedStates = getOrderedStates()

  const addCustomState = (afterStateId: string) => {
    if (!newState.name) return

    const state: CustomState = {
      id: `custom-${newState.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: newState.name,
      color: newState.color || '#8B5CF6',
      insertAfter: afterStateId
    }

    onCustomStatesChange([...customStates, state])
    setNewState({ name: '', color: '#8B5CF6' })
    setInsertAfterState(null)
  }

  const removeCustomState = (id: string) => {
    // Also update any states that were inserted after this one
    const updated = customStates
      .filter(s => s.id !== id)
      .map(s => s.insertAfter === id ? { ...s, insertAfter: customStates.find(cs => cs.id === id)?.insertAfter } : s)
    onCustomStatesChange(updated)
  }

  const startAddingAfter = (stateId: string) => {
    setInsertAfterState(stateId)
    setNewState({ name: '', color: '#8B5CF6' })
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Workflow Customization</h2>
        <p className="text-sm text-gray-500">Define status transitions - this generates actual state machine code</p>
      </div>

      {/* Workflow Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{workflow.name}</h3>
        <p className="text-sm text-gray-500">{workflow.description}</p>
      </div>

      {/* Visual State Machine */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-4">Status Flow</div>
        <p className="text-xs sm:text-sm text-gray-500 mb-4">Tap the + button between states to add a custom status</p>

        {/* Mobile: Vertical layout */}
        <div className="sm:hidden space-y-2">
          {orderedStates.map((state, index) => (
            <div key={state.id} className="flex flex-col items-center">
              {/* State chip */}
              <div
                className="relative px-4 py-2 rounded-lg font-medium text-white shadow-sm text-sm w-full text-center"
                style={{ backgroundColor: state.color }}
              >
                {state.name}
                {state.isInitial && (
                  <span className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
                {state.isFinal && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
                {state.isCustom && (
                  <button
                    onClick={() => removeCustomState(state.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Arrow and Add button (not after final states) */}
              {index < orderedStates.length - 1 && !state.isFinal && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-0.5 h-2 bg-gray-300" />
                  <button
                    onClick={() => startAddingAfter(state.id)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-purple-100 hover:text-purple-600 text-gray-400 flex items-center justify-center transition-colors my-1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="w-0.5 h-2 bg-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {orderedStates.map((state, index) => (
            <div key={state.id} className="flex items-center gap-2">
              {/* State chip */}
              <div
                className="relative px-4 py-2 rounded-lg font-medium text-white shadow-sm"
                style={{ backgroundColor: state.color }}
              >
                {state.name}
                {state.isInitial && (
                  <span className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white" title="Initial state" />
                )}
                {state.isFinal && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" title="Final state" />
                )}
                {state.isCustom && (
                  <button
                    onClick={() => removeCustomState(state.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Arrow and Add button (not after final states) */}
              {index < orderedStates.length - 1 && !state.isFinal && (
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                  <button
                    onClick={() => startAddingAfter(state.id)}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-purple-100 hover:text-purple-600 text-gray-400 flex items-center justify-center transition-colors"
                    title={`Add status after ${state.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Inline Add Form */}
        {insertAfterState && (
          <div className="mt-4 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm font-medium text-purple-800 mb-3">
              Add status after "{orderedStates.find(s => s.id === insertAfterState)?.name}"
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Status name (e.g., Awaiting Parts)"
                value={newState.name}
                onChange={(e) => setNewState({ ...newState, name: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                autoFocus
              />
              <div className="flex items-center gap-2 sm:gap-1 justify-between sm:justify-start">
                <div className="flex gap-1">
                  {COLORS.slice(0, 6).map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setNewState({ ...newState, color: color.value })}
                      className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg transition-transform ${
                        newState.color === color.value ? 'ring-2 ring-offset-1 ring-purple-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addCustomState(insertAfterState)}
                    disabled={!newState.name}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setInsertAfterState(null)}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full" />
            Initial
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            Final
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full" />
            Custom
          </div>
        </div>
      </div>

      {/* States List */}
      <div className="space-y-2 sm:space-y-3">
        <div className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">All States (in order)</div>

        {orderedStates.map((state, index) => (
          <div
            key={state.id}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
              state.isCustom
                ? 'bg-purple-50 border border-purple-200'
                : 'bg-gray-50'
            }`}
          >
            <div className="text-xs text-gray-400 w-5 sm:w-6 flex-shrink-0">{index + 1}.</div>
            <div
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: state.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-700 text-sm sm:text-base truncate">{state.name}</div>
              <div className="text-xs text-gray-500 hidden sm:block">
                {state.isInitial && 'Initial state'}
                {state.isFinal && 'Final state'}
                {state.isCustom && 'Custom state'}
                {!state.isInitial && !state.isFinal && !state.isCustom && (state.description || 'Base state')}
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 sm:py-1 rounded flex-shrink-0 ${
              state.isCustom
                ? 'text-purple-600 bg-purple-100'
                : 'text-gray-400 bg-gray-200'
            }`}>
              {state.isCustom ? 'Custom' : 'Base'}
            </span>
            {state.isCustom && (
              <button
                onClick={() => removeCustomState(state.id)}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Transitions */}
      <div className="space-y-2 sm:space-y-3">
        <div className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Transitions</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {workflow.transitions.map((transition, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs sm:text-sm"
            >
              <span className="font-medium text-gray-700 truncate">
                {workflow.states.find(s => s.id === transition.from)?.name}
              </span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-700 truncate">
                {workflow.states.find(s => s.id === transition.to)?.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="text-amber-500 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-amber-800 text-sm sm:text-base">Generated State Machine</div>
            <div className="text-xs sm:text-sm text-amber-700">
              These statuses generate TypeScript code with proper state transitions and validation.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
