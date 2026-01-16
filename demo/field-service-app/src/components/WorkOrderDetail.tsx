import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, MapPin, Clock, Star, CheckSquare, Square,
  Save, MessageSquare, AlertTriangle, Camera, X, Image
} from 'lucide-react'
import { updateWorkOrder, type WorkOrder } from '../db'
import { useWorkflowStates, useEnabledScenarios } from '../config'

interface WorkOrderDetailProps {
  workOrder: WorkOrder
  onBack: () => void
  onChange: () => void
}

const CHECKLIST_ITEMS = [
  { key: 'inspect', label: 'workOrder.checklist.items.inspect' },
  { key: 'diagnose', label: 'workOrder.checklist.items.diagnose' },
  { key: 'repair', label: 'workOrder.checklist.items.repair' },
  { key: 'test', label: 'workOrder.checklist.items.test' },
  { key: 'cleanup', label: 'workOrder.checklist.items.cleanup' }
]

export default function WorkOrderDetail({ workOrder: initialWorkOrder, onBack, onChange }: WorkOrderDetailProps) {
  const { t } = useTranslation()
  const workflowStates = useWorkflowStates()
  const enabledScenarios = useEnabledScenarios()
  const canCapturePhotos = enabledScenarios.includes('capture-photos')
  const [workOrder, setWorkOrder] = useState<WorkOrder>(initialWorkOrder)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Photo capture handlers
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      const updated = {
        ...workOrder,
        photos: [...(workOrder.photos || []), base64]
      }
      setWorkOrder(updated)
      await saveWorkOrder(updated)
    }
    reader.readAsDataURL(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (index: number) => {
    const updated = {
      ...workOrder,
      photos: (workOrder.photos || []).filter((_, i) => i !== index)
    }
    setWorkOrder(updated)
    await saveWorkOrder(updated)
  }

  // Build status options from config workflow states
  const statusOptions = workflowStates.map(state => ({
    value: state.id,
    label: state.name,
    color: state.color,
    isCustom: state.isCustom
  }))

  const handleStatusChange = async (status: WorkOrder['status']) => {
    const updated = { ...workOrder, status }
    setWorkOrder(updated)
    await saveWorkOrder(updated)
  }

  const handleChecklistToggle = async (key: keyof WorkOrder['checklist']) => {
    const updated = {
      ...workOrder,
      checklist: {
        ...workOrder.checklist,
        [key]: !workOrder.checklist[key]
      }
    }
    setWorkOrder(updated)
    await saveWorkOrder(updated)
  }

  const handleSafetyChecklistToggle = async () => {
    const updated = {
      ...workOrder,
      safetyChecklistCompleted: !workOrder.safetyChecklistCompleted
    }
    setWorkOrder(updated)
    await saveWorkOrder(updated)
  }

  const handleSatisfactionChange = async (rating: number) => {
    const updated = {
      ...workOrder,
      customerSatisfaction: rating
    }
    setWorkOrder(updated)
    await saveWorkOrder(updated)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    const updated = {
      ...workOrder,
      notes: [...workOrder.notes, `[${new Date().toLocaleTimeString()}] ${newNote.trim()}`]
    }
    setWorkOrder(updated)
    setNewNote('')
    await saveWorkOrder(updated)
  }

  const saveWorkOrder = async (wo: WorkOrder) => {
    setSaving(true)
    try {
      const result = await updateWorkOrder(wo)
      setWorkOrder(result)
      onChange()
    } catch (error) {
      console.error('Error saving work order:', error)
    } finally {
      setSaving(false)
    }
  }

  const checklistProgress = Object.values(workOrder.checklist).filter(Boolean).length
  const checklistTotal = Object.values(workOrder.checklist).length

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg touch-target"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 truncate">{workOrder.title}</h1>
          <p className="text-sm text-gray-500 truncate">{workOrder._id}</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Save className="w-4 h-4 animate-pulse" />
            <span>Saving...</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status Selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            {t('workOrder.fields.status')}
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value as WorkOrder['status'])}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  workOrder.status === option.value
                    ? `${option.color} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${option.isCustom ? 'ring-1 ring-purple-300' : ''}`}
              >
                {option.label}
                {option.isCustom && <span className="ml-1 text-xs opacity-75">*</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <h2 className="font-medium text-gray-900">Details</h2>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t('workOrder.fields.description')}
            </label>
            <p className="text-gray-700 mt-1">{workOrder.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t('workOrder.fields.location')}
              </label>
              <p className="text-gray-700 mt-1">{workOrder.location}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('workOrder.fields.dueDate')}
              </label>
              <p className={`mt-1 ${
                new Date(workOrder.dueDate) < new Date() && workOrder.status !== 'complete'
                  ? 'text-red-600 font-medium'
                  : 'text-gray-700'
              }`}>
                {new Date(workOrder.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Custom Field: Equipment Serial */}
          {workOrder.equipmentSerialNumber && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('workOrder.fields.equipmentSerial')}
              </label>
              <p className="text-gray-700 mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
                {workOrder.equipmentSerialNumber}
              </p>
            </div>
          )}
        </div>

        {/* Service Checklist */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">{t('workOrder.checklist.title')}</h2>
            <span className="text-sm text-gray-500">
              {checklistProgress}/{checklistTotal}
            </span>
          </div>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleChecklistToggle(item.key as keyof WorkOrder['checklist'])}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors touch-target"
              >
                {workOrder.checklist[item.key as keyof WorkOrder['checklist']] ? (
                  <CheckSquare className="w-5 h-5 text-green-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                <span className={workOrder.checklist[item.key as keyof WorkOrder['checklist']] ? 'text-gray-500 line-through' : 'text-gray-700'}>
                  {t(item.label)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Field: Safety Checklist */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <button
            onClick={handleSafetyChecklistToggle}
            className="w-full flex items-center gap-3 touch-target"
          >
            {workOrder.safetyChecklistCompleted ? (
              <CheckSquare className="w-6 h-6 text-green-600" />
            ) : (
              <Square className="w-6 h-6 text-gray-400" />
            )}
            <div className="text-left">
              <span className="font-medium text-gray-900">{t('workOrder.fields.safetyChecklist')}</span>
              {!workOrder.safetyChecklistCompleted && (
                <p className="text-sm text-amber-600 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  Required before completion
                </p>
              )}
            </div>
          </button>
        </div>

        {/* Custom Field: Customer Satisfaction */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-medium text-gray-900 mb-3">{t('workOrder.fields.customerSatisfaction')}</h2>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleSatisfactionChange(rating)}
                className="p-2 touch-target"
              >
                <Star
                  className={`w-8 h-8 ${
                    (workOrder.customerSatisfaction || 0) >= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Site Photos - Capture Photos Feature (only if scenario enabled) */}
        {canCapturePhotos && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-900 flex items-center gap-2">
                <Image className="w-5 h-5 text-gray-600" />
                {t('workOrder.fields.photos')}
              </h2>
              <span className="text-sm text-gray-500">
                {(workOrder.photos || []).length} photo{(workOrder.photos || []).length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Photo Grid */}
            {(workOrder.photos || []).length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(workOrder.photos || []).map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={photo}
                      alt={`Site photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDeletePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Camera Capture Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors touch-target"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">{t('workOrder.actions.capturePhoto')}</span>
            </button>
          </div>
        )}

        {/* Work Notes */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-medium text-gray-900 mb-3">{t('workOrder.fields.notes')}</h2>

          {workOrder.notes.length > 0 && (
            <div className="space-y-2 mb-4">
              {workOrder.notes.map((note, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  {note}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
