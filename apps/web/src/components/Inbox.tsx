'use client'

import { EmptyState } from './EmptyState'

export function Inbox({ onOpenDeal: _onOpenDeal }: { onOpenDeal: (id: number) => void }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          title="No messages yet"
          description="Emails and messages linked to deals will appear here"
        />
      </div>
    </div>
  )
}
