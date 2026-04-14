import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Register, registerSchema } from '@/components/register/register-form-schema'
import { postRegister } from '@/services'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { SERVICES_MSGS } from '@/utils/consts'

export const useRegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const form = useForm<Register>({
    resolver: zodResolver(registerSchema())
  })

  const onSuccess = async (data: Register): Promise<void> => {
    setIsLoading(true)
    try {
      await postRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        roleId: 1
      })
      toast.success('Cuenta creada exitosamente. Inicia sesión.')
      navigate('/')
    } catch (error) {
      const { response } = error as AxiosError<any>
      const errorMessage = response?.data?.errors ?? response?.data?.message
      if (errorMessage) {
        toast.warn(errorMessage)
      } else {
        toast.error(SERVICES_MSGS.ERROR)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    form,
    isLoading,
    onSuccess
  }
}
