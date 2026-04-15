import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export interface CardExpense {
    id: number
    amount: number
    description: string
    date: string
    creditCardId: number
}

export interface CreateCardExpensePayload {
    amount: number
    description: string
    date: string
    creditCardId: number
}

export const cardExpensesService = {
    async getByCard(cardId: number): Promise<CardExpense[]> {
        return await apiConfig.get(`${endpoints.cardExpenses.getByCard}/${cardId}`) as unknown as CardExpense[]
    },
    async create(payload: CreateCardExpensePayload): Promise<CardExpense> {
        return await apiConfig.post(endpoints.cardExpenses.create, payload) as unknown as CardExpense
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`${endpoints.cardExpenses.delete}/${id}`)
    }
}
