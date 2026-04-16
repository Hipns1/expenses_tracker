import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Landmark, Plus, Trash2, ChevronDown, ChevronUp,
  CheckCircle, CircleDollarSign, Clock, X, TrendingDown
} from 'lucide-react'
import { BaseLayout } from '@/components/shared/base-layout'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { debtsService, type Debt } from '@/services/debts'
import { toast } from 'react-toastify'

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

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const STATUS_CONFIG = {
  Pending: { label: 'Pendiente', bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200',  dot: 'bg-red-400'  },
  Partial: { label: 'Parcial',   bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200', dot: 'bg-blue-400' },
  Paid:    { label: 'Pagado',    bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200',dot: 'bg-green-500'},
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

/* ── Tarjeta resumen ── */
function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className='bg-white rounded-2xl border border-secondary-100 p-5 flex items-center gap-4'>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className='text-xs text-text-muted font-medium'>{label}</p>
        <p className='text-lg font-bold text-text-main leading-tight'>{value}</p>
      </div>
    </div>
  )
}

/* ── Tarjeta de deuda ── */
function DebtCard({
  debt,
  onAddPayment,
  onDelete,
  onDeletePayment,
}: {
  debt: Debt
  onAddPayment: (d: Debt) => void
  onDelete: (id: number) => void
  onDeletePayment: (debt: Debt, paymentId: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cfg = STATUS_CONFIG[debt.status]
  const pct = Math.min(100, Math.round((debt.totalPaid / debt.amount) * 100))

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      setConfirmDelete(false)
      onDelete(debt.id)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className={`bg-white rounded-2xl border ${cfg.border} overflow-hidden`}>
      <div className='p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-base font-semibold text-text-main'>{debt.creditorName}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <p className='text-xs text-text-muted mt-0.5'>
              {MONTHS[debt.month - 1]}
              {debt.description && <span> · {debt.description}</span>}
            </p>
          </div>
          <div className='flex-shrink-0 text-right'>
            <p className='text-base font-bold text-text-main'>{fmt(debt.amount)}</p>
            {debt.status !== 'Paid' && (
              <p className='text-xs text-text-muted'>Por pagar: {fmt(debt.remaining)}</p>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        {debt.status !== 'Pending' && (
          <div className='mt-3'>
            <div className='h-1.5 bg-secondary-100 rounded-full overflow-hidden'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${debt.status === 'Paid' ? 'bg-green-500' : 'bg-primary'}`}
              />
            </div>
            <p className='text-xs text-text-muted mt-1'>{pct}% pagado · {fmt(debt.totalPaid)} de {fmt(debt.amount)}</p>
          </div>
        )}

        {/* Acciones */}
        <div className='flex items-center gap-2 mt-4'>
          {debt.status !== 'Paid' && (
            <button
              onClick={() => onAddPayment(debt)}
              className='flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors'
            >
              <CircleDollarSign size={13} />
              Registrar pago
            </button>
          )}
          {debt.payments.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className='flex items-center gap-1 text-xs text-text-muted hover:text-text-main transition-colors px-2 py-1.5'
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {debt.payments.length} {debt.payments.length === 1 ? 'pago' : 'pagos'}
            </button>
          )}
          <div className='ml-auto'>
            <button
              onClick={handleDeleteClick}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                confirmDelete ? 'bg-danger text-white' : 'text-danger hover:bg-danger/10'
              }`}
              title={confirmDelete ? 'Confirmar eliminación' : 'Eliminar deuda'}
            >
              {confirmDelete ? <CheckCircle size={13} /> : <Trash2 size={13} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {confirmDelete && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='text-[11px] text-danger font-medium mt-1'
            >
              ¿Confirmar? Se eliminará la deuda y todos sus pagos.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Pagos expandibles */}
      <AnimatePresence>
        {expanded && debt.payments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t border-secondary-100'
          >
            <div className='px-5 py-3 space-y-2'>
              <p className='text-xs font-semibold text-text-muted uppercase tracking-wide mb-2'>Pagos realizados</p>
              {debt.payments.map((p) => (
                <div key={p.id} className='flex items-center justify-between gap-3 group'>
                  <div>
                    <span className='text-sm font-medium text-text-main'>{fmt(p.amount)}</span>
                    {p.note && <span className='text-xs text-text-muted ml-2'>{p.note}</span>}
                    <p className='text-xs text-text-muted'>
                      {new Date(p.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeletePayment(debt, p.id)}
                    className='w-6 h-6 flex items-center justify-center rounded-lg text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0'
                    title='Eliminar pago'
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Página principal ── */
export default function Deudas() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const [showNewDebt, setShowNewDebt] = useState(false)
  const [newCreditorName, setNewCreditorName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newMonth, setNewMonth] = useState(String(new Date().getMonth() + 1))
  const [newDescription, setNewDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [payingDebt, setPayingDebt] = useState<Debt | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')

  useEffect(() => {
    fiscalYearsService.getAll().then((years) => {
      const sorted = [...years].sort((a, b) => b.year - a.year)
      setFiscalYears(sorted)
      if (sorted.length > 0) setSelectedYearId(sorted[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedYearId) { setLoading(false); return }
    setLoading(true)
    setSelectedMonth(null)
    debtsService.getAll(selectedYearId)
      .then(setDebts)
      .catch(() => toast.error('Error al cargar deudas'))
      .finally(() => setLoading(false))
  }, [selectedYearId])

  const filteredDebts = useMemo(() =>
    selectedMonth === null ? debts : debts.filter((d) => d.month === selectedMonth),
    [debts, selectedMonth]
  )

  const totalDebt    = filteredDebts.reduce((s, d) => s + d.amount, 0)
  const totalPaid    = filteredDebts.reduce((s, d) => s + d.totalPaid, 0)
  const totalPending = filteredDebts.reduce((s, d) => s + d.remaining, 0)

  const active = filteredDebts.filter((d) => d.status !== 'Paid')
  const paid   = filteredDebts.filter((d) => d.status === 'Paid')

  const closeNewDebt = () => {
    setShowNewDebt(false)
    setNewCreditorName(''); setNewAmount(''); setNewDescription('')
    setNewMonth(String(new Date().getMonth() + 1))
  }

  const handleCreateDebt = async () => {
    if (!newCreditorName.trim() || !newAmount || !selectedYearId) return
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('Monto inválido'); return }
    setSubmitting(true)
    try {
      const created = await debtsService.create({
        creditorName: newCreditorName.trim(),
        amount,
        month: parseInt(newMonth),
        fiscalYearId: selectedYearId,
        description: newDescription.trim() || undefined,
      })
      setDebts((prev) => [created, ...prev])
      toast.success('Deuda registrada')
      closeNewDebt()
    } catch {
      toast.error('Error al registrar la deuda')
    } finally {
      setSubmitting(false)
    }
  }

  const closePayment = () => { setPayingDebt(null); setPayAmount(''); setPayNote('') }

  const handleAddPayment = async () => {
    if (!payingDebt || !payAmount) return
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('Monto inválido'); return }
    setSubmitting(true)
    try {
      const updated = await debtsService.addPayment(payingDebt.id, amount, payNote.trim() || undefined)
      setDebts((prev) => prev.map((d) => d.id === updated.id ? updated : d))
      toast.success('Pago registrado')
      closePayment()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al registrar el pago')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await debtsService.delete(id)
      setDebts((prev) => prev.filter((d) => d.id !== id))
      toast.success('Deuda eliminada')
    } catch {
      toast.error('Error al eliminar la deuda')
    }
  }

  const handleDeletePayment = async (debt: Debt, paymentId: number) => {
    try {
      const updated = await debtsService.deletePayment(debt.id, paymentId)
      setDebts((prev) => prev.map((d) => d.id === updated.id ? updated : d))
      toast.success('Pago eliminado')
    } catch {
      toast.error('Error al eliminar el pago')
    }
  }

  return (
    <BaseLayout titleHeader='Deudas'>
      <p className='text-sm text-text-muted -mt-2 mb-4'>
        Dinero que debes a otras personas o entidades.
      </p>

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
        <button
          onClick={() => setShowNewDebt(true)}
          className='flex items-center gap-1.5 bg-text-main text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-secondary-800 transition-colors'
        >
          <Plus size={15} />
          Nueva deuda
        </button>
      </div>

      {/* ── Filtro por mes ── */}
      <div className='flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mb-5'>
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

      {filteredDebts.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6'>
          <SummaryCard label='Total adeudado'  value={fmt(totalDebt)}    icon={Landmark}      color='bg-red-100 text-red-600' />
          <SummaryCard label='Total pagado'    value={fmt(totalPaid)}    icon={CheckCircle}   color='bg-green-100 text-green-600' />
          <SummaryCard label='Por pagar'       value={fmt(totalPending)} icon={Clock}         color='bg-amber-100 text-amber-600' />
        </div>
      )}

      {loading ? (
        <div className='flex justify-center py-12'>
          <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className='bg-white rounded-2xl border border-secondary-100 p-12 text-center'>
          <TrendingDown size={36} className='text-secondary-300 mx-auto mb-3' />
          <p className='text-text-muted text-sm'>
            {selectedMonth !== null
              ? `Sin deudas en ${MONTHS[selectedMonth - 1]}.`
              : 'No hay deudas registradas para este año.'}
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-3 max-w-2xl'>
          {active.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onAddPayment={setPayingDebt}
              onDelete={handleDelete}
              onDeletePayment={handleDeletePayment}
            />
          ))}
          {paid.length > 0 && (
            <>
              {active.length > 0 && (
                <p className='text-xs font-semibold text-text-muted uppercase tracking-wide mt-2'>Pagadas</p>
              )}
              {paid.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onAddPayment={setPayingDebt}
                  onDelete={handleDelete}
                  onDeletePayment={handleDeletePayment}
                />
              ))}
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {showNewDebt && (
          <Modal title='Nueva deuda' onClose={closeNewDebt}>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Acreedor</label>
                <input
                  value={newCreditorName}
                  onChange={(e) => setNewCreditorName(e.target.value)}
                  placeholder='Persona o entidad que te prestó'
                  className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  autoFocus
                />
              </div>
              <div className='flex gap-3'>
                <div className='flex flex-col gap-1.5 flex-1'>
                  <label className='text-sm font-medium text-text-main'>Monto</label>
                  <CurrencyInput
                    value={newAmount}
                    onChange={setNewAmount}
                    placeholder='0'
                    className='h-10 rounded-xl border border-secondary-200 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-sm font-medium text-text-main'>Mes</label>
                  <select
                    value={newMonth}
                    onChange={(e) => setNewMonth(e.target.value)}
                    className='h-10 rounded-xl border border-secondary-200 px-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Descripción <span className='text-text-muted font-normal'>(opcional)</span></label>
                <input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder='Motivo o nota'
                  className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                />
              </div>
              <button
                onClick={handleCreateDebt}
                disabled={submitting || !newCreditorName.trim() || !newAmount}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {submitting ? 'Guardando...' : 'Registrar deuda'}
              </button>
            </div>
          </Modal>
        )}

        {payingDebt && (
          <Modal title={`Pago a ${payingDebt.creditorName}`} onClose={closePayment}>
            <div className='flex flex-col gap-4'>
              <div className='bg-secondary-50 rounded-xl px-4 py-3 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-text-muted'>Deuda total</span>
                  <span className='font-medium text-text-main'>{fmt(payingDebt.amount)}</span>
                </div>
                <div className='flex justify-between mt-1'>
                  <span className='text-text-muted'>Por pagar</span>
                  <span className='font-semibold text-red-600'>{fmt(payingDebt.remaining)}</span>
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Monto del pago</label>
                <CurrencyInput
                  value={payAmount}
                  onChange={setPayAmount}
                  placeholder={`Máx. ${fmt(payingDebt.remaining)}`}
                  className='h-10 rounded-xl border border-secondary-200 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-medium text-text-main'>Nota <span className='text-text-muted font-normal'>(opcional)</span></label>
                <input
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder='Ej: Cuota 1'
                  className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                />
              </div>
              <button
                onClick={handleAddPayment}
                disabled={submitting || !payAmount}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {submitting ? 'Guardando...' : 'Registrar pago'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </BaseLayout>
  )
}
