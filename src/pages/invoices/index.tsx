import { useState, useRef } from 'react'
import { useForm, ControllerRenderProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useInvoices } from '@/hooks/use-invoices'
import { Loader2, CloudOff, Cloud, FileText, Camera, ScanLine, Edit3 } from 'lucide-react'
import { invoiceService } from '@/services'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'
import { BaseLayout } from '@/components/shared/base-layout'
import { extractTextFromImage } from '@/utils/ocr'

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
    const [scanProgress, setScanProgress] = useState(0)
    const [showManualForm, setShowManualForm] = useState(false)
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
        setShowManualForm(false)
        form.reset()
        toast.success("Invoice saved successfully!")
    }

    const handleScanClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            toast.error("Please select a valid image file")
            return
        }

        setIsScanning(true)
        setScanProgress(0)

        try {
            // PASO 1: Ejecutar OCR en el frontend
            toast.info("Extracting text from image...")
            const ocrResult = await extractTextFromImage(file, (progress) => {
                setScanProgress(Math.round(progress * 50)) // 0-50% for OCR
            })

            console.log('OCR Text extracted:', ocrResult.text)
            console.log('OCR Confidence:', ocrResult.confidence)

            if (!ocrResult.text || ocrResult.text.trim().length < 10) {
                throw new Error("Could not extract enough text from image")
            }

            // PASO 2: Enviar texto a backend para parseo con ChatGPT
            toast.info("Analyzing invoice data...")
            setScanProgress(60)

            const parsedInvoice = await invoiceService.parseText(ocrResult.text)

            setScanProgress(100)

            // PASO 3: Llenar el formulario con los datos parseados por ChatGPT
            form.setValue('description', parsedInvoice.description || 'Invoice')
            form.setValue('amount', parsedInvoice.amount || 0)
            form.setValue('date', parsedInvoice.date ? new Date(parsedInvoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
            form.setValue('category', parsedInvoice.category || 'General')

            toast.success(`Invoice scanned and analyzed! (${ocrResult.confidence.toFixed(0)}% OCR confidence)`)
            setShowManualForm(true) // Mostrar formulario para revisar/editar
        } catch (error) {
            console.error('Scan & Parse Error:', error)
            toast.error("Failed to scan invoice. Please enter manually.")
            setShowManualForm(true) // Permitir entrada manual en caso de error
        } finally {
            setIsScanning(false)
            setScanProgress(0)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleOpenModal = () => {
        setIsFormOpen(true)
        setShowManualForm(false)
    }

    const handleCloseModal = () => {
        setIsFormOpen(false)
        setShowManualForm(false)
        form.reset()
    }

    return (
        <BaseLayout isHeader={false}>
            <div className="font-sans text-text-main dark:text-text-light transition-colors duration-300 min-h-full relative pb-20 md:pb-24 px-3 md:px-4">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 md:mb-6 bg-glass p-4 md:p-5 rounded-2xl shadow-sm backdrop-blur-md sticky top-0 z-30">
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gradient">My Invoices</h1>
                        <p className="text-xs md:text-sm text-text-muted mt-0.5">Track your expenses</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("flex items-center gap-1 text-xs md:text-sm px-2.5 md:px-3 py-1.5 rounded-full font-medium transition-colors",
                            navigator.onLine
                                ? "bg-success/10 text-success-dark border border-success/20"
                                : "bg-warning/10 text-warning-dark border border-warning/20")}>
                            {navigator.onLine ? <Cloud size={14} className="md:w-4 md:h-4" /> : <CloudOff size={14} className="md:w-4 md:h-4" />}
                            <span className="hidden sm:inline">{navigator.onLine ? "Online" : "Offline"}</span>
                        </span>
                    </div>
                </header>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64 md:h-96">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="space-y-3 md:space-y-4 max-w-4xl mx-auto">
                        <AnimatePresence>
                            {invoices.length === 0 && !loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-12 md:py-20 opacity-60 flex flex-col items-center"
                                >
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary-100 dark:bg-card-dark rounded-full flex items-center justify-center mb-3 md:mb-4">
                                        <FileText size={28} className="md:w-9 md:h-9 text-secondary" />
                                    </div>
                                    <p className="text-base md:text-lg font-medium text-text-muted mb-1">No invoices yet</p>
                                    <p className="text-xs md:text-sm text-text-muted/70 mb-3">Start by scanning your first invoice</p>
                                    <Button
                                        variant="link"
                                        onClick={handleOpenModal}
                                        className="text-primary hover:text-primary-dark font-medium text-sm md:text-base"
                                    >
                                        📸 Scan your first invoice
                                    </Button>
                                </motion.div>
                            )}

                            {invoices.map((inv) => (
                                <motion.div
                                    key={inv.id as string | number}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-card-light dark:bg-card-dark rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm border border-secondary-100 dark:border-secondary-dark 
                                               flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0
                                               card-hover relative overflow-hidden group hover:border-primary/30 transition-all"
                                >
                                    {/* Left Accent Bar */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-gradient-to-b from-primary to-info opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Content */}
                                    <div className="flex-1 pl-3 md:pl-0">
                                        <h3 className="font-semibold text-base md:text-lg text-text-main dark:text-white mb-1 line-clamp-1">{inv.description}</h3>
                                        <div className="text-xs md:text-sm text-text-muted flex flex-wrap items-center gap-2">
                                            <span>{new Date(inv.date).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-secondary-300 hidden sm:block"></span>
                                            <span className="text-xs bg-secondary-100 dark:bg-secondary-dark/50 px-2 py-0.5 rounded-md text-secondary-dark dark:text-secondary-100 font-medium">
                                                {inv.category || 'General'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Amount & Status */}
                                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pl-3 md:pl-0">
                                        <span className="text-lg md:text-xl font-bold text-primary dark:text-primary-light">
                                            ${Number(inv.amount).toFixed(2)}
                                        </span>
                                        <span className={cn("text-xs flex items-center gap-1 font-medium px-2 py-0.5 rounded-full",
                                            inv.synced
                                                ? "text-success bg-success/10"
                                                : "text-warning bg-warning/10")}>
                                            {inv.synced ? "✓ Synced" : "⏳ Pending"}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Main FAB - Camera Icon */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleOpenModal}
                    className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-gradient-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 hover:shadow-glow transition-all duration-300"
                >
                    <Camera size={24} className="md:hidden" />
                    <Camera size={28} className="hidden md:block" />
                </motion.button>

                <AnimatePresence>
                    {isFormOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleCloseModal}
                                className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
                            />

                            {/* Modal */}
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 z-[101] w-full
                                           md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                                           md:max-w-md lg:max-w-lg md:w-full
                                           bg-white dark:bg-bg-dark
                                           rounded-t-3xl md:rounded-3xl
                                           shadow-2xl border-t md:border border-secondary-100 dark:border-secondary-800
                                           max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col"
                            >
                                {/* Header */}
                                <div className="flex-shrink-0 sticky top-0 bg-white dark:bg-bg-dark z-10 border-b border-secondary-100 dark:border-secondary-800 px-5 py-4 md:px-6 md:py-5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-bold text-gradient">New Invoice</h2>
                                            <p className="text-xs md:text-sm text-text-muted mt-0.5">Scan or enter manually</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCloseModal}
                                            className="text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl h-9 w-9 p-0"
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                </div>

                                {/* Content - Scrollable */}
                                <div className="flex-1 overflow-y-auto px-5 py-6 md:px-6 md:py-8">
                                    {!showManualForm ? (
                                        <div className="space-y-6">
                                            {/* Primary Action: Scan with OCR */}
                                            <div>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="hidden"
                                                />
                                                <motion.button
                                                    type="button"
                                                    onClick={handleScanClick}
                                                    disabled={isScanning}
                                                    whileHover={!isScanning ? { scale: 1.02 } : {}}
                                                    whileTap={!isScanning ? { scale: 0.98 } : {}}
                                                    className={cn(
                                                        "w-full h-36 md:h-40 border-2 rounded-2xl flex flex-col items-center justify-center transition-all relative overflow-hidden group",
                                                        isScanning
                                                            ? "border-primary/50 bg-primary/5 cursor-wait"
                                                            : "border-primary bg-gradient-to-br from-primary-50 via-primary-100 to-primary-50 dark:from-primary-900/20 dark:via-primary-800/30 dark:to-primary-900/20 hover:border-primary-600 hover:shadow-lg hover:shadow-primary/20"
                                                    )}
                                                >
                                                    {/* Animated Background */}
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"
                                                        animate={!isScanning ? {
                                                            opacity: [0, 0.3, 0],
                                                            scale: [1, 1.2, 1]
                                                        } : {}}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: "easeInOut"
                                                        }}
                                                    />

                                                    <div className="flex flex-col items-center gap-3 md:gap-4 relative z-10">
                                                        {isScanning ? (
                                                            <>
                                                                <motion.div
                                                                    animate={{ rotate: 360 }}
                                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                                >
                                                                    <Loader2 className="text-primary" size={40} />
                                                                </motion.div>
                                                                <div className="text-center">
                                                                    <span className="text-primary font-bold text-base md:text-lg block">Scanning Invoice...</span>
                                                                    <div className="mt-2 w-48 bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
                                                                        <motion.div
                                                                            className="h-full bg-gradient-to-r from-primary to-primary-600"
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${scanProgress}%` }}
                                                                            transition={{ duration: 0.3 }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-text-muted mt-1 block">{scanProgress}% complete</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <motion.div
                                                                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/15 dark:bg-primary/20 flex items-center justify-center"
                                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                                    transition={{ type: "spring", stiffness: 400 }}
                                                                >
                                                                    <ScanLine size={32} className="md:w-10 md:h-10 text-primary" />
                                                                </motion.div>
                                                                <div className="text-center">
                                                                    <span className="text-primary font-bold text-lg md:text-xl block">Scan Invoice</span>
                                                                    <span className="text-xs md:text-sm text-text-muted mt-1 block">📸 Take or upload a photo</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            </div>

                                            {/* Divider */}
                                            <div className="flex items-center gap-3 my-6">
                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary-300 dark:via-secondary-700 to-transparent"></div>
                                                <span className="text-xs font-medium text-text-muted uppercase tracking-wider px-2">Or</span>
                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary-300 dark:via-secondary-700 to-transparent"></div>
                                            </div>

                                            {/* Secondary Action: Manual Entry */}
                                            <motion.button
                                                onClick={() => setShowManualForm(true)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-3 md:py-4 px-4 flex items-center justify-center gap-2 
                                                           text-secondary-dark dark:text-secondary-300 
                                                           bg-secondary-100/50 dark:bg-secondary-800/30 
                                                           hover:bg-secondary-100 dark:hover:bg-secondary-800/50
                                                           hover:text-primary dark:hover:text-primary
                                                           rounded-xl transition-all border border-transparent hover:border-primary/20"
                                            >
                                                <Edit3 size={18} />
                                                <span className="font-medium text-sm md:text-base">Enter manually</span>
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <Form {...form}>
                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
                                                <FormField
                                                    control={form.control}
                                                    name="description"
                                                    render={({ field }: { field: ControllerRenderProps<FormValues, 'description'> }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-text-main dark:text-text-light font-semibold text-sm md:text-base">Description</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="e.g., Lunch at Mario's Restaurant"
                                                                    className="h-11 md:h-12 text-sm md:text-base rounded-xl border-secondary-200 dark:border-secondary-700 focus:border-primary focus:ring-primary/20"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="amount"
                                                        render={({ field }: { field: ControllerRenderProps<FormValues, 'amount'> }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-text-main dark:text-text-light font-semibold text-sm md:text-base">Amount ($)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="0.00"
                                                                        className="h-11 md:h-12 text-sm md:text-base rounded-xl border-secondary-200 dark:border-secondary-700 focus:border-primary focus:ring-primary/20"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage className="text-xs" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="date"
                                                        render={({ field }: { field: ControllerRenderProps<FormValues, 'date'> }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-text-main dark:text-text-light font-semibold text-sm md:text-base">Date</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="date"
                                                                        className="h-11 md:h-12 text-sm md:text-base rounded-xl border-secondary-200 dark:border-secondary-700 focus:border-primary focus:ring-primary/20"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage className="text-xs" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <FormField
                                                    control={form.control}
                                                    name="category"
                                                    render={({ field }: { field: ControllerRenderProps<FormValues, 'category'> }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-text-main dark:text-text-light font-semibold text-sm md:text-base">Category</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="e.g., Food, Transport, Shopping"
                                                                    className="h-11 md:h-12 text-sm md:text-base rounded-xl border-secondary-200 dark:border-secondary-700 focus:border-primary focus:ring-primary/20"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-xs" />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Action Buttons */}
                                                <div className="flex gap-3 pt-4">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => setShowManualForm(false)}
                                                        className="flex-1 h-11 md:h-12 text-sm md:text-base font-medium rounded-xl border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                                                    >
                                                        ← Back
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className="flex-1 h-11 md:h-12 text-sm md:text-base bg-gradient-primary text-white font-bold shadow-lg hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-xl"
                                                    >
                                                        Save Invoice
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </BaseLayout>
    )
}
