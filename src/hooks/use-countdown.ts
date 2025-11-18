import { useEffect, useState } from 'react'

export const useCountdown = (initialSeconds: number, trigger: boolean) => {
  const [remainingTime, setRemainingTime] = useState(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!trigger || remainingTime <= 0) {
      if (remainingTime <= 0) setIsExpired(true)
      return
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [trigger, remainingTime])

  const reset = () => {
    setRemainingTime(initialSeconds)
    setIsExpired(false)
  }

  return { isExpired, remainingTime, reset }
}
