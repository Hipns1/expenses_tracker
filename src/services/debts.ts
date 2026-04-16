import { apiConfig } from './api-config'

export type DebtStatus = 'Pending' | 'Partial' | 'Paid'

export interface DebtPayment {
    id: number
    amount: number
    month: number
    year: number
    note?: string | null
    createdAt: string
}

export interface Debt {
    id: number
    creditorName: string
    amount: number
    description?: string | null
    totalPaid: number
    remaining: number
    status: DebtStatus
    payments: DebtPayment[]
}

export const debtsService = {
    async getAll(): Promise<Debt[]> {
        const data = await apiConfig.get('/Debts')
        return (Array.isArray(data) ? data : []) as Debt[]
    },
    async create(data: {
        creditorName: string
        amount: number
        description?: string
    }): Promise<Debt> {
        return await apiConfig.post('/Debts', data) as unknown as Debt
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`/Debts/${id}`)
    },
    async addPayment(debtId: number, amount: number, month: number, year: number, note?: string): Promise<Debt> {
        return await apiConfig.post(`/Debts/${debtId}/payments`, { amount, month, year, note }) as unknown as Debt
    },
    async deletePayment(debtId: number, paymentId: number): Promise<Debt> {
        return await apiConfig.delete(`/Debts/${debtId}/payments/${paymentId}`) as unknown as Debt
    },
}
