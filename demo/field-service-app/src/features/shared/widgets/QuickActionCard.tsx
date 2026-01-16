import type { LucideIcon } from 'lucide-react'

export interface QuickActionCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  variant: 'blue' | 'orange' | 'green' | 'purple' | 'indigo' | 'amber'
  onClick: () => void
  className?: string
}

const VARIANT_STYLES = {
  blue: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    subtitle: 'text-blue-600',
  },
  orange: {
    bg: 'bg-orange-50 border-orange-200',
    icon: 'text-orange-600',
    title: 'text-orange-900',
    subtitle: 'text-orange-600',
  },
  green: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-900',
    subtitle: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50 border-purple-200',
    icon: 'text-purple-600',
    title: 'text-purple-900',
    subtitle: 'text-purple-600',
  },
  indigo: {
    bg: 'bg-indigo-50 border-indigo-200',
    icon: 'text-indigo-600',
    title: 'text-indigo-900',
    subtitle: 'text-indigo-600',
  },
  amber: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    subtitle: 'text-amber-600',
  },
}

export function QuickActionCard({
  icon: Icon,
  title,
  subtitle,
  variant,
  onClick,
  className = '',
}: QuickActionCardProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <button
      onClick={onClick}
      className={`${styles.bg} border rounded-xl p-4 text-left hover:shadow-md transition-shadow ${className}`}
    >
      <Icon className={`w-6 h-6 ${styles.icon} mb-2`} />
      <div className={`font-medium ${styles.title}`}>{title}</div>
      <div className={`text-xs ${styles.subtitle}`}>{subtitle}</div>
    </button>
  )
}
