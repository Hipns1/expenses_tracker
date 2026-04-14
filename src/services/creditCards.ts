import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export interface CreditCard {
    id: number
    name: string
    lastFourDigits: string
}

export const creditCardsService = {
    async getAll(): Promise<CreditCard[]> {
        return await apiConfig.get(endpoints.creditCards.getAll) as unknown as CreditCard[]
    },
    async create(name: string, lastFourDigits: string): Promise<CreditCard> {
        return await apiConfig.post(endpoints.creditCards.create, { name, lastFourDigits }) as unknown as CreditCard
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`${endpoints.creditCards.delete}/${id}`)
    }
}
