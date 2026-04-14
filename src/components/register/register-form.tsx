import { Button, Form, InputField, Spinner } from '@/components/ui'
import { useRegisterForm } from './use-register-form'
import { cn } from '@/utils'

export const RegisterForm = () => {
  const { form, isLoading, onSuccess } = useRegisterForm()
  const { control, handleSubmit } = form

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSuccess)} className='w-full'>
        <div className='flex w-full flex-col items-center justify-center gap-10'>
          <div className='flex w-full flex-col gap-4'>
            <InputField
              control={control}
              label='Nombre'
              name='name'
              type='text'
              placeholder='Ingrese su nombre'
              labelClassName='text-sm'
              inputClassName='text-base'
              disabled={isLoading}
            />
            <InputField
              control={control}
              label='Correo electrónico'
              name='email'
              type='email'
              placeholder='Ingrese su correo'
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
            <InputField
              control={control}
              label='Confirmar contraseña'
              name='confirmPassword'
              type='password'
              placeholder='Repita su contraseña'
              labelClassName='text-sm'
              inputClassName='text-base'
              disabled={isLoading}
            />
          </div>
          <div className={cn('grid w-full grid-cols-1 gap-2')}>
            <Button type='submit' className={cn('col-span-2 gap-2')} disabled={isLoading}>
              {isLoading && <Spinner size='sm' />}
              <span>Crear cuenta</span>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
