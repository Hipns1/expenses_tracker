import { create } from 'zustand'

interface HomeStoreProps {
  isLoginLoading: boolean
  setIsLoginLoading: (value: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
  showOnboarding: boolean
  setShowOnboarding: (value: boolean) => void
  resetStore: () => void
}

export const useHomeStore = create<HomeStoreProps>((set) => ({
  isLoginLoading: false,
  setIsLoginLoading: (value) => set({ isLoginLoading: value }),
  isCollapsed: false,
  setIsCollapsed: (value) => set({ isCollapsed: value }),
  showOnboarding: false,
  setShowOnboarding: (value) => set({ showOnboarding: value }),
  resetStore: () =>
    set({
      isLoginLoading: false,
      isCollapsed: false,
      showOnboarding: false
    })
}))
