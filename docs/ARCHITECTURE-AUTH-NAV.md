# Frontend Auth Architecture — Next.js App Router

How auth identity flows through the frontend. Not how auth is *done* (that's the backend's job), but how the FE consumes it cleanly so navigation stays fast and components don't fight the session lifecycle.

The pattern is straightforward. Once it's in place, route progress bars, TanStack Query gating, and back-navigation all just work — none of those need workarounds.

---

## The split: gating vs. identity

Two distinct concerns. Confusing them is the root cause of nearly every "back button is stuck", "skeleton flashes everywhere", "loader spins forever" pathology.

| Concern | Question it answers | Where it lives |
|---|---|---|
| **Gating** | "Is this request allowed to reach this URL?" | Middleware (edge) |
| **Identity** | "Who is the current user, and what can they see?" | React Context (client) |

Gating happens once per request, before any rendering. Identity is read continuously while rendering. Mixing them — e.g. `await auth()` inside a layout — couples a per-request server check to every component render and produces the stuck-loader symptoms.

---

## The three layers

```
┌─────────────────────────────────────────────────────────┐
│  Edge middleware                                         │
│    - Validates session cookie                            │
│    - Redirects unauth → /login                           │
│    - Redirects unonboarded → /onboarding                 │
│    - Decides BEFORE any layout/page renders             │
└────────────────────────┬────────────────────────────────┘
                         ↓ allowed request
┌─────────────────────────────────────────────────────────┐
│  Client layout (e.g. (dashboard)/layout.tsx)             │
│    - 'use client' — NO async, NO await auth()            │
│    - Wraps children in:                                  │
│      • <SessionProvider>      (NextAuth, no session prop)│
│      • <AuthUserProvider>     (calls useSession() once)  │
│      • <QueryClientProvider>  (TanStack)                 │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Components                                              │
│    - useUser() reads from Context — synchronous          │
│    - No useSession() calls anywhere downstream           │
│    - TanStack queries gate on Context userId, not async  │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Middleware (gating only)

This is the only place that knows whether a request should be served. Layouts and pages don't gate access; the middleware did that already.

`src/middleware.ts`:

```ts
export { auth as middleware } from './auth'

