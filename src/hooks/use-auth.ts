import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import { AuthSlice } from '@/context/auth-slice-store'
import { Login } from '@/components/login/login-form-schema'
import { LoginResponse } from '@/types/login'
import { SERVICES_MSGS } from '@/utils/consts'
import { useBoundStore } from '@/hooks/use-bound-store'
import { useHomeStore } from '@/context/home-store'
import { postLogin, postRevoke } from '@/services'

type SessionData = Pick<AuthSlice, 'user'>

export function useAuth() {
  const { setIsLoginLoading } = useHomeStore()
  const navigate = useNavigate()
  const { resetAuth, setAuth, user, refreshToken } = useBoundStore((s) => ({
    resetAuth: s.resetAuth,
    setAuth: s.setAuth,
    user: s.user,
    accessToken: s.accessToken,
    refreshToken: s.refreshToken
  }))

  const login = async (data: Login): Promise<LoginResponse> => {
    try {
      const response = await postLogin(data)
      setAuth({ ...response })
      setIsLoginLoading(true)
      return response
    } catch (error) {
      const { response } = error as AxiosError<any>
      const errorMessage = response?.data?.errors
      if (errorMessage) {
        toast.warn(errorMessage)
      } else {
        console.log(error)
        toast.error(SERVICES_MSGS.ERROR)
      }
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    resetAuth()
    navigate('/')
    await postRevoke({ token: refreshToken || '' })
    localStorage.removeItem('roleRoutes')
  }

  const getSessionData = (): SessionData => {
    return { user }
  }

  return {
    getSessionData,
    login,
    logout,
    user
  }
}
