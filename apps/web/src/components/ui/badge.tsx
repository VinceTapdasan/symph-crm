import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xxs font-semibold leading-[18px] whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-accent-dim text-accent',
        success: 'bg-success-dim text-success',
        danger: 'bg-danger-dim text-danger',
        warning: 'bg-warning-dim text-warning',
        info: 'bg-info-dim text-info',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
