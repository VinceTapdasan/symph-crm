'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthUserProvider } from '@/lib/auth-context'

/**
 * Auth layout — purely client-side, mirrors (dashboard)/layout.tsx.
 * Login/onboarding pages also benefit from synchronous `useUser()` reads.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthUserProvider>{children}</AuthUserProvider>
    </SessionProvider>
  )
}
