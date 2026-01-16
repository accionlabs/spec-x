import WorkflowEditor from '../../WorkflowEditor'
import type { CustomState } from '../../../App'

interface State {
  id: string
  name: string
  color: string
  isInitial?: boolean
  isFinal?: boolean
  description?: string
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

interface WorkflowStepProps {
  ontology: Ontology
  customStates: CustomState[]
  onCustomStatesChange: (states: CustomState[]) => void
}

export default function WorkflowStep({
  ontology,
  customStates,
  onCustomStatesChange,
}: WorkflowStepProps) {
  return (
    <div className="space-y-4">
      {/* Context header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 mb-6">
        <p className="text-sm text-amber-800">
          Customize your work order statuses to match your process.
          Custom states generate real TypeScript code with proper state machine validation.
          This step is optional.
        </p>
      </div>

      {/* Reuse existing WorkflowEditor */}
      <WorkflowEditor
        ontology={ontology}
        customStates={customStates}
        onCustomStatesChange={onCustomStatesChange}
      />
    </div>
  )
}
