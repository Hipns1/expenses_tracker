import { useAuth } from '@/hooks'
import { getInitials } from '@/utils'

export const Header = ({ titleHeader }: { titleHeader?: string }) => {
  const { user } = useAuth()

  return (
    <div className='border-border flex items-center justify-between gap-4 px-8 py-4 shadow-sm'>
      <div className='ml-6 md:ml-0'>
        <h1 className='text-dark text-sm font-normal md:text-2xl md:font-bold'>{titleHeader}</h1>
        <h2 className='text-secondary hidden text-xs md:block'>
          <span className='text-primary'>Inicio /</span>
          <span> {titleHeader}</span>
        </h2>
      </div>

      <div className='hidden items-center gap-2 md:flex'>
        <div className='bg-gradient-primary relative flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white'>
          {getInitials(user?.name ?? '', 1)}
          <span className='absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500'></span>
        </div>
        <div className='text-secondary flex flex-col gap-1'>
          <span className='text-sm font-semibold'>{user?.name}</span>
          <span className='text-xs'>Cliente Premium</span>
        </div>
      </div>
    </div>
  )
}
