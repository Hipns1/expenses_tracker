import { apiConfig } from './api-config'
import { LoginProps, LoginResponse, RefreshProps, RegisterProps, RevokeProps } from '@/types/login'
import endpoints from './endpoints.json'

export async function postRegister(data: RegisterProps): Promise<LoginResponse> {
  return await apiConfig.post<never, LoginResponse>(endpoints.auth.register, data, { headers: { 'Skip-Auth': true } })
}

export async function postLogin(data: LoginProps): Promise<LoginResponse> {
  return await apiConfig.post<never, LoginResponse>(endpoints.auth.login, data, { headers: { 'Skip-Auth': true } })
}

export async function postRefresh(data: RefreshProps): Promise<LoginResponse> {
  return await apiConfig.post<never, LoginResponse>(endpoints.auth.refresh, data, { headers: { 'Skip-Auth': true } })
}

export async function postRevoke(data: RevokeProps): Promise<void> {
  return await apiConfig.post<never, void>(endpoints.auth.revoke, data)
}
