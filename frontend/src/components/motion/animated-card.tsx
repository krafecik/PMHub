'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { Card, type CardProps } from '@/components/ui/card'
import { forwardRef, type ReactNode } from 'react'

export interface AnimatedCardProps extends Omit<CardProps, keyof HTMLMotionProps<'div'>> {
  children?: ReactNode
  delay?: number
  animateHover?: boolean
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, delay = 0, animateHover = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{
          duration: 0.4,
          delay,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        whileHover={
          animateHover
            ? {
                y: -5,
                transition: { duration: 0.2 },
              }
            : undefined
        }
      >
        <Card {...props}>{children}</Card>
      </motion.div>
    )
  },
)

AnimatedCard.displayName = 'AnimatedCard'
