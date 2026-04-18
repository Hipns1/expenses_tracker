import { RouteProps } from '@/types'
import { cn, useIsQueryUp } from '@/utils/utils'
import { useHomeStore } from '@/context/home-store'
import { NavItem } from '@/components'
import isologo from '../../assets/isologo.png'
import isotipo from '../../assets/isotipo.png'
import { useNavigate } from 'react-router-dom'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'
import { IoMenu } from 'react-icons/io5'
import { HiLogout } from 'react-icons/hi'
import { useAuth } from '@/hooks'
import { Button } from '@/components/ui'
import { X } from 'lucide-react'

const SUPPRESS_MS = 180

export const Sidebar = () => {
  const { isCollapsed, setIsCollapsed } = useHomeStore()
  const isMdUp = useIsQueryUp('(min-width: 768px)')
  const [suppressTransition, setSuppressTransition] = useState(false)
  const timerRef = useRef<number | null>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const storedRoutes = localStorage.getItem('roleRoutes')
  const accessibleRoutes: RouteProps[] = storedRoutes
    ? (JSON.parse(storedRoutes) as Array<RouteProps & { route?: string }>).map((r) => ({
        ...r,
        path: r.path ?? r.route ?? '',
        icon: r.icon ?? (r as unknown as { urlImg?: string }).urlImg ?? '',
      }))
    : []

  // Ordenar rutas dinámicamente por el campo 'level' del Backend
  const sortedRoutes = [...accessibleRoutes].sort((a, b) => {
    const levelA = a.level ?? 999
    const levelB = b.level ?? 999
    return levelA - levelB
  })

  const prevIsLgUp = useRef<boolean>(isMdUp)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (!isFirstRun.current) return
    isFirstRun.current = false
    setSuppressTransition(true)
    setIsCollapsed(!isMdUp)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setSuppressTransition(false), SUPPRESS_MS)
  }, [])

  useEffect(() => {
    if (prevIsLgUp.current !== isMdUp) {
      setSuppressTransition(true)
      setIsCollapsed(!isMdUp)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setSuppressTransition(false), SUPPRESS_MS)
      prevIsLgUp.current = isMdUp
    }
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [isMdUp, setIsCollapsed])

  useLockBodyScroll(!isCollapsed && !isMdUp)

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMdUp) setIsCollapsed(true)
    },
    [isMdUp, setIsCollapsed]
  )

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const openMobile = () => setIsCollapsed(false)
  const closeMobile = () => setIsCollapsed(true)

  /* ── Shared nav content ── */
  const NavContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className='flex h-full flex-col'>
      {/* Menu items */}
      <nav className='flex-1 overflow-y-auto px-3 py-4'>
        {!collapsed && (
          <p className='px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-secondary-400 select-none'>
            Menú
          </p>
        )}
        <ul className='space-y-0.5'>
          {sortedRoutes.filter(r => !r.isExcludeNav).map((route) => (
            <li key={route.id}>
              <NavItem route={route} isCollapsed={collapsed} onClick={isMdUp ? undefined : closeMobile} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className='px-3 pb-4 border-t border-secondary-100 dark:border-secondary-dark pt-3'>
        <button
          onClick={() => logout()}
          title='Cerrar sesión'
          className={cn(
            'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
            'text-danger hover:bg-danger/10',
            collapsed ? 'justify-center' : 'justify-start'
          )}
        >
          <HiLogout className='h-5 w-5 flex-shrink-0' />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      {!isMdUp && isCollapsed && (
        <Button
          aria-label='Abrir menú'
          className='fixed top-2 left-4 z-[60] md:hidden'
          size='icon'
          variant='ghost'
          onClick={openMobile}
        >
          <span className='sr-only'>Abrir navegación</span>
          <IoMenu className='text-primary h-8 w-auto' />
        </Button>
      )}

      {/* Mobile sidebar */}
      {!isMdUp && (
        <>
          {!isCollapsed && (
            <div
              className={cn('fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm md:hidden', suppressTransition && 'transition-none')}
              onClick={closeMobile}
              aria-hidden='true'
            />
          )}

          <aside
            aria-label='Barra lateral de navegación'
            role='dialog'
            aria-modal={!isCollapsed ? 'true' : undefined}
            className={cn(
              'bg-card-light dark:bg-card-dark fixed inset-y-0 left-0 z-[55] h-screen w-[280px] shadow-2xl border-r border-secondary-100 dark:border-secondary-dark flex flex-col',
              'transition-transform duration-300 will-change-transform',
              suppressTransition && 'transition-none',
              isCollapsed ? '-translate-x-full' : 'translate-x-0'
            )}
          >
            {/* Header */}
            <div className='flex items-center justify-between px-5 py-4 border-b border-secondary-100 dark:border-secondary-dark'>
              <button
                onClick={() => { navigate('/'); closeMobile() }}
                className='flex items-center gap-2.5 hover:opacity-80 transition-opacity'
              >
                <img src={isologo} alt='Mis Finanzas' className='w-[110px]' loading='lazy' />
              </button>
              <button
                onClick={closeMobile}
                className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors text-secondary-500'
                aria-label='Cerrar menú'
              >
                <X size={16} />
              </button>
            </div>

            <div className='flex-1 overflow-hidden'>
              <NavContent collapsed={false} />
            </div>
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      {isMdUp && (
        <aside
          aria-label='Barra lateral de navegación'
          className={cn(
            'bg-card-light dark:bg-card-dark relative hidden shadow-sm border-r border-secondary-100 dark:border-secondary-dark md:flex md:flex-col',
            'transition-[width] duration-200',
            suppressTransition && 'transition-none',
            isCollapsed ? 'w-[68px]' : 'w-[260px]'
          )}
        >
          {/* Header */}
          <div className={cn(
            'flex items-center border-b border-secondary-100 dark:border-secondary-dark h-[64px]',
            isCollapsed ? 'justify-center px-2' : 'px-5'
          )}>
            {!isCollapsed ? (
              <button
                onClick={() => navigate('/')}
                className='flex items-center gap-2.5 hover:opacity-80 transition-opacity'
              >
                <img src={isologo} alt='Mis Finanzas' className='w-[110px]' loading='lazy' />
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className='hover:opacity-80 transition-opacity'
              >
                <img src={isotipo} alt='Mis Finanzas' className='w-8' loading='lazy' />
              </button>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='absolute top-5 -right-3 z-[56] h-6 w-6 rounded-full bg-white dark:bg-card-dark border border-secondary-200 dark:border-secondary-dark shadow-md flex items-center justify-center hover:scale-110 transition-transform text-secondary-400 hover:text-primary'
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
          </button>

          {/* Nav content */}
          <div className='flex-1 overflow-hidden'>
            <NavContent collapsed={isCollapsed} />
          </div>
        </aside>
      )}
    </>
  )
}
