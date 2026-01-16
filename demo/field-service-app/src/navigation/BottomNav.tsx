import { Home, Settings } from 'lucide-react'
import { usePersonaTheme } from '../features/theme'
import type { NavItemConfig } from '../features/registry/types'

interface BottomNavProps {
  navItems: NavItemConfig[]
  currentView: string
  onNavigate: (viewId: string) => void
}

export function BottomNav({ navItems, currentView, onNavigate }: BottomNavProps) {
  const theme = usePersonaTheme()

  // Always include dashboard and settings
  const allItems: NavItemConfig[] = [
    { id: 'dashboard', icon: Home, labelKey: 'Dashboard', order: 0 },
    ...navItems,
    { id: 'settings', icon: Settings, labelKey: 'Settings', order: 99 },
  ]

  // Sort by order and dedupe
  const sortedItems = allItems
    .sort((a, b) => a.order - b.order)
    .filter((item, index, arr) => arr.findIndex(i => i.id === item.id) === index)

  return (
    <nav className="bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around">
        {sortedItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center py-2 px-3 touch-target ${
              currentView === item.id ? theme.navActive : 'text-gray-500'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.labelKey}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
