import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Pencil, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { BaseLayout } from '@/components/shared/base-layout'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { categoriesService, type Category } from '@/services/categories'
import { budgetsService, type Budget } from '@/services/budgets'
import { toast } from 'react-toastify'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

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

/* ── Tarjeta de presupuesto ── */
function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: Budget
  onEdit: (b: Budget) => void
  onDelete: (id: number) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pct = budget.monthlyLimit > 0 ? Math.min(100, Math.round((budget.spent / budget.monthlyLimit) * 100)) : 0
  const isOver = budget.spent > budget.monthlyLimit
  const isWarning = !isOver && pct >= 80

  const barColor = isOver ? 'bg-danger' : isWarning ? 'bg-amber-400' : 'bg-primary'
  const textColor = isOver ? 'text-danger' : isWarning ? 'text-amber-600' : 'text-text-muted'

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      setConfirmDelete(false)
      onDelete(budget.id)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className={`bg-white rounded-2xl border p-5 ${isOver ? 'border-danger/30' : 'border-secondary-100'}`}>
      <div className='flex items-start justify-between gap-3 mb-3'>
        <div>
          <div className='flex items-center gap-2'>
            <p className='text-sm font-semibold text-text-main'>
              {budget.category?.name ?? 'Sin categoría'}
            </p>
            {isOver && (
              <span className='inline-flex items-center gap-1 text-[11px] font-medium text-danger bg-danger/10 px-2 py-0.5 rounded-full'>
                <AlertTriangle size={10} /> Excedido
              </span>
            )}
            {isWarning && (
              <span className='inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full'>
                <AlertTriangle size={10} /> Cerca del límite
              </span>
            )}
          </div>
          <p className='text-xs text-text-muted mt-0.5'>Límite mensual: {fmt(budget.monthlyLimit)}</p>
        </div>
        <div className='flex items-center gap-1 flex-shrink-0'>
          <button
            onClick={() => onEdit(budget)}
            className='w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-secondary-100 transition-colors'
            title='Editar presupuesto'
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDeleteClick}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              confirmDelete ? 'bg-danger text-white' : 'text-danger hover:bg-danger/10'
            }`}
            title={confirmDelete ? 'Confirmar eliminación' : 'Eliminar presupuesto'}
          >
            {confirmDelete ? <CheckCircle size={13} /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className='h-2 bg-secondary-100 rounded-full overflow-hidden'>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <div className='flex items-center justify-between mt-1.5'>
        <p className={`text-xs font-medium ${textColor}`}>
          {fmt(budget.spent)} gastado
        </p>
        <p className='text-xs text-text-muted'>
          {isOver
            ? `${fmt(budget.spent - budget.monthlyLimit)} sobre el límite`
            : `${fmt(budget.monthlyLimit - budget.spent)} disponible · ${pct}%`}
        </p>
      </div>
      <AnimatePresence>
        {confirmDelete && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='text-[11px] text-danger font-medium mt-1'
          >
            ¿Confirmar? Se eliminará el presupuesto.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Página principal ── */
export default function Presupuesto() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  // Modal nuevo/editar
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formCategory, setFormCategory] = useState<string>('')
  const [formLimit, setFormLimit] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* ── Carga inicial ── */
  useEffect(() => {
    Promise.all([
      fiscalYearsService.getAll(),
      categoriesService.getAll(),
    ]).then(([years, cats]) => {
      const sorted = [...years].sort((a, b) => b.year - a.year)
      setFiscalYears(sorted)
      if (sorted.length > 0) setSelectedYearId(sorted[0].id)
      setCategories(cats)
    }).catch(() => {})
  }, [])

  /* ── Carga de presupuestos (año + mes) ── */
  useEffect(() => {
    if (!selectedYearId) { setLoading(false); return }
    setLoading(true)
    budgetsService.getByYear(selectedYearId, selectedMonth)
      .then(setBudgets)
      .catch(() => toast.error('Error al cargar presupuestos'))
      .finally(() => setLoading(false))
  }, [selectedYearId, selectedMonth])

  /* ── Categorías sin presupuesto aún (para el selector del modal) ── */
  const usedCategoryIds = useMemo(
    () => new Set(budgets.map((b) => b.category?.id ?? null)),
    [budgets]
  )
  const availableCategories = useMemo(
    () => categories.filter((c) => !usedCategoryIds.has(c.id)),
    [categories, usedCategoryIds]
  )

  /* ── Resumen global del mes ── */
  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)

  /* ── Handlers ── */
  const openCreate = () => {
    setEditingBudget(null)
    setFormCategory(availableCategories.length > 0 ? String(availableCategories[0].id) : '')
    setFormLimit('')
    setShowModal(true)
  }

  const openEdit = (b: Budget) => {
    setEditingBudget(b)
    setFormCategory(b.category ? String(b.category.id) : '')
    setFormLimit(String(Math.round(b.monthlyLimit)))
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false); setEditingBudget(null)
    setFormCategory(''); setFormLimit('')
  }

  const handleSubmit = async () => {
    if (!formLimit || !selectedYearId) return
    const limit = parseFloat(formLimit)
    if (isNaN(limit) || limit <= 0) { toast.error('Límite inválido'); return }

    setSubmitting(true)
    try {
      if (editingBudget) {
        const updated = await budgetsService.update(editingBudget.id, limit)
        // Re-fetch to get correct spent value
        const fresh = await budgetsService.getByYear(selectedYearId, selectedMonth)
        setBudgets(fresh)
        void updated
        toast.success('Presupuesto actualizado')
      } else {
        await budgetsService.create({
          fiscalYearId: selectedYearId,
          categoryId: formCategory ? parseInt(formCategory) : null,
          monthlyLimit: limit,
        })
        const fresh = await budgetsService.getByYear(selectedYearId, selectedMonth)
        setBudgets(fresh)
        toast.success('Presupuesto creado')
      }
      closeModal()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar el presupuesto')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await budgetsService.delete(id)
      setBudgets((prev) => prev.filter((b) => b.id !== id))
      toast.success('Presupuesto eliminado')
    } catch {
      toast.error('Error al eliminar el presupuesto')
    }
  }

  const canCreate = availableCategories.length > 0 || !budgets.some((b) => b.category === null)

  return (
    <BaseLayout titleHeader='Presupuesto'>
      <p className='text-sm text-text-muted -mt-2 mb-4'>
        Límites mensuales por categoría. El gasto se calcula automáticamente de tus registros.
      </p>

      {/* ── Selectores año + botón ── */}
      <div className='flex items-center gap-3 mb-4 flex-wrap'>
        <select
          value={selectedYearId ?? ''}
          onChange={(e) => setSelectedYearId(Number(e.target.value))}
          className='h-9 rounded-xl border border-secondary-200 px-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
        >
          {fiscalYears.map((y) => (
            <option key={y.id} value={y.id}>{y.year}</option>
          ))}
        </select>
        {canCreate && (
          <button
            onClick={openCreate}
            className='flex items-center gap-1.5 bg-text-main text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-secondary-800 transition-colors'
          >
            <Plus size={15} />
            Nuevo presupuesto
          </button>
        )}
      </div>

      {/* ── Filtro por mes ── */}
      <div className='flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mb-5'>
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

      {/* ── Resumen total del mes ── */}
      {budgets.length > 0 && (
        <div className='bg-white rounded-2xl border border-secondary-100 p-5 mb-5'>
          <p className='text-xs text-text-muted font-medium mb-2'>
            Resumen de {MONTHS[selectedMonth - 1]}
          </p>
          <div className='flex items-end justify-between gap-2 mb-2'>
            <span className='text-2xl font-bold text-text-main'>{fmt(totalSpent)}</span>
            <span className='text-sm text-text-muted mb-0.5'>de {fmt(totalLimit)} presupuestado</span>
          </div>
          <div className='h-2 bg-secondary-100 rounded-full overflow-hidden'>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${totalSpent > totalLimit ? 'bg-danger' : 'bg-primary'}`}
            />
          </div>
        </div>
      )}

      {/* ── Lista de presupuestos ── */}
      {loading ? (
        <div className='flex justify-center py-12'>
          <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
        </div>
      ) : budgets.length === 0 ? (
        <div className='bg-white rounded-2xl border border-secondary-100 p-12 text-center'>
          <Target size={36} className='text-secondary-300 mx-auto mb-3' />
          <p className='text-text-muted text-sm'>No hay presupuestos configurados para este año.</p>
          <p className='text-xs text-secondary-300 mt-1'>Agrega un presupuesto por categoría para comenzar.</p>
        </div>
      ) : (
        <div className='flex flex-col gap-3 max-w-2xl'>
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {showModal && (
          <Modal
            title={editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            onClose={closeModal}
          >
            <div className='flex flex-col gap-4'>
              {!editingBudget && (
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium text-text-main'>Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className='h-10 rounded-xl border border-secondary-200 px-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  >
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {!budgets.some((b) => b.category === null) && (
                      <option value=''>Sin categoría</option>
                    )}
                  </select>
                </div>
              )}
              {editingBudget && (
                <div className='bg-secondary-50 rounded-xl px-4 py-3 text-sm text-text-muted'>
                  Categoría: <span className='font-medium text-text-main'>{editingBudget.category?.name ?? 'Sin categoría'}</span>
                </div>
              )}
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Límite mensual</label>
                <CurrencyInput
                  value={formLimit}
                  onChange={setFormLimit}
                  placeholder='0'
                  className='h-10 rounded-xl border border-secondary-200 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formLimit}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {submitting ? 'Guardando...' : editingBudget ? 'Actualizar' : 'Crear presupuesto'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </BaseLayout>
  )
}
