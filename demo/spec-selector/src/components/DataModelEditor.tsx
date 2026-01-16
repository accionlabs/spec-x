import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronRight, Database, Type, Hash, Calendar, List, CheckSquare, Star } from 'lucide-react'
import type { CustomField } from '../App'

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

interface DataModelEditorProps {
  ontology: Ontology
  customFields: Record<string, CustomField[]>
  onCustomFieldsChange: (fields: Record<string, CustomField[]>) => void
}

export default function DataModelEditor({ ontology, customFields, onCustomFieldsChange }: DataModelEditorProps) {
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set(['work-order']))
  const [addingFieldTo, setAddingFieldTo] = useState<string | null>(null)
  const [newField, setNewField] = useState<Partial<CustomField>>({ name: '', type: 'text', required: false })

  const toggleEntity = (id: string) => {
    const next = new Set(expandedEntities)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedEntities(next)
  }

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'textarea': return <Type className="w-4 h-4" />
      case 'number': return <Hash className="w-4 h-4" />
      case 'date':
      case 'datetime': return <Calendar className="w-4 h-4" />
      case 'dropdown': return <List className="w-4 h-4" />
      case 'checkbox': return <CheckSquare className="w-4 h-4" />
      case 'rating': return <Star className="w-4 h-4" />
      default: return <Type className="w-4 h-4" />
    }
  }

  const addCustomField = (entityId: string) => {
    if (!newField.name) return

    const field: CustomField = {
      id: `custom-${Date.now()}`,
      name: newField.name,
      type: newField.type || 'text',
      required: newField.required || false,
      options: newField.type === 'dropdown' ? newField.options : undefined
    }

    const entityFields = customFields[entityId] || []
    onCustomFieldsChange({
      ...customFields,
      [entityId]: [...entityFields, field]
    })

    setNewField({ name: '', type: 'text', required: false })
    setAddingFieldTo(null)
  }

  const removeCustomField = (entityId: string, fieldId: string) => {
    const entityFields = customFields[entityId] || []
    onCustomFieldsChange({
      ...customFields,
      [entityId]: entityFields.filter(f => f.id !== fieldId)
    })
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Data Model Customization</h2>
        <p className="text-sm text-gray-500">Add custom fields to entities - these become real database columns</p>
      </div>

      {ontology.dataModel.entities.map((entity) => (
        <div key={entity.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Entity Header */}
          <button
            onClick={() => toggleEntity(entity.id)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {expandedEntities.has(entity.id) ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Database className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <div className="font-medium text-gray-900">{entity.name}</div>
              <div className="text-sm text-gray-500">{entity.description}</div>
            </div>
            <div className="text-sm text-gray-400">
              {entity.baseFields.length + (customFields[entity.id]?.length || 0)} fields
            </div>
          </button>

          {/* Fields */}
          {expandedEntities.has(entity.id) && (
            <div className="border-t border-gray-200 p-4 space-y-3">
              {/* Base Fields */}
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Base Fields</div>
              <div className="space-y-2">
                {entity.baseFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                      {getFieldIcon(field.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">{field.name}</div>
                      <div className="text-xs text-gray-500">{field.type}{field.required ? ' • Required' : ''}</div>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">Base</span>
                  </div>
                ))}
              </div>

              {/* Custom Fields */}
              {(customFields[entity.id]?.length || 0) > 0 && (
                <>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wider mt-4 mb-2">Custom Fields</div>
                  <div className="space-y-2">
                    {customFields[entity.id]?.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-green-200 rounded flex items-center justify-center text-green-600">
                          {getFieldIcon(field.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-700">{field.name}</div>
                          <div className="text-xs text-gray-500">{field.type}{field.required ? ' • Required' : ''}</div>
                        </div>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Custom</span>
                        <button
                          onClick={() => removeCustomField(entity.id, field.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Add Field Form */}
              {entity.allowCustomFields && (
                <>
                  {addingFieldTo === entity.id ? (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div className="text-sm font-medium text-blue-800">Add Custom Field</div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Field name"
                          value={newField.name}
                          onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <select
                          value={newField.type}
                          onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {ontology.dataModel.fieldTypes.map((ft) => (
                            <option key={ft.id} value={ft.id}>{ft.name}</option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Required field</span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addCustomField(entity.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Add Field
                        </button>
                        <button
                          onClick={() => setAddingFieldTo(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingFieldTo(entity.id)}
                      className="mt-2 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom Field
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-amber-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-amber-800">Real Database Fields</div>
            <div className="text-sm text-amber-700">
              Custom fields are generated as actual database columns, not just metadata. They're fully indexed and queryable.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
