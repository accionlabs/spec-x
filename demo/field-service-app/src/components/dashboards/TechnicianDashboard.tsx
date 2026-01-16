import { useState, useEffect } from 'react'
import {
  ClipboardList, Wrench, Clock, CheckCircle, AlertTriangle,
  TrendingUp, Calendar, MapPin, Plus
} from 'lucide-react'
import { getWorkOrders, getEquipment, type WorkOrder } from '../../db'
import { useCustomFields, useEnabledScenarios } from '../../config'

interface TechnicianDashboardProps {
  onNavigate: (view: string) => void
  onCreateWorkOrder?: () => void
}

export default function TechnicianDashboard({ onNavigate, onCreateWorkOrder }: TechnicianDashboardProps) {
  const customFields = useCustomFields()
  const enabledScenarios = useEnabledScenarios()
  const canCreateWorkOrders = enabledScenarios.includes('create-work-orders')
  const canViewWorkOrders = enabledScenarios.includes('view-work-orders')
  const canTrackEquipment = enabledScenarios.includes('view-history') || enabledScenarios.includes('scan-barcode')

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    equipmentCount: 0
  })
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    const workOrders = await getWorkOrders()
    const equipment = await getEquipment()

    const now = new Date()
    const overdue = workOrders.filter(wo =>
      wo.status !== 'complete' && new Date(wo.dueDate) < now
    ).length

    setStats({
      total: workOrders.length,
      pending: workOrders.filter(wo => wo.status === 'new' || wo.status === 'assigned').length,
      inProgress: workOrders.filter(wo => wo.status === 'in-progress' || wo.status === 'awaiting-parts').length,
      completed: workOrders.filter(wo => wo.status === 'complete').length,
      overdue,
      equipmentCount: equipment.length
    })

    // Get 3 most recent/urgent orders
    const sorted = [...workOrders]
      .filter(wo => wo.status !== 'complete')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
      })
      .slice(0, 3)
    setRecentOrders(sorted)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Persona Outcomes Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="w-5 h-5" />
          <span className="text-xs font-medium opacity-80 uppercase tracking-wide">Field Technician</span>
        </div>
        <div className="font-semibold">Your Outcomes</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {canCreateWorkOrders && (
            <button
              onClick={onCreateWorkOrder}
              className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors cursor-pointer"
            >
              Manage Work Orders →
            </button>
          )}
          {canViewWorkOrders && (
            <button
              onClick={() => onNavigate('work-orders')}
              className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors cursor-pointer"
            >
              Complete Work Orders →
            </button>
          )}
          {canTrackEquipment && (
            <button
              onClick={() => onNavigate('equipment')}
              className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors cursor-pointer"
            >
              Track Equipment →
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {canViewWorkOrders && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('work-orders')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <div className="text-sm text-gray-600">Total Work Orders</div>
          </button>

          <button
            onClick={() => onNavigate('work-orders')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.pending}</span>
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </button>

          <button
            onClick={() => onNavigate('work-orders')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.inProgress}</span>
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </button>

          <button
            onClick={() => onNavigate('work-orders')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.completed}</span>
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </button>
        </div>
      )}

      {/* Overdue Alert */}
      {canViewWorkOrders && stats.overdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <div className="font-semibold text-red-800">{stats.overdue} Overdue Work Orders</div>
            <div className="text-sm text-red-600">Requires immediate attention</div>
          </div>
        </div>
      )}

      {/* Urgent Work Orders */}
      {canViewWorkOrders && recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Priority Work Orders</h2>
            <button
              onClick={() => onNavigate('work-orders')}
              className="text-sm text-blue-600 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div
                key={order._id}
                className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{order.title}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3" />
                      {order.location}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    order.priority === 'critical' ? 'bg-red-100 text-red-700' :
                    order.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    order.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Due: {new Date(order.dueDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions - Match Outcome Names */}
      {(canCreateWorkOrders || canViewWorkOrders || canTrackEquipment) && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {canCreateWorkOrders && (
              <button
                onClick={onCreateWorkOrder}
                className="bg-green-50 border border-green-200 rounded-xl p-4 text-left"
              >
                <Plus className="w-6 h-6 text-green-600 mb-2" />
                <div className="font-medium text-green-900">Create Work Order</div>
                <div className="text-xs text-green-600">Add a new job</div>
              </button>
            )}
            {canViewWorkOrders && (
              <button
                onClick={() => onNavigate('work-orders')}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left"
              >
                <ClipboardList className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium text-blue-900">Complete Work Orders</div>
                <div className="text-xs text-blue-600">View, update & complete tasks</div>
              </button>
            )}
            {canTrackEquipment && (
              <button
                onClick={() => onNavigate('equipment')}
                className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-left"
              >
                <Wrench className="w-6 h-6 text-purple-600 mb-2" />
                <div className="font-medium text-purple-900">Track Equipment</div>
                <div className="text-xs text-purple-600">Look up & view history</div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feature Highlights - Custom Fields from Config */}
      {customFields.workOrder.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Custom Fields (From Spec)
          </div>
          <div className="space-y-1 text-sm text-gray-700">
            {customFields.workOrder.map(field => (
              <div key={field.id} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {field.label}
                {field.required && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
