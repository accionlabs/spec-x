import type { LucideIcon } from 'lucide-react'

export interface OutcomeLink {
  label: string
  onClick: () => void
}

export interface PersonaBannerProps {
  icon: LucideIcon
  personaLabel: string
  title: string
  gradient: string
  outcomes: OutcomeLink[]
  className?: string
}

export function PersonaBanner({
  icon: Icon,
  personaLabel,
  title,
  gradient,
  outcomes,
  className = '',
}: PersonaBannerProps) {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-xl p-4 text-white ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium opacity-80 uppercase tracking-wide">{personaLabel}</span>
      </div>
      <div className="font-semibold">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {outcomes.map((outcome, index) => (
          <button
            key={index}
            onClick={outcome.onClick}
            className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors cursor-pointer"
          >
            {outcome.label} →
          </button>
        ))}
      </div>
    </div>
  )
}
