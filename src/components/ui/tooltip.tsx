import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/utils/utils'

interface TooltipProps {
  message: string
  children: React.ReactNode
  className?: string
  childrenClassName?: string
  sideTooltip?: 'top' | 'right' | 'bottom' | 'left'
}

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'bg-tooltip animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm font-semibold shadow-sm',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))

TooltipContent.displayName = TooltipPrimitive.Content.displayName

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ message, children, className, sideTooltip = 'top', childrenClassName }, ref) => {
    return (
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <div ref={ref} className={cn('', childrenClassName)}>
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent className={cn('', className)} side={sideTooltip}>
            <p>{message}</p>
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    )
  }
)
