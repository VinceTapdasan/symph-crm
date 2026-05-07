/**
 * Compatibility re-export.
 *
 * The actual implementation moved to `lib/auth-context.tsx` so the user
 * shape is computed ONCE at the AuthUserProvider boundary and consumed
 * synchronously via Context. Components calling `useUser()` see no change.
 */
export { useUser, useApiHeaders } from '@/lib/auth-context'
