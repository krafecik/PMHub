'use client'

import { motion } from 'framer-motion'
import { ComponentPropsWithoutRef } from 'react'
interface ScaleInProps extends ComponentPropsWithoutRef<typeof motion.div> {
  delay?: number
  duration?: number
  initialScale?: number
  className?: string
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  initialScale = 0.8,
  className,
  ...props
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: initialScale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: initialScale }}
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1], // easeOut
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
