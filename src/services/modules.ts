import { apiConfig } from './api-config'
import { RouteProps } from '@/types/routes'
import endpoints from './endpoints.json'

export interface CreateModuleProps {
    name: string
    path: string
    component: string
}

export interface AssignModuleProps {
    roleId: number
    moduleId: number
}

export async function getAllModules() {
    return await apiConfig.get(endpoints.modules.getAll)
}

export async function createModule(data: CreateModuleProps) {
    return await apiConfig.post(endpoints.modules.create, data)
}

export async function assignModule(data: AssignModuleProps) {
    return await apiConfig.post(endpoints.modules.assign, data)
}

export async function getRoleRoutes(): Promise<RouteProps[]> {
    return await apiConfig.get(endpoints.modules.getRoleRoutes)
}
