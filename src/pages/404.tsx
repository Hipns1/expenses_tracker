import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useStoredRoleRoutes } from '@/hooks'

export function NotFound() {
  const navigate = useNavigate()
  const { roleRoutes } = useStoredRoleRoutes()

  return (
    <div className='text-secondary relative flex h-screen items-center justify-center bg-center'>
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <div className='mb-12'></div>
        <div className='relative w-full text-center font-bold'>
          <h3 className='text-xl'>Oops! Página no encontrada</h3>
          <h1 className='mt-4 text-9xl font-bold'>
            <span>4</span>
            <span>0</span>
            <span>4</span>
          </h1>
        </div>
        <h2 className='mt-4 w-[450px] text-center text-xl font-bold'>
          Lo sentimos, pero la página que solicitaste no fue encontrada
        </h2>
        <Button
          size={'lg'}
          onClick={() => navigate(`${roleRoutes[0].path}`)}
          className='mt-16 px-4 text-center text-xl font-bold'
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}
