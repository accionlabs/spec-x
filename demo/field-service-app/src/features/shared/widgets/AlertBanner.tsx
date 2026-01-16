import type { LucideIcon } from 'lucide-react'

export interface AlertBannerProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  variant: 'warning' | 'error' | 'success' | 'info'
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const VARIANT_STYLES = {
  warning: {
    bg: 'bg-orange-50 border-orange-200',
    icon: 'text-orange-600',
    title: 'text-orange-800',
    subtitle: 'text-orange-600',
    button: 'bg-orange-600 text-white',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    subtitle: 'text-red-600',
    button: 'bg-red-600 text-white',
  },
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    subtitle: 'text-green-600',
    button: 'bg-green-600 text-white',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    subtitle: 'text-blue-600',
    button: 'bg-blue-600 text-white',
  },
}

export function AlertBanner({
  icon: Icon,
  title,
  subtitle,
  variant,
  action,
  className = '',
}: AlertBannerProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <div className={`${styles.bg} border rounded-xl p-4 flex items-center gap-3 ${className}`}>
      <Icon className={`w-6 h-6 ${styles.icon}`} />
      <div className="flex-1">
        <div className={`font-semibold ${styles.title}`}>{title}</div>
        {subtitle && <div className={`text-sm ${styles.subtitle}`}>{subtitle}</div>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className={`${styles.button} px-3 py-1.5 rounded-lg text-sm font-medium`}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
