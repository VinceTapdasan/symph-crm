import { useSession } from 'next-auth/react'

/**
 * useUser — returns the current authenticated user from NextAuth session.
 *
 * Usage:
 *   const { userId, user, role, isSales, isLoading } = useUser()
 *   // Pass userId as 'x-user-id' header to API calls
 *
 * userId is the DB-stable id (synced from Google OAuth via POST /api/users/sync).
 * role is 'SALES' | 'BUILD' (auto-assigned from email list on every login).
 */
export function useUser() {
  const { data: session, status } = useSession()

  const role = (session?.user as any)?.role as 'SALES' | 'BUILD' | undefined
  return {
    userId: session?.user?.id ?? null,
    user: session?.user ?? null,
    role: role ?? 'BUILD',
    isSales: role === 'SALES',
    isBuild: role !== 'SALES',
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}

/**
 * apiHeaders — returns headers with the current user ID for API calls.
 * The RolesGuard on the API reads x-user-id to look up the user's role from DB.
 *
 * Usage:
 *   const headers = useApiHeaders()
 *   fetch(`${API}/deals`, { headers })
 */
export function useApiHeaders() {
  const { userId } = useUser()
  return {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
  }
}
