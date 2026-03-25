import { AM_GRADIENTS } from '@/lib/constants'
import { cn } from '@/lib/utils'

type AvatarProps = {
  name: string
  size?: number
  className?: string
}

export function Avatar({ name, size = 26, className }: AvatarProps) {
  const bg = AM_GRADIENTS[name] || '#334155'
  const fontSize = Math.round(size * 0.4)

  return (
    <div
      className={cn('rounded-full flex items-center justify-center shrink-0 font-bold text-white tracking-[-0.02em]', className)}
      style={{ width: size, height: size, background: bg, fontSize }}
    >
      {name[0]}
    </div>
  )
}
