import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat2, Plus, Pencil, Trash2, X, CheckCircle, CalendarDays, Tag, Loader2, SendHorizonal } from 'lucide-react'
import { BaseLayout } from '@/components/shared/base-layout'
import { categoriesService, type Category } from '@/services/categories'
import { creditCardsService, type CreditCard } from '@/services/creditCards'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { recurringExpensesService, type RecurringExpense, type CreateRecurringExpensePayload } from '@/services/recurringExpenses'
import { recordsService } from '@/services/records'
import { toast } from 'react-toastify'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const ORDINALS: Record<number, string> = {
  1: '1°', 2: '2°', 3: '3°', 4: '4°', 5: '5°', 6: '6°', 7: '7°', 8: '8°', 9: '9°', 10: '10°',
  11: '11°', 12: '12°', 13: '13°', 14: '14°', 15: '15°', 16: '16°', 17: '17°', 18: '18°', 19: '19°', 20: '20°',
  21: '21°', 22: '22°', 23: '23°', 24: '24°', 25: '25°', 26: '26°', 27: '27°', 28: '28°', 29: '29°', 30: '30°', 31: '31°',
}

/* ── Input de moneda ── */
function CurrencyInput({ value, onChange, placeholder = '0', className }: {
  value: string; onChange: (val: string) => void; placeholder?: string; className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const numericOnly = value.replace(/\D/g, '')
  const formatted = numericOnly ? new Intl.NumberFormat('es-CO').format(parseInt(numericOnly)) : ''

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [onChange])

  return (
    <div className='relative flex items-center w-full'>
      <span className='absolute left-2.5 text-text-muted pointer-events-none select-none text-xs z-10'>$</span>
      <input
        ref={inputRef}
        type='text'
        inputMode='numeric'
        value={formatted}
        placeholder={placeholder}
        style={{ paddingLeft: '1.625rem' }}
        className={`w-full ${className ?? ''}`}
        onChange={handleChange}
      />
    </div>
  )
}

