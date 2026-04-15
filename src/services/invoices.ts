import { apiConfig } from './api-config'
import { Invoice } from '@/types/invoice'
import endpoints from './endpoints.json'
import { N8N_INVOICE_SCAN_URL } from '@/utils/consts/auth'

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

        const res = await fetch(N8N_INVOICE_SCAN_URL!, {
            method: 'POST',
            body: formData,
        })

        if (!res.ok) throw new Error('Error al escanear la factura')
        const data = await res.json()

        return {
            description: data.comercio || data.metodo_pago || '',
            amount: data.valor_factura ?? 0,
            date: new Date().toISOString(),
            items: (data.productos ?? []).map((p: { marca?: string; item: string; cantidad: number; precio_unitario: number; ahorro?: number }) => ({
                name: `${p.marca ? p.marca + ' - ' : ''}${p.item}`,
                quantity: p.cantidad,
                unitPrice: p.precio_unitario,
                totalPrice: Math.round(p.cantidad * p.precio_unitario) - (p.ahorro ?? 0),
                discount: p.ahorro ?? 0,
            })),
        }
    },

}
