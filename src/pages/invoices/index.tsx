import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useInvoices } from '@/hooks/use-invoices'
import { Loader2, Plus, CloudOff, Cloud, FileText, Camera } from 'lucide-react'
import { invoiceService } from '@/services/invoices'
import { toast } from 'react-toastify'
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
    const [isScanning, setIsScanning] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handleScanClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsScanning(true)
        try {
            const result = await invoiceService.scan(file)
            form.setValue('description', result.description)
            form.setValue('amount', result.amount)
            form.setValue('date', result.date.split('T')[0])
            form.setValue('category', result.category || 'General')
            toast.success("Invoice scanned successfully!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to scan invoice")
        } finally {
            setIsScanning(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <BaseLayout isHeader={false}>
            <div className="font-sans text-text-main dark:text-text-light transition-colors duration-300 min-h-full relative pb-24">
                <header className="flex justify-between items-center mb-6 bg-glass p-4 rounded-2xl shadow-sm backdrop-blur-md sticky top-0 z-30">
                    <h1 className="text-2xl font-bold text-gradient">My Invoices</h1>
                    <div className="flex items-center gap-2">
                        <span className={cn("flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-colors",
                            navigator.onLine
                                ? "bg-success/10 text-success-dark border border-success/20"
                                : "bg-warning/10 text-warning-dark border border-warning/20")}>
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
                                    className="text-center py-20 opacity-60 flex flex-col items-center"
                                >
                                    <div className="w-20 h-20 bg-secondary-100 dark:bg-card-dark rounded-full flex items-center justify-center mb-4">
                                        <FileText size={32} className="text-secondary" />
                                    </div>
                                    <p className="text-lg font-medium text-text-muted">No invoices yet</p>
                                    <Button variant="link" onClick={() => setIsFormOpen(true)} className="text-primary mt-2">Add your first one</Button>
                                </motion.div>
                            )}

                            {invoices.map((inv) => (
                                <motion.div
                                    key={inv.id as string | number}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-sm border border-secondary-100 dark:border-secondary-dark flex justify-between items-center card-hover relative overflow-hidden group hover:border-primary/30 transition-all"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-info opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div>
                                        <h3 className="font-semibold text-lg text-text-main dark:text-white mb-1">{inv.description}</h3>
                                        <div className="text-sm text-text-muted flex items-center gap-2">
                                            <span>{new Date(inv.date).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-secondary-300"></span>
                                            <span className="text-xs bg-secondary-100 dark:bg-secondary-dark/50 px-2 py-0.5 rounded-md text-secondary-dark dark:text-secondary-100 font-medium">
                                                {inv.category || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-bold text-primary dark:text-primary-light">
                                            ${Number(inv.amount).toFixed(2)}
                                        </span>
                                        <span className={cn("text-xs flex items-center justify-end gap-1 mt-1 font-medium",
                                            inv.synced ? "text-success" : "text-warning")}>
                                            {inv.synced ? "Synced" : "Pending"}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsFormOpen(true)}
                    className="fixed bottom-8 right-6 w-14 h-14 bg-gradient-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 hover:shadow-glow transition-all duration-300"
                >
                    <Plus size={28} />
                </motion.button>

                <AnimatePresence>
                    {isFormOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFormOpen(false)}
                                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-bg-dark w-full md:max-w-lg md:mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl border-t md:border border-secondary-100 dark:border-secondary-dark"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gradient">New Invoice</h2>
                                    <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)} className="text-text-muted hover:text-danger">Cancel</Button>
                                </div>

                                <div className="mb-8">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleScanClick}
                                        disabled={isScanning}
                                        className={cn(
                                            "w-full h-16 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all bg-secondary-100/30 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary/50 group",
                                            isScanning ? "opacity-70 cursor-wait" : ""
                                        )}
                                    >
                                        <div className="flex items-center gap-2 text-primary font-medium group-hover:scale-105 transition-transform">
                                            {isScanning ? <Loader2 className="animate-spin" /> : <Camera />}
                                            <span>{isScanning ? "Analyzing Invoice..." : "Scan with AI"}</span>
                                        </div>
                                        <span className="text-xs text-text-muted mt-1">Automatic extraction</span>
                                    </Button>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-text-muted dark:text-text-muted font-medium ml-1">Description</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Lunch, Taxi, etc." {...field} />
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
                                                        <FormLabel className="text-text-muted dark:text-text-muted font-medium ml-1">Amount ($)</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" step="0.01" {...field} />
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
                                                        <FormLabel className="text-text-muted dark:text-text-muted font-medium ml-1">Date</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} />
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
                                                    <FormLabel className="text-text-muted dark:text-text-muted font-medium ml-1">Category</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Food, Travel..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="pt-6">
                                            <Button type="submit" className="w-full bg-gradient-primary text-white font-bold py-6 text-lg shadow-lg hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-xl">
                                                Save Invoice
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </BaseLayout>
    )
}
