'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/lib/query-keys'
import { useEscapeKey } from '@/lib/hooks/use-escape-key'

// ─── Types (matching GmailService output) ────────────────────────────────────

type GmailMessage = {
  id: string
  subject: string
  from: string
  fromEmail: string
  to: string
  cc: string[]
  date: string
  snippet: string
  unread: boolean
  bodyHtml?: string
  bodyText?: string
}

type GmailThread = {
  id: string
  subject: string
  from: string
  fromEmail: string
  latestDate: string
  snippet: string
  unread: boolean
  messageCount: number
  cc: string[]
  messages: GmailMessage[]
}

type InboxResponse = {
  threads: GmailThread[]
  fetchedAt: string
  needsReconnect?: boolean
  error?: string
}

type FilterTab = 'all' | 'unread'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString('en-PH', { weekday: 'short' })
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = ['#6c63ff','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16']
function avatarColor(email: string): string {
  let h = 0
  for (let i = 0; i < email.length; i++) h = email.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function parseDisplayName(address: string): string {
  const match = address.match(/^(.+?)\s*<.+>$/)
  if (match) return match[1].trim().replace(/^["']|["']$/g, '')
  return address.split('@')[0]
}

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchInbox(): Promise<InboxResponse> {
  const res = await fetch('/api/gmail/inbox')
  if (!res.ok) throw new Error('Failed to fetch inbox')
  return res.json()
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ThreadAvatar({ name, email, size = 36 }: { name: string; email: string; size?: number }) {
  const color = avatarColor(email)
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white font-semibold"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {getInitials(name || email)}
    </div>
  )
}

function CcPill({ address }: { address: string }) {
  const display = parseDisplayName(address)
  const email = address.match(/<(.+)>$/)?.[1] ?? address
  const color = avatarColor(email)
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
      style={{ background: `${color}12`, color, borderColor: `${color}25` }}
    >
      {display}
    </span>
  )
}

function ThreadRow({ thread, selected, onClick }: { thread: GmailThread; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3.5 py-3 border-b border-black/[.05] transition-colors duration-150 flex items-start gap-3',
        selected
          ? 'bg-[rgba(108,99,255,0.06)] border-l-2 border-l-[#6c63ff]'
          : 'hover:bg-slate-50 border-l-2 border-l-transparent',
      )}
    >
      <div className="relative shrink-0 mt-0.5">
        <ThreadAvatar name={thread.from} email={thread.fromEmail} size={36} />
        {thread.unread && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#6c63ff] border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn('text-[12.5px] truncate', thread.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>
            {thread.from}
          </span>
          <span className="text-[10.5px] text-slate-400 shrink-0 tabular-nums">
            {formatRelativeDate(thread.latestDate)}
          </span>
        </div>
        <div className={cn('text-[12px] truncate mb-1', thread.unread ? 'font-medium text-slate-800' : 'text-slate-600')}>
          {thread.subject}
        </div>
        <div className="text-[11px] text-slate-400 truncate leading-relaxed">{thread.snippet}</div>
        {thread.messageCount > 1 && (
          <span className="mt-1 inline-block text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 tabular-nums">
            {thread.messageCount} messages
          </span>
        )}
      </div>
    </button>
  )
}

function MessageBubble({ message, isFirst }: { message: GmailMessage; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(isFirst)
  return (
    <div className={cn('border border-black/[.06] rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]', !isFirst && 'mt-3')}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors text-left"
      >
        <ThreadAvatar name={message.from} email={message.fromEmail} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-semibold text-slate-900 truncate">{message.from}</span>
            <span className="text-[10.5px] text-slate-400 shrink-0 tabular-nums">
              {new Date(message.date).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            {expanded ? `to ${message.to}` : message.snippet}
          </div>
        </div>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"
          className={cn('text-slate-400 shrink-0 transition-transform duration-150', expanded && 'rotate-180')}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-black/[.05]">
          {message.cc.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-black/[.04] bg-slate-50/50 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">CC</span>
              <div className="flex flex-wrap gap-1">
                {message.cc.map((addr, i) => <CcPill key={i} address={addr} />)}
              </div>
            </div>
          )}
          <div className="px-4 py-4">
            {message.bodyHtml ? (
              <iframe
                srcDoc={message.bodyHtml}
                className="w-full border-0 min-h-[200px]"
                sandbox="allow-same-origin"
                onLoad={(e) => {
                  const f = e.currentTarget
                  if (f.contentDocument?.body) f.style.height = f.contentDocument.body.scrollHeight + 'px'
                }}
              />
            ) : message.bodyText ? (
              <pre className="text-[12px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{message.bodyText}</pre>
            ) : (
              <p className="text-[12px] text-slate-400 italic">{message.snippet}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ThreadReader({ thread, onClose }: { thread: GmailThread; onClose: () => void }) {
  useEscapeKey(useCallback(onClose, [onClose]))
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-5 py-3.5 border-b border-black/[.06] bg-white flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-semibold text-slate-900 leading-snug mb-1">{thread.subject}</h2>
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[11px] text-slate-400">
              {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
            </span>
            {thread.cc.length > 0 && (
              <>
                <span className="text-slate-200 mx-1">·</span>
                <span className="text-[11px] text-slate-400">CC:</span>
                {thread.cc.slice(0, 4).map((addr, i) => <CcPill key={i} address={addr} />)}
                {thread.cc.length > 4 && <span className="text-[10px] text-slate-400">+{thread.cc.length - 4} more</span>}
              </>
            )}
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-slate-50/40">
        {thread.messages.map((msg, i) => <MessageBubble key={msg.id} message={msg} isFirst={i === 0} />)}
      </div>
    </div>
  )
}

function ConnectPrompt() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 pb-12">
      <div className="w-14 h-14 rounded-full bg-[rgba(108,99,255,0.08)] flex items-center justify-center">
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth={1.5} strokeLinecap="round">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="text-center">
        <div className="text-[13px] font-semibold text-slate-800 mb-1.5">Connect your Google account</div>
        <div className="text-[12px] text-slate-400 leading-relaxed max-w-[260px]">
          Inbox shows this month&apos;s team emails where you&apos;re CC&apos;d. Connect via Calendar to get started.
        </div>
      </div>
      <a
        href="/api/auth/google-calendar/connect"
        className="px-4 py-2 bg-[#6c63ff] hover:bg-[#5b52e8] text-white text-[12px] font-semibold rounded-lg transition-colors duration-150 active:scale-[0.98]"
      >
        Connect Google
      </a>
    </div>
  )
}

function InboxSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="px-3.5 py-3 border-b border-black/[.05] flex items-start gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-2.5 w-10 bg-slate-100 rounded" />
            </div>
            <div className="h-2.5 w-40 bg-slate-100 rounded mb-1.5" />
            <div className="h-2.5 w-full bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function Inbox({ onOpenDeal: _onOpenDeal }: { onOpenDeal: (id: string) => void }) {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.gmail.inbox,
    queryFn: fetchInbox,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const threads = data?.threads ?? []
  const needsReconnect = data?.needsReconnect ?? false
  const apiError = data?.error ?? null

  const filtered = threads.filter(t => {
    if (filter === 'unread' && !t.unread) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        t.subject.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.fromEmail.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q)
      )
    }
    return true
  })

  const selectedThread = selectedId ? threads.find(t => t.id === selectedId) ?? null : null
  const unreadCount = threads.filter(t => t.unread).length

  return (
    <div className="h-full flex overflow-hidden">

      {/* Left panel */}
      <div className="w-[340px] shrink-0 border-r border-black/[.06] flex flex-col h-full bg-white">
        <div className="px-4 pt-4 pb-2.5 shrink-0 border-b border-black/[.05]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-[13px] font-semibold text-slate-900">Inbox</h1>
              {!isLoading && !needsReconnect && (
                <p className="text-[10.5px] text-slate-400 mt-0.5 tabular-nums">
                  {threads.length} thread{threads.length !== 1 ? 's' : ''} this month
                </p>
              )}
            </div>
            {isLoading && (
              <div className="w-4 h-4 rounded-full border-2 border-[#6c63ff]/20 border-t-[#6c63ff] animate-spin" />
            )}
          </div>

          <div className="relative mb-2.5">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx={11} cy={11} r={8} /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search inbox..."
              className="w-full pl-8 pr-3 py-[7px] text-[12px] bg-slate-50 border border-black/[.07] rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c63ff]/40 transition-colors"
            />
          </div>

          <div className="flex gap-1">
            {(['all', 'unread'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors',
                  filter === tab ? 'bg-[#6c63ff] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {tab}
                {tab === 'unread' && unreadCount > 0 && (
                  <span className={cn('ml-1.5 tabular-nums', filter === 'unread' ? 'text-white/70' : 'text-slate-400')}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <InboxSkeleton />
          ) : needsReconnect ? (
            <ConnectPrompt />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="text-slate-400">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-[12.5px] font-semibold text-slate-600 mb-1">
                  {search ? 'No matching threads' : 'No threads yet this month'}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  {search ? 'Try a different search term' : 'Team emails with CC will appear here'}
                </div>
              </div>
            </div>
          ) : (
            filtered.map(thread => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                selected={selectedId === thread.id}
                onClick={() => setSelectedId(thread.id)}
              />
            ))
          )}
        </div>

        {apiError && !needsReconnect && (
          <div className="shrink-0 px-3.5 py-2.5 border-t border-red-100 bg-red-50">
            <p className="text-[11px] text-red-600 leading-relaxed">{apiError}</p>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
        {selectedThread ? (
          <ThreadReader thread={selectedThread} onClose={() => setSelectedId(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white border border-black/[.06] shadow-[0_1px_3px_rgba(17,24,39,0.06)] flex items-center justify-center">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" className="text-slate-300">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div className="text-[12.5px] font-medium text-slate-400">Select a thread to read</div>
          </div>
        )}
      </div>
    </div>
  )
}
