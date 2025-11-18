import { Button, Form, InputField, Spinner } from '@/components/ui'
import { useLoginForm } from './use-login-form'
import { cn } from '@/utils'

export const LoginForm = () => {
  const { form, isLoading, onSuccess } = useLoginForm()
  const { control, handleSubmit } = form

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSuccess)} className='w-full'>
        <div className='flex w-full flex-col items-center justify-center gap-10'>
          <div className='flex w-full flex-col gap-4'>
            <InputField
              control={control}
              label='Usuario'
              name='email'
              type='email'
              placeholder='Ingrese su usuario'
              labelClassName='text-sm'
              inputClassName='text-base'
              disabled={isLoading}
            />
            <InputField
              control={control}
              label='Contraseña'
              name='password'
              type='password'
              placeholder='Ingrese su contraseña'
              labelClassName='text-sm'
              inputClassName='text-base'
              disabled={isLoading}
            />
          </div>
          <div className={cn('grid w-full grid-cols-1 gap-2')}>
            <Button type='submit' className={cn('col-span-2 gap-2')} disabled={isLoading}>
              {isLoading && <Spinner size='sm' />}
              <span>Iniciar sesión</span>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
