import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useResetStoreOnLocationChange } from '@/hooks/use-reset-store'
import { useHomeStore } from '@/context/home-store'
import { Loading } from '@/components/ui'
import { ToastContainer } from 'react-toastify'
import { useRefreshToken } from './hooks'
import { useBoundStore } from '@/hooks/use-bound-store'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { fiscalYearsService } from '@/services/fiscalYears'
import { categoriesService } from '@/services/categories'
import { creditCardsService } from '@/services/creditCards'

export function Providers() {
  const { setIsLoginLoading, isLoginLoading, resetStore: resetHomeStore, showOnboarding, setShowOnboarding } = useHomeStore()
  const user = useBoundStore((s) => s.user)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<'year' | 'category' | 'card'>('year')

  useResetStoreOnLocationChange(resetHomeStore)
  useRefreshToken()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoginLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [isLoginLoading])

  // Al terminar el loading inicial, verificar onboarding antes de mostrar la app
  useEffect(() => {
    if (isLoginLoading || !user) return

    setIsCheckingOnboarding(true)
    const checkOnboarding = async () => {
      try {
        const [years, categories, cards] = await Promise.all([
          fiscalYearsService.getAll(),
          categoriesService.getAll(),
          creditCardsService.getAll(),
        ])
        const needsOnboarding =
          years.length === 0 || categories.length === 0 || cards.length === 0
        if (needsOnboarding) {
          if (years.length === 0) setOnboardingStep('year')
          else if (categories.length === 0) setOnboardingStep('category')
          else setOnboardingStep('card')
          setShowOnboarding(true)
        }
      } catch {
        // Si falla la verificación, no bloquear al usuario
      } finally {
        setIsCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [isLoginLoading, user])

  if (isLoginLoading || isCheckingOnboarding) {
    return <Loading />
  }

  return (
    <>
      <Outlet />
      <ToastContainer />
      {showOnboarding && (
        <OnboardingModal initialStep={onboardingStep} onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  )
}
