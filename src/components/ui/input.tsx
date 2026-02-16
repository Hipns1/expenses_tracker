import * as React from 'react'
import { cn } from '@/utils/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'placeholder:text-placeholder focus-visible:ring-2 focus-visible:ring-primary/50 flex h-11 w-full rounded-xl border border-secondary-100 dark:border-secondary-dark px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200',
        'bg-white dark:bg-card-dark text-text-main dark:text-white',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:outline-none focus:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-100',
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
