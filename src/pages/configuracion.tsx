import { useState, useEffect, useRef } from 'react'
import { BaseLayout } from '@/components/shared/base-layout'
import { categoriesService, type Category } from '@/services/categories'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { creditCardsService, type CreditCard } from '@/services/creditCards'
import { toast } from 'react-toastify'
import { Plus, Trash2, Tag, CreditCard as CreditCardIcon, CalendarDays, X, CheckCircle, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Tipos de modal ── */
type ModalType = 'category' | 'creditCard' | 'year' | 'editCategory' | 'editCreditCard' | null

/* ── Modal simple inline ── */
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
  icon: Icon,
  title,
  onAdd,
  addLabel,
  isEmpty,
  emptyText,
  children,
}: {
  icon: React.ElementType
  title: string
  onAdd: () => void
  addLabel: string
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
          <h2 className='font-semibold text-text-main'>{title}</h2>
        </div>
        <button
          onClick={onAdd}
          className='flex items-center gap-1.5 bg-text-main text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-secondary-800 transition-colors'
        >
          <Plus size={14} />
          {addLabel}
        </button>
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

/* ── Fila de ítem con edit + delete de doble confirmación ── */
function ItemRow({
  label,
  sublabel,
  onEdit,
  onDelete,
  deleteWarning,
}: {
  label: string
  sublabel?: string
  onEdit?: () => void
  onDelete?: () => void
  deleteWarning?: string
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
      <div className='ml-3 flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all'>
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
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              pending
                ? 'opacity-100 bg-danger text-white hover:bg-danger/90'
                : 'hover:bg-danger/10 text-danger'
            }`}
            title={pending ? 'Confirmar eliminación' : 'Eliminar'}
          >
            {pending ? <CheckCircle size={13} /> : <Trash2 size={13} />}
          </button>
        )}
      </div>
    </li>
  )
}

/* ── Input simple para los modales ── */
function ModalInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  maxLength?: number
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

/* ── Página principal ── */
export default function Configuracion() {
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])

  // Form fields - crear
  const [categoryName, setCategoryName] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardDigits, setCardDigits] = useState('')
  const [yearValue, setYearValue] = useState(String(new Date().getFullYear()))

  // Form fields - editar
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [editCardName, setEditCardName] = useState('')
  const [editCardDigits, setEditCardDigits] = useState('')

  /* ── Carga inicial ── */
  useEffect(() => {
    categoriesService.getAll().then(setCategories).catch(() => {})
    fiscalYearsService.getAll().then(setFiscalYears).catch(() => {})
    creditCardsService.getAll().then(setCreditCards).catch(() => {})
  }, [])

  const closeModal = () => {
    setOpenModal(null)
    setCategoryName('')
    setCardName('')
    setCardDigits('')
    setYearValue(String(new Date().getFullYear()))
    setEditingCategory(null)
    setEditCategoryName('')
    setEditingCard(null)
    setEditCardName('')
    setEditCardDigits('')
  }

  const openEditCategory = (c: Category) => {
    setEditingCategory(c)
    setEditCategoryName(c.name)
    setOpenModal('editCategory')
  }

  const openEditCard = (c: CreditCard) => {
    setEditingCard(c)
    setEditCardName(c.name)
    setEditCardDigits(c.lastFourDigits)
    setOpenModal('editCreditCard')
  }

  /* ── Handlers ── */
  const handleAddCategory = async () => {
    if (!categoryName.trim()) return
    setIsSubmitting(true)
    try {
      const created = await categoriesService.create(categoryName.trim())
      setCategories((prev) => [...prev, created])
      toast.success('Categoría agregada')
      closeModal()
    } catch {
      toast.error('Error al agregar categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return
    setIsSubmitting(true)
    try {
      const updated = await categoriesService.update(editingCategory.id, editCategoryName.trim())
      setCategories((prev) => prev.map((c) => c.id === updated.id ? { ...c, name: updated.name } : c))
      toast.success('Categoría actualizada')
      closeModal()
    } catch {
      toast.error('Error al actualizar categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoriesService.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('Categoría eliminada')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al eliminar categoría'
      toast.error(msg)
    }
  }

  const handleAddCard = async () => {
    if (!cardName.trim() || cardDigits.length !== 4) return
    setIsSubmitting(true)
    try {
      const created = await creditCardsService.create(cardName.trim(), cardDigits)
      setCreditCards((prev) => [...prev, created])
      toast.success('Tarjeta agregada')
      closeModal()
    } catch {
      toast.error('Error al agregar tarjeta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCard = async () => {
    if (!editingCard || !editCardName.trim() || editCardDigits.length !== 4) return
    setIsSubmitting(true)
    try {
      const updated = await creditCardsService.update(editingCard.id, editCardName.trim(), editCardDigits)
      setCreditCards((prev) => prev.map((c) => c.id === updated.id ? updated : c))
      toast.success('Método de pago actualizado')
      closeModal()
    } catch {
      toast.error('Error al actualizar método de pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCard = async (id: number) => {
    try {
      await creditCardsService.delete(id)
      setCreditCards((prev) => prev.filter((c) => c.id !== id))
      toast.success('Método de pago eliminado')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al eliminar método de pago'
      toast.error(msg)
    }
  }

  const handleAddYear = async () => {
    const year = parseInt(yearValue)
    if (!year || year < 2000 || year > 2100) return
    setIsSubmitting(true)
    try {
      const created = await fiscalYearsService.create(year)
      setFiscalYears((prev) => [...prev, created].sort((a, b) => b.year - a.year))
      toast.success(`Año ${year} agregado`)
      closeModal()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al agregar año'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <BaseLayout titleHeader='Configuración'>
      <p className='text-sm text-text-muted -mt-2 mb-2'>
        Administra categorías, tarjetas de crédito y años fiscales.
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
            <ItemRow
              key={c.id}
              label={c.name}
              onEdit={!c.isSystem ? () => openEditCategory(c) : undefined}
              onDelete={!c.isSystem ? () => handleDeleteCategory(c.id) : undefined}
              deleteWarning='¿Confirmar? Los registros con esta categoría la perderán.'
            />
          ))}
        </Section>

        {/* ── Tarjetas de crédito ── */}
        <Section
          icon={CreditCardIcon}
          title='Tarjetas de Crédito'
          onAdd={() => setOpenModal('creditCard')}
          addLabel='Añadir'
          isEmpty={creditCards.length === 0}
          emptyText='Sin tarjetas de crédito'
        >
          {creditCards.map((c) => (
            <ItemRow
              key={c.id}
              label={c.name}
              sublabel={`···· ${c.lastFourDigits}`}
              onEdit={() => openEditCard(c)}
              onDelete={() => handleDeleteCard(c.id)}
              deleteWarning='¿Confirmar? Los registros con este método de pago lo perderán.'
            />
          ))}
        </Section>

        {/* ── Años ── */}
        <Section
          icon={CalendarDays}
          title='Años'
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
              <ModalInput
                label='Nombre'
                value={categoryName}
                onChange={setCategoryName}
                placeholder='Ej: Alimentación'
              />
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
          <Modal title='Nueva tarjeta de crédito' onClose={closeModal}>
            <div className='flex flex-col gap-4'>
              <ModalInput
                label='Nombre de la tarjeta'
                value={cardName}
                onChange={setCardName}
                placeholder='Ej: Visa Oro'
              />
              <ModalInput
                label='Últimos 4 dígitos'
                value={cardDigits}
                onChange={(v) => setCardDigits(v.replace(/\D/g, '').slice(0, 4))}
                placeholder='0000'
                maxLength={4}
              />
              <button
                onClick={handleAddCard}
                disabled={isSubmitting || !cardName.trim() || cardDigits.length !== 4}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Guardando...' : 'Guardar tarjeta'}
              </button>
            </div>
          </Modal>
        )}

        {openModal === 'year' && (
          <Modal title='Añadir año fiscal' onClose={closeModal}>
            <div className='flex flex-col gap-4'>
              <ModalInput
                label='Año'
                value={yearValue}
                onChange={setYearValue}
                placeholder='2025'
                type='number'
              />
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
              <ModalInput
                label='Nombre'
                value={editCategoryName}
                onChange={setEditCategoryName}
                placeholder='Ej: Alimentación'
              />
              <button
                onClick={handleEditCategory}
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
              <ModalInput
                label='Nombre'
                value={editCardName}
                onChange={setEditCardName}
                placeholder='Ej: Visa Oro'
              />
              <ModalInput
                label='Últimos 4 dígitos'
                value={editCardDigits}
                onChange={(v) => setEditCardDigits(v.replace(/\D/g, '').slice(0, 4))}
                placeholder='0000'
                maxLength={4}
              />
              <button
                onClick={handleEditCard}
                disabled={isSubmitting || !editCardName.trim() || editCardDigits.length !== 4}
                className='w-full h-10 bg-text-main text-white text-sm font-semibold rounded-xl hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </BaseLayout>
  )
}
