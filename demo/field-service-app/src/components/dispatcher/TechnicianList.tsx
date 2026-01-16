import { useState } from 'react'
import {
  Users, MapPin, Clock, CheckCircle, Phone, Mail,
  ChevronRight, Coffee, Wrench
} from 'lucide-react'

// Mock technicians data for demo
const TECHNICIANS = [
  {
    id: 't1',
    name: 'John Smith',
    status: 'active',
    currentOrders: 2,
    completedToday: 3,
    location: 'Downtown District',
    phone: '(555) 123-4567',
    email: 'john.smith@company.com',
    currentTask: 'HVAC Unit Maintenance'
  },
  {
    id: 't2',
    name: 'Maria Garcia',
    status: 'active',
    currentOrders: 1,
    completedToday: 4,
    location: 'Westside Business Park',
    phone: '(555) 234-5678',
    email: 'maria.garcia@company.com',
    currentTask: 'Generator Inspection'
  },
  {
    id: 't3',
    name: 'James Wilson',
    status: 'break',
    currentOrders: 0,
    completedToday: 2,
    location: 'N/A',
    phone: '(555) 345-6789',
    email: 'james.wilson@company.com',
    currentTask: null
  },
  {
    id: 't4',
    name: 'Sarah Johnson',
    status: 'active',
    currentOrders: 3,
    completedToday: 5,
    location: 'Industrial Park',
    phone: '(555) 456-7890',
    email: 'sarah.johnson@company.com',
    currentTask: 'Emergency Cooling Repair'
  },
]

export default function TechnicianList() {
  const [selectedTech, setSelectedTech] = useState<string | null>(null)

  const activeTechs = TECHNICIANS.filter(t => t.status === 'active').length
  const totalOrders = TECHNICIANS.reduce((acc, t) => acc + t.currentOrders, 0)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Technicians</h2>
        </div>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-green-600">{activeTechs} active</span>
          <span className="text-gray-500">{totalOrders} orders in progress</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-3 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-700">{activeTechs}</div>
          <div className="text-xs text-green-600">Active</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-700">
            {TECHNICIANS.filter(t => t.status === 'break').length}
          </div>
          <div className="text-xs text-yellow-600">On Break</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-700">{totalOrders}</div>
          <div className="text-xs text-blue-600">Orders</div>
        </div>
      </div>

      {/* Technician List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {TECHNICIANS.map(tech => (
          <div
            key={tech.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setSelectedTech(selectedTech === tech.id ? null : tech.id)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                tech.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {tech.status === 'active' ? (
                  <Wrench className="w-6 h-6 text-green-600" />
                ) : (
                  <Coffee className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{tech.name}</div>
                <div className="text-sm text-gray-500">
                  {tech.status === 'active' ? (
                    <span className="text-green-600">{tech.currentOrders} active orders</span>
                  ) : (
                    <span className="text-yellow-600">On break</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-xs px-2 py-1 rounded ${
                  tech.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {tech.status === 'active' ? 'Active' : 'Break'}
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                  selectedTech === tech.id ? 'rotate-90' : ''
                }`} />
              </div>
            </button>

            {selectedTech === tech.id && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
                {tech.currentTask && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs text-blue-600 font-medium mb-1">Current Task</div>
                    <div className="text-sm text-blue-900">{tech.currentTask}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {tech.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4" />
                    {tech.completedToday} done today
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`tel:${tech.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  <a
                    href={`mailto:${tech.email}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Last update: 5 minutes ago
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
