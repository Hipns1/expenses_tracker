import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export interface FiscalYear {
    id: number
    year: number
}

export const fiscalYearsService = {
    async getAll(): Promise<FiscalYear[]> {
        return await apiConfig.get(endpoints.fiscalYears.getAll) as unknown as FiscalYear[]
    },
    async create(year: number): Promise<FiscalYear> {
        return await apiConfig.post(endpoints.fiscalYears.create, { year }) as unknown as FiscalYear
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`${endpoints.fiscalYears.delete}/${id}`)
    }
}
