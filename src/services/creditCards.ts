import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export type PaymentMethodType = 'Card' | 'BankAccount' | 'DigitalWallet' | 'Cash'

export interface CreditCard {
    id: number
    name: string
    lastFourDigits?: string | null
    type: PaymentMethodType
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
    Card: 'Tarjeta',
    BankAccount: 'Cuenta bancaria',
    DigitalWallet: 'Billetera digital',
    Cash: 'Efectivo',
}

export const creditCardsService = {
    async getAll(): Promise<CreditCard[]> {
        return await apiConfig.get(endpoints.creditCards.getAll) as unknown as CreditCard[]
    },
    async create(name: string, type: PaymentMethodType, lastFourDigits?: string): Promise<CreditCard> {
        return await apiConfig.post(endpoints.creditCards.create, { name, type, lastFourDigits: lastFourDigits || null }) as unknown as CreditCard
    },
    async update(id: number, name: string, type: PaymentMethodType, lastFourDigits?: string): Promise<CreditCard> {
        return await apiConfig.put(`${endpoints.creditCards.getAll}/${id}`, { name, type, lastFourDigits: lastFourDigits || null }) as unknown as CreditCard
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`${endpoints.creditCards.delete}/${id}`)
    }
}
