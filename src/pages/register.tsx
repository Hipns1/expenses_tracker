import { RegisterForm } from '@/components/register/register-form'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Smartphone, RefreshCw, Wallet } from 'lucide-react'

const features = [
  { icon: ShieldCheck, text: 'Tus datos seguros y privados' },
  { icon: Smartphone, text: 'Accede desde cualquier dispositivo' },
  { icon: RefreshCw, text: 'Sincronización con código único' },
]

export const Register = () => {
  return (
    <div className='flex h-screen w-full overflow-hidden'>

      {/* ── Left panel (decorative, hidden on mobile) ── */}
      <div className='hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12'
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
            <h2 className='text-5xl font-bold text-white leading-tight mb-4'>
              Empieza hoy,<br />
              sin costo.
            </h2>
            <p className='text-primary-200 text-lg mb-10 leading-relaxed'>
              Crea tu cuenta en segundos y toma<br />el control de tus finanzas personales.
            </p>

            <ul className='space-y-4'>
              {features.map(({ icon: Icon, text }, i) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className='flex items-center gap-3'
                >
                  <div className='w-9 h-9 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10 flex-shrink-0'>
                    <Icon size={16} className='text-primary-300' />
                  </div>
                  <span className='text-primary-100 text-sm'>{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Footer */}
        <div className='relative z-10'>
          <p className='text-primary-400 text-xs'>
            © {new Date().getFullYear()} Mis Finanzas · Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className='w-full lg:w-[55%] flex flex-col items-center justify-center bg-white px-8 sm:px-16 lg:px-20 xl:px-28'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='w-full max-w-[400px]'
        >
          {/* Mobile logo */}
          <div className='flex items-center gap-2 mb-10 lg:hidden'>
            <div className='w-9 h-9 bg-primary rounded-xl flex items-center justify-center'>
              <Wallet className='text-white' size={18} />
            </div>
            <span className='font-bold text-text-main text-lg'>Mis Finanzas</span>
          </div>

          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-text-main mb-2 tracking-tight'>
              Crear cuenta
            </h1>
            <p className='text-text-muted text-sm'>
              Completa los datos para registrarte en la plataforma.
            </p>
          </div>

          <RegisterForm />

          <p className='text-center text-sm text-text-muted mt-6'>
            ¿Ya tienes cuenta?{' '}
            <Link to='/' className='text-primary font-semibold hover:underline transition-colors'>
              Iniciar sesión
            </Link>
          </p>
        </motion.div>
      </div>

    </div>
  )
}
