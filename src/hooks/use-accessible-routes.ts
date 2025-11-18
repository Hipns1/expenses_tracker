import { filterAccessibleRoutes, routes } from '@/routes'
import { useEffect, useState } from 'react'
import { LoginUserProps } from '@/types/login'
import { getRoleRoutes } from '@/services/routes'
import { useBoundStore } from '@/hooks/use-bound-store'
import { RouteProps } from '@/types/routes'

export const useAccessibleRoutes = (user: LoginUserProps | null) => {
  const [roleRoutes, setRoleRoutes] = useState<RouteProps[]>([])
  const { resetAuth } = useBoundStore()

  const fnGetRoleRoutes = async () => {
    const storedRoutes = localStorage.getItem('roleRoutes')
    if (storedRoutes) {
      const parsedStoredRoutes = JSON.parse(storedRoutes)
      setRoleRoutes(parsedStoredRoutes)
    }

    if (user) {
      try {
        const newRoutes = await getRoleRoutes()
        if (!storedRoutes || JSON.stringify(newRoutes) !== storedRoutes) {
          setRoleRoutes(newRoutes)
          localStorage.setItem('roleRoutes', JSON.stringify(newRoutes))
        }
      } catch (error) {
        resetAuth()
      }
    }
  }

  useEffect(() => {
    fnGetRoleRoutes()
  }, [user])

  const accessibleRoutes = [...filterAccessibleRoutes(routes, user !== null, roleRoutes)]

  return { accessibleRoutes }
}
