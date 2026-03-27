'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

function RoleBadge({ role }: { role: string }) {
  const isSales = role === 'SALES'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
        isSales
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
      }`}
    >
      {isSales ? '⚡ Sales' : '🔧 Build'}
    </span>
  )
}

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)

  const role = (session?.user as any)?.role ?? 'BUILD'
  const userId = session?.user?.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/users/onboarding`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            firstName: firstName.trim(),
            middleName: middleName.trim(),
            lastName: lastName.trim(),
            nickname: nickname.trim() || null,
          }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body?.message ?? 'Something went wrong. Please try again.')
          return
        }

        // Refresh the JWT to pick up isOnboarded = true
        await update({ refreshUser: true })
        router.replace('/')
      } catch {
        setError('Network error. Please check your connection and try again.')
      }
    })
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-extrabold text-white tracking-tight"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--color-primary-accent))' }}
          >
            S
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Symph CRM</div>
            <div className="text-[11px] text-slate-400">Sales Pipeline</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-black/[.06] dark:border-white/[.08] shadow-sm p-7">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Set up your profile
            </h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Let&apos;s get you set up. This only takes a minute.
            </p>
          </div>

          {/* Role indicator */}
          <div className="flex items-center justify-between mb-5 py-3 px-3.5 rounded-lg bg-slate-50 dark:bg-white/[.04] border border-slate-100 dark:border-white/[.06]">
            <div>
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
                Your role
              </div>
              <RoleBadge role={role} />
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 text-right leading-snug max-w-[160px]">
              {role === 'SALES'
                ? 'Full access to all pipeline features'
                : 'View-only access to pipeline data'}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* First name */}
              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="firstName"
                  className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide"
                >
                  First name <span className="text-red-400">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Mary"
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors"
                />
              </div>

              {/* Middle name */}
              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="middleName"
                  className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide"
                >
                  Middle name <span className="text-red-400">*</span>
                </label>
                <input
                  id="middleName"
                  type="text"
                  required
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Santos"
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* Last name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide"
              >
                Last name <span className="text-red-400">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Amora"
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Nickname */}
            <div>
              <label
                htmlFor="nickname"
                className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide"
              >
                Nickname <span className="text-slate-300 dark:text-slate-600 font-normal normal-case">(optional)</span>
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="How do your teammates call you?"
                className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--color-primary-accent))' }}
            >
              {isPending ? 'Setting up…' : 'Complete setup →'}
            </button>
          </form>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-4">
          Symph internal use only
        </p>
      </div>
    </div>
  )
}
