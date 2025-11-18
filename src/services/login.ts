import { apiConfig } from '@/services/api-config'
import { LoginProps, LoginResponse, RefreshProps } from '@/types/login'

export async function postLogin(data: LoginProps): Promise<LoginResponse> {
  return await apiConfig.post<never, LoginResponse>('/auth/login', data, { headers: { 'Skip-Auth': true } })
}

export async function postRefresh(data: RefreshProps): Promise<LoginResponse> {
  return await apiConfig.post<never, LoginResponse>('/auth/refresh', data, { headers: { 'Skip-Auth': true } })
}

export async function postLogout(refreshToken: string): Promise<void> {
  return await apiConfig.post<never, void>('/auth/revoke', { token: refreshToken })
}
