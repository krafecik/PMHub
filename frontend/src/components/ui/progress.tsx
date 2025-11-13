import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full bg-primary-500 transition-all dark:bg-primary-600',
            indicatorClassName,
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </div>
    )
  },
)
Progress.displayName = 'Progress'

export { Progress }
