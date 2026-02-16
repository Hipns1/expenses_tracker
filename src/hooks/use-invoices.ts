import { useState, useEffect, useCallback } from 'react'
import { dbService } from '@/services/db'
import { invoiceService } from '@/services/invoices'
import { Invoice } from '@/types/invoice'

export const useInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    const fetchInvoices = useCallback(async () => {
        try {
            const data = await dbService.getInvoices()
            const sorted = data.sort((a: Invoice, b: Invoice) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            setInvoices(sorted)
        } catch (err) {
            console.error('Failed to fetch invoices', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
        // Optimistic update: save locally first
        await dbService.addInvoice(invoice)
        await fetchInvoices()

        if (navigator.onLine) {
            try {
                console.log('Online, syncing to backend...')
                await invoiceService.create(invoice as Invoice)
                // In a real app, we would update the local ID with the remote ID
                // and mark as synced. For now, we just push to backend.
            } catch (err) {
                console.error('Failed to sync invoice', err)
            }
        }
    }

    return { invoices, loading, addInvoice, refresh: fetchInvoices }
}
