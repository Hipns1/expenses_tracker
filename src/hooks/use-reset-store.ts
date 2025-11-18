import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useResetStoreOnLocationChange(resetStore: () => void) {
  const location = useLocation()

  useEffect(() => {
    return () => resetStore()
  }, [location, resetStore])
}
