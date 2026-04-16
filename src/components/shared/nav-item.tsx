import { useLocation, useNavigate } from 'react-router-dom'
import { RouteProps } from '@/types/routes'
import { cn } from '@/utils/utils'
import {
  LayoutDashboard, BookOpen, BarChart2, PiggyBank, CreditCard,
  FileText, User, Settings, HandCoins, Target, Landmark, Repeat2, type LucideIcon
} from 'lucide-react'

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  PiggyBank,
  CreditCard,
  FileText,
  User,
  Settings,
  HandCoins,
  Target,
  Landmark,
  Repeat2,
}

interface NavItemProps {
  route: RouteProps
  isCollapsed: boolean
  onClick: (() => void) | undefined
}

export const NavItem = ({ route, isCollapsed, onClick }: NavItemProps) => {
  const location = useLocation()
  const navigate = useNavigate()

  const searchParams = new URLSearchParams(location.search)
  const pathValue = searchParams.get('path')
  const isPathActive = pathValue === 'home'

  const isActive =
    `${route?.path}` === '/' && !isPathActive
      ? `${route?.path}` === decodeURIComponent(location.pathname)
      : decodeURIComponent(location.pathname).startsWith(`${route?.path}`)

  const handleClick = () => {
    navigate(route.path ?? '')
    onClick?.()
  }

  return (
    <button
      onClick={handleClick}
      title={isCollapsed ? route.name : undefined}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
        isCollapsed ? 'justify-center' : 'justify-start',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 hover:text-primary'
      )}
    >
      {/* Icon */}
      <span className={cn(
        'flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors',
        isActive ? 'text-primary' : 'text-secondary-400'
      )}>
        {typeof route.icon === 'string'
          ? LUCIDE_ICONS[route.icon]
            ? (() => { const Icon = LUCIDE_ICONS[route.icon as string]; return <Icon size={18} /> })()
            : <img src={`data:image/png;base64,${route.icon}`} alt={route.name} className='h-4 w-4' />
          : route.icon
        }
      </span>

      {/* Label */}
      {!isCollapsed && (
        <span className='truncate'>{route.name}</span>
      )}

      {/* Active indicator dot */}
      {isActive && !isCollapsed && (
        <span className='ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0' />
      )}
    </button>
  )
}
