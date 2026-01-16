import { useState, useEffect } from 'react'
import {
  Radio, Users, ClipboardCheck, Clock, AlertTriangle,
  MapPin, Calendar, UserCheck, Map
} from 'lucide-react'
import { getWorkOrders, type WorkOrder } from '../../db'

// Mock technicians data for demo
const TECHNICIANS = [
  { id: 't1', name: 'John Smith', status: 'active', currentOrders: 2, location: 'Downtown' },
  { id: 't2', name: 'Maria Garcia', status: 'active', currentOrders: 1, location: 'Westside' },
  { id: 't3', name: 'James Wilson', status: 'break', currentOrders: 0, location: 'N/A' },
  { id: 't4', name: 'Sarah Johnson', status: 'active', currentOrders: 3, location: 'Industrial Park' },
]

interface DispatcherDashboardProps {
  onNavigate: (view: string) => void
}

export default function DispatcherDashboard({ onNavigate }: DispatcherDashboardProps) {
  const [stats, setStats] = useState({
    unassigned: 0,
    activeToday: 0,
    activeTechnicians: 0,
    avgResponseTime: '45 min'
  })
  const [unassignedOrders, setUnassignedOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    const workOrders = await getWorkOrders()

    const unassigned = workOrders.filter(wo => wo.status === 'new')
    const activeToday = workOrders.filter(wo =>
      wo.status !== 'complete' && wo.status !== 'new'
    ).length

    setStats({
      unassigned: unassigned.length,
      activeToday,
      activeTechnicians: TECHNICIANS.filter(t => t.status === 'active').length,
      avgResponseTime: '45 min'
    })

    setUnassignedOrders(unassigned.slice(0, 3))
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
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-5 h-5" />
          <span className="text-xs font-medium opacity-80 uppercase tracking-wide">Dispatcher</span>
        </div>
        <div className="font-semibold">Your Outcomes</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('assign')}
            className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors cursor-pointer"
          >
            Assign Work Orders →
          </button>
          <button
            onClick={() => onNavigate('monitor-progress')}
            className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors cursor-pointer"
          >
            Monitor Progress →
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('assign')}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.unassigned}</span>
          </div>
          <div className="text-sm text-gray-600">Unassigned Orders</div>
        </button>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.activeToday}</span>
          </div>
          <div className="text-sm text-gray-600">Active Today</div>
        </div>

        <button
          onClick={() => onNavigate('technicians')}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.activeTechnicians}</span>
          </div>
          <div className="text-sm text-gray-600">Active Technicians</div>
        </button>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}</span>
          </div>
          <div className="text-sm text-gray-600">Avg Response</div>
        </div>
      </div>

      {/* Unassigned Alert */}
      {stats.unassigned > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <div className="flex-1">
            <div className="font-semibold text-orange-800">{stats.unassigned} Orders Need Assignment</div>
            <div className="text-sm text-orange-600">Assign to available technicians</div>
          </div>
          <button
            onClick={() => onNavigate('assign')}
            className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            Assign
          </button>
        </div>
      )}

      {/* Unassigned Work Orders */}
      {unassignedOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Unassigned Work Orders</h2>
            <button
              onClick={() => onNavigate('assign')}
              className="text-sm text-orange-600 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {unassignedOrders.map(order => (
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
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    Due: {new Date(order.dueDate).toLocaleDateString()}
                  </div>
                  <button className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technician Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Technician Status</h2>
          <button
            onClick={() => onNavigate('technicians')}
            className="text-sm text-blue-600 font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-2">
          {TECHNICIANS.slice(0, 3).map(tech => (
            <div
              key={tech.id}
              className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tech.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{tech.name}</div>
                <div className="text-xs text-gray-500">{tech.location}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs px-2 py-1 rounded ${
                  tech.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tech.status === 'active' ? 'Active' : 'On Break'}
                </div>
                <div className="text-xs text-gray-500 mt-1">{tech.currentOrders} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions - Match Outcome Names */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('assign')}
            className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-left"
          >
            <ClipboardCheck className="w-6 h-6 text-orange-600 mb-2" />
            <div className="font-medium text-orange-900">Assign Work Orders</div>
            <div className="text-xs text-orange-600">Dispatch to technicians</div>
          </button>
          <button
            onClick={() => onNavigate('monitor-progress')}
            className="bg-green-50 border border-green-200 rounded-xl p-4 text-left"
          >
            <Map className="w-6 h-6 text-green-600 mb-2" />
            <div className="font-medium text-green-900">Monitor Progress</div>
            <div className="text-xs text-green-600">View Map & track status</div>
          </button>
        </div>
      </div>
    </div>
  )
}
