import { LoginForm } from '@/components/login/login-form'

export const Login = () => {
  const getActualYear = () => {
    return new Date().getFullYear()
  }

  return (
    <div className='flex h-screen w-full flex-col items-center justify-center gap-12 px-2'>
      <div className='flex w-auto rounded-[33px]'>
        <div className='flex h-full flex-col gap-12 px-8 md:px-22 xl:px-36'>
          <div className='flex h-full max-w-[330px] flex-col items-center justify-center gap-3 xl:max-w-[350px] xl:gap-5'>
            <h1 className='text-primary text-center text-2xl font-black xl:text-4xl'>Iniciar sesión</h1>
            <p className='px-2 text-center text-sm font-normal xl:px-4 xl:text-lg/6'>
              Bienvenido, digita tus credenciales para acceder a la plataforma.
            </p>
            <LoginForm />
          </div>
          <p className='text-center text-sm'>© {getActualYear()} Copyright.</p>
        </div>
      </div>
    </div>
  )
}
