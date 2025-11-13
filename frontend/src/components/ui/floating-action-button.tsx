import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button, ButtonProps } from './button'
import { motion } from 'framer-motion'

export interface FloatingActionButtonProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  offset?: number
}

const positionClasses = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, position = 'bottom-right', offset = 24, children, ...props }, ref) => {
    return (
      <motion.div
        className={cn('fixed z-50', positionClasses[position])}
        style={{
          margin: offset,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          ref={ref}
          size="icon"
          variant="gradient"
          className={cn('h-14 w-14 rounded-full shadow-lg', className)}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    )
  },
)

FloatingActionButton.displayName = 'FloatingActionButton'
