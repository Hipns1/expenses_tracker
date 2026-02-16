import { useAuth } from '@/hooks'
import { getInitials } from '@/utils'

export const Header = ({ titleHeader }: { titleHeader?: string }) => {
  const { user } = useAuth()

  return (
    <div className='bg-card-light dark:bg-card-dark border-b border-secondary-100 dark:border-secondary-dark flex items-center justify-between gap-4 px-8 py-4 shadow-sm transition-colors duration-300'>
      <div className='ml-6 md:ml-0'>
        <h1 className='text-text-main dark:text-white text-sm font-normal md:text-2xl md:font-bold'>{titleHeader}</h1>
        <h2 className='text-text-muted hidden text-xs md:block space-x-1'>
          <span className='text-primary font-medium hover:underline cursor-pointer'>Inicio</span>
          <span>/</span>
          <span>{titleHeader}</span>
        </h2>
      </div>

      <div className='hidden items-center gap-3 md:flex'>
        <div className='flex flex-col items-end'>
          <span className='text-text-main dark:text-white text-sm font-semibold'>{user?.name}</span>
          <span className='text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full'>Premium</span>
        </div>
        <div className='bg-gradient-primary relative flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg ring-2 ring-white dark:ring-bg-dark'>
          {getInitials(user?.name ?? '', 1)}
          <span className='absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-bg-dark bg-success'></span>
        </div>
      </div>
    </div>
  )
}
