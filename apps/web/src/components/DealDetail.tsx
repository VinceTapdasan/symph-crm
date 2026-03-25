'use client'

import { useState } from 'react'
import type { Deal, NoteEntry } from '@/lib/constants'
import { STAGES, DEALS, BRAND_COLORS } from '@/lib/constants'
import { formatPeso, getInitials, cn } from '@/lib/utils'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type DealDetailProps = {
  dealId: number
  onBack: () => void
  onOpenDeal: (id: number) => void
}

type NoteTab = 'disc' | 'asm' | 'prop'

function StageTracker({ deal }: { deal: Deal }) {
  const stagesNoLost = STAGES.filter(s => s.id !== 'lost')
  const currentIdx = STAGES.findIndex(s => s.id === deal.stage)

  return (
    <div className="flex items-center py-3">
      {stagesNoLost.map((s, i) => {
        const sIdx = STAGES.findIndex(x => x.id === s.id)
        const isDone = sIdx < currentIdx
        const isCurrent = sIdx === currentIdx

        return (
          <div key={s.id} className={cn('flex items-center', i < stagesNoLost.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono',
                  (isDone || isCurrent) ? 'text-white' : 'text-slate-400'
                )}
                style={{
                  background: isDone ? '#16a34a' : isCurrent ? '#6c63ff' : '#f1f5f9',
                  border: `2px solid ${isDone ? '#16a34a' : isCurrent ? '#6c63ff' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                {isDone ? (
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] whitespace-nowrap',
                  isCurrent ? 'font-semibold text-[#6c63ff]' : 'font-medium text-slate-400'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < stagesNoLost.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1.5 mb-[18px]"
                style={{ background: isDone ? '#16a34a' : 'rgba(0,0,0,0.06)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function NotesPanel({ deal }: { deal: Deal }) {
  const [noteTab, setNoteTab] = useState<NoteTab>('disc')
  const [noteType, setNoteType] = useState('Call Notes')
  const notes = deal.notes[noteTab] || []

  return (
    <div>
      <Tabs value={noteTab} onValueChange={(v) => setNoteTab(v as NoteTab)}>
        <TabsList className="p-1 bg-slate-100 rounded mb-3.5 gap-0.5 h-auto">
          {([
            { id: 'disc', label: 'Discovery' },
            { id: 'asm', label: 'Assessment' },
            { id: 'prop', label: 'Demo + Proposal' },
          ] as { id: NoteTab; label: string }[]).map(t => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={cn(
                'flex-1 py-1.5 px-2.5 rounded-[4px] text-[11px] transition-colors duration-150 border-b-0',
                'data-[state=active]:bg-white data-[state=active]:shadow-[var(--shadow-card)] data-[state=active]:font-semibold data-[state=active]:text-slate-900',
                'data-[state=inactive]:bg-transparent data-[state=inactive]:font-medium data-[state=inactive]:text-slate-400'
              )}
            >
              {t.label}
              <span className="ml-1 text-[10px] text-slate-400 font-mono">
                {(deal.notes[t.id] || []).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {(['disc', 'asm', 'prop'] as NoteTab[]).map(tabId => (
          <TabsContent key={tabId} value={tabId}>
            <div className="bg-white border border-black/[.06] rounded-[10px] shadow-[var(--shadow-card)] p-3 mb-3.5">
              <Textarea
                rows={3}
                placeholder="Add notes, paste a transcript, drop a link..."
                className="w-full border-none outline-none text-xs text-slate-900 bg-transparent resize-y focus-visible:ring-0 focus-visible:border-transparent"
              />
              <div className="flex items-center border-t border-black/[.06] pt-2 mt-1">
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-auto min-w-[120px] py-0.5 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Call Notes', 'Email Thread', 'Voice Note', 'Screenshot', 'Document', 'Chat Log'].map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="ml-auto">Add</Button>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No notes yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {notes.map((n, i) => (
                  <NoteCard key={i} note={n} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function NoteCard({ note }: { note: NoteEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-black/[.06] rounded-[10px] shadow-[var(--shadow-card)] overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-slate-50 transition-colors duration-150"
      >
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: note.color }} />
        <span className="text-[11px] font-semibold text-slate-900">{note.author}</span>
        <span className="text-[10px] py-px px-[5px] rounded-[3px] bg-slate-100 text-slate-400">{note.type}</span>
        <span className="text-[10px] text-slate-400 ml-auto">{note.time}</span>
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth={1.2}
          strokeLinecap="round"
          className={cn('transition-transform duration-150', expanded && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <div className="px-3 pb-0.5 text-xs font-semibold text-slate-900">
        {note.title}
      </div>
      {expanded && (
        <div className="px-3 pt-2 pb-3 text-xs text-slate-600 leading-relaxed">
          {note.body}
          {note.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {note.tags.map(t => (
                <span key={t} className="text-[10px] py-0.5 px-1.5 rounded-[3px] bg-[rgba(108,99,255,0.08)] text-[#6c63ff]">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResourcesPanel({ deal }: { deal: Deal }) {
  const resources = [
    { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', name: 'Proposal Deck', desc: 'Google Slides', url: deal.proposalUrl, label: 'Proposal' },
    { icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', name: 'Demo / POC', desc: 'Figma prototype or live build', url: deal.demoUrl, label: 'Demo' },
    { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', name: 'Shared Calendar', desc: 'Cal.com scheduling', url: undefined, label: 'Calendar' },
    { icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', name: 'Contract (HelloSign)', desc: 'Send & track signatures', url: undefined, label: 'Contract' },
    { icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', name: 'Circleback / Tactiq', desc: 'Auto-sync meeting transcripts', url: undefined, label: 'Transcripts' },
  ]

  return (
    <div>
      <div className="text-[13px] font-semibold text-slate-900 mb-3.5">
        Linked Resources
      </div>
      <div className="flex flex-col gap-2">
        {resources.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[36px_1fr_auto] items-center gap-3 py-2.5 px-3 bg-white border border-black/[.06] rounded-[10px] shadow-[var(--shadow-card)]"
          >
            <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d={r.icon} />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">{r.name}</div>
              <div className="text-[11px] text-slate-400">{r.desc}</div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener" className="text-[11px] text-[#6c63ff] no-underline hover:text-[#5b52e8]">
                  Open {r.label}
                </a>
              )}
            </div>
            <span
              className={cn(
                'text-[10px] font-semibold py-0.5 px-2 rounded-full',
                r.url ? 'bg-success-dim text-success' : 'bg-slate-100 text-slate-400'
              )}
            >
              {r.url ? 'Linked' : 'Not Set'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelinePanel({ deal }: { deal: Deal }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-slate-900 mb-3.5">
        Activity Timeline
      </div>
      <div className="flex flex-col">
        {deal.timeline.map((t, i) => (
          <div
            key={i}
            className={cn(
              'grid grid-cols-[24px_1fr] gap-3 py-2.5',
              i < deal.timeline.length - 1 && 'border-b border-black/[.06]'
            )}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{
                border: `2px solid ${t.color}`,
                background: `${t.color}10`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-900 leading-snug">{t.text}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{t.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DealDetail({ dealId, onBack, onOpenDeal }: DealDetailProps) {
  const [tab, setTab] = useState('notes')
  const deal = DEALS.find(d => d.id === dealId)
  if (!deal) return null

  const brandColor = BRAND_COLORS[deal.brand] || '#57534e'
  const relatedDeals = DEALS.filter(d => d.brand === deal.brand && d.id !== deal.id)

  const tabs = [
    { id: 'notes', label: 'Notes', count: Object.values(deal.notes).flat().length },
    { id: 'resources', label: 'Resources' },
    { id: 'timeline', label: 'Timeline', count: deal.timeline.length },
  ]

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-medium text-[#6c63ff] hover:text-[#5b52e8] mb-3 active:scale-[0.98] transition-colors duration-150 w-fit"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}><polyline points="15 18 9 12 15 6" /></svg>
        Back to Pipeline
      </button>

      {/* Header */}
      <div className="bg-white border border-black/[.06] rounded-[10px] shadow-[var(--shadow-card)] px-5 py-[18px] mb-4">
        <div className="flex items-start gap-3.5 flex-wrap sm:flex-nowrap">
          <div
            className="w-11 h-11 rounded-[10px] flex items-center justify-center text-base font-bold shrink-0"
            style={{ background: `${brandColor}10`, color: brandColor }}
          >
            {getInitials(deal.brand)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold" style={{ color: brandColor }}>{deal.brand}</div>
            <div className="text-base font-bold text-slate-900 tracking-tight truncate">{deal.name}</div>
            <div className="text-xs text-slate-400">{deal.project} · {deal.industry}</div>
          </div>
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <div className="text-right">
              <div className="text-xl font-bold text-[#6c63ff] tabular-nums">{formatPeso(deal.size)}</div>
              <div className="mt-1"><Badge stageId={deal.stage} /></div>
            </div>
            {deal.stage !== 'won' && deal.stage !== 'lost' && (
              <Button className="rounded py-2 px-4 shrink-0 active:scale-[0.98]">
                Advance
              </Button>
            )}
          </div>
        </div>
        <StageTracker deal={deal} />
      </div>

      {/* Body: main + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 flex-1 overflow-hidden lg:overflow-hidden overflow-y-auto">
        {/* Main panel */}
        <div className="flex flex-col overflow-hidden min-h-0">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
            <TabsList variant="line" className="border-b border-black/[.06] mb-4 shrink-0">
              {tabs.map(t => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span
                      className={cn(
                        'ml-[5px] text-[10px] py-px px-[5px] rounded-full font-mono',
                        tab === t.id
                          ? 'bg-[rgba(108,99,255,0.08)] text-[#6c63ff]'
                          : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {t.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="notes" className="flex-1 overflow-y-auto">
              <NotesPanel deal={deal} />
            </TabsContent>
            <TabsContent value="resources" className="flex-1 overflow-y-auto">
              <ResourcesPanel deal={deal} />
            </TabsContent>
            <TabsContent value="timeline" className="flex-1 overflow-y-auto">
              <TimelinePanel deal={deal} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar */}
        <div className="overflow-y-auto flex flex-col bg-white border border-black/[.06] shadow-[var(--shadow-card)] rounded-[10px] divide-y divide-black/[.06]">
          {/* Deal Info */}
          <div className="p-3.5 px-4">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Deal Info</div>
            {([
              ['Deal Size', formatPeso(deal.size), '#6c63ff', true],
              ['Category', deal.category],
              ['Industry', deal.industry],
              ['Date Captured', deal.dateCaptured],
              ['Days in Stage', `${deal.daysInStage}d`],
            ] as [string, string, string?, boolean?][]).map(([k, v, c, bold]) => (
              <div key={k} className="flex justify-between items-center py-[5px]">
                <span className="text-[11px] text-slate-400">{k}</span>
                <span
                  className={cn('text-[11px]', bold ? 'font-bold tabular-nums' : 'font-semibold')}
                  style={{ color: c || '#0f172a' }}
                >
                  {v}
                </span>
              </div>
            ))}
            <div className="mt-2">
              <div className="text-[10px] text-slate-400 mb-[5px]">Services</div>
              <div className="flex flex-wrap gap-1">
                {deal.services.map(s => (
                  <span key={s} className="text-[10px] font-medium py-0.5 px-1.5 rounded bg-slate-100 text-slate-600">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* AM */}
          <div className="p-3.5 px-4">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Account Manager</div>
            <div className="flex items-center gap-2">
              <Avatar name={deal.am} size={28} />
              <div>
                <div className="text-xs font-semibold text-slate-900">{deal.am}</div>
                <div className="text-[10px] text-slate-400">Account Manager</div>
              </div>
            </div>
          </div>

          {/* Next Step */}
          {deal.nextStep && (
            <div className="p-3.5 px-4">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Next Step</div>
              <div className="bg-[rgba(108,99,255,0.06)] border border-[rgba(108,99,255,0.12)] rounded p-3">
                <div className="text-[10px] font-semibold text-[#6c63ff] uppercase tracking-wider mb-1">Action Required</div>
                <div className="text-xs font-medium text-slate-900 leading-snug">{deal.nextStep}</div>
                {deal.nextDate && <div className="text-[10px] text-slate-400 mt-1.5">Due {deal.nextDate}</div>}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-3.5 px-4">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Quick Actions</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Schedule Demo', path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { label: 'Build Proposal', path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { label: 'Send Contract', path: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
                { label: 'Mark as Won', path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: '#16a34a' },
              ].map(a => (
                <Button
                  key={a.label}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 py-2 px-2.5 text-[11px] font-medium active:scale-[0.98] h-auto justify-start"
                  style={{ color: a.color || undefined }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d={a.path} /></svg>
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Related deals */}
          {relatedDeals.length > 0 && (
            <div className="p-3.5 px-4">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Other {deal.brand} Deals</div>
              <div className="flex flex-col gap-1.5">
                {relatedDeals.map(rd => (
                  <div
                    key={rd.id}
                    onClick={() => onOpenDeal(rd.id)}
                    className="flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-slate-100 transition-colors duration-150 border border-black/[.06]"
                  >
                    <span className="text-xs font-semibold text-slate-900">{rd.project}</span>
                    <Badge stageId={rd.stage} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
