import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { BaseLayout } from '@/components/shared/base-layout'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { categoriesService, type Category } from '@/services/categories'
import { creditCardsService, type CreditCard } from '@/services/creditCards'
import { recordsService, type Record as FinanceRecord, type RecordType, type CreateRecordPayload, type UpdateRecordPayload } from '@/services/records'
import { invoiceService } from '@/services'
import { toast } from 'react-toastify'
import {
  Plus, Trash2, Pencil, X, TrendingUp, TrendingDown, Wallet,
  ChevronDown, CalendarDays, Tag, ArrowUpCircle, ArrowDownCircle,
  ScanLine, Edit3, Loader2, CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const RECORD_TYPE_LABELS: { [K in RecordType]: string } = {
  IncomeNormal: 'Ingreso',
  IncomeBonus: 'Bono',
  Expense: 'Gasto',
}

const RECORD_TYPE_OPTIONS: { value: RecordType; label: string }[] = [
  { value: 'IncomeNormal', label: 'Ingreso normal' },
  { value: 'IncomeBonus', label: 'Ingreso extra / bono' },
  { value: 'Expense', label: 'Gasto' },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
}

function isIncome(type: RecordType) {
  return type === 'IncomeNormal' || type === 'IncomeBonus'
}

/* ── Input de moneda ── */
function CurrencyInput({
  value, onChange, placeholder = '0', className, readOnly = false, currency = 'COP',
}: {
  value: string; onChange: (val: string) => void; placeholder?: string; className?: string; readOnly?: boolean; currency?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const numericOnly = value.replace(/\D/g, '')
  const formatted = numericOnly ? new Intl.NumberFormat('es-CO').format(parseInt(numericOnly)) : ''

  const symbol = new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 })
    .formatToParts(0).find(p => p.type === 'currency')?.value ?? ''

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return
    const input = e.target
    const cursorPos = input.selectionStart ?? 0
    const digitsBeforeCursor = input.value.slice(0, cursorPos).replace(/\D/g, '').length
    const raw = e.target.value.replace(/\D/g, '')
    onChange(raw)
    requestAnimationFrame(() => {
      if (!inputRef.current) return
      const newFormatted = raw ? new Intl.NumberFormat('es-CO').format(parseInt(raw)) : ''
      let digitCount = 0
      let newPos = newFormatted.length
      for (let i = 0; i < newFormatted.length; i++) {
        if (/\d/.test(newFormatted[i])) {
          digitCount++
          if (digitCount === digitsBeforeCursor) { newPos = i + 1; break }
        }
      }
      if (digitsBeforeCursor === 0) newPos = 0
      inputRef.current.setSelectionRange(newPos, newPos)
    })
  }, [readOnly, onChange])

  return (
    <div className='relative flex items-center w-full'>
      {symbol && (
        <span className='absolute left-2.5 text-text-muted pointer-events-none select-none text-xs z-10'>
          {symbol}
        </span>
      )}
      <input
        ref={inputRef}
        type='text'
        inputMode='numeric'
        value={formatted}
        placeholder={placeholder}
        readOnly={readOnly}
        style={symbol ? { paddingLeft: '1.625rem' } : undefined}
        className={`w-full ${className ?? ''}`}
        onChange={handleChange}
      />
    </div>
  )
}

/* ── Modal ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className='relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto'
      >
        <div className='flex items-center justify-between mb-5'>
          <h3 className='text-lg font-semibold text-text-main'>{title}</h3>
          <button
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary-100 text-secondary-500 transition-colors'
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

/* ── Resumen ── */
function SummaryCard({ label, amount, icon: Icon, color, bg }: {
  label: string; amount: number; icon: React.ElementType; color: string; bg: string
}) {
  return (
    <div className='bg-white rounded-2xl border border-secondary-100 p-5 flex items-center gap-4'>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon size={20} className={color} />
      </div>
      <div className='min-w-0'>
        <p className='text-xs text-text-muted font-medium uppercase tracking-wide'>{label}</p>
        <p className='text-xl font-bold text-text-main truncate'>{formatCurrency(amount)}</p>
      </div>
    </div>
  )
}

