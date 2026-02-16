import { apiConfig } from './api-config'
import { Role } from '@/types/login'
import endpoints from './endpoints.json'

export interface CreateRoleProps {
    roleName: string
}

export async function getAllRoles(): Promise<Role[]> {
    return await apiConfig.get(endpoints.roles.getAll)
}

export async function createRole(data: CreateRoleProps) {
    return await apiConfig.post(endpoints.roles.create, data)
}
