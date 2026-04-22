'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ChatSidebarState = {
  /** Whether the chat session sidebar is open (mobile overlay) */
  isOpen: boolean
  /** Toggle the sidebar open/closed */
  toggle: () => void
  /** Explicitly close the sidebar */
  close: () => void
}

const ChatSidebarContext = createContext<ChatSidebarState>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

export function ChatSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useCallback(() => setIsOpen(v => !v), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <ChatSidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </ChatSidebarContext.Provider>
  )
}

export function useChatSidebar() {
  return useContext(ChatSidebarContext)
}
