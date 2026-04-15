import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Link2Off, Copy, Check, Save } from 'lucide-react'
import { toast } from 'react-toastify'
import { BaseLayout } from '@/components/shared/base-layout'
import { profileService, type UserProfile } from '@/services/profile'
import { useAuth } from '@/hooks'

const CURRENCY_OPTIONS = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'CLP', 'PEN', 'BRL']

export default function Perfil() {
  const { logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('COP')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    profileService.getMe().then(p => {
      setProfile(p)
      setName(p.name)
      setCurrency(p.currency)
    })
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre no puede estar vacío.')
      return
    }
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
    <BaseLayout titleHeader="Perfil">
      <div className="flex flex-col gap-6 max-w-lg">

        {/* Basic data */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card-light dark:bg-card-dark rounded-2xl border border-secondary-100 dark:border-secondary-dark shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-secondary-100 dark:border-secondary-dark">
            <User size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-main dark:text-white">Datos básicos</h2>
          </div>

          <div className="px-5 py-5 flex flex-col gap-4">
            {/* Email (readonly) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Correo electrónico</label>
              <input
                type="text"
                value={profile?.email ?? ''}
                readOnly
                className="h-10 text-sm px-3 rounded-xl border border-secondary-200 dark:border-secondary-dark bg-secondary-50 dark:bg-secondary-800/30 text-text-muted cursor-not-allowed"
              />
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                className="h-10 text-sm px-3 rounded-xl border border-secondary-200 dark:border-secondary-dark bg-white dark:bg-card-dark text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Currency */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Moneda</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="h-10 text-sm px-3 rounded-xl border border-secondary-200 dark:border-secondary-dark bg-white dark:bg-card-dark text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {CURRENCY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                <Save size={15} />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>

              <button
                onClick={() => logout()}
                className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl border border-danger/40 text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
              >
                <Link2Off size={15} />
                Desvincular este dispositivo
              </button>
            </div>
          </div>
        </motion.div>

        {/* Sync code */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card-light dark:bg-card-dark rounded-2xl border border-secondary-100 dark:border-secondary-dark shadow-sm overflow-hidden"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-secondary-100 dark:border-secondary-dark">
            <Link2Off size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-text-main dark:text-white">Sincronización</h2>
          </div>

          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Código de sincronización</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profile?.syncCode ?? 'Sin código asignado'}
                  readOnly
                  className="flex-1 h-10 text-sm px-3 rounded-xl border border-secondary-200 dark:border-secondary-dark bg-secondary-50 dark:bg-secondary-800/30 text-text-main dark:text-white font-mono tracking-widest cursor-default"
                />
                {profile?.syncCode && (
                  <button
                    onClick={handleCopySyncCode}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-secondary-200 dark:border-secondary-dark hover:bg-primary/10 hover:border-primary/40 transition-colors text-secondary-500 hover:text-primary"
                    title="Copiar código"
                  >
                    {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-text-muted bg-secondary-50 dark:bg-secondary-800/30 rounded-xl px-4 py-3 border border-secondary-100 dark:border-secondary-dark">
              Comparte este código contigo mismo para vincular otro dispositivo. <strong className="text-text-main dark:text-white">No lo publiques.</strong>
            </p>
          </div>
        </motion.div>

      </div>
    </BaseLayout>
  )
}
