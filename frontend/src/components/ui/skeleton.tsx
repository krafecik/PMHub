'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse rounded-md bg-secondary-200/80 dark:bg-secondary-800/40',
          className,
        )}
        {...props}
      />
    )
  },
)

Skeleton.displayName = 'Skeleton'
