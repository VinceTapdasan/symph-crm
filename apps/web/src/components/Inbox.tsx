'use client'

import { useState } from 'react'
import { DEALS, BRAND_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

type Message = {
  from: string
  text: string
  time: string
  sent: boolean
}

type InboxThread = {
  id: number
  from: string
  email: string
  subject: string
  preview: string
  date: string
  channel: 'email' | 'messenger' | 'viber'
  unread: boolean
  dealIds: number[]
  messages: Message[]
}

const THREADS: InboxThread[] = [
  {
    id: 1,
    from: 'Sir Ricky (Mlhuillier)',
    email: 'ricky@mlhuillier.com.ph',
    subject: 'Re: Asys Platform — Board Presentation',
    preview: 'Thanks for the deck. The board is set for Mar 20...',
    date: 'Mar 21',
    channel: 'email',
    unread: true,
    dealIds: [1],
    messages: [
      { from: 'Sir Ricky', text: 'Thanks for the deck. The board meeting is set for March 20. We will present the proposal alongside two other vendors. Expecting a decision by end of month.', time: 'Mar 21 - 10:14 AM', sent: false },
      { from: 'Gee (You)', text: 'Noted! Will update the pricing sheet and send the revised version by Thursday. Let me know if you need anything else for the board presentation.', time: 'Mar 21 - 11:02 AM', sent: true },
      { from: 'Sir Ricky', text: 'Yes please. Also include the timeline breakdown per phase if possible.', time: 'Mar 21 - 11:47 AM', sent: false },
    ],
  },
  {
    id: 2,
    from: 'Grace (NCC Procurement)',
    email: 'grace@ncc.gov.ph',
    subject: 'NCC App Dev — Requirements Clarification',
    preview: 'Hi, regarding the scope for Phase 1...',
    date: 'Mar 20',
    channel: 'email',
    unread: true,
    dealIds: [4],
    messages: [
      { from: 'Grace', text: 'Hi, regarding the scope for Phase 1, we need clarification on whether the mobile component is included or if that falls under Phase 2.', time: 'Mar 20 - 2:30 PM', sent: false },
      { from: 'Lyra (You)', text: 'Mobile is included in Phase 1 as a responsive web app. Native mobile app is Phase 2. Let me send the detailed scope document.', time: 'Mar 20 - 3:15 PM', sent: true },
    ],
  },
  {
    id: 3,
    from: 'Sir Ricky (Mlhuillier)',
    email: 'ricky@mlhuillier.com.ph',
    subject: 'KP Division — Separate Scope',
    preview: 'For the KP deal, can we get a separate...',
    date: 'Mar 19',
    channel: 'email',
    unread: false,
    dealIds: [2],
    messages: [
      { from: 'Sir Ricky', text: 'For the KP deal, can we get a separate proposal? The division head wants to evaluate independently from Asys.', time: 'Mar 19 - 9:00 AM', sent: false },
    ],
  },
  {
    id: 4,
    from: 'Allan (RCBC IT Head)',
    email: 'allan@rcbc.com',
    subject: 'Re: Onboarding Kickoff',
    preview: 'Looking forward to the kickoff next week...',
    date: 'Mar 18',
    channel: 'email',
    unread: false,
    dealIds: [3],
    messages: [
      { from: 'Allan', text: 'Looking forward to the kickoff next week. Our team will be available Monday and Tuesday. Please share the agenda beforehand.', time: 'Mar 18 - 4:00 PM', sent: false },
      { from: 'Mary (You)', text: 'Great! I will send the agenda and team intro by Friday. See you Monday.', time: 'Mar 18 - 4:30 PM', sent: true },
    ],
  },
  {
    id: 5,
    from: 'Sir Ricky',
    email: '',
    subject: 'Quick update on proposal',
    preview: 'Board moved to next week...',
    date: 'Mar 17',
    channel: 'messenger',
    unread: false,
    dealIds: [1],
    messages: [
      { from: 'Sir Ricky', text: 'Board meeting moved to next week. Will keep you posted.', time: 'Mar 17 - 6:12 PM', sent: false },
      { from: 'Gee (You)', text: 'Thanks for the heads up. Standing by for any updates.', time: 'Mar 17 - 6:30 PM', sent: true },
    ],
  },
  {
    id: 6,
    from: 'JFC Digital Team',
    email: 'digital@jollibee.com.ph',
    subject: 'Delivery Platform v2 — Technical Questions',
    preview: 'We have some questions about the proposed...',
    date: 'Mar 16',
    channel: 'email',
    unread: true,
    dealIds: [6],
    messages: [
      { from: 'JFC Digital Team', text: 'We have some questions about the proposed architecture. Can we schedule a technical deep-dive this week?', time: 'Mar 16 - 11:00 AM', sent: false },
    ],
  },
]

type InboxFilter = 'all' | 'unread' | 'tagged'

const CHANNEL_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  email:     { bg: 'rgba(108,99,255,0.1)',   color: '#6c63ff',  label: 'Email' },
  messenger: { bg: 'rgba(245,158,11,0.1)',   color: '#d97706',  label: 'Messenger' },
  viber:     { bg: 'rgba(37,99,235,0.1)',    color: '#2563eb',  label: 'Viber' },
}

