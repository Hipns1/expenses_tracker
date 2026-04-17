import { useState, useEffect, useRef } from 'react'
import { BaseLayout } from '@/components/shared/base-layout'
import { categoriesService, type Category } from '@/services/categories'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { creditCardsService, type CreditCard, type PaymentMethodType, PAYMENT_METHOD_LABELS } from '@/services/creditCards'
import { categoryGroupsService, type CategoryGroup } from '@/services/categoryGroups'
import { toast } from 'react-toastify'
import {
  Plus, Trash2, Tag, CreditCard as CreditCardIcon, CalendarDays, X,
  CheckCircle, Pencil, Building2, Smartphone, Banknote, Loader2,
  Layers, Target,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

/* ── Helpers de tipo de pago ── */
const PAYMENT_METHOD_OPTIONS: { type: PaymentMethodType; label: string; icon: React.ElementType }[] = [
  { type: 'Card', label: 'Tarjeta', icon: CreditCardIcon },
  { type: 'BankAccount', label: 'Cuenta bancaria', icon: Building2 },
  { type: 'DigitalWallet', label: 'Billetera digital', icon: Smartphone },
  { type: 'Cash', label: 'Efectivo', icon: Banknote },
]

function PaymentTypeIcon({ type, size = 14 }: { type: PaymentMethodType; size?: number }) {
  const opt = PAYMENT_METHOD_OPTIONS.find((o) => o.type === type)
  if (!opt) return <CreditCardIcon size={size} />
  const Icon = opt.icon
  return <Icon size={size} />
}

const showDigitsForType = (type: PaymentMethodType) => type === 'Card' || type === 'BankAccount'

/* ── Tipos de modal ── */
type ModalType = 'category' | 'creditCard' | 'year' | 'editCategory' | 'editCreditCard' | 'createGroup' | 'editGroup' | null

/* ── Selector de tipo de método de pago ── */
function PaymentTypeSelector({ value, onChange }: { value: PaymentMethodType; onChange: (v: PaymentMethodType) => void }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-sm font-medium text-text-main'>Tipo de método</label>
      <div className='grid grid-cols-2 gap-2'>
        {PAYMENT_METHOD_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isSelected = value === opt.type
          return (
            <button
              key={opt.type}
              type='button'
              onClick={() => onChange(opt.type)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-secondary-200 text-text-muted hover:border-secondary-300 hover:bg-secondary-50'
              }`}
            >
              <Icon size={15} />
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Modal simple ── */
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

/* ── Sección reutilizable ── */
function Section({
  icon: Icon, title, subtitle, onAdd, addLabel, isEmpty, emptyText, children,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  onAdd?: () => void
  addLabel?: string
  isEmpty: boolean
  emptyText: string
  children?: React.ReactNode
}) {
  return (
    <div className='bg-white rounded-2xl border border-secondary-100 overflow-hidden'>
      <div className='flex items-center justify-between px-6 py-4 border-b border-secondary-100'>
        <div className='flex items-center gap-2.5'>
          <div className='w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center'>
            <Icon size={16} className='text-primary' />
          </div>
          <div>
            <h2 className='font-semibold text-text-main'>{title}</h2>
            {subtitle && <p className='text-xs text-text-muted mt-0.5'>{subtitle}</p>}
          </div>
        </div>
        {onAdd && addLabel && (
          <button
            onClick={onAdd}
            className='flex items-center gap-1.5 bg-text-main text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-secondary-800 transition-colors'
          >
            <Plus size={14} />
            {addLabel}
          </button>
        )}
      </div>
      <div className='px-6 py-4'>
        {isEmpty ? (
          <p className='text-sm text-text-muted py-2'>{emptyText}</p>
        ) : (
          <ul className='space-y-2'>{children}</ul>
        )}
      </div>
    </div>
  )
}

/* ── Fila de ítem genérica ── */
function ItemRow({
  label, sublabel, icon, onEdit, onDelete, deleteWarning, isDeleting = false,
}: {
  label: string
  sublabel?: string
  icon?: React.ReactNode
  onEdit?: () => void
  onDelete?: () => void
  deleteWarning?: string
  isDeleting?: boolean
}) {
  const [pending, setPending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDeleteClick = () => {
    if (!pending) {
      setPending(true)
      timerRef.current = setTimeout(() => setPending(false), 3000)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      setPending(false)
      onDelete?.()
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <li className='flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary-50 group transition-colors'>
      <div className='flex items-center gap-2.5 min-w-0'>
        {icon && <span className='text-text-muted flex-shrink-0'>{icon}</span>}
        <div className='flex flex-col min-w-0'>
          <div>
            <span className='text-sm font-medium text-text-main'>{label}</span>
            {sublabel && <span className='text-xs text-text-muted ml-2'>{sublabel}</span>}
          </div>
          <AnimatePresence>
            {pending && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='text-[11px] text-danger font-medium mt-0.5'
              >
                {deleteWarning}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className={`ml-3 flex-shrink-0 flex items-center gap-1 transition-all ${isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {onEdit && (
          <button
            onClick={onEdit}
            className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors'
            title='Editar'
          >
            <Pencil size={13} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
              pending ? 'opacity-100 bg-danger text-white hover:bg-danger/90' : 'hover:bg-danger/10 text-danger'
            }`}
            title={isDeleting ? 'Eliminando…' : pending ? 'Confirmar eliminación' : 'Eliminar'}
          >
            {isDeleting
              ? <Loader2 size={13} className='animate-spin' />
              : pending
              ? <CheckCircle size={13} />
              : <Trash2 size={13} />}
          </button>
        )}
      </div>
    </li>
  )
}

/* ── Fila de Categoría con Ideal ── */
function CategoryRow({
  category, onEditName, onSaveIdeal, onDelete, isDeleting,
}: {
  category: Category
  onEditName: () => void
  onSaveIdeal: (v: number) => Promise<void>
  onDelete: () => void
  isDeleting: boolean
}) {
  const [editingIdeal, setEditingIdeal] = useState(false)
  const [idealValue, setIdealValue] = useState('')
  const [isSavingIdeal, setIsSavingIdeal] = useState(false)

  const [pendingDelete, setPendingDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDeleteClick = () => {
    if (!pendingDelete) {
      setPendingDelete(true)
      timerRef.current = setTimeout(() => setPendingDelete(false), 3000)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      setPendingDelete(false)
      onDelete()
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const startEditIdeal = () => {
    setEditingIdeal(true)
    setIdealValue(category.monthlyIdeal && category.monthlyIdeal > 0 ? String(Math.round(category.monthlyIdeal)) : '')
  }

  const commitEditIdeal = async () => {
    setEditingIdeal(false)
    const parsed = parseInt(idealValue) || 0
    if (parsed === (category.monthlyIdeal ?? 0)) return

    setIsSavingIdeal(true)
    try {
      await onSaveIdeal(parsed)
    } finally {
      setIsSavingIdeal(false)
    }
  }

  const displayFormattedIdeal = idealValue ? new Intl.NumberFormat('es-CO').format(parseInt(idealValue) || 0) : ''

  return (
    <li className='flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-1 px-3 rounded-xl hover:bg-secondary-50 group transition-colors gap-2'>
      <div className='flex flex-col min-w-0'>
        <span className='text-sm font-medium text-text-main'>{category.name}</span>
        <AnimatePresence>
          {pendingDelete && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='text-[11px] text-danger font-medium'
            >
              ¿Confirmar? Los registros perderán esta categoría.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className='flex items-center gap-3 self-end sm:self-auto'>
        {/* IDEAL */}
        <div className='flex items-center gap-1.5' title='Ideal mensual de gasto'>
          <Target size={12} className='text-secondary-400' />
          {editingIdeal ? (
            <input
              autoFocus
              type='text'
              value={displayFormattedIdeal}
              onChange={(e) => setIdealValue(e.target.value.replace(/\D/g, ''))}
              onBlur={commitEditIdeal}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEditIdeal(); if (e.key === 'Escape') setEditingIdeal(false) }}
              className='w-24 sm:w-28 h-7 rounded-lg border border-primary px-2 text-[13px] text-right text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20'
              placeholder='0'
            />
          ) : (
            <button
              onClick={!category.isSystem ? startEditIdeal : undefined}
              disabled={category.isSystem || isSavingIdeal}
              className={`flex items-center gap-1.5 h-7 px-2 rounded-lg border border-dashed border-secondary-200 text-[13px] transition-colors group/ideal ${
                !category.isSystem ? 'hover:border-primary cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
            >
              {isSavingIdeal ? (
                <Loader2 size={11} className='animate-spin text-text-muted' />
              ) : category.monthlyIdeal && category.monthlyIdeal > 0 ? (
                <span className='font-medium text-text-main group-hover/ideal:text-primary transition-colors'>
                  {fmt(category.monthlyIdeal)}
                </span>
              ) : (
                <span className='text-secondary-400'>Sin ideal</span>
              )}
              {!category.isSystem && (
                <Pencil size={10} className='text-secondary-400 opacity-0 group-hover/ideal:opacity-100 transition-opacity' />
              )}
            </button>
          )}
        </div>

        {/* ACCIONES */}
        <div className={`flex-shrink-0 flex items-center gap-1 transition-all ${isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {!category.isSystem && (
            <button
              onClick={onEditName}
              className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors'
              title='Editar nombre'
            >
              <Pencil size={13} />
            </button>
          )}
          {!category.isSystem && (
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                pendingDelete ? 'opacity-100 bg-danger text-white hover:bg-danger/90' : 'hover:bg-danger/10 text-danger'
              }`}
              title={isDeleting ? 'Eliminando…' : pendingDelete ? 'Confirmar eliminación' : 'Eliminar'}
            >
              {isDeleting
                ? <Loader2 size={13} className='animate-spin' />
                : pendingDelete
                ? <CheckCircle size={13} />
                : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

/* ── Input simple para los modales ── */
function ModalInput({
  label, value, onChange, placeholder, type = 'text', maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; maxLength?: number
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-sm font-medium text-text-main'>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main placeholder:text-secondary-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
      />
    </div>
  )
}

/* ── Tarjeta de grupo de categorías ── */
function GroupCard({ group, categories, onEdit, onDelete }: {
  group: CategoryGroup; categories: Category[]
  onEdit: (g: CategoryGroup) => void; onDelete: (id: number) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Categorías que pertenecen a este grupo
  const assignedCats = categories.filter((c) => group.categoryIds.includes(c.id))

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      setConfirmDelete(false)
      onDelete(group.id)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <li className='py-3 px-3 rounded-xl hover:bg-secondary-50 group transition-colors'>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-sm font-semibold text-text-main'>{group.name}</span>
        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all'>
          <button
            onClick={() => onEdit(group)}
            className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors'
            title='Editar grupo'
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDeleteClick}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              confirmDelete ? 'bg-danger text-white' : 'hover:bg-danger/10 text-danger'
            }`}
            title={confirmDelete ? 'Confirmar eliminación' : 'Eliminar grupo'}
          >
            {confirmDelete ? <CheckCircle size={13} /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {assignedCats.map((c) => (
          <span key={c.id} className='inline-flex items-center text-xs font-medium bg-primary/8 text-primary px-2 py-0.5 rounded-full'>
            {c.name}
          </span>
        ))}
        {assignedCats.length === 0 && (
          <span className='text-xs text-text-muted italic'>Sin categorías asignadas</span>
        )}
      </div>
      <AnimatePresence>
        {confirmDelete && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='text-[11px] text-danger font-medium mt-1.5'
          >
            ¿Confirmar? El grupo se elimina; las categorías se conservan.
          </motion.p>
        )}
      </AnimatePresence>
    </li>
  )
}

/* ── Página principal ── */
export default function Configuracion() {
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [groups, setGroups] = useState<CategoryGroup[]>([])

  // Form fields - crear
  const [categoryName, setCategoryName] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardDigits, setCardDigits] = useState('')
  const [cardType, setCardType] = useState<PaymentMethodType>('Card')
  const [yearValue, setYearValue] = useState(String(new Date().getFullYear()))

  // Form fields - editar
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [editCardName, setEditCardName] = useState('')
  const [editCardDigits, setEditCardDigits] = useState('')
  const [editCardType, setEditCardType] = useState<PaymentMethodType>('Card')

  // Form fields - grupos
  const [groupName, setGroupName] = useState('')
  const [groupCategoryIds, setGroupCategoryIds] = useState<number[]>([])
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null)

  /* ── Carga inicial ── */
  useEffect(() => {
    categoriesService.getAll().then(setCategories).catch(() => {})
    fiscalYearsService.getAll().then(setFiscalYears).catch(() => {})
    creditCardsService.getAll().then(setCreditCards).catch(() => {})
    categoryGroupsService.getAll().then(setGroups).catch(() => {})
  }, [])

  // IDs de categorías asignadas a grupos
  const assignedCategoryIds = groups.flatMap((g) => g.categoryIds)

  const closeModal = () => {
    setOpenModal(null)
    setCategoryName(''); setCardName(''); setCardDigits(''); setCardType('Card')
    setYearValue(String(new Date().getFullYear()))
    setEditingCategory(null); setEditCategoryName('')
    setEditingCard(null); setEditCardName(''); setEditCardDigits(''); setEditCardType('Card')
    setGroupName(''); setGroupCategoryIds([]); setEditingGroup(null)
  }

  const openEditCategory = (c: Category) => {
    setEditingCategory(c); setEditCategoryName(c.name); setOpenModal('editCategory')
  }

  const openEditCard = (c: CreditCard) => {
    setEditingCard(c); setEditCardName(c.name)
    setEditCardDigits(c.lastFourDigits ?? ''); setEditCardType(c.type)
    setOpenModal('editCreditCard')
  }

  const openCreateGroup = () => {
    setEditingGroup(null); setGroupName(''); setGroupCategoryIds([])
    setOpenModal('createGroup')
  }

  const openEditGroup = (g: CategoryGroup) => {
    setEditingGroup(g); setGroupName(g.name); setGroupCategoryIds([...g.categoryIds])
    setOpenModal('editGroup')
  }

  /* ── Handlers categorías ── */
  const handleAddCategory = async () => {
    if (!categoryName.trim()) return
    setIsSubmitting(true)
    try {
      const created = await categoriesService.create(categoryName.trim())
      setCategories((prev) => [...prev, created])
      toast.success('Categoría agregada'); closeModal()
    } catch { toast.error('Error al agregar categoría')
    } finally { setIsSubmitting(false) }
  }

  const handleEditCategoryName = async () => {
    if (!editingCategory || !editCategoryName.trim()) return
    setIsSubmitting(true)
    try {
      const updated = await categoriesService.update(editingCategory.id, editCategoryName.trim(), editingCategory.monthlyIdeal)
      setCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      toast.success('Categoría actualizada'); closeModal()
    } catch { toast.error('Error al actualizar categoría')
    } finally { setIsSubmitting(false) }
  }

  const handleSaveCategoryIdeal = async (category: Category, ideal: number) => {
    const idealVal = ideal > 0 ? ideal : undefined
    const updated = await categoriesService.update(category.id, category.name, idealVal)
    setCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    toast.success('Ideal guardado')
  }

  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null)

  const handleDeleteCategory = async (id: number) => {
    setDeletingCategoryId(id)
    try {
      await categoriesService.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('Categoría eliminada')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al eliminar categoría')
    } finally { setDeletingCategoryId(null) }
  }

  /* ── Handlers tarjetas ── */
  const handleAddCard = async () => {
    if (!cardName.trim()) return
    if (showDigitsForType(cardType) && cardDigits.length > 0 && cardDigits.length !== 4) {
      toast.error('Los dígitos deben ser exactamente 4'); return
    }
    setIsSubmitting(true)
    try {
      const digits = showDigitsForType(cardType) && cardDigits.length === 4 ? cardDigits : undefined
      const created = await creditCardsService.create(cardName.trim(), cardType, digits)
      setCreditCards((prev) => [...prev, created])
      toast.success('Método de pago agregado'); closeModal()
    } catch { toast.error('Error al agregar método de pago')
    } finally { setIsSubmitting(false) }
  }

  const handleEditCard = async () => {
    if (!editingCard || !editCardName.trim()) return
    if (showDigitsForType(editCardType) && editCardDigits.length > 0 && editCardDigits.length !== 4) {
      toast.error('Los dígitos deben ser exactamente 4'); return
    }
    setIsSubmitting(true)
    try {
      const digits = showDigitsForType(editCardType) && editCardDigits.length === 4 ? editCardDigits : undefined
      const updated = await creditCardsService.update(editingCard.id, editCardName.trim(), editCardType, digits)
      setCreditCards((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      toast.success('Método de pago actualizado'); closeModal()
    } catch { toast.error('Error al actualizar método de pago')
    } finally { setIsSubmitting(false) }
  }

  const handleDeleteCard = async (id: number) => {
    setDeletingCardId(id)
    try {
      await creditCardsService.delete(id)
      setCreditCards((prev) => prev.filter((c) => c.id !== id))
      toast.success('Método de pago eliminado')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al eliminar método de pago')
    } finally { setDeletingCardId(null) }
  }

  /* ── Handler años ── */
  const handleAddYear = async () => {
    const year = parseInt(yearValue)
    if (!year || year < 2000 || year > 2100) return
    setIsSubmitting(true)
    try {
      const created = await fiscalYearsService.create(year)
      setFiscalYears((prev) => [...prev, created].sort((a, b) => b.year - a.year))
      toast.success(`Año ${year} agregado`); closeModal()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al agregar año')
    } finally { setIsSubmitting(false) }
  }

  /* ── Handlers grupos ── */
  const toggleGroupCategory = (categoryId: number) => {
    setGroupCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return
    setIsSubmitting(true)
    try {
        if (editingGroup) {
            const updated = await categoryGroupsService.update(editingGroup.id, groupName.trim(), groupCategoryIds)
            setGroups((prev) => prev.map(g => g.id === updated.id ? updated : g))
            toast.success('Grupo actualizado')
        } else {
            const created = await categoryGroupsService.create(groupName.trim(), groupCategoryIds)
            setGroups((prev) => [...prev, created])
            toast.success('Grupo creado')
        }
        closeModal()
    } catch {
        toast.error('Error al guardar grupo')
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleDeleteGroup = async (id: number) => {
    try {
        await categoryGroupsService.delete(id)
        setGroups((prev) => prev.filter((g) => g.id !== id))
        toast.success('Grupo eliminado')
    } catch {
        toast.error('Error al eliminar grupo')
    }
  }

  // Categorías disponibles para agregar a un grupo (no en otros grupos, o las del grupo que se está editando)
  const categoriesForGroupModal = () => {
    return categories.filter((c) => !c.isSystem && (
      !assignedCategoryIds.includes(c.id) ||
      (editingGroup?.categoryIds.includes(c.id))
    ))
  }

  return (
    <BaseLayout titleHeader='Configuración'>
      <p className='text-sm text-text-muted -mt-2 mb-2'>
        Administra categorías, métodos de pago, años fiscales y grupos de análisis.
      </p>

      <div className='flex flex-col gap-5 max-w-3xl'>
        {/* ── Categorías ── */}
        <Section
          icon={Tag}
          title='Categorías'
          onAdd={() => setOpenModal('category')}
          addLabel='Añadir'
          isEmpty={categories.length === 0}
          emptyText='Sin categorías'
        >
          {categories.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              onEditName={() => openEditCategory(c)}
              onSaveIdeal={(v) => handleSaveCategoryIdeal(c, v)}
              onDelete={() => handleDeleteCategory(c.id)}
              isDeleting={deletingCategoryId === c.id}
            />
          ))}
        </Section>

        {/* ── Grupos de categorías ── */}
        <Section
          icon={Layers}
          title='Grupos de categorías'
          subtitle='Agrupa categorías para ver subtotales en Panorama'
          onAdd={openCreateGroup}
          addLabel='Nuevo grupo'
          isEmpty={groups.length === 0}
          emptyText='Sin grupos. Crea grupos para ver subtotales en la vista Panorama.'
        >
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              categories={categories}
              onEdit={openEditGroup}
              onDelete={handleDeleteGroup}
            />
          ))}
        </Section>

        {/* ── Métodos de pago ── */}
        <Section
          icon={CreditCardIcon}
          title='Métodos de Pago'
          onAdd={() => setOpenModal('creditCard')}
          addLabel='Añadir'
          isEmpty={creditCards.length === 0}
          emptyText='Sin métodos de pago'
        >
          {creditCards.map((c) => (
            <ItemRow
              key={c.id}
              label={c.name}
              sublabel={c.lastFourDigits ? `···· ${c.lastFourDigits}` : PAYMENT_METHOD_LABELS[c.type]}
              icon={<PaymentTypeIcon type={c.type} size={13} />}
              onEdit={() => openEditCard(c)}
              onDelete={() => handleDeleteCard(c.id)}
              deleteWarning='¿Confirmar? Los registros con este método de pago lo perderán.'
              isDeleting={deletingCardId === c.id}
            />
          ))}
        </Section>

        {/* ── Años ── */}
        <Section
          icon={CalendarDays}
          title='Años Fiscales'
          onAdd={() => setOpenModal('year')}
          addLabel='Añadir año'
          isEmpty={fiscalYears.length === 0}
          emptyText='Sin años'
        >
          {fiscalYears.map((f) => (
            <ItemRow key={f.id} label={String(f.year)} />
          ))}
        </Section>
      </div>

      {/* ── Modales ── */}
      <AnimatePresence>
        {openModal === 'category' && (
          <Modal title='Nueva categoría' onClose={closeModal}>
            <div className='flex flex-col gap-4'>
              <ModalInput label='Nombre' value={categoryName} onChange={setCategoryName} placeholder='Ej: Alimentación' />
              <button
                onClick={handleAddCategory}
                disabled={isSubmitting || !categoryName.trim()}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Guardando...' : 'Guardar categoría'}
              </button>
            </div>
          </Modal>
        )}

        {openModal === 'creditCard' && (
          <Modal title='Nuevo método de pago' onClose={closeModal}>
            <div className='flex flex-col gap-4'>
              <PaymentTypeSelector value={cardType} onChange={(v) => { setCardType(v); setCardDigits('') }} />
              <ModalInput
                label='Nombre' value={cardName} onChange={setCardName}
                placeholder={cardType === 'Card' ? 'Ej: Visa Oro' : cardType === 'BankAccount' ? 'Ej: Bancolombia' : cardType === 'DigitalWallet' ? 'Ej: Nequi' : 'Efectivo'}
              />
              {showDigitsForType(cardType) && (
                <ModalInput
                  label='Últimos 4 dígitos (opcional)'
                  value={cardDigits}
                  onChange={(v) => setCardDigits(v.replace(/\D/g, '').slice(0, 4))}
                  placeholder='0000' maxLength={4}
                />
              )}
              <button
                onClick={handleAddCard}
                disabled={isSubmitting || !cardName.trim()}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Guardando...' : 'Guardar método de pago'}
              </button>
            </div>
          </Modal>
        )}

        {openModal === 'year' && (
          <Modal title='Añadir año fiscal' onClose={closeModal}>
            <div className='flex flex-col gap-4'>
              <ModalInput label='Año' value={yearValue} onChange={setYearValue} placeholder='2025' type='number' />
              <button
                onClick={handleAddYear}
                disabled={isSubmitting || !yearValue}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Guardando...' : 'Añadir año'}
              </button>
            </div>
          </Modal>
        )}

        {openModal === 'editCategory' && editingCategory && (
          <Modal title='Editar categoría' onClose={closeModal}>
            <div className='flex flex-col gap-4'>
              <ModalInput label='Nombre' value={editCategoryName} onChange={setEditCategoryName} placeholder='Ej: Alimentación' />
              <button
                onClick={handleEditCategoryName}
                disabled={isSubmitting || !editCategoryName.trim()}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </Modal>
        )}

        {openModal === 'editCreditCard' && editingCard && (
          <Modal title='Editar método de pago' onClose={closeModal}>
            <div className='flex flex-col gap-4'>
              <PaymentTypeSelector value={editCardType} onChange={(v) => { setEditCardType(v); setEditCardDigits('') }} />
              <ModalInput label='Nombre' value={editCardName} onChange={setEditCardName} placeholder='Ej: Visa Oro' />
              {showDigitsForType(editCardType) && (
                <ModalInput
                  label='Últimos 4 dígitos (opcional)'
                  value={editCardDigits}
                  onChange={(v) => setEditCardDigits(v.replace(/\D/g, '').slice(0, 4))}
                  placeholder='0000' maxLength={4}
                />
              )}
              <button
                onClick={handleEditCard}
                disabled={isSubmitting || !editCardName.trim()}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </Modal>
        )}

        {(openModal === 'createGroup' || openModal === 'editGroup') && (
          <Modal
            title={openModal === 'editGroup' ? 'Editar grupo' : 'Nuevo grupo'}
            onClose={closeModal}
          >
            <div className='flex flex-col gap-4'>
              <ModalInput
                label='Nombre del grupo'
                value={groupName}
                onChange={setGroupName}
                placeholder='Ej: Hogar, Servicios, Ocio...'
              />
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-text-main'>
                  Categorías
                  <span className='text-xs font-normal text-text-muted ml-1'>(solo las no asignadas a otro grupo)</span>
                </label>
                <div className='max-h-52 overflow-y-auto flex flex-col gap-0.5 pr-1'>
                  {categoriesForGroupModal().length === 0 ? (
                    <p className='text-xs text-text-muted py-3 px-2'>
                      No hay categorías disponibles. Las demás ya están en otro grupo.
                    </p>
                  ) : (
                    categoriesForGroupModal().map((c) => (
                      <label
                        key={c.id}
                        className='flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary-50 cursor-pointer transition-colors'
                      >
                        <input
                          type='checkbox'
                          checked={groupCategoryIds.includes(c.id)}
                          onChange={() => toggleGroupCategory(c.id)}
                          className='w-4 h-4 rounded accent-primary'
                        />
                        <span className='text-sm text-text-main'>{c.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <button
                onClick={handleSaveGroup}
                disabled={isSubmitting || !groupName.trim()}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Guardando...' : (openModal === 'editGroup' ? 'Guardar cambios' : 'Crear grupo')}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </BaseLayout>
  )
}
