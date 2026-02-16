import { apiConfig } from './api-config'
import { Invoice } from '@/types/invoice'
import endpoints from './endpoints.json'

export const invoiceService = {
    async getAll(): Promise<Invoice[]> {
        return await apiConfig.get(endpoints.invoices.getAll) as unknown as Invoice[]
    },

    async create(invoice: Invoice): Promise<Invoice> {
        return await apiConfig.post(endpoints.invoices.create, invoice) as unknown as Invoice
    },

    async scan(file: File): Promise<Invoice> {
        const formData = new FormData()
        formData.append('file', file)

        return await apiConfig.post(endpoints.invoices.scan, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }) as unknown as Invoice
    },

    async parseText(text: string): Promise<Invoice> {
        return await apiConfig.post(endpoints.invoices.parseText, { text }) as unknown as Invoice
    }
}
