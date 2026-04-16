import { useAuth } from '@/hooks'
import { getInitials } from '@/utils'
import { useEffect, useRef, useState } from 'react'
import { profileService, type UserProfile } from '@/services/profile'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Link2Off, Save, X } from 'lucide-react'
import { toast } from 'react-toastify'

const CURRENCY_OPTIONS = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN', 'BRL']

/* ── Panel de perfil flotante ── */
function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('COP')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    profileService.getMe().then((p) => {
      setProfile(p)
      setName(p.name)
      setCurrency(p.currency)
    })
  }, [])

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre no puede estar vacío.'); return }
    setSaving(true)
    try {
      const updated = await profileService.updateMe({ name: name.trim(), currency })
      setProfile(updated)
      toast.success('Perfil actualizado.')
    } catch {
      toast.error('No se pudo guardar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopySyncCode = async () => {
    if (!profile?.syncCode) return
    await navigator.clipboard.writeText(profile.syncCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.15 }}
      className='absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-secondary-100 z-50 overflow-hidden'
    >
      {/* Header del panel */}
      <div className='flex items-center justify-between px-5 py-4 border-b border-secondary-100'>
        <p className='text-sm font-semibold text-text-main'>Mi perfil</p>
        <button
          onClick={onClose}
          className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary-100 text-secondary-400 transition-colors'
        >
          <X size={14} />
        </button>
      </div>

      <div className='px-5 py-4 flex flex-col gap-4'>
        {/* Email (readonly) */}
        <div className='flex flex-col gap-1'>
          <label className='text-[11px] font-medium text-text-muted uppercase tracking-wide'>Correo electrónico</label>
          <input
            type='text'
            value={profile?.email ?? ''}
            readOnly
            className='h-9 text-sm px-3 rounded-xl border border-secondary-200 bg-secondary-50 text-text-muted cursor-not-allowed'
          />
        </div>

        {/* Nombre */}
        <div className='flex flex-col gap-1'>
          <label className='text-[11px] font-medium text-text-muted uppercase tracking-wide'>Nombre</label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Tu nombre'
            className='h-9 text-sm px-3 rounded-xl border border-secondary-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30'
          />
        </div>

        {/* Moneda */}
        <div className='flex flex-col gap-1'>
          <label className='text-[11px] font-medium text-text-muted uppercase tracking-wide'>Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className='h-9 text-sm px-3 rounded-xl border border-secondary-200 bg-white text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30'
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Guardar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className='flex items-center justify-center gap-2 h-9 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors'
        >
          <Save size={14} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {/* Código de sincronización */}
        <div className='flex flex-col gap-1'>
          <label className='text-[11px] font-medium text-text-muted uppercase tracking-wide'>Código de sincronización</label>
          <div className='flex gap-2'>
            <input
              type='text'
              value={profile?.syncCode ?? 'Sin código asignado'}
              readOnly
              className='flex-1 h-9 text-sm px-3 rounded-xl border border-secondary-200 bg-secondary-50 text-text-main font-mono tracking-widest cursor-default'
            />
            {profile?.syncCode && (
              <button
                onClick={handleCopySyncCode}
                className='h-9 w-9 flex items-center justify-center rounded-xl border border-secondary-200 hover:bg-primary/10 hover:border-primary/40 transition-colors text-secondary-400 hover:text-primary flex-shrink-0'
                title='Copiar código'
              >
                {copied ? <Check size={14} className='text-green-500' /> : <Copy size={14} />}
              </button>
            )}
          </div>
          <p className='text-[11px] text-text-muted mt-0.5'>
            Comparte este código en otro dispositivo para vincularlo.
          </p>
        </div>

        {/* Cerrar sesión / Desvincular */}
        <div className='flex flex-col gap-2 pt-1 border-t border-secondary-100'>
          <button
            onClick={() => logout()}
            className='flex items-center justify-center gap-2 h-9 rounded-xl border border-danger/40 text-danger text-sm font-medium hover:bg-danger/10 transition-colors'
          >
            <Link2Off size={14} />
            Desvincular este dispositivo
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Header ── */
export const Header = ({ titleHeader }: { titleHeader?: string }) => {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className='bg-card-light dark:bg-card-dark border-b border-secondary-100 dark:border-secondary-dark flex items-center justify-between gap-4 px-8 py-4 shadow-sm transition-colors duration-300'>
      <div className='ml-6 md:ml-0'>
        <h1 className='text-text-main dark:text-white text-sm font-normal md:text-2xl md:font-bold'>{titleHeader}</h1>
        <h2 className='text-text-muted hidden text-xs md:block space-x-1'>
          <span className='text-primary font-medium hover:underline cursor-pointer'>Inicio</span>
          <span>/</span>
          <span>{titleHeader}</span>
        </h2>
      </div>

      {/* Avatar / nombre — abre panel al hacer clic */}
      <div className='relative hidden md:block' ref={containerRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className='flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-secondary-50 transition-colors cursor-pointer'
        >
          <div className='flex flex-col items-end'>
            <span className='text-text-main dark:text-white text-sm font-semibold'>{user?.name}</span>
            <span className='text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full'>Premium</span>
          </div>
          <div className='bg-gradient-primary relative flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg ring-2 ring-white dark:ring-bg-dark flex-shrink-0'>
            {getInitials(user?.name ?? '', 1)}
            <span className='absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-bg-dark bg-success' />
          </div>
        </button>

        <AnimatePresence>
          {open && <ProfilePanel onClose={() => setOpen(false)} />}
        </AnimatePresence>
      </div>
    </div>
  )
}
