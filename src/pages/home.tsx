import { Button } from '@/components/ui'
import { BaseLayout } from '@/components/shared/base-layout'
import { useAuth } from '@/hooks'

export default function Home() {
  const { logout, user } = useAuth()

  return (
    <BaseLayout>
      Hola, {user?.name}
      <Button onClick={() => logout()}>Logout</Button>
    </BaseLayout>
  )
}
