export interface Invoice {
    id?: number | string;
    description: string;
    amount: number;
    date: string;
    synced?: number;
    createdAt?: string;
    category?: string;
}
