import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { RouteProps } from '@/types/routes'
import { cn } from '@/utils/utils'

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

  const hanldeClick = () => {
    navigate(route.path ?? '')
    onClick?.()
  }

  return (
    <Button
      onClick={() => hanldeClick()}
      className={cn(
        'group h-12 justify-start gap-3 truncate rounded-none border-l-2 px-4 py-6 text-sm font-semibold',
        isActive ? 'bg-primary/[0.12] text-primary border-primary' : 'bg-tertiary-50 text-dark border-transparent'
      )}
    >
      {typeof route.icon === 'string' ? (
        <img
          src={`data:image/png;base64,${route.icon}`}
          alt={route.name}
          className={cn(
            'h-5 w-5 transition',
            'group-hover:[filter:invert(67%)_sepia(39%)_saturate(4976%)_hue-rotate(327deg)_brightness(104%)_contrast(101%)]',
            isActive &&
              '[filter:invert(67%)_sepia(39%)_saturate(4976%)_hue-rotate(327deg)_brightness(104%)_contrast(101%)]'
          )}
        />
      ) : (
        route.icon
      )}
      {!isCollapsed && <span className='truncate'>{route.name}</span>}
    </Button>
  )
}
