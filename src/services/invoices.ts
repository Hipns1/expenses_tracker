import { apiConfig } from './api-config'
import { Invoice } from '@/types/invoice'

export const invoiceService = {
    async getAll() {
        return await apiConfig.get('/Invoices') as unknown as Invoice[]
    },

    async create(invoice: Invoice) {
        return await apiConfig.post('/Invoices', invoice) as unknown as Invoice
    },

    async scan(file: File) {
        const formData = new FormData()
        formData.append('file', file)

        return await apiConfig.post('/Invoices/scan', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }) as unknown as Invoice
    }
}
