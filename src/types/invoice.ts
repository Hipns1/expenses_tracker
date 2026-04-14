export interface InvoiceItem {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Invoice {
    id?: number | string;
    description: string;
    amount: number;
    date: string;
    synced?: number;
    createdAt?: string;
    category?: string;
    items?: InvoiceItem[];
}
