import type { ReactNode } from 'react'
import type { WidgetConfig, FeatureContextValue } from '../features/registry/types'
import { WidgetWrapper } from './WidgetWrapper'

export interface DashboardContainerProps {
  widgets: WidgetConfig[]
  featureContext: FeatureContextValue
  header?: ReactNode
  className?: string
}

export function DashboardContainer({
  widgets,
  featureContext,
  header,
  className = '',
}: DashboardContainerProps) {
  // Filter widgets based on showWhen condition
  const visibleWidgets = widgets.filter(widget => {
    if (widget.showWhen) {
      return widget.showWhen(featureContext)
    }
    return true
  })

  // Group widgets by size for layout
  const smallWidgets = visibleWidgets.filter(w => w.size === 'small')
  const mediumWidgets = visibleWidgets.filter(w => w.size === 'medium')
  const largeWidgets = visibleWidgets.filter(w => w.size === 'large')
  const fullWidgets = visibleWidgets.filter(w => w.size === 'full')

  return (
    <div className={`p-4 space-y-6 overflow-y-auto ${className}`}>
      {/* Header (persona banner, etc.) */}
      {header}

      {/* Small widgets in 2-column grid */}
      {smallWidgets.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {smallWidgets.map(widget => (
            <WidgetWrapper key={widget.id}>
              <widget.component />
            </WidgetWrapper>
          ))}
        </div>
      )}

      {/* Medium widgets in 2-column grid */}
      {mediumWidgets.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {mediumWidgets.map(widget => (
            <WidgetWrapper key={widget.id} title={widget.titleKey}>
              <widget.component />
            </WidgetWrapper>
          ))}
        </div>
      )}

      {/* Large widgets full width */}
      {largeWidgets.map(widget => (
        <WidgetWrapper key={widget.id} title={widget.titleKey}>
          <widget.component />
        </WidgetWrapper>
      ))}

      {/* Full widgets full width */}
      {fullWidgets.map(widget => (
        <WidgetWrapper key={widget.id} title={widget.titleKey}>
          <widget.component />
        </WidgetWrapper>
      ))}
    </div>
  )
}
