import { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Calendar,
  CheckCircle, Clock, Star, AlertTriangle, Download
} from 'lucide-react'
import { getWorkOrders } from '../../db'

type TimeRange = 'week' | 'month' | 'quarter'

export default function ReportsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [stats, setStats] = useState({
    totalOrders: 0,
    completed: 0,
    completionRate: 0,
    avgTime: '2.1 hrs',
    satisfaction: 4.6,
    overdue: 0
  })
  const [, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [timeRange])

  const loadStats = async () => {
    setLoading(true)
    const workOrders = await getWorkOrders()

    const completed = workOrders.filter(wo => wo.status === 'complete').length
    const total = workOrders.length
    const overdue = workOrders.filter(wo =>
      wo.status !== 'complete' && new Date(wo.dueDate) < new Date()
    ).length

    // Simulate time-range scaling
    const multiplier = timeRange === 'week' ? 1 : timeRange === 'month' ? 4 : 12

    setStats({
      totalOrders: total * multiplier,
      completed: completed * multiplier,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgTime: '2.1 hrs',
      satisfaction: 4.6,
      overdue: overdue
    })

    setLoading(false)
  }

  const weeklyData = [
    { day: 'Mon', completed: 8, target: 10 },
    { day: 'Tue', completed: 12, target: 10 },
    { day: 'Wed', completed: 9, target: 10 },
    { day: 'Thu', completed: 11, target: 10 },
    { day: 'Fri', completed: 14, target: 10 },
    { day: 'Sat', completed: 6, target: 5 },
    { day: 'Sun', completed: 3, target: 5 },
  ]

  const maxValue = Math.max(...weeklyData.map(d => Math.max(d.completed, d.target)))

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Reports</h2>
          </div>
          <button className="flex items-center gap-1 text-sm text-purple-600 font-medium">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mt-3">
          {(['week', 'month', 'quarter'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Quarter'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                +12%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                +5%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
            <div className="text-sm text-gray-500">Completion Rate</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingDown className="w-3 h-3" />
                -8%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgTime}</div>
            <div className="text-sm text-gray-500">Avg Completion</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                +0.2
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.satisfaction}</div>
            <div className="text-sm text-gray-500">Satisfaction</div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Weekly Performance</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span className="text-gray-500">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 rounded" />
                <span className="text-gray-500">Target</span>
              </div>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyData.map(day => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 justify-center" style={{ height: '100px' }}>
                  <div
                    className="w-3 bg-purple-500 rounded-t transition-all"
                    style={{ height: `${(day.completed / maxValue) * 100}%` }}
                  />
                  <div
                    className="w-3 bg-gray-300 rounded-t transition-all"
                    style={{ height: `${(day.target / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {stats.overdue > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div className="flex-1">
              <div className="font-semibold text-red-800">{stats.overdue} Overdue Orders</div>
              <div className="text-sm text-red-600">Requires attention</div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Work Orders</span>
              <span className="font-medium text-gray-900">{stats.totalOrders}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">On-Time Completion</span>
              <span className="font-medium text-green-600">94%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">First-Time Fix Rate</span>
              <span className="font-medium text-gray-900">87%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Customer Callbacks</span>
              <span className="font-medium text-gray-900">3</span>
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div className="bg-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Available Reports</span>
          </div>
          <div className="space-y-2">
            {['Completion Summary', 'Technician Performance', 'Customer Satisfaction', 'Equipment Service History'].map(report => (
              <button
                key={report}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
              >
                <span className="text-sm text-gray-700">{report}</span>
                <Download className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
