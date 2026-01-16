import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, User, Wrench, Clock, Navigation, Layers, ZoomIn, ZoomOut } from 'lucide-react'

// Mock technicians with locations for the demo map
const TECHNICIANS = [
  {
    id: 't1',
    name: 'John Smith',
    status: 'active',
    currentOrder: 'HVAC Unit Maintenance',
    location: { x: 35, y: 40, label: 'Downtown' }
  },
  {
    id: 't2',
    name: 'Maria Garcia',
    status: 'active',
    currentOrder: 'Generator Inspection',
    location: { x: 25, y: 65, label: 'Westside' }
  },
  {
    id: 't3',
    name: 'James Wilson',
    status: 'break',
    currentOrder: null,
    location: { x: 60, y: 30, label: 'North District' }
  },
  {
    id: 't4',
    name: 'Sarah Johnson',
    status: 'active',
    currentOrder: 'Emergency Cooling Repair',
    location: { x: 70, y: 70, label: 'Industrial Park' }
  },
]

// Mock work order locations
const WORK_ORDERS = [
  { id: 'wo1', title: 'Elevator Service Call', priority: 'high', location: { x: 45, y: 55 } },
  { id: 'wo2', title: 'AC Inspection', priority: 'low', location: { x: 55, y: 25 } },
  { id: 'wo3', title: 'Plumbing Repair', priority: 'medium', location: { x: 20, y: 35 } },
]

export default function TechnicianMap() {
  const { t } = useTranslation()
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [showOrders, setShowOrders] = useState(true)
  const [zoom, setZoom] = useState(1)

  const selectedTechnician = TECHNICIANS.find(t => t.id === selectedTech)

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Map Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            {t('map.title')}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOrders(!showOrders)}
              className={`p-2 rounded-lg transition-colors ${
                showOrders ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Simulated Map Background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          {/* Grid lines for map effect */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Simulated roads */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300" />
          <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-gray-300" />
          <div className="absolute top-0 bottom-0 right-1/3 w-1 bg-gray-300" />
          <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gray-200" />
          <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-gray-200" />

          {/* Area labels */}
          <div className="absolute top-[15%] left-[20%] text-xs text-gray-400 font-medium">NORTH DISTRICT</div>
          <div className="absolute top-[35%] left-[30%] text-xs text-gray-400 font-medium">DOWNTOWN</div>
          <div className="absolute top-[60%] left-[15%] text-xs text-gray-400 font-medium">WESTSIDE</div>
          <div className="absolute top-[65%] left-[65%] text-xs text-gray-400 font-medium">INDUSTRIAL PARK</div>

          {/* Work Order Markers */}
          {showOrders && WORK_ORDERS.map(order => (
            <div
              key={order.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${order.location.x}%`, top: `${order.location.y}%` }}
            >
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${
                order.priority === 'high' ? 'bg-red-500' :
                order.priority === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
            </div>
          ))}

          {/* Technician Markers */}
          {TECHNICIANS.map(tech => (
            <button
              key={tech.id}
              onClick={() => setSelectedTech(selectedTech === tech.id ? null : tech.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                selectedTech === tech.id ? 'z-20 scale-125' : 'z-10'
              }`}
              style={{ left: `${tech.location.x}%`, top: `${tech.location.y}%` }}
            >
              <div className={`relative ${selectedTech === tech.id ? 'animate-pulse' : ''}`}>
                {/* Pulse effect for active techs */}
                {tech.status === 'active' && (
                  <div className="absolute inset-0 w-10 h-10 -m-1 rounded-full bg-green-400 opacity-30 animate-ping" />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${
                  tech.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="absolute right-4 top-4 flex flex-col gap-2 z-30">
          <button
            onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <ZoomIn className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 0.2, 0.6))}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <ZoomOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute left-4 bottom-4 bg-white rounded-lg shadow-md p-3 z-30">
          <div className="text-xs font-medium text-gray-500 mb-2">{t('map.legend')}</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span>{t('map.techActive')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <span>{t('map.techOnBreak')}</span>
            </div>
            {showOrders && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>{t('map.highPriority')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>{t('map.medPriority')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected Technician Info Panel */}
        {selectedTechnician && (
          <div className="absolute left-4 right-4 top-4 bg-white rounded-xl shadow-lg p-4 z-30">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedTechnician.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedTechnician.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                  <Navigation className="w-3 h-3" />
                  {selectedTechnician.location.label}
                </div>
                {selectedTechnician.currentOrder && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                    <Wrench className="w-4 h-4" />
                    {selectedTechnician.currentOrder}
                  </div>
                )}
                {!selectedTechnician.currentOrder && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                    <Clock className="w-4 h-4" />
                    {t('map.onBreak')}
                  </div>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                selectedTechnician.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {selectedTechnician.status === 'active' ? t('map.active') : t('map.break')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Technician Quick List */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {TECHNICIANS.map(tech => (
            <button
              key={tech.id}
              onClick={() => setSelectedTech(selectedTech === tech.id ? null : tech.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0 transition-colors ${
                selectedTech === tech.id
                  ? 'bg-blue-100 border-blue-300 border'
                  : 'bg-gray-100 border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                tech.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}>
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{tech.name.split(' ')[0]}</div>
                <div className="text-xs text-gray-500">{tech.location.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
