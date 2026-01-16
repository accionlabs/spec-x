import FeatureSelector from '../../FeatureSelector'

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

interface FeaturesStepProps {
  ontology: Ontology
  selectedScenarios: Set<string>
  onSelectionChange: (scenarios: Set<string>) => void
  infrastructure: string
}

export default function FeaturesStep({
  ontology,
  selectedScenarios,
  onSelectionChange,
  infrastructure,
}: FeaturesStepProps) {
  return (
    <div className="space-y-4">
      {/* Context header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mb-6">
        <p className="text-sm text-blue-800">
          Based on your team size selection, you have access to certain personas.
          Expand each persona to select the specific features you need.
        </p>
      </div>

      {/* Reuse existing FeatureSelector */}
      <FeatureSelector
        ontology={ontology}
        selectedScenarios={selectedScenarios}
        onSelectionChange={onSelectionChange}
        infrastructure={infrastructure}
      />
    </div>
  )
}
