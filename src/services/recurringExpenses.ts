import { apiConfig } from './api-config'

export interface RecurringExpenseCategory {
    id: number
    name: string
}

export interface RecurringExpense {
    id: number
    name: string
    amount: number
    dayOfMonth?: number | null
    description?: string | null
    category: RecurringExpenseCategory | null
}

export interface CreateRecurringExpensePayload {
    name: string
    amount: number
    dayOfMonth?: number | null
    description?: string | null
    categoryId?: number | null
}

export const recurringExpensesService = {
    async getAll(): Promise<RecurringExpense[]> {
        const data = await apiConfig.get('/RecurringExpenses')
        return (Array.isArray(data) ? data : []) as RecurringExpense[]
    },
    async create(payload: CreateRecurringExpensePayload): Promise<RecurringExpense> {
        return await apiConfig.post('/RecurringExpenses', payload) as unknown as RecurringExpense
    },
    async update(id: number, payload: CreateRecurringExpensePayload): Promise<RecurringExpense> {
        return await apiConfig.put(`/RecurringExpenses/${id}`, payload) as unknown as RecurringExpense
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`/RecurringExpenses/${id}`)
    },
}
