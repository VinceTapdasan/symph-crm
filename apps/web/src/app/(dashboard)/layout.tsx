import { auth } from '@/auth'
import { CrmShell } from '@/components/CrmShell'
import { SessionProvider } from 'next-auth/react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      <CrmShell>{children}</CrmShell>
    </SessionProvider>
  )
}
