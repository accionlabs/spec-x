import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, MapPin, AlertTriangle, CheckCircle, Play, Package } from 'lucide-react'
import { getWorkOrders, type WorkOrder } from '../db'

interface WorkOrderListProps {
  onSelect: (workOrder: WorkOrder) => void
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  'new': <Clock className="w-4 h-4" />,
  'assigned': <Play className="w-4 h-4" />,
  'in-progress': <Play className="w-4 h-4" />,
  'awaiting-parts': <Package className="w-4 h-4" />,
  'complete': <CheckCircle className="w-4 h-4" />
}

const STATUS_COLORS: Record<string, string> = {
  'new': 'bg-gray-500',
  'assigned': 'bg-blue-500',
  'in-progress': 'bg-yellow-500',
  'awaiting-parts': 'bg-purple-500',
  'complete': 'bg-green-500'
}

const PRIORITY_COLORS: Record<string, string> = {
  'low': 'text-gray-500 bg-gray-100',
  'medium': 'text-blue-600 bg-blue-100',
  'high': 'text-orange-600 bg-orange-100',
  'critical': 'text-red-600 bg-red-100'
}

export default function WorkOrderList({ onSelect }: WorkOrderListProps) {
  const { t } = useTranslation()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkOrders()
  }, [])

  const loadWorkOrders = async () => {
    setLoading(true)
    const orders = await getWorkOrders()
    // Sort by priority and due date
    orders.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const aPriority = priorityOrder[a.priority] ?? 4
      const bPriority = priorityOrder[b.priority] ?? 4
      if (aPriority !== bPriority) return aPriority - bPriority
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
    setWorkOrders(orders)
    setLoading(false)
  }

  const filteredOrders = workOrders.filter(wo => {
    if (filter === 'all') return true
    return wo.status === filter
  })

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return t('workOrder.new')
      case 'assigned': return t('workOrder.assigned')
      case 'in-progress': return t('workOrder.inProgress')
      case 'awaiting-parts': return t('workOrder.awaitingParts')
      case 'complete': return t('workOrder.complete')
      default: return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    return t(`workOrder.priority.${priority}`)
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && dueDate !== ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'new', 'assigned', 'in-progress', 'awaiting-parts', 'complete'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : getStatusLabel(status)}
              {status !== 'all' && (
                <span className="ml-1 text-xs opacity-75">
                  ({workOrders.filter(wo => wo.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Work Order List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No work orders found
          </div>
        ) : (
          filteredOrders.map((workOrder) => (
            <button
              key={workOrder._id}
              onClick={() => onSelect(workOrder)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-left hover:shadow-md transition-shadow touch-target"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {workOrder.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                    {workOrder.description}
                  </p>
                </div>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[workOrder.priority]}`}>
                  {getPriorityLabel(workOrder.priority)}
                </span>
              </div>

              {/* Status & Location */}
              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-white ${STATUS_COLORS[workOrder.status]}`}>
                  {STATUS_ICONS[workOrder.status]}
                  <span className="text-xs font-medium">{getStatusLabel(workOrder.status)}</span>
                </div>

                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{workOrder.location}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className={`flex items-center gap-1 text-sm ${
                  isOverdue(workOrder.dueDate) && workOrder.status !== 'complete'
                    ? 'text-red-600 font-medium'
                    : 'text-gray-500'
                }`}>
                  {isOverdue(workOrder.dueDate) && workOrder.status !== 'complete' && (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <Clock className="w-4 h-4" />
                  <span>Due: {new Date(workOrder.dueDate).toLocaleDateString()}</span>
                </div>

                {/* Checklist Progress */}
                <div className="flex items-center gap-1">
                  {Object.values(workOrder.checklist).map((done, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${done ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
