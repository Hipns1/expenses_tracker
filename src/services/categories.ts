import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export interface Category {
    id: number
    name: string
    isSystem?: boolean
    monthlyIdeal?: number
    categoryGroupId?: number
}

export const categoriesService = {
    async getAll(): Promise<Category[]> {
        return await apiConfig.get(endpoints.categories.getAll) as unknown as Category[]
    },
    async create(name: string, monthlyIdeal?: number): Promise<Category> {
        return await apiConfig.post(endpoints.categories.create, { name, monthlyIdeal }) as unknown as Category
    },
    async update(id: number, name: string, monthlyIdeal?: number): Promise<Category> {
        return await apiConfig.put(`${endpoints.categories.getAll}/${id}`, { name, monthlyIdeal }) as unknown as Category
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`${endpoints.categories.delete}/${id}`)
    }
}
