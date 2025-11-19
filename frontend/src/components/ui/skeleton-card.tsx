'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface SkeletonCardProps {
  className?: string
  variant?: 'demanda' | 'produto' | 'default'
  count?: number
}

export function SkeletonCard({ className, variant = 'default', count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} variant="elevated" className={cn('animate-pulse', className)}>
          {variant === 'demanda' && <DemandaSkeleton />}
          {variant === 'produto' && <ProdutoSkeleton />}
          {variant === 'default' && <DefaultSkeleton />}
        </Card>
      ))}
    </>
  )
}

function DemandaSkeleton() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="h-12 w-12 rounded-lg bg-secondary-200" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-secondary-200" />
          <div className="h-8 w-8 rounded-md bg-secondary-200" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-2 h-5 w-3/4 rounded bg-secondary-200" />
      <div className="mb-4 h-5 w-1/2 rounded bg-secondary-200" />

      {/* Description */}
      <div className="mb-4 space-y-2">
        <div className="h-3 w-full rounded bg-secondary-200" />
        <div className="h-3 w-full rounded bg-secondary-200" />
        <div className="h-3 w-2/3 rounded bg-secondary-200" />
      </div>

      {/* Tags */}
      <div className="mb-4 flex gap-2">
        <div className="h-5 w-20 rounded-full bg-secondary-200" />
        <div className="h-5 w-24 rounded-full bg-secondary-200" />
        <div className="h-5 w-16 rounded-full bg-secondary-200" />
      </div>

      {/* Footer */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-secondary-200" />
          <div className="flex gap-3">
            <div className="h-3 w-8 rounded bg-secondary-200" />
            <div className="h-3 w-8 rounded bg-secondary-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProdutoSkeleton() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-secondary-200" />
          <div>
            <div className="mb-2 h-5 w-32 rounded bg-secondary-200" />
            <div className="h-5 w-16 rounded-full bg-secondary-200" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-md bg-secondary-200" />
      </div>

      {/* Description */}
      <div className="mb-4 space-y-2">
        <div className="h-3 w-full rounded bg-secondary-200" />
        <div className="h-3 w-2/3 rounded bg-secondary-200" />
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="mb-1 h-4 w-4 rounded bg-secondary-200" />
            <div className="mb-1 h-6 w-12 rounded bg-secondary-200" />
            <div className="h-3 w-16 rounded bg-secondary-200" />
          </div>
        ))}
      </div>

      {/* Health Ring */}
      <div className="mb-4 flex items-center justify-center">
        <div className="h-24 w-24 rounded-full bg-secondary-200" />
      </div>

      {/* Footer */}
      <div className="border-t pt-4">
        <div className="mx-auto h-3 w-32 rounded bg-secondary-200" />
      </div>
    </div>
  )
}

function DefaultSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-6 w-3/4 rounded bg-secondary-200" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-secondary-200" />
        <div className="h-4 w-full rounded bg-secondary-200" />
        <div className="h-4 w-2/3 rounded bg-secondary-200" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 rounded-md bg-secondary-200" />
        <div className="h-8 w-20 rounded-md bg-secondary-200" />
      </div>
    </div>
  )
}

// Shimmer effect overlay
export function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  )
}
