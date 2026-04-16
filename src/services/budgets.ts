import { apiConfig } from './api-config'

export interface BudgetCategory {
    id: number
    name: string
}

export interface Budget {
    id: number
    fiscalYearId: number
    monthlyLimit: number
    spent: number
    category: BudgetCategory | null
}

export interface CreateBudgetPayload {
    fiscalYearId: number
    categoryId?: number | null
    monthlyLimit: number
}

export const budgetsService = {
    async getByYear(fiscalYearId: number, month?: number): Promise<Budget[]> {
        const url = month
            ? `/Budgets?fiscalYearId=${fiscalYearId}&month=${month}`
            : `/Budgets?fiscalYearId=${fiscalYearId}`
        const data = await apiConfig.get(url)
        return (Array.isArray(data) ? data : []) as Budget[]
    },
    async create(payload: CreateBudgetPayload): Promise<Budget> {
        return await apiConfig.post('/Budgets', payload) as unknown as Budget
    },
    async update(id: number, monthlyLimit: number): Promise<Budget> {
        return await apiConfig.put(`/Budgets/${id}`, { monthlyLimit }) as unknown as Budget
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`/Budgets/${id}`)
    },
}
