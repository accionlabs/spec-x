import { WifiOff, Server, Cloud, Building2, Check } from 'lucide-react'

interface TeamSizeOption {
  id: string
  name: string
  cost: string
  description: string
  personas: string[]
  features: string[]
}

const TEAM_SIZE_OPTIONS: TeamSizeOption[] = [
  {
    id: 'individual',
    name: 'Individual',
    cost: '$0/mo',
    description: 'Works completely offline. Data stored locally on device. Perfect for solo technicians.',
    personas: ['Technician'],
    features: ['Offline-first', 'Local storage', 'No server needed'],
  },
  {
    id: 'team',
    name: 'Small Team',
    cost: '$5-35/mo',
    description: 'Sync via Raspberry Pi or $5 VPS. Great for small teams sharing work orders.',
    personas: ['Technician', 'Dispatcher'],
    features: ['Real-time sync', 'Work assignment', 'Team coordination'],
  },
  {
    id: 'department',
    name: 'Department',
    cost: '$50-200/mo',
    description: 'CouchDB server with backups. Suitable for departmental operations with management oversight.',
    personas: ['Technician', 'Dispatcher', 'Manager'],
    features: ['Reports & analytics', 'Manager dashboard', 'Automated backups'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    cost: 'Custom',
    description: 'Clustered CouchDB with high availability. Full enterprise deployment with SLA.',
    personas: ['Technician', 'Dispatcher', 'Manager'],
    features: ['High availability', 'Custom SLA', 'Dedicated support'],
  },
]

const TEAM_SIZE_ICONS: Record<string, React.ReactNode> = {
  individual: <WifiOff className="w-6 h-6" />,
  team: <Server className="w-6 h-6" />,
  department: <Cloud className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
}

interface TeamSizeStepProps {
  selectedSize: string
  onSizeChange: (size: string) => void
}

export default function TeamSizeStep({ selectedSize, onSizeChange }: TeamSizeStepProps) {
  return (
    <div className="space-y-6">
      {/* Team size cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {TEAM_SIZE_OPTIONS.map((option) => {
          const isSelected = selectedSize === option.id
          return (
            <button
              key={option.id}
              onClick={() => onSizeChange(option.id)}
              className={`
                p-6 rounded-xl border-2 text-left transition-all relative
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon and title */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center
                  ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                `}>
                  {TEAM_SIZE_ICONS[option.id]}
                </div>
                <div>
                  <div className={`font-semibold text-lg ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {option.name}
                  </div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {option.cost}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                {option.description}
              </p>

              {/* Persona badges */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Available Personas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {option.personas.map((persona) => (
                    <span
                      key={persona}
                      className={`
                        text-xs px-2.5 py-1 rounded-full font-medium
                        ${isSelected
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-purple-100 text-purple-700'
                        }
                      `}
                    >
                      {persona}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {option.features.map((feature) => (
                  <span
                    key={feature}
                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Info box */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-blue-800">You can upgrade anytime</div>
            <div className="text-sm text-blue-700">
              Start small and scale up as your team grows. The same app works at every level -
              just add a sync server when you need to share data with teammates.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