export function Inbox({ onOpenDeal }: { onOpenDeal: (id: number) => void }) {
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [activeThread, setActiveThread] = useState<number | null>(1)
  const [threads, setThreads] = useState(THREADS)
  const [reply, setReply] = useState('')

  const filtered = filter === 'all'
    ? threads
    : filter === 'unread'
      ? threads.filter(t => t.unread)
      : threads.filter(t => t.dealIds.length > 0)

  const selectedThread = threads.find(t => t.id === activeThread)

  function openThread(id: number) {
    setActiveThread(id)
    setThreads(prev => prev.map(t => t.id === id ? { ...t, unread: false } : t))
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] overflow-hidden">

        {/* Left: thread list */}
        <div className={cn(
          'border-r border-black/[.06] flex flex-col overflow-hidden bg-white',
          activeThread !== null ? 'hidden md:flex' : 'flex'
        )}>
          {/* Search */}
          <div className="px-3.5 pt-3.5 pb-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="text-slate-400 shrink-0">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search messages..."
                className="bg-transparent border-none outline-none text-[12px] text-slate-900 placeholder:text-slate-400 w-full"
              />
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 px-3.5 pb-2.5 shrink-0">
            {(['all', 'unread', 'tagged'] as InboxFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors duration-150',
                  filter === f
                    ? 'bg-[#6c63ff] text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(t => {
              const dealLabels = t.dealIds.map(id => {
                const d = DEALS.find(x => x.id === id)
                return d ? { label: d.project, color: BRAND_COLORS[d.brand] || '#57534e' } : null
              }).filter(Boolean) as { label: string; color: string }[]

              const chStyle = CHANNEL_STYLES[t.channel]
              const isActive = activeThread === t.id

              return (
                <div
                  key={t.id}
                  onClick={() => openThread(t.id)}
                  className={cn(
                    'px-3.5 py-2.5 border-b border-black/[.06] cursor-pointer transition-colors duration-150',
                    isActive
                      ? 'bg-[rgba(108,99,255,0.06)]'
                      : 'hover:bg-slate-50'
                  )}
                >
                  {/* Row 1: sender + date + channel badge */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {t.unread && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6c63ff] shrink-0" />
                    )}
                    <span className={cn(
                      'text-[12px] text-slate-900 flex-1 overflow-hidden text-ellipsis whitespace-nowrap',
                      t.unread ? 'font-bold' : 'font-medium'
                    )}>
                      {t.from}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{t.date}</span>
                    <span
                      className="text-[9px] font-semibold px-[5px] py-px rounded shrink-0"
                      style={{ background: chStyle.bg, color: chStyle.color }}
                    >
                      {chStyle.label}
                    </span>
                  </div>

                  {/* Row 2: subject */}
                  <div className={cn(
                    'text-[12px] text-slate-700 mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap',
                    t.unread ? 'font-semibold' : 'font-medium'
                  )}>
                    {t.subject}
                  </div>

                  {/* Row 3: deal tags + tag action */}
                  <div className="flex gap-1 flex-wrap items-center">
                    {dealLabels.map(dl => (
                      <span
                        key={dl.label}
                        className="text-[9px] font-semibold px-1.5 py-px rounded"
                        style={{ background: `${dl.color}18`, color: dl.color }}
                      >
                        {dl.label}
                      </span>
                    ))}
                    <span className="text-[9px] font-medium px-1.5 py-px rounded bg-slate-100 text-slate-400 cursor-pointer hover:bg-slate-200 transition-colors duration-150">
                      + Tag Deal
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: thread view */}
        <div className={cn(
          'flex flex-col overflow-hidden bg-white',
          activeThread !== null ? 'flex' : 'hidden md:flex'
        )}>
          {selectedThread ? (
            <>
              {/* Thread header */}
              <div className="px-5 py-3.5 border-b border-black/[.06] shrink-0">
                {/* Mobile back */}
                <button
                  onClick={() => setActiveThread(null)}
                  className="md:hidden flex items-center gap-1 mb-2 text-[12px] font-medium text-[#6c63ff] hover:text-[#5b52e8] transition-colors duration-150"
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  All messages
                </button>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold text-slate-900 mb-0.5 leading-snug">
                      {selectedThread.subject}
                    </div>
                    <div className="text-[11px] text-slate-400 mb-1.5">
                      {selectedThread.from}
                      {selectedThread.email && (
                        <span className="text-slate-300"> · </span>
                      )}
                      {selectedThread.email && (
                        <span>{selectedThread.email}</span>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {selectedThread.dealIds.map(id => {
                        const d = DEALS.find(x => x.id === id)
                        if (!d) return null
                        return (
                          <span
                            key={id}
                            onClick={(e) => { e.stopPropagation(); onOpenDeal(id) }}
                            className="text-[11px] font-semibold text-[#6c63ff] cursor-pointer hover:text-[#5b52e8] transition-colors duration-150 flex items-center gap-0.5"
                          >
                            {d.project}
                            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button className="px-3 py-1.5 rounded-lg border border-black/[.08] text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 active:scale-[0.98]">
                      Tag Deal
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-black/[.08] text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 active:scale-[0.98]">
                      Archive
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {selectedThread.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'max-w-[78%] rounded-xl px-4 py-3',
                      msg.sent
                        ? 'self-end bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.12)]'
                        : 'self-start bg-white border border-black/[.08]'
                    )}
                  >
                    <div className={cn(
                      'text-[10px] font-semibold mb-1',
                      msg.sent ? 'text-[#6c63ff]' : 'text-slate-500'
                    )}>
                      {msg.from}
                    </div>
                    <div className="text-[13px] text-slate-900 leading-[1.55]">{msg.text}</div>
                    <div className="text-[10px] text-slate-400 mt-1.5 text-right">{msg.time}</div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="px-5 py-3.5 border-t border-black/[.06] shrink-0">
                <Textarea
                  rows={3}
                  placeholder="Reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="w-full bg-slate-50 border-black/[.08] text-[13px] text-slate-900 placeholder:text-slate-400 resize-none mb-2.5 focus-visible:ring-0 focus-visible:border-black/20"
                />
                <div className="flex justify-end gap-1.5">
                  <button className="px-3 py-1.5 rounded-lg border border-black/[.08] text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 active:scale-[0.98]">
                    Save Draft
                  </button>
                  <button className="px-4 py-1.5 rounded-lg bg-[#6c63ff] hover:bg-[#5b52e8] text-white text-[12px] font-semibold transition-colors duration-150 active:scale-[0.98]">
                    Send Reply
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px] text-slate-300">
              Select a thread to read
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
