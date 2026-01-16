import { useState, useEffect } from 'react'
import {
  ClipboardCheck, MapPin, Calendar, User, Check, X, AlertTriangle
} from 'lucide-react'
import { getWorkOrders, updateWorkOrder, type WorkOrder } from '../../db'

// Mock technicians for assignment
const TECHNICIANS = [
  { id: 't1', name: 'John Smith', available: true, currentOrders: 2 },
  { id: 't2', name: 'Maria Garcia', available: true, currentOrders: 1 },
  { id: 't3', name: 'James Wilson', available: false, currentOrders: 0 },
  { id: 't4', name: 'Sarah Johnson', available: true, currentOrders: 3 },
]

export default function AssignmentView() {
  const [unassignedOrders, setUnassignedOrders] = useState<WorkOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    const workOrders = await getWorkOrders()
    const unassigned = workOrders.filter(wo => wo.status === 'new')
    setUnassignedOrders(unassigned)
    setLoading(false)
  }

  const handleAssign = async (order: WorkOrder, technicianName: string) => {
    const updated = {
      ...order,
      status: 'assigned' as const,
      assignedTo: technicianName
    }
    await updateWorkOrder(updated)
    setSelectedOrder(null)
    loadOrders()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-orange-600" />
          <h2 className="font-semibold text-gray-900">Assign Work Orders</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {unassignedOrders.length} orders waiting for assignment
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {unassignedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Check className="w-12 h-12 text-green-500 mb-3" />
            <div className="font-medium">All Caught Up!</div>
            <div className="text-sm">No unassigned work orders</div>
          </div>
        ) : (
          unassignedOrders.map(order => (
            <div
              key={order._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{order.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{order.description}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ml-2 ${
                    order.priority === 'critical' ? 'bg-red-100 text-red-700' :
                    order.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    order.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {order.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due: {new Date(order.dueDate).toLocaleDateString()}
                  </div>
                </div>

                {order.priority === 'critical' && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    Critical priority - assign immediately
                  </div>
                )}
              </div>

              {selectedOrder?._id === order._id ? (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">Select Technician:</div>
                  <div className="space-y-2">
                    {TECHNICIANS.filter(t => t.available).map(tech => (
                      <button
                        key={tech.id}
                        onClick={() => handleAssign(order, tech.name)}
                        className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">{tech.name}</div>
                          <div className="text-xs text-gray-500">{tech.currentOrders} current orders</div>
                        </div>
                        <Check className="w-5 h-5 text-gray-300" />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 p-3">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    Assign Technician
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
