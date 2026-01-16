import type { LucideIcon } from 'lucide-react'

export interface StatCardProps {
  icon: LucideIcon
  iconColor: string
  value: string | number
  label: string
  trend?: {
    icon?: LucideIcon
    value: string
    color: string
  }
  onClick?: () => void
  className?: string
}

export function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
  trend,
  onClick,
  className = '',
}: StatCardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200 ${
        onClick ? 'text-left cursor-pointer hover:shadow-md transition-shadow' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <div className="text-sm text-gray-600">{label}</div>
      {trend && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${trend.color}`}>
          {trend.icon && <trend.icon className="w-3 h-3" />}
          {trend.value}
        </div>
      )}
    </Component>
  )
}
