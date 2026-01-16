import { useState, useEffect } from 'react'
import { ArrowLeft, Save, AlertCircle, Star } from 'lucide-react'
import { createWorkOrder, getEquipment, type Equipment } from '../db'
import { useCustomFields, type CustomFieldConfig } from '../config'

interface NewWorkOrderProps {
  onBack: () => void
  onCreated: () => void
}

// Render a custom field based on its config
function renderCustomField(
  field: CustomFieldConfig,
  value: unknown,
  onChange: (value: unknown) => void,
  equipment: Equipment[]
) {
  switch (field.type) {
    case 'text':
      // Special case for equipment serial number - show as dropdown
      if (field.id === 'equipmentSerialNumber' && equipment.length > 0) {
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select equipment...</option>
            {equipment.map(eq => (
              <option key={eq._id} value={eq.serialNumber}>
                {eq.serialNumber} - {eq.name}
              </option>
            ))}
          </select>
        )
      }
      return (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      )

    case 'number':
      return (
        <input
          type="number"
          value={(value as number) || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )

    case 'date':
      return (
        <input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )

    case 'checkbox':
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={field.id}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={field.id} className="text-sm font-medium text-gray-700">
            {field.label}
          </label>
        </div>
      )

    case 'rating':
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(value === rating ? undefined : rating)}
              className="p-2 touch-target"
            >
              <Star
                className={`w-8 h-8 ${
                  ((value as number) || 0) >= rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      )

    case 'dropdown':
      return (
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select...</option>
          {(field.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )

    default:
      return null
  }
}

export default function NewWorkOrder({ onBack, onCreated }: NewWorkOrderProps) {
  const customFieldsConfig = useCustomFields()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assignedTo: 'John Smith',
    dueDate: new Date().toISOString().split('T')[0],
    location: ''
  })

  // Dynamic custom field values
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({})

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    const eq = await getEquipment()
    setEquipment(eq)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    try {
      // Build the work order with custom field values
      await createWorkOrder({
        title: formData.title,
        description: formData.description,
        status: 'new',
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        location: formData.location,
        // Include custom field values
        equipmentSerialNumber: (customFieldValues.equipmentSerialNumber as string) || undefined,
        safetyChecklistCompleted: Boolean(customFieldValues.safetyChecklistCompleted),
        customerSatisfaction: customFieldValues.customerSatisfaction as number | undefined,
        checklist: {
          inspect: false,
          diagnose: false,
          repair: false,
          test: false,
          cleanup: false
        },
        notes: []
      })
      onCreated()
    } catch (err) {
      setError('Failed to create work order')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCustomFieldChange = (fieldId: string, value: unknown) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }))

    // Special handling for equipment serial - auto-fill location
    if (fieldId === 'equipmentSerialNumber' && value) {
      const eq = equipment.find(e => e.serialNumber === value)
      if (eq && eq.location) {
        setFormData(prev => ({ ...prev, location: eq.location || prev.location }))
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg touch-target"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-semibold text-gray-900 flex-1">New Work Order</h2>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Basic Info Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter work order title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the work to be done"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Custom Fields Section - FROM SPEC */}
        {customFieldsConfig.workOrder.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Custom Fields</h3>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">FROM SPEC</span>
            </div>
            <p className="text-sm text-gray-500">These fields were generated from your specification</p>

            {customFieldsConfig.workOrder.map((field) => (
              <div key={field.id}>
                {field.type !== 'checkbox' && (
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {renderCustomField(
                  field,
                  customFieldValues[field.id],
                  (value) => handleCustomFieldChange(field.id, value),
                  equipment
                )}
              </div>
            ))}
          </div>
        )}

        {/* Spacer for safe area */}
        <div className="h-4" />
      </form>
    </div>
  )
}
