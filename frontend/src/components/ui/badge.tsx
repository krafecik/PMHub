import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-100 text-primary-700 hover:bg-primary-200',
        secondary: 'border-transparent bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
        destructive: 'border-transparent bg-error-light/20 text-error-dark hover:bg-error-light/30',
        outline: 'border border-border text-text-secondary hover:bg-secondary-100',
        success:
          'border-transparent bg-success-light/20 text-success-dark hover:bg-success-light/30',
        warning:
          'border-transparent bg-warning-light/20 text-warning-dark hover:bg-warning-light/30',
        info: 'border-transparent bg-info-light/20 text-info-dark hover:bg-info-light/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
