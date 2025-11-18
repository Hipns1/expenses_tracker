import { v } from '@/utils/zod-validations'
import { z } from 'zod'

export const loginSchema = () =>
  z.object({
    email: v.string({
      required: true,
      type: 'email'
    }),
    password: v.string({
      required: true,
      type: 'text'
    })
  })
export type Login = z.infer<ReturnType<typeof loginSchema>>
