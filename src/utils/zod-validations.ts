import { z, ZodDate, ZodNumber, ZodObject, ZodRawShape, ZodString } from 'zod'
import { FORM_ERRORS_MSGS } from '@/utils/consts'

export type StringFieldArgs = {
  required?: boolean
  min?: number
  max?: number
  type?: 'email' | 'text' | 'password' | 'onlyAlphanumeric' | 'onlyText' | 'specialText' | 'website' | 'phoneNumber'
}
export type NumberFieldArgs = {
  min?: number
  max?: number
  isSelect?: boolean
  format?: (value: number) => string
}
export type DateFieldArgs = {
  min?: Date
  max?: Date
  required?: boolean
}

export const stringField = ({ required, min, max, type = 'text' }: StringFieldArgs = {}) => {
  let zodType: ZodString = z.string({
    required_error: FORM_ERRORS_MSGS.REQUIRED,
    invalid_type_error: FORM_ERRORS_MSGS.REQUIRED
  })
  if (min) zodType = zodType.min(min, `Mínimo ${min} caracteres`)
  if (max) zodType = zodType.max(max, `Máximo ${max} caracteres`)
  if (required) zodType = zodType.min(1, FORM_ERRORS_MSGS.REQUIRED)
  if (type === 'email') zodType = zodType.email('Debe ingresar un email válido')
  if (type === 'password') {
    zodType = zodType.regex(/.*[A-Z].*/, 'Debe Incluir una mayúscula')
    zodType = zodType.regex(/.*[a-z].*/, 'Debe Incluir una minúscula')
    zodType = zodType.regex(/.*[^\w\s].*/, 'Debe Incluir un carácter especial')
    zodType = zodType.regex(/^(?!.*([^\w\s]).*\1).*$/, 'No puede contener caracteres especiales repetidos')
    zodType = zodType.regex(/.*\d.*/, 'Debe Incluir una numero')
  }
  if (type === 'onlyAlphanumeric') {
    zodType = zodType.regex(/^[a-zA-Z0-9 ]*$/, 'Solo se permiten letras y números')
  }
  if (type === 'onlyText') {
    zodType = zodType.regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$/, 'Solo se permiten letras y espacios')
  }
  if (type === 'specialText') {
    zodType = zodType.regex(/^[\p{L} ]+$/u, 'Solo se permiten letras con o sin tildes y espacios')
  }
  if (type === 'website') {
    const websiteRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([\/?#][^\s]*)?$/
    zodType = zodType.regex(websiteRegex, 'Debe ingresar una URL de sitio web válida')
  }
  if (type === 'phoneNumber') {
    const phoneRegex = /^3\d{9}$/ // empieza con 3 y debe tener exactamente 10 dígitos
    zodType = zodType.regex(phoneRegex, 'Debe ingresar un número de teléfono válido que empiece por 3')
  }
  return zodType
}

export const numberField = ({ min, max, isSelect, format }: NumberFieldArgs = {}) => {
  let zodNumber: ZodNumber = z.number({
    invalid_type_error: isSelect ? 'Seleccione una opción' : 'Número invalido',
    required_error: FORM_ERRORS_MSGS.REQUIRED
  })

  if (min) zodNumber = zodNumber.min(min, `Mínimo ${format ? format(min) : min}`)
  if (max) zodNumber = zodNumber.max(max, `Máximo ${format ? format(max) : max}`)

  return zodNumber
}

export const selectStringField = () =>
  z
    .string({
      required_error: 'Seleccione una opción',
      invalid_type_error: 'Seleccione una opción'
    })
    .min(1, 'Seleccione una opción')
export const selectNumberField = () => z.number({ invalid_type_error: 'Seleccione una opción' })

export const dateField = ({ min, max, required = false }: DateFieldArgs = {}) => {
  let zodType: ZodDate

  if (required) {
    zodType = z.date({
      required_error: FORM_ERRORS_MSGS.REQUIRED
    })
  } else {
    zodType = z.date().optional() as unknown as z.ZodDate
  }

  if (min) zodType = zodType.min(min, `Debe ser mayor a ${min.toLocaleDateString()}`)
  if (max) zodType = zodType.max(max, `Debe ser menor a ${max.toLocaleDateString()}`)

  return zodType
}

export const booleanField = () => z.boolean({ required_error: FORM_ERRORS_MSGS.REQUIRED })

export const arrayField = <T extends ZodRawShape>(zodObject: ZodObject<T>) =>
  z.array(zodObject, { required_error: FORM_ERRORS_MSGS.UNSELECT })

export const dateRange = () =>
  z.object(
    {
      from: z.date(),
      to: z.date()
    },
    {
      required_error: FORM_ERRORS_MSGS.REQUIRED
    }
  )

export const v = {
  string: stringField,
  number: numberField,
  date: dateField,
  boolean: booleanField,
  selectString: selectStringField,
  selectNumber: selectNumberField,
  array: arrayField,
  dateRange: dateRange
}

export default v
