import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, CalendarDays, CreditCard,
  CheckCircle, ChevronRight, Sparkles, Building2, Smartphone, Banknote,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fiscalYearsService } from '@/services/fiscalYears'
import { categoriesService } from '@/services/categories'
import { creditCardsService, type PaymentMethodType } from '@/services/creditCards'
import { categoryGroupsService } from '@/services/categoryGroups'
import { toast } from 'react-toastify'

interface OnboardingModalProps {
  onComplete: () => void
  initialStep?: 'year' | 'category' | 'card'
}

type StepId = 'year' | 'category' | 'card'

interface StepMeta {
  id: StepId
  icon: React.ReactNode
  label: string
  title: string
  subtitle: string
  hint: string
}

const STEPS: StepMeta[] = [
  {
    id: 'year',
    icon: <CalendarDays size={22} />,
    label: 'Año fiscal',
    title: 'Define tu año fiscal',
    subtitle: 'El año en el que vas a registrar y analizar tus finanzas.',
    hint: 'Puedes agregar más años desde Configuración en cualquier momento.',
  },
  {
    id: 'category',
    icon: <Layers size={22} />,
    label: 'Grupo',
    title: 'Crea tu primer Grupo',
    subtitle: 'Los grupos organizan tus categorías (ej: Vivienda, Ocio, Transporte).',
    hint: 'Asociaremos automáticamente una categoría inicial con el mismo nombre.',
  },
  {
    id: 'card',
    icon: <CreditCard size={22} />,
    label: 'Método de pago',
    title: 'Agrega un método de pago',
    subtitle: 'Identifica con qué tarjeta o cuenta realizas tus pagos.',
    hint: 'Puede ser una tarjeta, cuenta bancaria, efectivo, etc.',
  },
]

