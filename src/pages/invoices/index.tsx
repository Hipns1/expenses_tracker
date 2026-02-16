import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useInvoices } from '@/hooks/use-invoices'
import { Loader2, Plus, CloudOff, Cloud, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'
import { BaseLayout } from '@/components/shared/base-layout'

const formSchema = z.object({
    description: z.string().min(2, "Description is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    category: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

export default function InvoicesPage() {
    const { invoices, loading, addInvoice } = useInvoices()
    const [isFormOpen, setIsFormOpen] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: 'General'
        }
    })

    const onSubmit = async (data: FormValues) => {
        await addInvoice({
            ...data,
            synced: 0
        })
        setIsFormOpen(false)
        form.reset()
    }

    return (
        <BaseLayout isHeader={false}>
            <div className="font-sans text-tertiary dark:text-light transition-colors duration-300 min-h-full relative pb-24">
                <header className="flex justify-between items-center mb-6 bg-glass p-4 rounded-xl shadow-sm backdrop-blur-md sticky top-0 z-30">
                    <h1 className="text-2xl font-bold text-gradient">My Invoices</h1>
                    <div className="flex items-center gap-2">
                        <span className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-full", navigator.onLine ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                            {navigator.onLine ? <Cloud size={14} /> : <CloudOff size={14} />}
                            {navigator.onLine ? "Online" : "Offline"}
                        </span>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {invoices.length === 0 && !loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-10 opacity-60"
                                >
                                    <FileText size={48} className="mx-auto mb-2 text-gray-400" />
                                    <p>No invoices yet.</p>
                                    <Button variant="link" onClick={() => setIsFormOpen(true)}>Add your first one</Button>
                                </motion.div>
                            )}

                            {invoices.map((inv) => (
                                <motion.div
                                    key={inv.id as string | number}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-white dark:bg-tertiary-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center card-hover relative overflow-hidden group"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div>
                                        <h3 className="font-semibold text-lg">{inv.description}</h3>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <span>{new Date(inv.date).toLocaleDateString()}</span>
                                            •
                                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{inv.category || 'General'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-bold text-primary dark:text-primary-light">
                                            ${Number(inv.amount).toFixed(2)}
                                        </span>
                                        <span className={cn("text-xs flex items-center justify-end gap-1 mt-1", inv.synced ? "text-green-500" : "text-orange-500")}>
                                            {inv.synced ? "Synced" : "Pending Sync"}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFormOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-primary text-white rounded-full shadow-lg flex items-center justify-center z-50 card-hover"
                >
                    <Plus size={28} />
                </motion.button>

                <AnimatePresence>
                    {isFormOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white dark:bg-dark w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl relative"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gradient">New Invoice</h2>
                                    <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Lunch, Taxi, etc." {...field} className="bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Amount ($)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" {...field} className="bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="date"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Date</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} className="bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Food, Travel..." {...field} className="bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="pt-4">
                                            <Button type="submit" className="w-full bg-gradient-primary text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                                                Save Invoice
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </BaseLayout>
    )
}
