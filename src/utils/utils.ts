import { clsx, type ClassValue } from 'clsx'
import { useLayoutEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Nulleable<T> = {
  [key in keyof T]: T[key] | null
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/* Funcion para obtener los iniciales de un nombre */
export function getInitials(fullName: string, numberSlice?: number) {
  const words = fullName?.trim()?.split(' ')
  const initials = words
    ?.slice(0, numberSlice)
    .map((word) => word[0])
    .join('')
  return initials
}

/* Funcion para validar un mediaquery */
export function useIsQueryUp(QUERY: string) {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : true
  )
  useLayoutEffect(() => {
    const mq = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setMatches('matches' in e ? e.matches : (e as MediaQueryList).matches)
    handler(mq)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return matches
}
