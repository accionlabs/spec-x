import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

export interface WidgetWrapperProps {
  title?: string
  children: ReactNode
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

export function WidgetWrapper({
  title,
  children,
  onRefresh,
  isRefreshing,
  className = '',
}: WidgetWrapperProps) {
  return (
    <div className={className}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
