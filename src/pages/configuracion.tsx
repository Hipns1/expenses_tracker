import { useState, useEffect } from 'react'
import { BaseLayout } from '@/components/shared/base-layout'
import { categoriesService, type Category } from '@/services/categories'
import { fiscalYearsService, type FiscalYear } from '@/services/fiscalYears'
import { creditCardsService, type CreditCard } from '@/services/creditCards'
import { toast } from 'react-toastify'
import { Plus, Trash2, Tag, CreditCard as CreditCardIcon, CalendarDays, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Tipos de modal ── */
type ModalType = 'category' | 'creditCard' | 'year' | null

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

/* ── Fila de ítem con delete ── */
function ItemRow({ label, sublabel, onDelete }: { label: string; sublabel?: string; onDelete: () => void }) {
  return (
    <li className='flex items-center justify-between py-2 px-3 rounded-xl hover:bg-secondary-50 group transition-colors'>
      <div>
        <span className='text-sm font-medium text-text-main'>{label}</span>
        {sublabel && <span className='text-xs text-text-muted ml-2'>{sublabel}</span>}
      </div>
      <button
        onClick={onDelete}
        className='opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-danger/10 text-danger transition-all'
        title='Eliminar'
      >
        <Trash2 size={14} />
      </button>
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

  // Form fields
  const [categoryName, setCategoryName] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardDigits, setCardDigits] = useState('')
  const [yearValue, setYearValue] = useState(String(new Date().getFullYear()))

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

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoriesService.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success('Categoría eliminada')
    } catch {
      toast.error('Error al eliminar categoría')
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

  const handleDeleteCard = async (id: number) => {
    try {
      await creditCardsService.delete(id)
      setCreditCards((prev) => prev.filter((c) => c.id !== id))
      toast.success('Tarjeta eliminada')
    } catch {
      toast.error('Error al eliminar tarjeta')
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

  const handleDeleteYear = async (id: number) => {
    try {
      await fiscalYearsService.delete(id)
      setFiscalYears((prev) => prev.filter((f) => f.id !== id))
      toast.success('Año eliminado')
    } catch {
      toast.error('Error al eliminar año')
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
            <ItemRow key={c.id} label={c.name} onDelete={() => handleDeleteCategory(c.id)} />
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
              onDelete={() => handleDeleteCard(c.id)}
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
            <ItemRow key={f.id} label={String(f.year)} onDelete={() => handleDeleteYear(f.id)} />
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
      </AnimatePresence>
    </BaseLayout>
  )
}
