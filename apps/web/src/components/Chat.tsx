'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MOCK_RESPONSES: { pattern: RegExp; response: string }[] = [
  {
    pattern: /follow.?up|dormant|unreplied/i,
    response: 'Based on your pipeline, 2 deals need attention this week:\n\n1. **Mlhuillier KP Division App** — last activity 3 days ago. Gee should send the separate scope proposal Sir Ricky requested.\n\n2. **PenBrothers Staff Augmentation** — lead captured 6 days ago, still in Lead stage. Vince should schedule an intro call.\n\nBoth are past the 3-day follow-up threshold. Want me to draft follow-up messages for either?',
  },
  {
    pattern: /mlhuillier|asys/i,
    response: 'Here is the Mlhuillier pipeline summary:\n\n**Asys Digital Platform** — Demo + Proposal stage, P2.5M\n- AM: Gee\n- Sir Ricky loved the demo (9/10)\n- Waiting on board approval (Mar 24 deadline)\n- Proposal and credential deck sent\n\n**KP Division App** — Assessment stage, P800K\n- AM: Gee\n- Sir Ricky requested a separate proposal for this division\n- 9 days in current stage\n\nTotal Mlhuillier exposure: P3.3M across 2 active deals.',
  },
  {
    pattern: /win rate|performance|leaderboard/i,
    response: 'AM performance breakdown:\n\n| AM | Win Rate | Pipeline |\n|---|---|---|\n| Vince | 100% | P1.4M |\n| Mary | 75% | P5.7M |\n| Gee | 68% | P8.2M |\n| Lyra | 50% | P3.1M |\n\nVince has the highest win rate at 100%, but with only 1 deal. Mary leads in efficiency with 75% across 4 deals. Gee carries the largest pipeline at P8.2M.',
  },
  {
    pattern: /draft|email|message/i,
    response: 'Here is a draft follow-up for NCC:\n\n---\n\nHi Grace,\n\nFollowing up on our earlier conversation about the Phase 1 scope. I have attached the detailed scope document clarifying the mobile component (responsive web in Phase 1, native in Phase 2).\n\nWould you be available for a quick call this week to walk through the requirements? Happy to align on any open questions before we finalize the proposal.\n\nBest,\nLyra\n\n---\n\nWant me to adjust the tone or add anything?',
  },
  {
    pattern: /pipeline|total|overview|summary/i,
    response: 'Pipeline overview as of today:\n\n- **Total Pipeline:** P18.4M across 12 active deals\n- **Win Rate:** 68% (+5% vs last quarter)\n- **Avg Deal Size:** P1.5M\n\nStage distribution:\n- Lead: 1 deal (PenBrothers)\n- Discovery: 2 deals (NCC, Jollibee)\n- Assessment: 1 deal (Mlhuillier KP)\n- Demo + Proposal: 1 deal (Mlhuillier Asys)\n- Won: 1 deal (RCBC at P3.2M)\n\nBiggest opportunity: Jollibee Delivery Platform v2 at P5.5M, currently in Discovery.',
  },
]

function getMockResponse(input: string): string {
  for (const mock of MOCK_RESPONSES) {
    if (mock.pattern.test(input)) return mock.response
  }
  return 'I looked at your current pipeline data. You have 12 active deals worth P18.4M total. The most urgent items are the Mlhuillier board review this week and the PenBrothers intro call that needs scheduling.\n\nIs there a specific deal or metric you want to dig into?'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const SUGGESTED_PROMPTS = [
  { label: 'Follow-up deals', prompt: 'What deals need follow-up this week?' },
  { label: 'Mlhuillier pipeline', prompt: 'Summarize the Mlhuillier Asys pipeline' },
  { label: 'AM performance', prompt: 'Which AMs have the highest win rate?' },
  { label: 'Draft email for NCC', prompt: 'Draft a follow-up email for NCC' },
]

function renderContent(text: string) {
  return text.split('\n').map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/)
    const rendered = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
      }
      return <span key={partIdx}>{part}</span>
    })
    return (
      <span key={lineIdx}>
        {lineIdx > 0 && <br />}
        {rendered}
      </span>
    )
  })
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400"
          style={{
            animation: 'typingDot 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [focused, setFocused] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function sendMessage(text: string) {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const response = getMockResponse(text)
      const assistantMsg: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', content: response }
      setMessages(prev => [...prev, assistantMsg])
      setTyping(false)
    }, 800 + Math.random() * 400)
  }

  function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed || typing) return
    sendMessage(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isEmpty = messages.length === 0 && !typing

  const inputBox = (
    <div className="max-w-[680px] w-full mx-auto">
      <div
        className={cn(
          'rounded-2xl bg-white transition-all duration-150',
          focused
            ? 'border border-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_3px_rgba(0,0,0,0.05)]'
            : 'border border-black/[.08] shadow-[var(--shadow-card)]'
        )}
      >
        <div className="px-4 pt-4 pb-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            disabled={typing}
            rows={1}
            className={cn(
              'w-full bg-transparent border-none outline-none text-[14px] text-slate-900 leading-[1.6] resize-none overflow-hidden placeholder:text-slate-400',
              typing && 'opacity-50'
            )}
            style={{ minHeight: '28px', maxHeight: '160px' }}
          />
        </div>

        <div className="flex items-center gap-1.5 px-3 pb-3 pt-1">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <div className="flex-1" />

          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150">
            <span className="text-[12px] font-medium">Symph AI</span>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10a7 7 0 0014 0" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          <button
            onClick={handleSubmit}
            disabled={typing || !input.trim()}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 active:scale-[0.94]',
              input.trim() && !typing
                ? 'bg-[#6c63ff] hover:bg-[#5b52e8] cursor-pointer'
                : 'bg-slate-100 cursor-default'
            )}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={input.trim() && !typing ? '#fff' : '#94a3b8'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6 max-w-[680px] w-full">
          {/* Greeting */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-[15px] shrink-0"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)' }}
            >
              S
            </div>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">
              {getGreeting()}, Gee
            </h1>
          </div>

          {inputBox}

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.prompt}
                onClick={() => sendMessage(p.prompt)}
                className="px-3.5 py-2 rounded-xl bg-white border border-black/[.08] text-[12px] font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] transition-colors duration-150 shadow-[var(--shadow-card)]"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] w-full mx-auto px-6 pt-8 pb-4 flex flex-col gap-5">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[78%] px-4 py-3 rounded-2xl bg-[rgba(108,99,255,0.08)] border border-[rgba(108,99,255,0.12)] text-[13px] text-slate-900 leading-[1.6]">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="text-[13px] text-slate-700 leading-[1.75] whitespace-pre-wrap">
                  {renderContent(msg.content)}
                </div>
              )}
            </div>
          ))}
          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-6 pb-5 pt-3 border-t border-black/[.06]">
        {inputBox}
      </div>
    </div>
  )
}