/* ── Modal genérico ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className='relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6'
      >
        <div className='flex items-center justify-between mb-5'>
          <h3 className='text-lg font-semibold text-text-main'>{title}</h3>
          <button onClick={onClose} className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary-100 text-secondary-500 transition-colors'>
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

/* ── Fila de gasto fijo ── */
function ExpenseRow({
  expense,
  onEdit,
  onDelete,
  onRegister,
  isDeleting,
}: {
  expense: RecurringExpense
  onEdit: (e: RecurringExpense) => void
  onDelete: (id: number) => void
  onRegister: (e: RecurringExpense) => void
  isDeleting: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      setConfirmDelete(false)
      onDelete(expense.id)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className='flex items-center gap-3 px-5 py-4 group hover:bg-secondary-50 transition-colors'>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-text-main truncate'>{expense.name}</p>
        <div className='flex items-center gap-3 mt-0.5 flex-wrap'>
          {expense.category && (
            <span className='inline-flex items-center gap-1 text-xs text-text-muted'>
              <Tag size={10} />
              {expense.category.name}
            </span>
          )}
          {expense.dayOfMonth && (
            <span className='inline-flex items-center gap-1 text-xs text-text-muted'>
              <CalendarDays size={10} />
              Día {ORDINALS[expense.dayOfMonth] ?? expense.dayOfMonth}
            </span>
          )}
          {expense.description && (
            <span className='text-xs text-text-muted truncate'>{expense.description}</span>
          )}
        </div>
      </div>
      <span className='text-sm font-semibold text-text-main flex-shrink-0'>{fmt(expense.amount)}</span>
      <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0'>
        {/* Registrar en mes */}
        <button
          onClick={() => onRegister(expense)}
          className='w-7 h-7 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors'
          title='Registrar en un mes'
        >
          <SendHorizonal size={13} />
        </button>
        <button
          onClick={() => onEdit(expense)}
          className='w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-secondary-100 transition-colors'
          title='Editar'
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
            confirmDelete ? 'bg-danger text-white' : 'text-danger hover:bg-danger/10'
          }`}
          title={isDeleting ? 'Eliminando…' : confirmDelete ? 'Confirmar' : 'Eliminar'}
        >
          {isDeleting
            ? <Loader2 size={13} className='animate-spin' />
            : confirmDelete
            ? <CheckCircle size={13} />
            : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  )
}

/* ── Página principal ── */
export default function Recurrentes() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)

  // Modal crear/editar gasto fijo
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null)
  const [formName, setFormName] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDay, setFormDay] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Modal registrar en mes
  const [registeringExpense, setRegisteringExpense] = useState<RecurringExpense | null>(null)
  const [regYearId, setRegYearId] = useState<string>('')
  const [regMonth, setRegMonth] = useState<string>(String(new Date().getMonth() + 1))
  const [regCreditCardId, setRegCreditCardId] = useState<string>('')
  const [registering, setRegistering] = useState(false)

  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      recurringExpensesService.getAll(),
      categoriesService.getAll(),
      fiscalYearsService.getAll(),
      creditCardsService.getAll(),
    ]).then(([exp, cats, years, cards]) => {
      setExpenses(exp)
      setCategories(cats)
      const sorted = [...years].sort((a, b) => b.year - a.year)
      setFiscalYears(sorted)
      if (sorted.length > 0) setRegYearId(String(sorted[0].id))
      setCreditCards(cards)
    }).catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  const totalMonthly = expenses.reduce((s, e) => s + e.amount, 0)

  /* ── Handlers crear/editar ── */
  const openCreate = () => {
    setEditingExpense(null)
    setFormName(''); setFormAmount(''); setFormDay(''); setFormDescription(''); setFormCategory('')
    setShowModal(true)
  }

  const openEdit = (e: RecurringExpense) => {
    setEditingExpense(e)
    setFormName(e.name)
    setFormAmount(String(Math.round(e.amount)))
    setFormDay(e.dayOfMonth ? String(e.dayOfMonth) : '')
    setFormDescription(e.description ?? '')
    setFormCategory(e.category ? String(e.category.id) : '')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false); setEditingExpense(null)
  }

  const buildPayload = (): CreateRecurringExpensePayload => ({
    name: formName.trim(),
    amount: parseFloat(formAmount),
    dayOfMonth: formDay ? parseInt(formDay) : null,
    description: formDescription.trim() || null,
    categoryId: formCategory ? parseInt(formCategory) : null,
  })

  const handleSubmit = async () => {
    if (!formName.trim() || !formAmount) return
    const amount = parseFloat(formAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('Monto inválido'); return }

    setSubmitting(true)
    try {
      if (editingExpense) {
        const updated = await recurringExpensesService.update(editingExpense.id, buildPayload())
        setExpenses((prev) => prev.map((e) => e.id === updated.id ? updated : e))
        toast.success('Gasto fijo actualizado')
      } else {
        const created = await recurringExpensesService.create(buildPayload())
        setExpenses((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        toast.success('Gasto fijo agregado')
      }
      closeModal()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await recurringExpensesService.delete(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      toast.success('Gasto fijo eliminado')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  /* ── Handlers registrar en mes ── */
  const openRegister = (e: RecurringExpense) => {
    setRegisteringExpense(e)
    setRegMonth(String(new Date().getMonth() + 1))
    setRegCreditCardId('')
    // Mantener el año seleccionado (ya inicializado al más reciente)
  }

  const closeRegister = () => {
    setRegisteringExpense(null)
    setRegCreditCardId('')
  }

  const handleRegister = async () => {
    if (!registeringExpense || !regYearId || !regCreditCardId) return
    setRegistering(true)
    try {
      await recordsService.create({
        type: 'Expense',
        amount: Math.round(registeringExpense.amount),
        month: parseInt(regMonth),
        fiscalYearId: parseInt(regYearId),
        description: registeringExpense.name,
        categoryId: registeringExpense.category?.id ?? null,
        creditCardId: parseInt(regCreditCardId),
      })
      const yearLabel = fiscalYears.find((y) => String(y.id) === regYearId)?.year ?? ''
      toast.success(`"${registeringExpense.name}" registrado en ${MONTHS[parseInt(regMonth) - 1]} ${yearLabel}`)
      closeRegister()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al registrar el gasto')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <BaseLayout titleHeader='Gastos Fijos'>
      <p className='text-sm text-text-muted -mt-2 mb-4'>
        Catálogo de gastos que se repiten cada mes. Úsalos como referencia al registrar.
      </p>

      <div className='flex items-center gap-3 mb-6'>
        <button
          onClick={openCreate}
          className='flex items-center gap-1.5 bg-text-main text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-secondary-800 transition-colors'
        >
          <Plus size={15} />
          Agregar gasto fijo
        </button>
      </div>

      {loading ? (
        <div className='flex justify-center py-12'>
          <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
        </div>
      ) : expenses.length === 0 ? (
        <div className='bg-white rounded-2xl border border-secondary-100 p-12 text-center'>
          <Repeat2 size={36} className='text-secondary-300 mx-auto mb-3' />
          <p className='text-text-muted text-sm'>No hay gastos fijos registrados.</p>
          <p className='text-xs text-secondary-300 mt-1'>Agrega arriendos, suscripciones y servicios recurrentes.</p>
        </div>
      ) : (
        <div className='max-w-2xl'>
          {/* Resumen */}
          <div className='bg-white rounded-2xl border border-secondary-100 px-5 py-4 mb-3 flex items-center justify-between'>
            <div>
              <p className='text-xs text-text-muted font-medium'>Total mensual estimado</p>
              <p className='text-2xl font-bold text-text-main'>{fmt(totalMonthly)}</p>
            </div>
            <span className='text-xs text-text-muted'>{expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}</span>
          </div>

          {/* Lista */}
          <div className='bg-white rounded-2xl border border-secondary-100 overflow-hidden divide-y divide-secondary-50'>
            {expenses.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                onEdit={openEdit}
                onDelete={handleDelete}
                onRegister={openRegister}
                isDeleting={deletingId === e.id}
              />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {/* ── Modal crear/editar ── */}
        {showModal && (
          <Modal
            title={editingExpense ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
            onClose={closeModal}
          >
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Nombre</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder='Ej: Arriendo, Netflix, Gym...'
                  className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  autoFocus
                />
              </div>
              <div className='flex gap-3'>
                <div className='flex flex-col gap-1.5 flex-1'>
                  <label className='text-sm font-medium text-text-main'>Monto</label>
                  <CurrencyInput
                    value={formAmount}
                    onChange={setFormAmount}
                    placeholder='0'
                    className='h-10 rounded-xl border border-secondary-200 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  />
                </div>
                <div className='flex flex-col gap-1.5 w-24'>
                  <label className='text-sm font-medium text-text-main'>Día <span className='text-text-muted font-normal text-xs'>(opc)</span></label>
                  <input
                    type='number'
                    min={1}
                    max={31}
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    placeholder='1-31'
                    className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  />
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Categoría <span className='text-text-muted font-normal'>(opcional)</span></label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className='h-10 rounded-xl border border-secondary-200 px-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                >
                  <option value=''>Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Descripción <span className='text-text-muted font-normal'>(opcional)</span></label>
                <input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder='Nota adicional'
                  className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formName.trim() || !formAmount}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {submitting ? 'Guardando...' : editingExpense ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </Modal>
        )}

        {/* ── Modal registrar en mes ── */}
        {registeringExpense && (
          <Modal title='Registrar en gastos' onClose={closeRegister}>
            <div className='flex flex-col gap-4'>
              {/* Resumen del gasto fijo */}
              <div className='bg-secondary-50 rounded-xl px-4 py-3'>
                <p className='text-sm font-semibold text-text-main'>{registeringExpense.name}</p>
                <p className='text-lg font-bold text-text-main mt-0.5'>{fmt(registeringExpense.amount)}</p>
                {registeringExpense.category && (
                  <p className='text-xs text-text-muted mt-0.5 flex items-center gap-1'>
                    <Tag size={10} /> {registeringExpense.category.name}
                  </p>
                )}
              </div>

              {/* Año */}
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Año fiscal</label>
                <select
                  value={regYearId}
                  onChange={(e) => setRegYearId(e.target.value)}
                  className='h-10 rounded-xl border border-secondary-200 px-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                >
                  {fiscalYears.length === 0 && (
                    <option value=''>Sin años fiscales</option>
                  )}
                  {fiscalYears.map((y) => (
                    <option key={y.id} value={y.id}>{y.year}</option>
                  ))}
                </select>
              </div>

              {/* Mes */}
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Mes</label>
                <select
                  value={regMonth}
                  onChange={(e) => setRegMonth(e.target.value)}
                  className='h-10 rounded-xl border border-secondary-200 px-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Método de pago */}
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Método de pago</label>
                <select
                  value={regCreditCardId}
                  onChange={(e) => setRegCreditCardId(e.target.value)}
                  className='h-10 rounded-xl border border-secondary-200 px-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                >
                  <option value=''>Selecciona un método de pago</option>
                  {creditCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.lastFourDigits ? ` ···· ${c.lastFourDigits}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRegister}
                disabled={registering || !regYearId || !regCreditCardId}
                className='w-full h-10 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
              >
                {registering
                  ? <><Loader2 size={15} className='animate-spin' /> Registrando...</>
                  : <><SendHorizonal size={15} /> Registrar gasto</>
                }
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </BaseLayout>
  )
}
