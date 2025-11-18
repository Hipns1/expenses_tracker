import clsx from 'clsx'

const sizes = {
  xs: '5',
  sm: '20',
  md: '50',
  lg: '70',
  xl: '100'
}

const variants = {
  light: '#f8f8f8',
  primary: '#90b567',
  secondary: '#1F2B62'
}

export type SpinnerProps = {
  size?: keyof typeof sizes
  variant?: keyof typeof variants
  className?: string
}

export const Spinner = ({
  size = 'md',
  variant = 'primary',
  className = ''
}: SpinnerProps) => {
  return (
    <>
      <svg
        width={sizes[size]}
        height={sizes[size]}
        stroke={variants[variant]}
        viewBox='0 0 100 100'
        xmlns='http://www.w3.org/2000/svg'
        fill='currentColor'
      >
        <g
          className={clsx(
            'spinner_V8m1',
            sizes[size],
            variants[variant],
            className
          )}
        >
          <circle
            cx='50'
            cy='50'
            r='35'
            stroke='currentColor'
            strokeWidth='10'
            fill='none'
            opacity='0.25'
          />
          <circle
            cx='50'
            cy='50'
            r='35'
            stroke='currentColor'
            strokeWidth='10'
            fill='none'
            strokeDasharray='164.93361431346415 56.97787143782138'
          >
            <animateTransform
              attributeName='transform'
              type='rotate'
              repeatCount='indefinite'
              dur='1s'
              values='0 50 50;360 50 50'
              keyTimes='0;1'
            />
          </circle>
        </g>
      </svg>
      <span className='sr-only'>Cargando</span>
    </>
  )
}
