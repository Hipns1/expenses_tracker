import { openDB } from 'idb'

const DB_NAME = 'expenses-tracker-db'
const DB_VERSION = 1

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('invoices')) {
                const store = db.createObjectStore('invoices', {
                    keyPath: 'id',
                    autoIncrement: true
                })
                store.createIndex('synced', 'synced')
            }
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
            }
        }
    })
}

export const dbService = {
    async addInvoice(invoice: any) {
        const db = await initDB()
        const tx = db.transaction('invoices', 'readwrite')
        await tx.store.add({ ...invoice, synced: 0, createdAt: new Date().toISOString() })
        await tx.done
    },

    async getInvoices() {
        const db = await initDB()
        return db.getAll('invoices')
    },

    async getUnsyncedInvoices() {
        const db = await initDB()
        return db.getAllFromIndex('invoices', 'synced', 0)
    },

    async markAsSynced(id: number) {
        const db = await initDB()
        const tx = db.transaction('invoices', 'readwrite')
        const invoice = await tx.store.get(id)
        if (invoice) {
            invoice.synced = 1
            await tx.store.put(invoice)
        }
        await tx.done
    }
}
