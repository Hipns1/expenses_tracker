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
              'bg-tertiary-50 lgmd:hidden fixed inset-y-0 left-0 z-[55] h-screen w-[280px] shadow-sm',
              'transition-transform duration-300 will-change-transform',
              suppressTransition && 'transition-none',
              isCollapsed ? '-translate-x-full' : 'translate-x-0'
            )}
          >
            <header className='border-border relative flex items-center justify-center gap-4 border-b p-6'>
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
                <span className='bg-primary text-tertiary-50 rounded-full px-2 py-1 text-center text-xs font-semibold'>
                  Premium
                </span>
              </Button>
            </header>

            <nav className='h-dvh pb-28'>
              <ul className='mt-2 flex h-full flex-col justify-between'>
                <div>
                  {accessibleRoutes.map((route) => (
                    <li key={route.id}>
                      <NavItem route={route} isCollapsed={false} onClick={closeMobile} />
                    </li>
                  ))}
                </div>
                <li>
                  <NavItem
                    route={{
                      name: 'Cerrar sesion',
                      icon: <HiLogout className='text-primary h-8 w-auto' />
                    }}
                    onClick={() => logout()}
                    isCollapsed={isCollapsed}
                  />
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
            'bg-tertiary-50 relative hidden shadow-sm md:flex md:flex-col',
            'transition-[width] duration-200',
            suppressTransition && 'transition-none',
            isCollapsed ? 'w-[54px]' : 'w-[280px]'
          )}
        >
          <header
            className={cn('border-border flex items-center justify-center gap-4 border-b', isCollapsed ? 'p-3' : 'p-6')}
          >
            {!isCollapsed ? (
              <Button variant='ghost' className='gap-4 p-0 hover:bg-transparent' onClick={() => navigate('/')}>
                <img src={isologo} alt='Logo de PeritoYa' className='w-[120px]' loading='lazy' />
                <span className='bg-primary text-tertiary-50 rounded-full px-2 py-1 text-center text-xs font-semibold'>
                  Premium
                </span>
              </Button>
            ) : (
              <Button variant='ghost' className='p-0 hover:bg-transparent' onClick={() => navigate('/')} size='icon'>
                <img src={isotipo} alt='Icono de carro' loading='lazy' />
              </Button>
            )}
          </header>

          <Button
            size='icon'
            onClick={() => setIsCollapsed(!isCollapsed)}
            className='bg-tertiary-50 text-secondary absolute top-4 -right-4 z-[56] h-7 w-7 rounded-full shadow-md'
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
          </Button>

          <nav className='h-full pb-2'>
            <ul className='mt-2 flex h-full flex-col justify-between'>
              <div>
                {accessibleRoutes.map((route) => (
                  <li key={route.id}>
                    <NavItem route={route} isCollapsed={isCollapsed} onClick={isMdUp ? undefined : closeMobile} />
                  </li>
                ))}
              </div>
              <li>
                <NavItem
                  route={{
                    name: 'Cerrar sesion',
                    icon: <HiLogout className='text-primary h-8 w-auto' />
                  }}
                  onClick={() => logout()}
                  isCollapsed={isCollapsed}
                />
              </li>
            </ul>
          </nav>
        </aside>
      )}
    </>
  )
}
