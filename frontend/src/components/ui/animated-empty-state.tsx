'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedEmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function AnimatedEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: AnimatedEmptyStateProps) {
  return (
    <motion.div
      className={cn('flex flex-col items-center justify-center text-center', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="mb-4 rounded-full bg-secondary-100 p-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
          delay: 0.1,
        }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{
            duration: 0.5,
            delay: 0.6,
            ease: 'easeInOut',
          }}
        >
          {icon}
        </motion.div>
      </motion.div>

      <motion.h3
        className="mb-2 text-lg font-medium text-text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="mb-6 max-w-sm text-sm text-text-secondary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {description}
      </motion.p>

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}

// Animated illustration component for larger empty states
export function AnimatedIllustration({ type = 'empty' }: { type?: 'empty' | 'error' | 'search' }) {
  const illustrations = {
    empty: (
      <svg viewBox="0 0 200 200" className="h-32 w-32">
        <motion.circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-secondary-300"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        <motion.path
          d="M60 90 L80 90 M120 90 L140 90 M80 130 Q100 140 120 130"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-secondary-400"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 200 200" className="h-32 w-32">
        <motion.circle
          cx="80"
          cy="80"
          r="50"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-secondary-300"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.line
          x1="115"
          y1="115"
          x2="150"
          y2="150"
          stroke="currentColor"
          strokeWidth="3"
          className="text-secondary-400"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
        <motion.text
          x="80"
          y="85"
          textAnchor="middle"
          className="text-2xl text-secondary-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          ?
        </motion.text>
      </svg>
    ),
    error: (
      <svg viewBox="0 0 200 200" className="h-32 w-32">
        <motion.path
          d="M100 20 L180 150 L20 150 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-error-light"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        <motion.text
          x="100"
          y="110"
          textAnchor="middle"
          className="text-error-DEFAULT text-4xl font-bold"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          !
        </motion.text>
      </svg>
    ),
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="mb-6"
    >
      {illustrations[type]}
    </motion.div>
  )
}
