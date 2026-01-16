import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Wrench, Radio, Briefcase, Check } from 'lucide-react'

export type Persona = 'technician' | 'dispatcher' | 'manager'

interface PersonaInfo {
  id: Persona
  name: string
  description: string
  icon: React.ReactNode
  outcomes: string[]
}

const PERSONAS: PersonaInfo[] = [
  {
    id: 'technician',
    name: 'Field Technician',
    description: 'On-site service work',
    icon: <Wrench className="w-5 h-5" />,
    outcomes: ['Complete Work Orders', 'Track Equipment']
  },
  {
    id: 'dispatcher',
    name: 'Dispatcher',
    description: 'Coordination & assignment',
    icon: <Radio className="w-5 h-5" />,
    outcomes: ['Assign Work Orders', 'Monitor Progress']
  },
  {
    id: 'manager',
    name: 'Service Manager',
    description: 'Operations oversight',
    icon: <Briefcase className="w-5 h-5" />,
    outcomes: ['Generate Reports', 'Track Performance']
  }
]

interface PersonaSelectorProps {
  currentPersona: Persona
  onPersonaChange: (persona: Persona) => void
  enabledPersonas?: string[]
}

export default function PersonaSelector({ currentPersona, onPersonaChange, enabledPersonas }: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter personas based on enabled list from config
  const availablePersonas = enabledPersonas && enabledPersonas.length > 0
    ? PERSONAS.filter(p => enabledPersonas.includes(p.id))
    : PERSONAS

  const current = availablePersonas.find(p => p.id === currentPersona) || availablePersonas[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg transition-colors"
      >
        <span className="text-blue-200">{current.icon}</span>
        <span className="text-sm font-medium text-white hidden sm:inline">{current.name}</span>
        <ChevronDown className={`w-4 h-4 text-blue-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Switch Persona</div>
          </div>
          <div className="p-2">
            {availablePersonas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => {
                  onPersonaChange(persona.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  persona.id === currentPersona
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  persona.id === currentPersona
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {persona.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      persona.id === currentPersona ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {persona.name}
                    </span>
                    {persona.id === currentPersona && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{persona.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {persona.outcomes.map((outcome, i) => (
                      <span
                        key={i}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          persona.id === currentPersona
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 bg-purple-50 border-t border-purple-100">
            <div className="text-xs text-purple-700 text-center">
              Generated from specification - each persona has unique outcomes
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { PERSONAS }
export type { PersonaInfo }
