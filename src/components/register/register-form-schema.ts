import { v } from '@/utils/zod-validations'
import { z } from 'zod'

export const registerSchema = () =>
  z
    .object({
      name: v.string({ required: true, type: 'text', min: 2 }),
      email: v.string({ required: true, type: 'email' }),
      password: v.string({ required: true, type: 'password' }),
      confirmPassword: v.string({ required: true })
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword']
    })

export type Register = z.infer<ReturnType<typeof registerSchema>>
