import { RouteProps } from '@/types'
import { cn, useIsQueryUp } from '@/utils/utils'
import { useHomeStore } from '@/context/home-store'
import { Button, NavItem } from '@/components'
import isologo from '../../assets/isologo.png'
import isotipo from '../../assets/isotipo.png'
import { useNavigate } from 'react-router-dom'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll'
import { IoMenu } from 'react-icons/io5'
import { HiLogout } from 'react-icons/hi'
import { useAuth } from '@/hooks'

const SUPPRESS_MS = 180

export const Sidebar = () => {
  const { isCollapsed, setIsCollapsed } = useHomeStore()
  const isMdUp = useIsQueryUp('(min-width: 768px)')
  const [suppressTransition, setSuppressTransition] = useState(false)
  const timerRef = useRef<number | null>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const storedRoutes = localStorage.getItem('roleRoutes')
  const accessibleRoutes: RouteProps[] = storedRoutes ? JSON.parse(storedRoutes) : []

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

  return (
    <>
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

      {!isMdUp && (
        <>
          {!isCollapsed && (
            <div
              className={cn('fixed inset-0 z-[50] bg-black/40 md:hidden', suppressTransition && 'transition-none')}
              onClick={closeMobile}
              aria-hidden='true'
            />
          )}

          <aside
            aria-label='Barra lateral de navegación'
            role='dialog'
            aria-modal={!isCollapsed ? 'true' : undefined}
            className={cn(
              'bg-card-light dark:bg-card-dark lgmd:hidden fixed inset-y-0 left-0 z-[55] h-screen w-[280px] shadow-2xl border-r border-secondary-100 dark:border-secondary-dark',
              'transition-transform duration-300 will-change-transform',
              suppressTransition && 'transition-none',
              isCollapsed ? '-translate-x-full' : 'translate-x-0'
            )}
          >
            <header className='border-secondary-100 dark:border-secondary-dark relative flex items-center justify-center gap-4 border-b p-6'>
              <div className='absolute top-3 right-3'>
                <Button size='icon' variant='ghost' onClick={closeMobile} aria-label='Cerrar menú'>
                  ✕
                </Button>
              </div>

              <Button
                variant='ghost'
                className='gap-4 p-0 hover:bg-transparent'
                onClick={() => {
                  navigate('/')
                  closeMobile()
                }}
              >
                <img src={isologo} alt='Logo de PeritoYa' className='w-[120px]' loading='lazy' />
              </Button>
            </header>

            <nav className='h-dvh pb-28'>
              <ul className='mt-2 flex h-full flex-col justify-between'>
                <div className="px-2 space-y-1">
                  {accessibleRoutes.map((route) => (
                    <li key={route.id}>
                      <NavItem route={route} isCollapsed={false} onClick={closeMobile} />
                    </li>
                  ))}
                </div>
                <li className="px-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-danger hover:text-danger-dark hover:bg-danger/10"
                    onClick={() => logout()}
                  >
                    <HiLogout className='h-5 w-5' />
                    <span>Cerrar sesión</span>
                  </Button>
                </li>
              </ul>
            </nav>
          </aside>
        </>
      )}

      {isMdUp && (
        <aside
          aria-label='Barra lateral de navegación'
          className={cn(
            'bg-card-light dark:bg-card-dark relative hidden shadow-xl border-r border-secondary-100 dark:border-secondary-dark md:flex md:flex-col',
            'transition-[width] duration-200',
            suppressTransition && 'transition-none',
            isCollapsed ? 'w-[70px]' : 'w-[280px]'
          )}
        >
          <header
            className={cn('border-secondary-100 dark:border-secondary-dark flex items-center justify-center gap-4 border-b h-[72px]', isCollapsed ? 'p-2' : 'p-6')}
          >
            {!isCollapsed ? (
              <Button variant='ghost' className='gap-4 p-0 hover:bg-transparent' onClick={() => navigate('/')}>
                <img src={isologo} alt='Logo' className='w-[120px]' loading='lazy' />
              </Button>
            ) : (
              <Button variant='ghost' className='p-0 hover:bg-transparent' onClick={() => navigate('/')} size='icon'>
                <img src={isotipo} alt='Icono' className="w-8" loading='lazy' />
              </Button>
            )}
          </header>

          <Button
            size='icon'
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='bg-white dark:bg-card-dark text-primary border border-secondary-100 dark:border-secondary-dark absolute top-6 -right-3 z-[56] h-6 w-6 rounded-full shadow-md hover:scale-110 transition-transform'
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
          </Button>

          <nav className='h-full pb-6 pt-4'>
            <ul className='flex h-full flex-col justify-between px-3'>
              <div className="space-y-1">
                {accessibleRoutes.map((route) => (
                  <li key={route.id}>
                    <NavItem route={route} isCollapsed={isCollapsed} onClick={isMdUp ? undefined : closeMobile} />
                  </li>
                ))}
              </div>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full text-danger hover:text-danger-dark hover:bg-danger/10",
                    isCollapsed ? "justify-center px-0" : "justify-start gap-3"
                  )}
                  onClick={() => logout()}
                  title="Cerrar sesión"
                >
                  <HiLogout className='h-5 w-5' />
                  {!isCollapsed && <span>Cerrar sesión</span>}
                </Button>
              </li>
            </ul>
          </nav>
        </aside>
      )}
    </>
  )
}
