import DataModelEditor from '../../DataModelEditor'
import type { CustomField } from '../../../App'

interface Field {
  id: string
  name: string
  type: string
  required: boolean
  description?: string
}

interface Entity {
  id: string
  name: string
  description: string
  icon: string
  baseFields: Field[]
  allowCustomFields: boolean
}

interface FieldType {
  id: string
  name: string
  icon: string
  description: string
}

interface Ontology {
  dataModel: {
    entities: Entity[]
    fieldTypes: FieldType[]
  }
}

interface DataModelStepProps {
  ontology: Ontology
  customFields: Record<string, CustomField[]>
  onCustomFieldsChange: (fields: Record<string, CustomField[]>) => void
}

export default function DataModelStep({
  ontology,
  customFields,
  onCustomFieldsChange,
}: DataModelStepProps) {
  return (
    <div className="space-y-4">
      {/* Context header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 mb-6">
        <p className="text-sm text-purple-800">
          Add custom fields to your work orders. These become real database columns
          that are fully indexed and queryable. This step is optional.
        </p>
      </div>

      {/* Reuse existing DataModelEditor */}
      <DataModelEditor
        ontology={ontology}
        customFields={customFields}
        onCustomFieldsChange={onCustomFieldsChange}
      />
    </div>
  )
}
