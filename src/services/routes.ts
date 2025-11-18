import { RouteProps } from '@/types/routes'
import { apiConfig } from '@/services/api-config'

export async function getRoleRoutes(): Promise<RouteProps[]> {
  return await apiConfig.get(`/modules/roles`)
}