/* ── Item de factura ── */
interface InvoiceItemRow {
  name: string
  quantity: string
  unitPrice: string
  discount?: string
}

/* ── Form state ── */
interface RecordFormState {
  type: RecordType
  amount: string
  month: number
  description: string
  categoryId: string
  creditCardId: string
  items: InvoiceItemRow[]
}

const EMPTY_FORM: RecordFormState = {
  type: 'Expense',
  amount: '',
  month: new Date().getMonth() + 1,
  description: '',
  categoryId: '',
  creditCardId: '',
  items: [],
}

/* ── Formulario de registro ── */
function RecordForm({
  initial,
  categories,
  creditCards,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  initial: RecordFormState
  categories: Category[]
  creditCards: CreditCard[]
  onSubmit: (values: RecordFormState) => void
  isSubmitting: boolean
  submitLabel: string
}) {
  const [form, setForm] = useState<RecordFormState>(initial)

  const set = <K extends keyof RecordFormState>(key: K, val: RecordFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const isExpense = form.type === 'Expense'

  // Auto-calcular monto desde ítems cuando hay al menos uno
  const itemsTotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0
      const price = parseInt(item.unitPrice.replace(/\D/g, '')) || 0
      const disc = parseInt(item.discount || '0') || 0
      return sum + Math.round(Math.max(0, qty * price - disc))
    }, 0)
  }, [form.items])

  useEffect(() => {
    if (isExpense && form.items.length > 0) {
      setForm((prev) => ({ ...prev, amount: String(Math.round(itemsTotal)) }))
    }
  }, [itemsTotal, isExpense])

  // Limpiar ítems al cambiar a ingreso
  const handleTypeChange = (type: RecordType) => {
    if (type !== 'Expense') {
      setForm((prev) => ({ ...prev, type, items: [] }))
    } else {
      set('type', type)
    }
  }

  const amountIsFromItems = isExpense && form.items.length > 0

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '1', unitPrice: '' }],
    }))
  }

  const removeItem = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }))
  }

  const updateItem = (idx: number, field: keyof InvoiceItemRow, value: string) => {
    setForm((prev) => {
      const items = [...prev.items]
      items[idx] = { ...items[idx], [field]: value }
      return { ...prev, items }
    })
  }

  const valid =
    form.amount !== '' &&
    parseInt(form.amount) > 0 &&
    form.month >= 1 &&
    form.month <= 12 &&
    form.categoryId !== '' &&
    form.creditCardId !== ''

  return (
    <div className='flex flex-col gap-4'>
      {/* Tipo */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm font-medium text-text-main'>Tipo</label>
        <div className='relative'>
          <select
            value={form.type}
            onChange={(e) => handleTypeChange(e.target.value as RecordType)}
            className='w-full h-10 appearance-none rounded-xl border border-secondary-200 px-3 pr-9 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white'
          >
            {RECORD_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none' />
        </div>
      </div>

      {/* Monto */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm font-medium text-text-main'>
          Monto
          {amountIsFromItems && (
            <span className='ml-1.5 text-xs text-text-muted font-normal'>(calculado desde ítems)</span>
          )}
        </label>
        <CurrencyInput
          value={form.amount}
          onChange={(val) => set('amount', val)}
          placeholder='0'
          readOnly={amountIsFromItems}
          className={`h-10 w-full rounded-xl border px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${amountIsFromItems ? 'bg-secondary-50 border-secondary-200 text-text-muted cursor-default' : 'border-secondary-200 bg-white'}`}
        />
      </div>

      {/* Mes */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm font-medium text-text-main'>Mes</label>
        <div className='relative'>
          <select
            value={form.month}
            onChange={(e) => set('month', parseInt(e.target.value))}
            className='w-full h-10 appearance-none rounded-xl border border-secondary-200 px-3 pr-9 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white'
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none' />
        </div>
      </div>

      {/* Categoría */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm font-medium text-text-main'>Categoría</label>
        <div className='relative'>
          <select
            value={form.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            className='w-full h-10 appearance-none rounded-xl border border-secondary-200 px-3 pr-9 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white'
          >
            <option value=''>Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none' />
        </div>
      </div>

      {/* Método de pago */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm font-medium text-text-main'>Método de pago</label>
        <div className='relative'>
          <select
            value={form.creditCardId}
            onChange={(e) => set('creditCardId', e.target.value)}
            className='w-full h-10 appearance-none rounded-xl border border-secondary-200 px-3 pr-9 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white'
          >
            <option value=''>Selecciona un método de pago</option>
            {creditCards.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ···· {c.lastFourDigits}</option>
            ))}
          </select>
          <ChevronDown size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none' />
        </div>
      </div>

      {/* Descripción */}
      <div className='flex flex-col gap-1.5'>
        <label className='text-sm font-medium text-text-main'>Descripción <span className='text-text-muted font-normal'>(opcional)</span></label>
        <input
          type='text'
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder='Ej: Sueldo de enero'
          className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
        />
      </div>

      {/* Ítems — solo cuando es Gasto */}
      {isExpense && (
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium text-text-main'>Ítems <span className='text-text-muted font-normal'>(opcional)</span></label>
            <button
              type='button'
              onClick={addItem}
              className='flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors'
            >
              <Plus size={13} /> Agregar ítem
            </button>
          </div>

          {form.items.length > 0 && (
            <div className='flex flex-col gap-2'>
              {/* Header */}
              <div className='grid grid-cols-[1fr_68px_80px_24px] gap-1.5 px-1'>
                <span className='text-[10px] font-semibold text-text-muted uppercase tracking-wide'>Nombre</span>
                <span className='text-[10px] font-semibold text-text-muted uppercase tracking-wide text-center'>Cant.</span>
                <span className='text-[10px] font-semibold text-text-muted uppercase tracking-wide text-right'>P. Unit.</span>
                <span />
              </div>
              {form.items.map((item, idx) => {
                const qty = parseFloat(item.quantity) || 0
                const price = parseInt(item.unitPrice.replace(/\D/g, '')) || 0
                const disc = parseInt(item.discount || '0') || 0
                const rowTotal = Math.max(0, qty * price - disc)
                return (
                  <div key={idx} className='flex flex-col gap-1'>
                    <div className='grid grid-cols-[1fr_68px_80px_24px] gap-1.5 items-center'>
                      <input
                        type='text'
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        placeholder='Descripción'
                        className='h-8 rounded-lg border border-secondary-200 px-2 text-xs text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all'
                      />
                      <input
                        type='number'
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        min='0'
                        step='any'
                        className='h-8 rounded-lg border border-secondary-200 px-2 text-xs text-text-main text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all'
                      />
                      <CurrencyInput
                        value={item.unitPrice}
                        onChange={(val) => updateItem(idx, 'unitPrice', val)}
                        placeholder='0'
                        className='h-8 w-full rounded-lg border border-secondary-200 px-2 text-xs text-text-main text-right placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all'
                      />
                      <button
                        type='button'
                        onClick={() => removeItem(idx)}
                        className='w-6 h-6 flex items-center justify-center rounded-md hover:bg-danger/10 text-danger/50 hover:text-danger transition-colors'
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {rowTotal > 0 && (
                      <div className='flex justify-end items-center gap-2 pr-8'>
                        {disc > 0 && (
                          <span className='text-xs text-green-600 font-medium'>-{formatCurrency(disc)}</span>
                        )}
                        <span className='text-xs font-bold text-text-main'>= {formatCurrency(rowTotal)}</span>
                      </div>
                    )}
                  </div>
                )
              })}

              <div className='flex justify-between items-center pt-1 border-t border-secondary-100'>
                <span className='text-xs text-text-muted'>Total ítems</span>
                <span className='text-sm font-bold text-text-main'>{formatCurrency(itemsTotal)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onSubmit(form)}
        disabled={isSubmitting || !valid}
        className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1'
      >
        {isSubmitting ? 'Guardando...' : submitLabel}
      </button>
    </div>
  )
}

/* ── Página principal ── */
export default function Registros() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [records, setRecords] = useState<FinanceRecord[]>([])

  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)

  type ModalMode = 'create' | 'edit' | null
  type CreateStep = 'choice' | 'form'

  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [createStep, setCreateStep] = useState<CreateStep>('choice')
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [formInitial, setFormInitial] = useState<RecordFormState>(EMPTY_FORM)

  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Carga inicial ── */
  useEffect(() => {
    fiscalYearsService.getAll().then((years) => {
      const sorted = [...years].sort((a, b) => b.year - a.year)
      setFiscalYears(sorted)
      if (sorted.length > 0) setSelectedYearId(sorted[0].id)
    }).catch(() => {})
    categoriesService.getAll().then(setCategories).catch(() => {})
    creditCardsService.getAll().then(setCreditCards).catch(() => {})
  }, [])

  /* ── Cargar registros al cambiar de año ── */
  useEffect(() => {
    if (!selectedYearId) { setRecords([]); return }
    setIsLoadingRecords(true)
    recordsService.getByYear(selectedYearId)
      .then(setRecords)
      .catch(() => toast.error('Error al cargar registros'))
      .finally(() => setIsLoadingRecords(false))
  }, [selectedYearId])

  /* ── Filtrado ── */
  const filtered = useMemo(() => {
    if (selectedMonth === null) return records
    return records.filter((r) => r.month === selectedMonth)
  }, [records, selectedMonth])

  /* ── Resumen ── */
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const totalIncome = filtered.filter((r) => isIncome(r.type)).reduce((s, r) => s + r.amount, 0)
    const totalExpenses = filtered.filter((r) => r.type === 'Expense').reduce((s, r) => s + r.amount, 0)
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses }
  }, [filtered])

  /* ── Agrupación por mes ── */
  const grouped = useMemo(() => {
    if (selectedMonth !== null) return null
    const map = new Map<number, FinanceRecord[]>()
    for (const r of filtered) {
      if (!map.has(r.month)) map.set(r.month, [])
      map.get(r.month)!.push(r)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [filtered, selectedMonth])

  /* ── Handlers de modal ── */
  const openCreate = () => {
    setFormInitial(EMPTY_FORM)
    setCreateStep('choice')
    setModalMode('create')
  }

  const openEdit = (record: FinanceRecord) => {
    setEditingRecord(record)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingRecord(null)
    setCreateStep('choice')
    setFormInitial(EMPTY_FORM)
  }

  /* ── Scan de factura ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona una imagen válida')
      return
    }

    setIsScanning(true)
    try {
      toast.info('Analizando factura con IA...')
      const parsed = await invoiceService.scan(file)

      const scannedInitial: RecordFormState = {
        type: 'Expense',
        amount: parsed.amount ? String(Math.round(parsed.amount)) : '',
        month: new Date().getMonth() + 1,
        description: parsed.description || '',
        categoryId: '',
        creditCardId: '',
        items: (parsed.items ?? []).map((it) => ({
          name: it.name,
          quantity: String(it.quantity),
          unitPrice: String(Math.round(it.unitPrice)),
          discount: it.discount ? String(it.discount) : undefined,
        })),
      }
      setFormInitial(scannedInitial)
      toast.success('Factura analizada correctamente')
    } catch {
      toast.error('No se pudo escanear. Ingresa los datos manualmente.')
      setFormInitial({ ...EMPTY_FORM, type: 'Expense' })
    } finally {
      setIsScanning(false)
      setCreateStep('form')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /* ── CRUD ── */
  const handleCreate = async (form: RecordFormState) => {
    if (!selectedYearId) return
    setIsSubmitting(true)
    try {
      const payload: CreateRecordPayload = {
        type: form.type,
        amount: parseInt(form.amount),
        month: form.month,
        fiscalYearId: selectedYearId,
        description: form.description || undefined,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        creditCardId: form.creditCardId ? parseInt(form.creditCardId) : null,
        items: form.items.length > 0 ? form.items.map((it) => {
          const qty = parseFloat(it.quantity) || 0
          const price = parseInt(it.unitPrice.replace(/\D/g, '')) || 0
          const disc = parseInt(it.discount || '0') || 0
          return {
            name: it.name,
            quantity: qty,
            unitPrice: price,
            totalPrice: Math.max(0, Math.round(qty * price) - disc),
          }
        }) : undefined,
      }
      await recordsService.create(payload)
      const updated = await recordsService.getByYear(selectedYearId)
      setRecords(updated)
      toast.success('Registro agregado')
      closeModal()
    } catch {
      toast.error('Error al agregar registro')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (form: RecordFormState) => {
    if (!editingRecord) return
    setIsSubmitting(true)
    try {
      const payload: UpdateRecordPayload = {
        type: form.type,
        amount: parseInt(form.amount),
        month: form.month,
        description: form.description || undefined,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        creditCardId: form.creditCardId ? parseInt(form.creditCardId) : null,
      }
      await recordsService.update(editingRecord.id, payload)
      if (selectedYearId) {
        const updated = await recordsService.getByYear(selectedYearId)
        setRecords(updated)
      }
      toast.success('Registro actualizado')
      closeModal()
    } catch {
      toast.error('Error al actualizar registro')
    } finally {
      setIsSubmitting(false)
    }
  }

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id)
      setTimeout(() => setPendingDeleteId(null), 3000)
      return
    }
    setPendingDeleteId(null)
    try {
      await recordsService.delete(id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      toast.success('Registro eliminado')
    } catch {
      toast.error('Error al eliminar registro')
    }
  }

  /* ── Fila de registro ── */
  const RecordRow = ({ record }: { record: FinanceRecord }) => {
    const income = isIncome(record.type)
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className='flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-secondary-50 group transition-colors'
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${income ? 'bg-success/10' : 'bg-danger/10'}`}>
          {income
            ? <ArrowUpCircle size={18} className='text-success' />
            : <ArrowDownCircle size={18} className='text-danger' />
          }
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-sm font-medium text-text-main truncate'>
              {record.description || RECORD_TYPE_LABELS[record.type]}
            </span>
            {record.category && (
              <span className='inline-flex items-center gap-1 text-[11px] font-medium bg-primary/8 text-primary px-2 py-0.5 rounded-full'>
                <Tag size={10} />
                {record.category.name}
              </span>
            )}
            {record.creditCard && (
              <span className='inline-flex items-center gap-1 text-[11px] font-medium bg-secondary-100 text-secondary-500 px-2 py-0.5 rounded-full'>
                ···· {record.creditCard.lastFourDigits}
              </span>
            )}
          </div>
          <div className='flex items-center gap-2 mt-0.5'>
            <span className='text-xs text-text-muted'>{MONTHS[record.month - 1]}</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${income ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {RECORD_TYPE_LABELS[record.type]}
            </span>
          </div>
        </div>

        <span className={`text-sm font-bold flex-shrink-0 ${income ? 'text-success' : 'text-danger'}`}>
          {income ? '+' : '-'}{formatCurrency(record.amount)}
        </span>

        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
          <button
            onClick={() => openEdit(record)}
            className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors'
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
              pendingDeleteId === record.id
                ? 'bg-danger text-white'
                : 'hover:bg-danger/10 text-danger'
            }`}
          >
            {pendingDeleteId === record.id ? <CheckCircle size={13} /> : <Trash2 size={13} />}
          </button>
        </div>
      </motion.div>
    )
  }

  const selectedYear = fiscalYears.find((y) => y.id === selectedYearId)

  const editInitial: RecordFormState = editingRecord
    ? {
        type: editingRecord.type,
        amount: String(editingRecord.amount),
        month: editingRecord.month,
        description: editingRecord.description ?? '',
        categoryId: editingRecord.category ? String(editingRecord.category.id) : '',
        creditCardId: editingRecord.creditCard ? String(editingRecord.creditCard.id) : '',
        items: (editingRecord.items ?? []).map((i) => ({
          name: i.name,
          quantity: String(i.quantity),
          unitPrice: String(Math.round(i.unitPrice)),
        })),
      }
    : EMPTY_FORM

  /* ── Pantalla de elección: scan o manual ── */
  const ChoiceStep = () => (
    <div className='flex flex-col gap-4'>
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileChange}
        accept='image/*'
        capture='environment'
        className='hidden'
      />

      {/* Zona de scan */}
      <motion.button
        type='button'
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
        whileHover={!isScanning ? { scale: 1.01 } : {}}
        whileTap={!isScanning ? { scale: 0.99 } : {}}
        className={`w-full h-32 border-2 rounded-2xl flex flex-col items-center justify-center transition-all relative overflow-hidden ${
          isScanning
            ? 'border-primary/40 bg-primary/5 cursor-wait'
            : 'border-dashed border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary'
        }`}
      >
        {isScanning ? (
          <div className='flex flex-col items-center gap-2'>
            <Loader2 size={32} className='text-primary animate-spin' />
            <span className='text-sm font-medium text-primary'>Analizando factura...</span>
          </div>
        ) : (
          <div className='flex flex-col items-center gap-2'>
            <div className='w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center'>
              <ScanLine size={24} className='text-primary' />
            </div>
            <div className='text-center'>
              <span className='text-sm font-semibold text-primary block'>Escanear factura</span>
              <span className='text-xs text-text-muted mt-0.5 block'>Toma o sube una foto</span>
            </div>
          </div>
        )}
      </motion.button>

      {/* Divisor */}
      <div className='flex items-center gap-3'>
        <div className='flex-1 h-px bg-secondary-200' />
        <span className='text-xs font-medium text-text-muted uppercase tracking-wider'>o</span>
        <div className='flex-1 h-px bg-secondary-200' />
      </div>

      {/* Manual */}
      <button
        onClick={() => setCreateStep('form')}
        className='w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-secondary-200 text-sm font-medium text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all'
      >
        <Edit3 size={16} />
        Ingresar manualmente
      </button>
    </div>
  )

  return (
    <BaseLayout titleHeader='Registros'>
      <p className='text-sm text-text-muted -mt-2 mb-1'>
        Visualiza y gestiona tus ingresos y gastos por año fiscal.
      </p>

      {/* ── Selector de año + botón ── */}
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='flex items-center gap-2'>
          <CalendarDays size={16} className='text-text-muted' />
          <div className='relative'>
            <select
              value={selectedYearId ?? ''}
              onChange={(e) => {
                setSelectedYearId(e.target.value ? parseInt(e.target.value) : null)
                setSelectedMonth(null)
              }}
              className='h-9 appearance-none rounded-xl border border-secondary-200 bg-white pl-3 pr-8 text-sm font-medium text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
            >
              <option value=''>— Selecciona un año —</option>
              {fiscalYears.map((y) => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
            <ChevronDown size={13} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none' />
          </div>
          {fiscalYears.length === 0 && (
            <span className='text-xs text-text-muted'>No tienes años fiscales. Agrégalos en Configuración.</span>
          )}
        </div>

        <button
          onClick={openCreate}
          disabled={!selectedYearId}
          className='flex items-center gap-2 bg-text-main text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-secondary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
        >
          <Plus size={16} />
          Agregar registro
        </button>
      </div>

      {selectedYearId && (
        <>
          {/* ── Resumen ── */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <SummaryCard label='Ingresos' amount={totalIncome} icon={TrendingUp} color='text-success' bg='bg-success/10' />
            <SummaryCard label='Gastos' amount={totalExpenses} icon={TrendingDown} color='text-danger' bg='bg-danger/10' />
            <SummaryCard
              label='Balance'
              amount={balance}
              icon={Wallet}
              color={balance >= 0 ? 'text-primary' : 'text-danger'}
              bg={balance >= 0 ? 'bg-primary/10' : 'bg-danger/10'}
            />
          </div>

          {/* ── Filtro por mes ── */}
          <div className='flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar'>
            <button
              onClick={() => setSelectedMonth(null)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                selectedMonth === null
                  ? 'bg-text-main text-white'
                  : 'bg-white border border-secondary-200 text-text-muted hover:border-primary hover:text-primary'
              }`}
            >
              Todos
            </button>
            {MONTHS.map((m, i) => (
              <button
                key={i}
                onClick={() => setSelectedMonth(i + 1)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  selectedMonth === i + 1
                    ? 'bg-text-main text-white'
                    : 'bg-white border border-secondary-200 text-text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* ── Lista ── */}
          <div className='bg-white rounded-2xl border border-secondary-100 overflow-hidden'>
            {isLoadingRecords ? (
              <div className='py-16 flex items-center justify-center'>
                <div className='w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin' />
              </div>
            ) : filtered.length === 0 ? (
              <div className='py-16 flex flex-col items-center justify-center gap-2 text-center'>
                <Wallet size={32} className='text-secondary-200' />
                <p className='text-sm font-medium text-text-muted'>
                  {selectedMonth !== null
                    ? `Sin registros en ${MONTHS[selectedMonth - 1]}`
                    : `Sin registros para ${selectedYear?.year}`}
                </p>
                <p className='text-xs text-secondary-300'>Usa el botón "Agregar registro" para comenzar</p>
              </div>
            ) : grouped ? (
              <div className='divide-y divide-secondary-50'>
                {grouped.map(([month, recs]) => (
                  <div key={month}>
                    <div className='px-5 py-2.5 bg-secondary-50/60'>
                      <span className='text-xs font-semibold text-text-muted uppercase tracking-wide'>{MONTHS[month - 1]}</span>
                      <span className='ml-2 text-xs text-secondary-400'>{recs.length} registro{recs.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className='px-3 py-1'>
                      <AnimatePresence>
                        {recs.map((r) => <RecordRow key={r.id} record={r} />)}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='px-3 py-2'>
                <AnimatePresence>
                  {filtered.map((r) => <RecordRow key={r.id} record={r} />)}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modales ── */}
      <AnimatePresence>
        {modalMode === 'create' && (
          <Modal
            title={createStep === 'choice' ? 'Agregar registro' : 'Nuevo registro'}
            onClose={closeModal}
          >
            {createStep === 'choice' ? (
              <ChoiceStep />
            ) : (
              <RecordForm
                initial={formInitial}
                categories={categories}
                creditCards={creditCards}
                onSubmit={handleCreate}
                isSubmitting={isSubmitting}
                submitLabel='Guardar registro'
              />
            )}
          </Modal>
        )}

        {modalMode === 'edit' && editingRecord && (
          <Modal title='Editar registro' onClose={closeModal}>
            <RecordForm
              key={editingRecord.id}
              initial={editInitial}
              categories={categories}
              creditCards={creditCards}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              submitLabel='Actualizar registro'
            />
          </Modal>
        )}
      </AnimatePresence>
    </BaseLayout>
  )
}
