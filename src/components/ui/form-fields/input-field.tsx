import { useState } from 'react'
import { FormControl, FormField, FormItem, FormMessage, Input, Label } from '@/components/ui'
import { cn } from '@/utils/utils'
import { Control } from 'react-hook-form'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6'
import { RxCross2 } from 'react-icons/rx'

interface InputFieldProps {
  control: Control<any>
  name: string
  placeholder?: string
  type?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  label?: string
  labelClassName?: string
  onClear?: () => void
  isClearable?: boolean
}

export const InputField = ({
  control,
  name,
  placeholder,
  type = 'text',
  disabled,
  className,
  inputClassName,
  label,
  labelClassName,
  isClearable,
  onClear
}: InputFieldProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev)
  }

  const inputType = type === 'password' && isPasswordVisible ? 'text' : type

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex flex-col', className)}>
          <Label htmlFor={name} className={cn('text-start text-sm font-semibold', labelClassName)}>
            {label}
          </Label>
          <FormControl>
            <div className='relative'>
              <Input
                {...field}
                value={field.value ?? ''}
                placeholder={placeholder}
                type={inputType}
                disabled={disabled}
                className={inputClassName}
              />
              <div className='absolute inset-y-0 right-0 flex items-center space-x-2 pr-2'>
                {field.value && isClearable && (
                  <button type='button' onClick={onClear} className='focus:outline-none' title='Limpiar'>
                    <RxCross2 size={18} />
                  </button>
                )}
                {type === 'password' && (
                  <button
                    type='button'
                    onClick={togglePasswordVisibility}
                    className='focus:outline-none'
                    title={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {isPasswordVisible ? <FaRegEye size={18} /> : <FaRegEyeSlash size={20} />}
                  </button>
                )}
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
