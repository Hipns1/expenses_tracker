import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useResetStoreOnLocationChange } from '@/hooks/use-reset-store'
import { useHomeStore } from '@/context/home-store'
import { Loading } from '@/components/ui'
import { ToastContainer } from 'react-toastify'
import { useRefreshToken } from './hooks'

export function Providers() {
  const { setIsLoginLoading, isLoginLoading, resetStore: resetHomeStore } = useHomeStore()

  useResetStoreOnLocationChange(resetHomeStore)
  useRefreshToken()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoginLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [isLoginLoading])

  if (isLoginLoading) {
    return <Loading />
  }

  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  )
}
