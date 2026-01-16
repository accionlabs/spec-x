import { useState } from 'react'
import {
  Users, Star, Clock, CheckCircle, TrendingUp, TrendingDown,
  ChevronRight, Award, Target
} from 'lucide-react'

// Mock team performance data
const TEAM_MEMBERS = [
  {
    id: 't1',
    name: 'John Smith',
    role: 'Senior Technician',
    avatar: 'JS',
    stats: {
      completed: 12,
      satisfaction: 4.8,
      avgTime: '2.1 hrs',
      onTime: 95,
      trend: 'up'
    }
  },
  {
    id: 't2',
    name: 'Maria Garcia',
    role: 'Technician',
    avatar: 'MG',
    stats: {
      completed: 15,
      satisfaction: 4.9,
      avgTime: '1.8 hrs',
      onTime: 98,
      trend: 'up'
    }
  },
  {
    id: 't3',
    name: 'James Wilson',
    role: 'Technician',
    avatar: 'JW',
    stats: {
      completed: 8,
      satisfaction: 4.5,
      avgTime: '2.5 hrs',
      onTime: 88,
      trend: 'down'
    }
  },
  {
    id: 't4',
    name: 'Sarah Johnson',
    role: 'Lead Technician',
    avatar: 'SJ',
    stats: {
      completed: 18,
      satisfaction: 4.7,
      avgTime: '1.9 hrs',
      onTime: 96,
      trend: 'up'
    }
  },
]

export default function TeamPerformance() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  // Calculate team averages
  const teamAvg = {
    completed: Math.round(TEAM_MEMBERS.reduce((acc, m) => acc + m.stats.completed, 0) / TEAM_MEMBERS.length),
    satisfaction: (TEAM_MEMBERS.reduce((acc, m) => acc + m.stats.satisfaction, 0) / TEAM_MEMBERS.length).toFixed(1),
    onTime: Math.round(TEAM_MEMBERS.reduce((acc, m) => acc + m.stats.onTime, 0) / TEAM_MEMBERS.length)
  }

  // Sort by completed (best performers first)
  const sortedMembers = [...TEAM_MEMBERS].sort((a, b) => b.stats.completed - a.stats.completed)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Team Performance</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">This week's metrics</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Team Summary */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5" />
            <span className="font-semibold">Team Averages</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{teamAvg.completed}</div>
              <div className="text-xs opacity-80">Completed/Tech</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{teamAvg.satisfaction}</div>
              <div className="text-xs opacity-80">Satisfaction</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{teamAvg.onTime}%</div>
              <div className="text-xs opacity-80">On-Time</div>
            </div>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <Award className="w-6 h-6 text-yellow-900" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-yellow-600 font-medium uppercase">Top Performer</div>
            <div className="font-semibold text-yellow-900">{sortedMembers[0].name}</div>
            <div className="text-sm text-yellow-700">{sortedMembers[0].stats.completed} completed this week</div>
          </div>
        </div>

        {/* Team Members */}
        <div className="space-y-3">
          {sortedMembers.map((member, index) => (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    {member.avatar}
                  </div>
                  {index < 3 && (
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      'bg-orange-400 text-orange-900'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.role}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium">{member.stats.satisfaction}</span>
                    </div>
                    <div className="text-xs text-gray-500">{member.stats.completed} done</div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedMember === member.id ? 'rotate-90' : ''
                  }`} />
                </div>
              </button>

              {selectedMember === member.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {member.stats.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      <div className="text-xl font-bold text-gray-900">{member.stats.completed}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-xl font-bold text-gray-900">{member.stats.avgTime}</div>
                      <div className="text-xs text-gray-500">Avg Time</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <Target className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="text-xl font-bold text-gray-900">{member.stats.onTime}%</div>
                      <div className="text-xs text-gray-500">On-Time</div>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-xl font-bold text-gray-900">{member.stats.satisfaction}</div>
                      <div className="text-xs text-gray-500">Satisfaction</div>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Performance vs Team Average</div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          member.stats.completed >= parseInt(teamAvg.completed.toString()) ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min((member.stats.completed / 20) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>0</span>
                      <span>Team Avg: {teamAvg.completed}</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Improvement Note */}
        {TEAM_MEMBERS.some(m => m.stats.trend === 'down') && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-800">Needs Attention</span>
            </div>
            <div className="text-sm text-orange-700">
              {TEAM_MEMBERS.filter(m => m.stats.trend === 'down').map(m => m.name).join(', ')} showing declining metrics.
              Consider scheduling a 1:1 review.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
