import { ReactNode } from 'react'
import { cn } from '@/utils/utils'
import { Wrapper } from '@/components/ui'
import { Header, Sidebar } from '@/components/shared'

export interface BaseLayoutProps {
  children: ReactNode
  className?: string
  mainClassName?: string
  isNav?: boolean
  isHeader?: boolean
  titleHeader?: string
}

export function BaseLayout({
  children,
  className = '',
  mainClassName = '',
  isNav = true,
  isHeader = true,
  titleHeader
}: Readonly<BaseLayoutProps>) {
  return (
    <div className={cn('relative flex h-screen min-h-screen', className)}>
      {isNav && <Sidebar />}
      <Wrapper className='flex h-full w-full min-w-0 flex-1 flex-col'>
        {isHeader && <Header titleHeader={titleHeader} />}
        <main
          className={cn('bg-light flex h-full w-full flex-1 flex-col gap-4 overflow-y-auto p-8 pb-4', mainClassName)}
        >
          {children}
        </main>
      </Wrapper>
    </div>
  )
}
