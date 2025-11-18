import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/utils'
import { Tooltip } from '@/components/ui'

const buttonVariants = cva(
  'transition-all duration-400 ease-in-out text-[0.9rem] w-full inline-flex items-center justify-center whitespace-nowrap rounded-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-primary text-white hover:bg-primary-950 hover:bg-inactive',
        tertiary: 'text-secondary bg-tertiary-50 border border-border',
        destructive: 'bg-inactive hover:bg-inactive-600 ',
        ghost: 'bg-transparent  border border-transparent',
        link: 'text-primary underline-offset-4 hover:underline',
        invisible: 'bg-transparent rounded-none',
        underline: 'text-primary underline'
      },
      size: {
        default: '!h-12 px-3',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-6',
        icon: 'h-9 w-9 p-0'
      },
      hoverStyle: {
        none: '',
        shine: `
          relative overflow-hidden transition-all duration-300
          hover:-translate-y-[1px] hover:shadow-lg
          before:content-[''] before:absolute before:top-0 before:left-[-100%]
          before:w-full before:h-full
          before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]
          before:transition-all before:duration-300
          hover:before:left-[100%]
        `,
        sidebar: `
          hover:bg-primary/[0.12]
          hover:text-primary
          hover:translate-x-[2px]
          transition-all duration-200
        `,
        create: `
          hover:-translate-y-[1px]
          hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]
          hover:bg-primary-700
        `,
        highlight: `
          hover:bg-tertiary-50
          hover:border-primary
          hover:text-primary
        `
      },
      gradient: {
        none: '',
        primary: 'bg-gradient-to-r from-[#FF6460] to-[#5664ED] text-white shadow-md'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      hoverStyle: 'none',
      gradient: 'none'
    }
  }
)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  tooltip?: string
  sideTooltip?: 'top' | 'right' | 'bottom' | 'left'
  hoverStyle?: 'none' | 'shine' | 'sidebar' | 'create' | 'highlight'
  gradient?: 'none' | 'primary'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      hoverStyle,
      icon,
      asChild = false,
      iconLeft,
      iconRight,
      tooltip,
      sideTooltip,
      gradient,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <>
        {tooltip ? (
          <Tooltip message={tooltip} childrenClassName='flex items-center justify-center' sideTooltip={sideTooltip}>
            <Comp
              className={cn(buttonVariants({ variant, size, className, hoverStyle, gradient }))}
              ref={ref}
              {...props}
            >
              {icon}
              {props.children}
            </Comp>
          </Tooltip>
        ) : (
          <Comp className={cn(buttonVariants({ variant, size, className, hoverStyle, gradient }))} ref={ref} {...props}>
            {icon}
            {props.children}
          </Comp>
        )}
      </>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