export const config = {
  matcher: [
    // Match all paths except API auth routes, Next internals, and PWA files
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sw\\.js).*)',
  ],
}
```

`src/auth.ts` exports the `auth` callback that NextAuth turns into middleware. Inside, the `authorized` callback enforces redirect rules:

```ts
authorized({ auth: session, request: { nextUrl } }) {
  const isLoggedIn = !!session?.user
  const isOnboarded = session?.user?.isOnboarded ?? false

  if (!isLoggedIn) {
    return nextUrl.pathname === '/login'
      ? true
      : Response.redirect(new URL('/login', nextUrl))
  }
  if (!isOnboarded && nextUrl.pathname !== '/onboarding') {
    return Response.redirect(new URL('/onboarding', nextUrl))
  }
  return true
}
```

By the time any client code runs, the user is allowed to be there. No layout has to re-check.

---

## Layer 2 — `AuthUserProvider` (identity, once)

Calls `useSession()` exactly once at the top of the protected tree. Resolves it into a stable shape and serves it via Context. Every component below reads synchronously.

`src/lib/auth-context.tsx`:

```tsx
'use client'

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
  if (ctx) return ctx
  // Fallback for components rendered outside provider tree (tests, error boundaries).
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
```

Why this matters:

- `useSession()` re-evaluates on every component mount. On back-navigation, that means dozens of components each briefly seeing `status: 'loading'`. With the Context, only `AuthUserProvider` subscribes; the rest read a memoized value.
- `enabled: !!userId` gates on TanStack queries used to flicker because `userId` was momentarily null on remount. From Context it's stable across renders within the same session.

---

## Layer 3 — Client layouts

Layouts in protected route groups are pure client components. No `async`, no `await auth()`, no server-side session read.

`src/app/(dashboard)/layout.tsx`:

```tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthUserProvider } from '@/lib/auth-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthUserProvider>
        {/* your existing app shell, sidebars, providers */}
        {children}
      </AuthUserProvider>
    </SessionProvider>
  )
}
```

Two non-obvious points:

- `SessionProvider` has **no `session` prop**. NextAuth client fetches `/api/auth/session` once on mount, caches it, and never blocks a navigation again. The 50ms initial fetch is masked by `AuthUserProvider`'s `isLoading` field, which most components ignore (skeletons render via `useQuery` loading state, not auth state).
- The function is **not async**. An async layout is a server component; a server component blocks RSC streaming on every navigation while it awaits. That's the back-button-stuck source.

Same shape for the auth route group (`(auth)/layout.tsx`) so login and onboarding pages also benefit from the sync `useUser()`.

---

## Why route progress bars work flawlessly after this

A route progress library (`@bprogress/next`, `nextjs-toploader`, etc.) hooks `pushState` / `popstate` to start a bar, and a `pathname` effect to complete it. The completion only fires when the destination layout/page actually finishes rendering.

When a layout is `async`-with-`await auth()`:

- `popstate` fires → bar starts
- Server stalls in `await auth()` for 100–300ms
- RSC payload streams late → pathname effect fires late → bar completes late
- If anything else in the chain (TanStack query, `enabled: false` deadlock from loading session) fails to settle, the bar appears stuck

Once the layout is a plain client component:

- `popstate` fires → bar starts
- Layout renders immediately from cache
- `pathname` effect fires on the same tick → bar completes
- Subjective feel: navigation is instant, bar is a quick flash

The progress bar choice (custom vs. library) becomes a non-issue. Any reasonable library works because the underlying lifecycle is no longer broken.

```tsx
// providers.tsx — typical wiring with @bprogress/next
'use client'
import { ProgressProvider } from '@bprogress/next/app'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
  }))
  return (
    <ProgressProvider height="2px" color="#1547e6" options={{ showSpinner: false }} shallowRouting>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </ProgressProvider>
  )
}
```

`shallowRouting` skips the bar on URL-only changes (search-param updates), so a checkbox toggle doesn't flash.

---

## What you don't do

- **Don't `await auth()` inside layouts.** Middleware did the gating. The only thing the layout was using `auth()` for was passing `session` to `SessionProvider`, which isn't worth the per-navigation server roundtrip.
- **Don't call `useSession()` outside `AuthUserProvider`.** Direct calls reintroduce the loading-state flash. The Context is the single subscriber.
- **Don't gate auth at the layout level.** Layouts assume the user is allowed to be here because middleware already enforced it. Gating in the layout duplicates work and creates lag.
- **Don't bump TanStack `staleTime` to mask the symptom.** It papers over a misshapen architecture. Fix the layers; let `staleTime` do its actual job.
- **Don't pass an initial `session` prop to `SessionProvider`** (that's what async layouts were for). The brief client-side fetch is invisible in practice and avoids the cost on every nav.

---

## How a request flows

Cold load of `/dashboard/deals/123`:

1. Browser → edge middleware. Session cookie validates, request allowed.
2. Server streams the layout RSC payload (fast — no awaits).
3. Client hydrates. `<SessionProvider>` mounts and starts fetching `/api/auth/session`.
4. `<AuthUserProvider>` renders with `isLoading: true`, `userId: null` for one tick.
5. Session response lands (~50ms). Provider re-renders with the resolved user.
6. `<DealsDetailPage>` reads `useUser()` from Context, fires its `useQuery` for the deal.

Back-navigation from `/dashboard/deals/123` → `/dashboard`:

1. Browser → edge middleware. Allowed (session cookie still valid).
2. Client renders `/dashboard` immediately from React's cached tree.
3. `useUser()` returns the same Context value as before — no re-resolution.
4. TanStack Query checks cache for the dashboard's queries. Within 60s `staleTime`, cached data renders instantly.
5. Progress bar started on `popstate`, completed on `pathname` change in the same render tick. Fades out after ~200ms.

---

## Stack assumptions

- Next.js 13.4+ App Router (route groups via `(group)/`)
- NextAuth v5 (`auth` export, `authorized` callback drives middleware)
- TanStack Query v5
- TypeScript

For Pages Router or NextAuth v4, the layering still applies but the implementations differ.
