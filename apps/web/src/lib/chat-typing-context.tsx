'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ChatTypingState = {
  /** Sessions where Aria is currently streaming a response. */
  typingSessions: Record<string, boolean>
  /** Sessions that received a response while the user was viewing a different session. */
  unreadSessions: Record<string, boolean>
  /** Mark a session as actively typing (true) or done (false). */
  setTyping: (sessionId: string, value: boolean) => void
  /** Mark a session as having an unread response (called when stream finishes off-session). */
  markUnread: (sessionId: string) => void
  /** Clear unread status when the user navigates to a session. */
  markRead: (sessionId: string) => void
}

const ChatTypingContext = createContext<ChatTypingState>({
  typingSessions: {},
  unreadSessions: {},
  setTyping: () => {},
  markUnread: () => {},
  markRead: () => {},
})

export function ChatTypingProvider({ children }: { children: ReactNode }) {
  const [typingSessions, setTypingSessions] = useState<Record<string, boolean>>({})
  const [unreadSessions, setUnreadSessions] = useState<Record<string, boolean>>({})

  const setTyping = useCallback((sessionId: string, value: boolean) => {
    setTypingSessions(prev => {
      if (!!prev[sessionId] === value) return prev
      const next = { ...prev }
      if (value) {
        next[sessionId] = true
      } else {
        delete next[sessionId]
      }
      return next
    })
  }, [])

  const markUnread = useCallback((sessionId: string) => {
    setUnreadSessions(prev => ({ ...prev, [sessionId]: true }))
  }, [])

  const markRead = useCallback((sessionId: string) => {
    setUnreadSessions(prev => {
      if (!prev[sessionId]) return prev
      const next = { ...prev }
      delete next[sessionId]
      return next
    })
  }, [])

  return (
    <ChatTypingContext.Provider value={{ typingSessions, unreadSessions, setTyping, markUnread, markRead }}>
      {children}
    </ChatTypingContext.Provider>
  )
}

export function useChatTyping() {
  return useContext(ChatTypingContext)
}
