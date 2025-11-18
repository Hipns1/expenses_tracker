import { Spinner } from '@/components/ui'
import { cn } from '@/utils/utils'

interface LoadingProps {
  className?: string
  isSpinner?: boolean
}

export function Loading({ className = '', isSpinner = true }: Readonly<LoadingProps>) {
  return (
    <div className={cn('relative flex min-h-screen items-center justify-center gap-6', className)}>
      {isSpinner && (
        <div className='absolute right-0 bottom-0 m-10'>
          <Spinner />
        </div>
      )}
    </div>
  )
}
