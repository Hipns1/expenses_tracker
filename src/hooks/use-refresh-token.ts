import { apiConfig, postLogout } from '@/services'
import { useBoundStore } from '@/hooks/use-bound-store'
import type { LoginResponse } from '@/types/login'
import { type Nulleable, SESSION_MINUTES } from '@/utils'
import { useCallback, useEffect, useRef } from 'react'
import { useIdleTimer } from 'react-idle-timer'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

export function useRefreshToken() {
  const navigate = useNavigate()

  const { accessToken, refreshToken, resetAuth, setAuth } = useBoundStore((s) => ({
    accessToken: s.accessToken,
    resetAuth: s.resetAuth,
    setAuth: s.setAuth,
    refreshToken: s.refreshToken
  }))
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mounted = useRef(false)

  const authRef = useRef<Nulleable<Pick<LoginResponse, 'accessToken' | 'refreshToken'>>>({ accessToken, refreshToken })
  useEffect(() => {
    authRef.current = { accessToken, refreshToken }
  }, [accessToken, refreshToken])

  const hasSession = accessToken != null && refreshToken != null

  const fetchSession = useCallback(async () => {
    const { refreshToken } = authRef.current
    return await apiConfig.post<never, LoginResponse>('auth/refresh', { token: refreshToken })
  }, [])

  const stopSessionRefreshInterval = useCallback(() => {
    if (intervalIdRef.current != null) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }
  }, [])

  const logout = useCallback(async () => {
    resetAuth()
    await postLogout(refreshToken || '')
    setTimeout(() => {
      navigate('/')
      stopSessionRefreshInterval()
      toast.info('Se ha vencido la sesión, debe ingresar nuevamente')
      localStorage.removeItem('roleRoutes')
    }, 100)
  }, [navigate, resetAuth, stopSessionRefreshInterval])

  const startSessionRefreshInterval = useCallback(() => {
    if (intervalIdRef.current != null) {
      stopSessionRefreshInterval()
    }
    const sessionRefreshMilliseconds = SESSION_MINUTES.SESSION_REFRESH_MINUTES
    const safeInterval = Math.min(sessionRefreshMilliseconds, 2147483647)
    intervalIdRef.current = setInterval(() => {
      const { accessToken, refreshToken } = authRef.current
      if (accessToken == null || refreshToken == null) return
      fetchSession().then(setAuth).catch(logout)
    }, safeInterval)
  }, [stopSessionRefreshInterval, fetchSession, setAuth, logout])

  const checkIfSessionIsAlive = useCallback(() => {
    const { accessToken, refreshToken } = authRef.current
    if (accessToken == null || refreshToken == null) return
    fetchSession()
      .then((auth) => {
        setAuth({ ...auth })
        startSessionRefreshInterval()
      })
      .catch(logout)
  }, [fetchSession, logout, setAuth, startSessionRefreshInterval])

  const handleActive = useCallback(() => {
    checkIfSessionIsAlive()
  }, [checkIfSessionIsAlive])

  const handleIdle = useCallback(() => {
    stopSessionRefreshInterval()
  }, [stopSessionRefreshInterval])

  const safeTimeout = Math.min(SESSION_MINUTES.SESSION_ACTIVE_MINUTES, 2147483647)

  useIdleTimer({
    disabled: !hasSession,
    onActive: handleActive,
    onIdle: handleIdle,
    timeout: safeTimeout
  })

  useEffect(() => {
    if (hasSession && intervalIdRef.current == null) {
      startSessionRefreshInterval()
    }
    if (!hasSession && intervalIdRef.current != null) {
      stopSessionRefreshInterval()
    }
  }, [hasSession, startSessionRefreshInterval, stopSessionRefreshInterval])

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    if (hasSession) {
      checkIfSessionIsAlive()
    }
  }, [hasSession, checkIfSessionIsAlive])

  useEffect(() => {
    return () => {
      stopSessionRefreshInterval()
    }
  }, [stopSessionRefreshInterval])
}
