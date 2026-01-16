import { useState, useEffect } from 'react'
import {
  Briefcase, BarChart3, Users, TrendingUp, TrendingDown,
  Star, Clock, CheckCircle, Target
} from 'lucide-react'
import { getWorkOrders } from '../../db'

// Mock team performance data
const TEAM_PERFORMANCE = [
  { id: 't1', name: 'John Smith', completed: 12, satisfaction: 4.8, avgTime: '2.1 hrs' },
  { id: 't2', name: 'Maria Garcia', completed: 15, satisfaction: 4.9, avgTime: '1.8 hrs' },
  { id: 't3', name: 'James Wilson', completed: 8, satisfaction: 4.5, avgTime: '2.5 hrs' },
  { id: 't4', name: 'Sarah Johnson', completed: 18, satisfaction: 4.7, avgTime: '1.9 hrs' },
]

interface ManagerDashboardProps {
  onNavigate: (view: string) => void
}

export default function ManagerDashboard({ onNavigate }: ManagerDashboardProps) {
  const [stats, setStats] = useState({
    completionRate: 0,
    avgSatisfaction: 0,
    avgCompletionTime: '2.1 hrs',
    totalCompleted: 0,
    weeklyTrend: 12 // percentage
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    const workOrders = await getWorkOrders()

    const completed = workOrders.filter(wo => wo.status === 'complete').length
    const total = workOrders.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Calculate average satisfaction from work orders that have it
    const withSatisfaction = workOrders.filter(wo => wo.customerSatisfaction !== undefined)
    const avgSatisfaction = withSatisfaction.length > 0
      ? withSatisfaction.reduce((acc, wo) => acc + (wo.customerSatisfaction || 0), 0) / withSatisfaction.length
      : 4.6 // Default for demo

    setStats({
      completionRate,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      avgCompletionTime: '2.1 hrs',
      totalCompleted: completed,
      weeklyTrend: 12
    })

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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-5 h-5" />
          <span className="text-xs font-medium opacity-80 uppercase tracking-wide">Service Manager</span>
        </div>
        <div className="font-semibold">Your Outcomes</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors cursor-pointer"
          >
            Generate Reports →
          </button>
          <button
            onClick={() => onNavigate('team')}
            className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors cursor-pointer"
          >
            Team Performance →
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900">{stats.completionRate}%</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">Completion Rate</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            +{stats.weeklyTrend}% this week
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.avgSatisfaction}</span>
          </div>
          <div className="text-sm text-gray-600">Avg Satisfaction</div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`w-3 h-3 ${i <= Math.round(stats.avgSatisfaction) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.avgCompletionTime}</span>
          </div>
          <div className="text-sm text-gray-600">Avg Completion</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
            <TrendingDown className="w-3 h-3" />
            -15 min from last week
          </div>
        </div>

        <button
          onClick={() => onNavigate('team')}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{TEAM_PERFORMANCE.length}</span>
          </div>
          <div className="text-sm text-gray-600">Team Members</div>
          <div className="text-xs text-purple-600 mt-1">View performance</div>
        </button>
      </div>

      {/* Weekly Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-800">Weekly Summary</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-700">{stats.totalCompleted}</div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700">53</div>
            <div className="text-xs text-green-600">Total Orders</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700">98%</div>
            <div className="text-xs text-green-600">On-Time</div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Top Performers</h2>
          <button
            onClick={() => onNavigate('team')}
            className="text-sm text-purple-600 font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-2">
          {TEAM_PERFORMANCE
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 3)
            .map((tech, index) => (
            <div
              key={tech.id}
              className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-600' :
                'bg-orange-100 text-orange-700'
              }`}>
                #{index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{tech.name}</div>
                <div className="text-xs text-gray-500">{tech.completed} completed this week</div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{tech.satisfaction}</span>
                </div>
                <div className="text-xs text-gray-500">{tech.avgTime} avg</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('reports')}
            className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-left"
          >
            <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
            <div className="font-medium text-purple-900">View Reports</div>
            <div className="text-xs text-purple-600">Analytics & metrics</div>
          </button>
          <button
            onClick={() => onNavigate('team')}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-left"
          >
            <Users className="w-6 h-6 text-indigo-600 mb-2" />
            <div className="font-medium text-indigo-900">Team Performance</div>
            <div className="text-xs text-indigo-600">Individual metrics</div>
          </button>
        </div>
      </div>

      {/* Spec Features Note */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Manager-Specific Features (From Spec)
        </div>
        <div className="space-y-1 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Completion Reports
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Technician Performance
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Customer Satisfaction Tracking
          </div>
        </div>
      </div>
    </div>
  )
}
