import { apiConfig } from './api-config'

export type LoanStatus = 'Pending' | 'Partial' | 'Paid'

export interface LoanPayment {
    id: number
    amount: number
    note?: string | null
    createdAt: string
}

export interface Loan {
    id: number
    personName: string
    amount: number
    month: number
    fiscalYearId: number
    description?: string | null
    totalPaid: number
    remaining: number
    status: LoanStatus
    payments: LoanPayment[]
}

export const loansService = {
    async getAll(fiscalYearId?: number): Promise<Loan[]> {
        const url = fiscalYearId ? `/Loans?fiscalYearId=${fiscalYearId}` : '/Loans'
        return await apiConfig.get(url) as unknown as Loan[]
    },
    async create(data: {
        personName: string
        amount: number
        month: number
        fiscalYearId: number
        description?: string
    }): Promise<Loan> {
        return await apiConfig.post('/Loans', data) as unknown as Loan
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`/Loans/${id}`)
    },
    async addPayment(loanId: number, amount: number, note?: string): Promise<Loan> {
        return await apiConfig.post(`/Loans/${loanId}/payments`, { amount, note }) as unknown as Loan
    },
    async deletePayment(loanId: number, paymentId: number): Promise<Loan> {
        return await apiConfig.delete(`/Loans/${loanId}/payments/${paymentId}`) as unknown as Loan
    },
}
