'use client'

import { Avatar } from './Avatar'
import { cn } from '@/lib/utils'
import type { ApiUser } from '@/lib/types'

type UserOptionProps = {
  user: ApiUser
  /** Avatar pixel size — defaults to 18 to fit shadcn CommandItem rows */
  size?: number
  className?: string
}

/**
 * Renders a user as Avatar + display name in a single row. Drop into shadcn
 * CommandItem (or any picker row) so all user pickers render consistently with
 * Google profile pictures and deterministic-color initials as fallback.
 */
export function UserOption({ user, size = 18, className }: UserOptionProps) {
  const label = user.name || user.email
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <Avatar
        name={user.name ?? undefined}
        email={user.email ?? undefined}
        src={user.image ?? undefined}
        size={size}
      />
      <span className="truncate text-ssm">{label}</span>
    </div>
  )
}
