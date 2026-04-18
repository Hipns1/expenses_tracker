import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export interface FiscalYear {
    id: number
    year: number
    hasAttachment?: boolean
    attachmentFileName?: string | null
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
    },
    async uploadAttachment(id: number, file: File): Promise<FiscalYear> {
        const form = new FormData()
        form.append('file', file)
        return await apiConfig.post(`${endpoints.fiscalYears.attachment}/${id}/attachment`, form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }) as unknown as FiscalYear
    },
    async downloadAttachment(id: number): Promise<Blob> {
        return await apiConfig.get(`${endpoints.fiscalYears.attachment}/${id}/attachment`, {
            responseType: 'blob'
        }) as unknown as Blob
    },
    async deleteAttachment(id: number): Promise<void> {
        await apiConfig.delete(`${endpoints.fiscalYears.attachment}/${id}/attachment`)
    }
}
