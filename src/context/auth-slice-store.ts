import { LoginResponse } from '@/types/login'
import { Nulleable } from '@/utils/utils'
import { type StateCreator } from 'zustand'

export interface AuthActions {
  resetAuth: () => void
  setAuth: (auth: LoginResponse) => void
}

export type AuthSlice = Nulleable<LoginResponse> & AuthActions

const initialState: Nulleable<LoginResponse> = {
  accessToken: null,
  refreshToken: null,
  user: null
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  ...initialState,
  resetAuth() {
    set(initialState)
  },
  setAuth(newState) {
    set(newState)
  }
})
