import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { useAccessibleRoutes } from '@/hooks/use-accessible-routes'
import { useBoundStore } from '@/hooks/use-bound-store'
import { Providers } from '@/providers'
import { PUBLIC_URL } from '@/utils/consts'
import './styles/global.css'

function App() {
  const user = useBoundStore((s) => s.user)
  const { accessibleRoutes } = useAccessibleRoutes(user)

  return (
    <RouterProvider
      router={createBrowserRouter(
        [
          {
            children: accessibleRoutes,
            element: <Providers />
          }
        ],
        { basename: PUBLIC_URL }
      )}
    />
  )
}

export default App