export function OnboardingModal({ onComplete, initialStep = 'year' }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(STEPS.findIndex((s) => s.id === initialStep))
  const [completed, setCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [categoryName, setCategoryName] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardDigits, setCardDigits] = useState('')
  const [cardType, setCardType] = useState<PaymentMethodType>('Card')

  const PAYMENT_OPTIONS: { type: PaymentMethodType; label: string; icon: React.ReactNode }[] = [
    { type: 'Card', label: 'Tarjeta', icon: <CreditCard size={15} /> },
    { type: 'BankAccount', label: 'Cuenta bancaria', icon: <Building2 size={15} /> },
    { type: 'DigitalWallet', label: 'Billetera digital', icon: <Smartphone size={15} /> },
    { type: 'Cash', label: 'Efectivo', icon: <Banknote size={15} /> },
  ]
  const showDigits = cardType === 'Card' || cardType === 'BankAccount'

  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      if (step.id === 'year') {
        const parsed = parseInt(year)
        if (!parsed || parsed < 2000 || parsed > 2100) {
          toast.error('Ingresa un año válido')
          return
        }
        await fiscalYearsService.create(parsed)
      }

        if (step.id === 'category') {
          if (!categoryName.trim()) {
            toast.error('Ingresa un nombre para el grupo')
            return
          }
          // Crear el grupo y una categoría semilla con el mismo nombre
          const newGroup = await categoryGroupsService.create(categoryName.trim(), [])
          await categoriesService.create(categoryName.trim(), newGroup.id)
        }

      if (step.id === 'card') {
        if (!cardName.trim()) {
          toast.error('Ingresa el nombre del método de pago')
          return
        }
        if (showDigits && cardDigits.length > 0 && cardDigits.length !== 4) {
          toast.error('Los dígitos deben ser exactamente 4')
          return
        }
        const digits = showDigits && cardDigits.length === 4 ? cardDigits : undefined
        await creditCardsService.create(cardName.trim(), cardType, digits)
      }

      if (isLastStep) {
        setCompleted(true)
      } else {
        setCurrentStep((s) => s + 1)
      }
    } catch {
      toast.error('Ocurrió un error, intenta de nuevo')
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = () => {
    if (step?.id === 'year') return year.length >= 4
    if (step?.id === 'category') return categoryName.trim().length > 0
    if (step?.id === 'card') return cardName.trim().length > 0
    return true
  }

  return (
    <div className='fixed inset-0 z-50 flex h-screen w-full overflow-hidden'>

      {/* ── Left panel ── */}
      <div
        className='hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12'
        style={{ background: 'linear-gradient(145deg, #312e81 0%, #1e1b4b 50%, #0f0e2a 100%)' }}
      >
        {/* Decorative blobs */}
        <div className='absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20'
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className='absolute -bottom-48 -left-24 w-[450px] h-[450px] rounded-full opacity-15'
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />

        {/* Logo */}
        <div className='relative z-10 flex items-center gap-3'>
          <div className='w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20'>
            <Wallet className='text-white' size={20} />
          </div>
          <span className='text-white font-bold text-lg tracking-tight'>Mis Finanzas</span>
        </div>

        {/* Main copy */}
        <div className='relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className='flex items-center gap-2 mb-4'>
              <Sparkles size={16} className='text-primary-300' />
              <span className='text-primary-300 text-sm font-medium tracking-wide uppercase'>
                Configuración inicial
              </span>
            </div>
            <h2 className='text-4xl font-bold text-white leading-tight mb-4'>
              Configura tu<br />cuenta en minutos.
            </h2>
            <p className='text-primary-200 text-base mb-12 leading-relaxed'>
              Solo necesitamos 3 datos para que<br />puedas empezar a registrar tus finanzas.
            </p>

            {/* Step progress */}
            <div className='space-y-3'>
              {STEPS.map((s, i) => {
                const isDone = completed || i < currentStep
                const isActive = !completed && i === currentStep
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`flex items-center gap-3 transition-all duration-300 ${
                      isActive ? 'opacity-100' : isDone ? 'opacity-70' : 'opacity-35'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 transition-all duration-300 ${
                      isDone
                        ? 'bg-green-500/20 border-green-400/40 text-green-400'
                        : isActive
                        ? 'bg-white/15 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-primary-400'
                    }`}>
                      {isDone
                        ? <CheckCircle size={15} />
                        : <span className='text-xs font-bold'>{i + 1}</span>
                      }
                    </div>
                    <div className='flex flex-col'>
                      <span className={`text-sm font-semibold ${isActive ? 'text-white' : isDone ? 'text-primary-200' : 'text-primary-400'}`}>
                        {s.label}
                      </span>
                    </div>
                    {isActive && (
                      <div className='ml-auto w-1.5 h-1.5 rounded-full bg-primary-300 animate-pulse' />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className='relative z-10'>
          <p className='text-primary-500 text-xs'>
            © {new Date().getFullYear()} Mis Finanzas · Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className='w-full lg:w-[58%] flex flex-col items-center justify-center bg-white px-8 sm:px-16 lg:px-20 xl:px-28'>

        {/* Mobile logo */}
        <div className='flex items-center gap-2 mb-10 lg:hidden self-start'>
          <div className='w-9 h-9 bg-primary rounded-xl flex items-center justify-center'>
            <Wallet className='text-white' size={18} />
          </div>
          <span className='font-bold text-text-main text-lg'>Mis Finanzas</span>
        </div>

        <div className='w-full max-w-[420px]'>
          <AnimatePresence mode='wait'>
            {!completed ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Step indicator */}
                <div className='flex items-center gap-2 mb-8'>
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i < currentStep
                          ? 'bg-primary w-6'
                          : i === currentStep
                          ? 'bg-primary w-10'
                          : 'bg-secondary-200 w-4'
                      }`}
                    />
                  ))}
                  <span className='ml-2 text-xs text-text-muted font-medium'>
                    {currentStep + 1} / {STEPS.length}
                  </span>
                </div>

                {/* Step icon + title */}
                <div className='mb-8'>
                  <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4'>
                    {step.icon}
                  </div>
                  <h1 className='text-2xl font-bold text-text-main mb-2 tracking-tight'>
                    {step.title}
                  </h1>
                  <p className='text-text-muted text-sm leading-relaxed'>
                    {step.subtitle}
                  </p>
                </div>

                {/* Form fields */}
                <div className='flex flex-col gap-3 mb-6'>
                  {step.id === 'year' && (
                    <Input
                      type='number'
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder='Ej: 2025'
                      className='text-center text-lg font-semibold tracking-widest'
                      onKeyDown={(e) => e.key === 'Enter' && canSubmit() && handleSubmit()}
                      autoFocus
                    />
                  )}

                  {step.id === 'category' && (
                    <Input
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder='Ej: Gastos Fijos, Estilo de Vida...'
                      onKeyDown={(e) => e.key === 'Enter' && canSubmit() && handleSubmit()}
                      autoFocus
                    />
                  )}

                  {step.id === 'card' && (
                    <>
                      {/* Selector de tipo */}
                      <div className='grid grid-cols-2 gap-2'>
                        {PAYMENT_OPTIONS.map((opt) => (
                          <button
                            key={opt.type}
                            type='button'
                            onClick={() => { setCardType(opt.type); setCardDigits('') }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                              cardType === opt.type
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'border-secondary-200 text-text-muted hover:border-secondary-300 hover:bg-secondary-50'
                            }`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder={
                          cardType === 'Card' ? 'Ej: Visa Oro' :
                          cardType === 'BankAccount' ? 'Ej: Bancolombia' :
                          cardType === 'DigitalWallet' ? 'Ej: Nequi' : 'Efectivo'
                        }
                        onKeyDown={(e) => e.key === 'Enter' && canSubmit() && handleSubmit()}
                        autoFocus
                      />
                      {showDigits && (
                        <Input
                          type='number'
                          value={cardDigits}
                          onChange={(e) => setCardDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder='Últimos 4 dígitos (opcional)'
                          onKeyDown={(e) => e.key === 'Enter' && canSubmit() && handleSubmit()}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Hint */}
                <p className='text-xs text-text-muted mb-6 leading-relaxed'>
                  {step.hint}
                </p>

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !canSubmit()}
                  hoverStyle='shine'
                  className='w-full'
                >
                  {isLoading
                    ? 'Guardando...'
                    : isLastStep
                    ? 'Finalizar configuración'
                    : 'Continuar'
                  }
                  {!isLoading && <ChevronRight size={16} className='ml-1' />}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key='done'
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className='flex flex-col items-center text-center'
              >
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className='w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mb-6'
                >
                  <CheckCircle size={40} className='text-green-500' />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <h1 className='text-2xl font-bold text-text-main mb-3 tracking-tight'>
                    ¡Todo listo!
                  </h1>
                  <p className='text-text-muted text-sm mb-8 leading-relaxed max-w-xs'>
                    Tu cuenta está configurada. Ya puedes empezar a registrar y analizar tus finanzas.
                  </p>

                  <Button onClick={onComplete} hoverStyle='shine' className='w-full'>
                    Ir a la app
                    <ChevronRight size={16} className='ml-1' />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
