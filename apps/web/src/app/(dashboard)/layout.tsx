import { auth } from '@/auth'
import { CrmShell } from '@/components/CrmShell'
import { SessionProvider } from 'next-auth/react'
import { ChatTypingProvider } from '@/lib/chat-typing-context'
import { ChatSidebarProvider } from '@/lib/chat-sidebar-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      <ChatTypingProvider>
        <ChatSidebarProvider>
          <CrmShell>{children}</CrmShell>
        </ChatSidebarProvider>
      </ChatTypingProvider>
    </SessionProvider>
  )
}
