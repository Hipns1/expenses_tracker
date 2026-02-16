import { useState, useEffect, useCallback } from 'react'
import { dbService } from '@/services/db'
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
        await dbService.addInvoice(invoice)
        await fetchInvoices()

        if (navigator.onLine) {
            console.log('Online, syncing...')
        }
    }

    return { invoices, loading, addInvoice, refresh: fetchInvoices }
}
