import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export interface CategoryGroup {
    id: number
    name: string
    categoryIds: number[]
}

export const categoryGroupsService = {
    async getAll(): Promise<CategoryGroup[]> {
        return await apiConfig.get(endpoints.categoryGroups.getAll) as unknown as CategoryGroup[]
    },
    async create(name: string, categoryIds: number[]): Promise<CategoryGroup> {
        return await apiConfig.post(endpoints.categoryGroups.create, { name, categoryIds }) as unknown as CategoryGroup
    },
    async update(id: number, name: string, categoryIds: number[]): Promise<CategoryGroup> {
        return await apiConfig.put(`${endpoints.categoryGroups.update}/${id}`, { name, categoryIds }) as unknown as CategoryGroup
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`${endpoints.categoryGroups.delete}/${id}`)
    }
}
