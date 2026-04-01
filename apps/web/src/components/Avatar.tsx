'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Avatar — Initials-based avatar with a deterministic background color.
 *
 * Color is derived from a hash of `email` (preferred, more stable) or `name`.
 * The palette mirrors Google Workspace's vibrant avatar colors, so users will
 * generally see a color that matches or is close to their Gmail profile color.
 *
 * Pass `src` (Google profile image URL) to show a real photo instead.
 */

// ── Color palette ─────────────────────────────────────────────────────────────
// Ordered to spread visually distinct colors across the hash space.
const PALETTE = [
  '#E91E63', // Fuchsia / Pink  (Google pink)
  '#9C27B0', // Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#0097A7', // Teal
  '#388E3C', // Green
  '#F57C00', // Orange
  '#D32F2F', // Red
  '#7B1FA2', // Deep Purple
  '#0288D1', // Light Blue
  '#00796B', // Dark Teal
  '#C62828', // Dark Red
]

/** DJB2-style 32-bit hash, returns a non-negative integer. */
function strHash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(33, h) ^ s.charCodeAt(i)) | 0
  }
  return h >>> 0 // unsigned 32-bit
}

function nameToColor(seed: string): string {
  return PALETTE[strHash(seed.toLowerCase().trim()) % PALETTE.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0] ?? '?').slice(0, 2).toUpperCase()
}

// ── Component ─────────────────────────────────────────────────────────────────

type AvatarProps = {
  /** Display name — used for initials and as fallback hash seed. */
  name: string
  /** Email address — used as the primary hash seed for color derivation. */
  email?: string
  /** Google profile picture URL. When provided, shown instead of initials. */
  src?: string
  size?: number
  className?: string
}

export function Avatar({ name, email, src, size = 26, className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const showPhoto = !!src && !imgError

  const seed = email || name
  const bg = nameToColor(seed)
  const initials = getInitials(name || email || '?')
  const fontSize = Math.max(7, Math.round(size * 0.38))

  return (
    <div
      className={cn('rounded-full shrink-0 overflow-hidden flex items-center justify-center select-none', className)}
      style={{ width: size, height: size, backgroundColor: showPhoto ? undefined : bg }}
    >
      {showPhoto ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="font-semibold text-white leading-none"
          style={{ fontSize }}
        >
          {initials}
        </span>
      )}
    </div>
  )
}
