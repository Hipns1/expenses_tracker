import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Login, loginSchema } from '@/components/login/login-form-schema'
import { useAuth } from '@/hooks/use-auth'

export const useLoginForm = () => {
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()

  const form = useForm<Login>({
    resolver: zodResolver(loginSchema())
  })

  const onSuccess = async (data: Login): Promise<void> => {
    setIsLoading(true)
    await login(data).finally(() => setIsLoading(false))
  }

  return {
    form,
    isLoading,
    onSuccess
  }
}
