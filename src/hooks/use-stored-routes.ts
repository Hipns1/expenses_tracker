import { useEffect, useState } from 'react'
import { RouteProps } from 'react-router-dom'

export const useStoredRoleRoutes = () => {
  const [roleRoutes, setRoleRoutes] = useState<RouteProps[]>([])
  const storedRoutes = localStorage.getItem('roleRoutes')
  useEffect(() => {
    if (storedRoutes) {
      try {
        const parsed = JSON.parse(storedRoutes)
        if (Array.isArray(parsed)) {
          setRoleRoutes(parsed)
        } else {
          console.warn('Los datos de roleRoutes no son un array:', parsed)
        }
      } catch (error) {
        console.error('Error al parsear roleRoutes:', error)
      }
    }
  }, [storedRoutes])

  return { roleRoutes }
}
