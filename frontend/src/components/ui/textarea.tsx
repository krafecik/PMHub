import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  minRows?: number
  maxRows?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, minRows, maxRows, style, rows, ...props }, ref) => {
    const baseRowHeight = 24
    const resolvedRows = rows ?? minRows
    const resolvedStyle = {
      ...style,
      ...(minRows ? { minHeight: `${minRows * baseRowHeight}px` } : {}),
      ...(maxRows ? { maxHeight: `${maxRows * baseRowHeight}px` } : {}),
    }

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error-DEFAULT focus-visible:ring-error-DEFAULT',
          className,
        )}
        ref={ref}
        rows={resolvedRows}
        style={resolvedStyle}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
