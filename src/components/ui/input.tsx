import * as React from 'react'
import { cn } from '@/utils/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'placeholder:text-placeholder focus-visible:ring-ring flex h-10 w-full rounded-[8px] border px-3 py-1 text-sm font-normal shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium focus-visible:ring-0 focus-visible:outline-none',
        'disabled:opacity-50',
        className
      )}
      ref={ref}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        const key = e.key
        const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']
        if (allowedKeys.includes(key)) {
          return
        }
        if (!(key >= '0' && key <= '9')) {
          type === 'number' && e.preventDefault()
        }
        if (type === 'onlyText') {
          const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$/
          if (!regex.test(key)) {
            e.preventDefault()
          }
        }
      }}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
