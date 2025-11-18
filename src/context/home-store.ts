import { create } from 'zustand'

interface HomeStoreProps {
  isLoginLoading: boolean
  setIsLoginLoading: (value: boolean) => void
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
  resetStore: () => void
}

export const useHomeStore = create<HomeStoreProps>((set) => ({
  isLoginLoading: false,
  setIsLoginLoading: (value) => set({ isLoginLoading: value }),
  isCollapsed: false,
  setIsCollapsed: (value) => set({ isCollapsed: value }),
  resetStore: () =>
    set({
      isLoginLoading: false,
      isCollapsed: false
    })
}))
