'use client'

/**
 * AuthUserProvider — single source of truth for the current user.
 *
 * Why this exists:
 *   Calling `useSession()` directly in every component triggers `status: 'loading'`
 *   on every remount, which makes back-navigation feel sluggish (skeleton flashes
 *   while session re-resolves). Instead, we call `useSession()` ONCE here, expose
 *   the resolved shape via React Context, and have every consumer read it
 *   synchronously via `useUser()` — no async, no `enabled: !!userId` deadlocks.
 *
 *   Pattern lifted from /work/ml-asys (AuthUserProvider) — works perfectly there.
 *
 * Drop-in compat:
 *   `useUser()` returns the same shape as the old `lib/hooks/use-user.ts` hook,
 *   so existing call sites don't change.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'

type UserShape = {
  userId: string | null
  user: any
  role: 'SALES' | 'BUILD'
  isSales: boolean
  isBuild: boolean
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthUserContext = createContext<UserShape | null>(null)

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  const value = useMemo<UserShape>(() => {
    const role = ((session?.user as any)?.role as 'SALES' | 'BUILD' | undefined) ?? 'BUILD'
    return {
      userId: session?.user?.id ?? null,
      user: session?.user ?? null,
      role,
      isSales: role === 'SALES',
      isBuild: role !== 'SALES',
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
    }
  }, [session, status])

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>
}

export function useUser(): UserShape {
  const ctx = useContext(AuthUserContext)
  if (!ctx) {
    // Fallback: if a component renders outside AuthUserProvider, fall through to
    // the raw session hook. Keeps backwards-compat for any tree that hasn't been
    // wrapped yet (e.g. error boundaries, isolated test renders).
    // Lint disable: hooks rule — this fallback path is stable per render tree.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: session, status } = useSession()
    const role = ((session?.user as any)?.role as 'SALES' | 'BUILD' | undefined) ?? 'BUILD'
    return {
      userId: session?.user?.id ?? null,
      user: session?.user ?? null,
      role,
      isSales: role === 'SALES',
      isBuild: role !== 'SALES',
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
    }
  }
  return ctx
}

/** Headers helper for components that build their own fetch calls. */
export function useApiHeaders() {
  const { userId } = useUser()
  return {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
  }
}
