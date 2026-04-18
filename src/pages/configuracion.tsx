import { useState, useEffect, useRef } from 'react'
import { BaseLayout } from '@/components/shared/base-layout'
import { categoriesService, type Category } from '@/services/categories'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { creditCardsService, type CreditCard, type PaymentMethodType, PAYMENT_METHOD_LABELS } from '@/services/creditCards'
import { categoryGroupsService, type CategoryGroup } from '@/services/categoryGroups'
import { toast } from 'react-toastify'
import {
  Plus, Trash2, CreditCard as CreditCardIcon, CalendarDays, X,
  CheckCircle, Pencil, Building2, Smartphone, Banknote, Loader2,
  Layers, Target, ChevronDown, ChevronRight, Upload, Download, Paperclip
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
          <p className='text-sm text-text-muted py-2 text-center my-4'>{emptyText}</p>
        ) : (
          <div className='flex flex-col gap-3'>{children}</div>
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
          <div className='flex items-baseline'>
            <span className='text-sm font-medium text-text-main truncate'>{label}</span>
            {sublabel && <span className='text-[10px] text-text-muted ml-2 font-normal'>{sublabel}</span>}
          </div>
          <AnimatePresence>
            {pending && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='text-[10px] text-danger font-medium mt-0.5'
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
          >
            <Pencil size={12} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              pending ? 'bg-danger text-white hover:bg-danger/90' : 'hover:bg-danger/10 text-danger'
            }`}
          >
            {isDeleting ? <Loader2 size={12} className='animate-spin' /> : pending ? <CheckCircle size={12} /> : <Trash2 size={12} />}
          </button>
        )}
      </div>
    </li>
  )
}

/* ── Tarjeta de grupo con categorías anidadas ── */
function GroupCard({ group, categories, onEdit, onDelete, onAddCategory, onEditCategory, onDeleteCategory, deletingId }: {
  group: CategoryGroup; categories: Category[]
  onEdit: (g: CategoryGroup) => void; onDelete: (id: number) => void
  onAddCategory: (groupId: number) => void
  onEditCategory: (c: Category) => void
  onDeleteCategory: (id: number) => void
  deletingId: number | null
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const groupCats = categories.filter(c => c.categoryGroupId === group.id)

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    } else {
      onDelete(group.id)
      setConfirmDelete(false)
    }
  }

  return (
    <div className='bg-secondary-50/50 rounded-2xl border border-secondary-100 overflow-hidden transition-all hover:bg-white hover:shadow-sm'>
      <div className='flex items-center justify-between px-4 py-3 bg-white/50'>
        <div className='flex items-center gap-2 overflow-hidden'>
          <button onClick={() => setIsExpanded(!isExpanded)} className='text-secondary-400 hover:text-primary transition-colors'>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <span className='font-bold text-sm text-text-main truncate'>{group.name}</span>
          {group.monthlyIdeal && (
             <div className='flex items-center gap-1 text-primary flex-shrink-0 ml-1'>
                <Target size={12} />
                <span className='text-[11px] font-bold'>{fmt(group.monthlyIdeal)}</span>
             </div>
          )}
        </div>
        <div className='flex items-center gap-1'>
          <button
            onClick={() => onAddCategory(group.id)}
            className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors'
            title='Añadir categoría'
          >
            <Plus size={14} />
          </button>
          <div className='w-px h-4 bg-secondary-200 mx-0.5' />
          <button onClick={() => onEdit(group)} className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary-100 text-text-muted hover:text-primary transition-colors'>
            <Pencil size={13} />
          </button>
          {groupCats.length === 0 && (
            <button
              onClick={handleDeleteClick}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${confirmDelete ? 'bg-danger text-white' : 'hover:bg-danger/10 text-danger'}`}
              title='Eliminar grupo'
            >
              {confirmDelete ? <CheckCircle size={13} /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className='px-3 py-1 pb-3 space-y-0.5'
          >
            {groupCats.length === 0 ? (
              <p className='text-[11px] text-text-muted italic px-3 py-2'>Sin categorías</p>
            ) : (
              groupCats.map(c => (
                <ItemRow
                  key={c.id}
                  label={c.name}
                  onEdit={() => onEditCategory(c)}
                  onDelete={() => onDeleteCategory(c.id)}
                  deleteWarning='¿Confirmar? Se desvinculará de registros.'
                  isDeleting={deletingId === c.id}
                />
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Fila de año fiscal con adjunto ── */
function FiscalYearRow({
  year, isUploading, isDownloading,
  onUpload, onDownload, onRemoveAttachment,
}: {
  year: FiscalYear
  isUploading: boolean
  isDownloading: boolean
  onUpload: (file: File) => void
  onDownload: () => void
  onRemoveAttachment: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleRemoveClick = () => {
    if (!confirmRemove) {
      setConfirmRemove(true)
      timerRef.current = setTimeout(() => setConfirmRemove(false), 3000)
    } else {
      if (timerRef.current) clearTimeout(timerRef.current)
      setConfirmRemove(false)
      onRemoveAttachment()
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = ''
  }

  return (
    <li className='flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary-50 group transition-colors'>
      <div className='flex items-center gap-2.5 min-w-0'>
        <CalendarDays size={14} className='text-text-muted flex-shrink-0' />
        <div className='flex flex-col min-w-0'>
          <span className='text-sm font-medium text-text-main'>{year.year}</span>
          {year.hasAttachment && year.attachmentFileName && (
            <span className='text-[10px] text-text-muted truncate flex items-center gap-1 mt-0.5'>
              <Paperclip size={9} />
              {year.attachmentFileName}
            </span>
          )}
        </div>
      </div>
      <div className='ml-3 flex-shrink-0 flex items-center gap-1'>
        <input
          ref={inputRef}
          type='file'
          accept='.xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg'
          onChange={handleFileChange}
          className='hidden'
        />
        {year.hasAttachment ? (
          <>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              title='Descargar soporte'
              className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50'
            >
              {isDownloading ? <Loader2 size={12} className='animate-spin' /> : <Download size={12} />}
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              title='Reemplazar soporte'
              className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary-100 text-text-muted hover:text-primary transition-colors disabled:opacity-50'
            >
              {isUploading ? <Loader2 size={12} className='animate-spin' /> : <Upload size={12} />}
            </button>
            <button
              onClick={handleRemoveClick}
              title='Eliminar soporte'
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                confirmRemove ? 'bg-danger text-white' : 'hover:bg-danger/10 text-danger'
              }`}
            >
              {confirmRemove ? <CheckCircle size={12} /> : <Trash2 size={12} />}
            </button>
          </>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            title='Subir soporte'
            className='flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50'
          >
            {isUploading ? <Loader2 size={11} className='animate-spin' /> : <Upload size={11} />}
            Subir soporte
          </button>
        )}
      </div>
    </li>
  )
}

/* ── Input simple ── */
function ModalInput({ label, value, onChange, placeholder, type = 'text', maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-sm font-medium text-text-main'>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        maxLength={maxLength}
        className='h-10 w-full rounded-xl border border-secondary-200 px-3 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
      />
    </div>
  )
}

export default function Configuracion() {
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [groups, setGroups] = useState<CategoryGroup[]>([])

  // State
  const [modalData, setModalData] = useState({
    categoryName: '',
    groupId: 0,
    groupName: '',
    groupIdeal: '',
    cardName: '',
    cardDigits: '',
    cardType: 'Card' as PaymentMethodType,
    yearValue: String(new Date().getFullYear()),
  })

  const [editingItem, setEditingItem] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      categoriesService.getAll(),
      fiscalYearsService.getAll(),
      creditCardsService.getAll(),
      categoryGroupsService.getAll()
    ]).then(([c, f, cr, g]) => {
      setCategories(Array.isArray(c) ? c : [])
      setFiscalYears(Array.isArray(f) ? f : [])
      setCreditCards(Array.isArray(cr) ? cr : [])
      setGroups(Array.isArray(g) ? g : [])
    }).catch(() => {})
  }, [])

  const closeModal = () => {
    setOpenModal(null); setEditingItem(null)
    setModalData({ ...modalData, categoryName: '', groupName: '', groupIdeal: '', cardName: '', cardDigits: '', cardType: 'Card' })
  }

  /* ── Handlers Grupos ── */
  const handleSaveGroup = async () => {
    if (!modalData.groupName.trim()) return
    setIsSubmitting(true)
    const ideal = parseInt(modalData.groupIdeal.replace(/\D/g, '')) || 0
    try {
      if (editingItem) {
        const u = await categoryGroupsService.update(editingItem.id, modalData.groupName, undefined, ideal > 0 ? ideal : undefined)
        setGroups(prev => prev.map(g => g.id === u.id ? u : g))
        toast.success('Grupo actualizado')
      } else {
        const c = await categoryGroupsService.create(modalData.groupName, undefined, ideal > 0 ? ideal : undefined)
        setGroups(prev => [...prev, c])
        toast.success('Grupo creado')
      }
      closeModal()
    } catch { toast.error('Error al guardar grupo') } finally { setIsSubmitting(false) }
  }

  const handleDeleteGroup = async (id: number) => {
    try {
      await categoryGroupsService.delete(id)
      setGroups(prev => prev.filter(g => g.id !== id))
      // Refetch categories because they might have been moved
      categoriesService.getAll().then(setCategories)
      categoryGroupsService.getAll().then(setGroups)
      toast.success('Grupo eliminado')
    } catch { toast.error('Error al eliminar grupo') }
  }

  /* ── Handlers Categorias ── */
  const handleSaveCategory = async () => {
    if (!modalData.categoryName.trim()) return
    setIsSubmitting(true)
    try {
      if (editingItem) {
        const u = await categoriesService.update(editingItem.id, modalData.categoryName, editingItem.categoryGroupId)
        setCategories(prev => prev.map(c => c.id === u.id ? u : c))
        toast.success('Categoría actualizada')
      } else {
        const c = await categoriesService.create(modalData.categoryName, modalData.groupId)
        setCategories(prev => [...prev, c])
        toast.success('Categoría creada')
      }
      closeModal()
    } catch { toast.error('Error al guardar categoría') } finally { setIsSubmitting(false) }
  }

  const handleDeleteCategory = async (id: number) => {
    setDeletingId(id)
    try {
      await categoriesService.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success('Categoría eliminada')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al eliminar')
    } finally { setDeletingId(null) }
  }

  /* ── Handlers Otros ── */
  const handleAddYear = async () => {
    const y = parseInt(modalData.yearValue)
    if (!y || y < 2000) return
    setIsSubmitting(true)
    try {
      const c = await fiscalYearsService.create(y)
      setFiscalYears(prev => [...prev, c].sort((a,b)=>b.year-a.year))
      toast.success('Año agregado'); closeModal()
    } catch { toast.error('Error') } finally { setIsSubmitting(false) }
  }

  const handleSaveCard = async () => {
    if (!modalData.cardName.trim()) return
    setIsSubmitting(true)
    try {
        if (editingItem) {
            const u = await creditCardsService.update(editingItem.id, modalData.cardName, modalData.cardType, modalData.cardDigits || undefined)
            setCreditCards(prev => prev.map(c => c.id === u.id ? u : c))
        } else {
            const c = await creditCardsService.create(modalData.cardName, modalData.cardType, modalData.cardDigits || undefined)
            setCreditCards(prev => [...prev, c])
        }
        toast.success('Guardado'); closeModal()
    } catch { toast.error('Error') } finally { setIsSubmitting(false) }
  }

  const handleDeleteCard = async (id: number) => {
    try {
      await creditCardsService.delete(id)
      setCreditCards(prev => prev.filter(c => c.id !== id))
      toast.success('Método eliminado')
    } catch { toast.error('Error al prevenir orfanato') }
  }

  /* ── Handlers adjuntos de año fiscal ── */
  const [uploadingYearId, setUploadingYearId] = useState<number | null>(null)
  const [downloadingYearId, setDownloadingYearId] = useState<number | null>(null)

  const handleUploadAttachment = async (yearId: number, file: File) => {
    setUploadingYearId(yearId)
    try {
      const updated = await fiscalYearsService.uploadAttachment(yearId, file)
      setFiscalYears(prev => prev.map(y => y.id === yearId ? { ...y, hasAttachment: true, attachmentFileName: updated.attachmentFileName } : y))
      toast.success('Soporte subido')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al subir el archivo')
    } finally {
      setUploadingYearId(null)
    }
  }

  const handleDownloadAttachment = async (year: FiscalYear) => {
    setDownloadingYearId(year.id)
    try {
      const blob = await fiscalYearsService.downloadAttachment(year.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = year.attachmentFileName || `soporte-${year.year}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('No se pudo descargar')
    } finally {
      setDownloadingYearId(null)
    }
  }

  const handleRemoveAttachment = async (yearId: number) => {
    try {
      await fiscalYearsService.deleteAttachment(yearId)
      setFiscalYears(prev => prev.map(y => y.id === yearId ? { ...y, hasAttachment: false, attachmentFileName: null } : y))
      toast.success('Soporte eliminado')
    } catch {
      toast.error('Error al eliminar adjunto')
    }
  }

  return (
    <BaseLayout titleHeader='Configuración'>
      <div className='flex flex-col gap-6 max-w-4xl'>
        
        {/* ── GRUPOS Y CATEGORIAS ANIDADAS ── */}
        <Section
            icon={Layers}
            title='Grupos y Categorías'
            subtitle='Toda categoría debe pertenecer a un grupo de análisis.'
            onAdd={() => setOpenModal('createGroup')}
            addLabel='Nuevo Grupo'
            isEmpty={groups.length === 0}
            emptyText='No hay grupos. Crea uno para empezar a organizar tus gastos.'
        >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2'>
                {groups.map(g => (
                    <GroupCard
                        key={g.id}
                        group={g}
                        categories={categories}
                        onEdit={(it) => { setEditingItem(it); setModalData({ ...modalData, groupName: it.name, groupIdeal: it.monthlyIdeal ? String(it.monthlyIdeal) : '' }); setOpenModal('editGroup') }}
                        onDelete={handleDeleteGroup}
                        onAddCategory={(gid) => { setModalData({ ...modalData, groupId: gid }); setOpenModal('category') }}
                        onEditCategory={(c) => { setEditingItem(c); setModalData({ ...modalData, categoryName: c.name }); setOpenModal('editCategory') }}
                        onDeleteCategory={handleDeleteCategory}
                        deletingId={deletingId}
                    />
                ))}
            </div>
        </Section>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* ── METODOS PAGO ── */}
            <Section icon={CreditCardIcon} title='Métodos de Pago' onAdd={() => setOpenModal('creditCard')} addLabel='Añadir' isEmpty={creditCards.length === 0} emptyText='—'>
                {creditCards.map(c => (
                    <ItemRow
                        key={c.id} label={c.name} sublabel={c.lastFourDigits ? `···· ${c.lastFourDigits}` : PAYMENT_METHOD_LABELS[c.type]}
                        icon={<PaymentTypeIcon type={c.type} />}
                        onEdit={() => { setEditingItem(c); setModalData({ ...modalData, cardName: c.name, cardType: c.type, cardDigits: c.lastFourDigits || '' }); setOpenModal('editCreditCard') }}
                        onDelete={() => handleDeleteCard(c.id)}
                    />
                ))}
            </Section>

            {/* ── ANOS ── */}
            <Section icon={CalendarDays} title='Años Fiscales' subtitle='Adjunta un archivo de soporte por año.' onAdd={() => setOpenModal('year')} addLabel='Añadir' isEmpty={fiscalYears.length === 0} emptyText='—'>
                {fiscalYears.map(f => (
                    <FiscalYearRow
                        key={f.id}
                        year={f}
                        isUploading={uploadingYearId === f.id}
                        isDownloading={downloadingYearId === f.id}
                        onUpload={(file) => handleUploadAttachment(f.id, file)}
                        onDownload={() => handleDownloadAttachment(f)}
                        onRemoveAttachment={() => handleRemoveAttachment(f.id)}
                    />
                ))}
            </Section>
        </div>

      </div>

      <AnimatePresence>
        {/* MODAL CATEGORIA */}
        {(openModal === 'category' || openModal === 'editCategory') && (
            <Modal title={editingItem ? 'Editar categoría' : 'Nueva categoría'} onClose={closeModal}>
                <div className='flex flex-col gap-4'>
                    <ModalInput label='Nombre' value={modalData.categoryName} onChange={v => setModalData({...modalData, categoryName: v})} placeholder='Ej: Netflix' />
                    <button onClick={handleSaveCategory} disabled={isSubmitting || !modalData.categoryName.trim()} className='w-full h-10 bg-text-main text-white font-semibold rounded-xl hover:bg-secondary-800 transition-colors'>
                        {isSubmitting ? 'Guardando...' : 'Guardar categoría'}
                    </button>
                </div>
            </Modal>
        )}

        {/* MODAL GRUPO */}
        {(openModal === 'createGroup' || openModal === 'editGroup') && (
            <Modal title={editingItem ? 'Editar grupo' : 'Nuevo grupo'} onClose={closeModal}>
                <div className='flex flex-col gap-4'>
                    <ModalInput label='Nombre del grupo' value={modalData.groupName} onChange={v => setModalData({...modalData, groupName: v})} placeholder='Ej: Ocio' />
                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-medium'>Ideal mensual</label>
                        <div className='relative'>
                            <input
                                type='text' value={modalData.groupIdeal ? fmt(parseInt(modalData.groupIdeal.replace(/\D/g, '')) || 0) : ''}
                                onChange={e => setModalData({...modalData, groupIdeal: e.target.value.replace(/\D/g,'')})}
                                className='h-10 w-full rounded-xl border border-secondary-200 pl-3 pr-10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
                                placeholder='$ 0'
                            />
                            <Target size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400' />
                        </div>
                    </div>
                    <button onClick={handleSaveGroup} disabled={isSubmitting || !modalData.groupName.trim()} className='w-full h-10 bg-text-main text-white font-semibold rounded-xl hover:bg-secondary-800 transition-colors'>
                        {isSubmitting ? 'Guardando...' : 'Guardar grupo'}
                    </button>
                </div>
            </Modal>
        )}

        {/* OTROS MODALES SIMPLIFICADOS */}
        {openModal === 'year' && (
            <Modal title='Añadir año' onClose={closeModal}>
                <div className='flex flex-col gap-4'>
                    <ModalInput label='Año' value={modalData.yearValue} onChange={v => setModalData({...modalData, yearValue: v})} type='number' />
                    <button onClick={handleAddYear} className='w-full h-10 bg-text-main text-white font-semibold rounded-xl hover:bg-secondary-800'>Añadir</button>
                </div>
            </Modal>
        )}

        {(openModal === 'creditCard' || openModal === 'editCreditCard') && (
            <Modal title='Método de pago' onClose={closeModal}>
              <div className='flex flex-col gap-4'>
                <PaymentTypeSelector value={modalData.cardType} onChange={v => setModalData({...modalData, cardType: v, cardDigits: ''})} />
                <ModalInput label='Nombre' value={modalData.cardName} onChange={v => setModalData({...modalData, cardName: v})} />
                {showDigitsForType(modalData.cardType) && (
                    <ModalInput label='4 dígitos' value={modalData.cardDigits} onChange={v => setModalData({...modalData, cardDigits: v.replace(/\D/g,'').slice(0,4)})} maxLength={4} />
                )}
                <button onClick={handleSaveCard} className='w-full h-10 bg-text-main text-white font-semibold rounded-xl'>Guardar</button>
              </div>
            </Modal>
        )}
      </AnimatePresence>
    </BaseLayout>
  )
}
