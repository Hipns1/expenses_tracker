import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Nulleable } from '@/utils/utils'
import { LoginResponse } from '@/types/login'
import { AuthSlice, createAuthSlice } from '@/context'

type Store = AuthSlice

export const useBoundStore = create(
  persist<Store, [], [], Nulleable<LoginResponse>>(
    (...a) => ({
      ...createAuthSlice(...a)
    }),
    {
      name: 'auth',
      partialize: (state) => {
        const { accessToken, user, refreshToken } = state

        return {
          accessToken,
          user,
          refreshToken
        }
      },
      storage: createJSONStorage(() => localStorage, {
        reviver: (_key, value) => {
          const isoDateRegex = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d+)?([+-][0-2]\d:[0-5]\d|Z)/

          if (typeof value === 'string' && RegExp(isoDateRegex).exec(value) != null) return new Date(value)

          return value
        }
      })
    }
  )
)
