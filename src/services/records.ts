import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export type RecordType = 'IncomeNormal' | 'IncomeBonus' | 'Expense'

export interface Category {
    id: number
    name: string
}

export interface RecordCreditCard {
    id: number
    name: string
    lastFourDigits: string
}

export interface Record {
    id: number
    type: RecordType
    amount: number
    month: number
    description?: string
    fiscalYearId: number
    category?: Category | null
    creditCard?: RecordCreditCard | null
}

export interface CreateRecordPayload {
    type: RecordType
    amount: number
    month: number
    fiscalYearId: number
    description?: string
    categoryId?: number | null
    creditCardId?: number | null
}

export interface UpdateRecordPayload {
    type: RecordType
    amount: number
    month: number
    description?: string
    categoryId?: number | null
    creditCardId?: number | null
}

export interface YearCompareData {
    year: number
    incomeNormal: number[]
    incomeBonus: number[]
    expense: number[]
}

export interface CompareResult {
    yearA: YearCompareData
    yearB: YearCompareData
}

export interface SavingsByYear {
    year: number
    savings: number
}

export interface SavingsResult {
    total: number
    byYear: SavingsByYear[]
}

export const recordsService = {
    async getByYear(fiscalYearId: number): Promise<Record[]> {
        return await apiConfig.get(`${endpoints.records.getByYear}/${fiscalYearId}`) as unknown as Record[]
    },
    async compare(yearAId: number, yearBId: number): Promise<CompareResult> {
        return await apiConfig.get(`${endpoints.records.compare}?yearAId=${yearAId}&yearBId=${yearBId}`) as unknown as CompareResult
    },
    async savings(): Promise<SavingsResult> {
        return await apiConfig.get(endpoints.records.savings) as unknown as SavingsResult
    },
    async create(payload: CreateRecordPayload): Promise<Record> {
        return await apiConfig.post(endpoints.records.create, payload) as unknown as Record
    },
    async update(id: number, payload: UpdateRecordPayload): Promise<Record> {
        return await apiConfig.put(`${endpoints.records.update}/${id}`, payload) as unknown as Record
    },
    async delete(id: number): Promise<void> {
        await apiConfig.delete(`${endpoints.records.delete}/${id}`)
    }
}
