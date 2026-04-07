'use client'

import { useState, useMemo } from 'react'
import { cn, getBrandColor, getInitials, formatDealValue } from '@/lib/utils'
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/constants'
import type { ApiCompanyDetail, ApiDeal } from '@/lib/types'

export type WikiView = 'list' | 'graph'

type WikiSelection =
  | { kind: 'none' }
  | { kind: 'brand'; company: ApiCompanyDetail }
  | { kind: 'deal'; deal: ApiDeal; company: ApiCompanyDetail | null }

type WikiSidebarProps = {
  companies: ApiCompanyDetail[]
  deals: ApiDeal[]
  selection: WikiSelection
  onSelect: (sel: WikiSelection) => void
  isLoading?: boolean
  view: WikiView
  onViewChange: (v: WikiView) => void
}

export function WikiSidebar({
  companies,
  deals,
  selection,
  onSelect,
  isLoading = false,
  view,
  onViewChange,
}: WikiSidebarProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Group deals by company, sorted alpha
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()

    const map = new Map<string, ApiDeal[]>()
    for (const deal of deals) {
      const key = deal.companyId ?? '__none__'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(deal)
    }

    // Build group list from companies
    const result: Array<{
      company: ApiCompanyDetail | null
      id: string
      deals: ApiDeal[]
    }> = []

    for (const company of [...companies].sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const companyDeals = map.get(company.id) ?? []
      const matchesCompany = !q || company.name.toLowerCase().includes(q) ||
        (company.industry ?? '').toLowerCase().includes(q)
      const matchingDeals = companyDeals.filter(
        d => !q || d.title.toLowerCase().includes(q) || STAGE_LABELS[d.stage]?.toLowerCase().includes(q)
      )

      if (!q || matchesCompany || matchingDeals.length > 0) {
        result.push({
          company,
          id: company.id,
          deals: matchesCompany ? companyDeals : matchingDeals,
        })
      }
    }

    // Orphan deals (no company)
    const orphans = (map.get('__none__') ?? []).filter(
      d => !q || d.title.toLowerCase().includes(q)
    )
    if (orphans.length > 0) {
      result.push({ company: null, id: '__none__', deals: orphans })
    }

    return result
  }, [companies, deals, search])

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedCompanyId =
    selection.kind === 'brand' ? selection.company.id :
    selection.kind === 'deal' && selection.company ? selection.company.id :
    null

  const selectedDealId =
    selection.kind === 'deal' ? selection.deal.id : null

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1d] border-r border-black/[.06] dark:border-white/[.06]">
      {/* Header + view toggle */}
      <div className="px-3 pt-3 pb-2 shrink-0 border-b border-black/[.06] dark:border-white/[.06]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xxs font-semibold uppercase tracking-[0.06em] text-slate-400">
            Wiki
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-white/[.06] rounded-md p-0.5 gap-0.5">
            <button
              onClick={() => onViewChange('list')}
              title="List view"
              className={cn(
                'h-6 w-6 rounded flex items-center justify-center transition-all',
                view === 'list'
                  ? 'bg-white dark:bg-[#2a2a2e] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              {/* List icon */}
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </button>
            <button
              onClick={() => onViewChange('graph')}
              title="Graph view"
              className={cn(
                'h-6 w-6 rounded flex items-center justify-center transition-all',
                view === 'graph'
                  ? 'bg-white dark:bg-[#2a2a2e] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              {/* Graph icon */}
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><circle cx="12" cy="12" r="2" />
                <line x1="7" y1="12" x2="10" y2="12" /><line x1="13.4" y1="10.6" x2="17" y2="6.9" /><line x1="13.4" y1="13.4" x2="17" y2="17.1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search — list view only */}
        {view === 'list' && (
          <div className="relative">
            <svg
              width={12} height={12}
              viewBox="0 0 24 24" fill="none"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter…"
              className="w-full h-7 pl-7 pr-3 text-xs rounded-md border border-black/[.08] dark:border-white/[.08] bg-slate-50 dark:bg-white/[.04] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Body — list view only; graph is rendered full-width by the parent page */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="overflow-y-auto h-full py-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : groups.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xxs text-slate-400">No results</p>
              </div>
            ) : (
              groups.map(({ company, id, deals: groupDeals }) => {
                const isOpen = expanded.has(id)
                const color = company ? getBrandColor(company.name) : '#64748b'
                const isSelectedBrand = selectedCompanyId === id
                const label = company?.name ?? 'No Brand'

                return (
                  <div key={id}>
                    {/* Brand row */}
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-[5px] cursor-pointer select-none group transition-colors',
                        isSelectedBrand && !selectedDealId
                          ? 'bg-primary/[.07] dark:bg-primary/[.1]'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[.04]'
                      )}
                      onClick={() => {
                        toggleExpand(id)
                        if (company) onSelect({ kind: 'brand', company })
                      }}
                    >
                      {/* Chevron */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleExpand(id) }}
                        className="w-4 h-4 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 shrink-0 transition-colors"
                      >
                        <svg
                          width={10} height={10} viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                          className={cn('transition-transform', isOpen && 'rotate-90')}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>

                      {/* Brand avatar */}
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-atom font-bold shrink-0"
                        style={{ background: `${color}18`, color }}
                      >
                        {getInitials(label)}
                      </div>

                      {/* Brand name */}
                      <span className={cn(
                        'flex-1 text-xs truncate min-w-0',
                        isSelectedBrand && !selectedDealId
                          ? 'text-primary font-semibold'
                          : 'text-slate-700 dark:text-slate-200 font-medium'
                      )}>
                        {label}
                      </span>

                      {/* Deal count badge */}
                      <span className="text-atom text-slate-400 shrink-0 tabular-nums">
                        {groupDeals.length}
                      </span>
                    </div>

                    {/* Deals (children) */}
                    {isOpen && groupDeals.length > 0 && (
                      <div className="ml-[22px] border-l border-black/[.05] dark:border-white/[.05]">
                        {groupDeals
                          .slice()
                          .sort((a, b) => a.title.localeCompare(b.title))
                          .map(deal => {
                            const stageColor = STAGE_COLORS[deal.stage] ?? '#94a3b8'
                            const isSelectedDeal = selectedDealId === deal.id

                            return (
                              <div
                                key={deal.id}
                                onClick={() => onSelect({ kind: 'deal', deal, company: company ?? null })}
                                className={cn(
                                  'flex items-center gap-2 px-2 py-[5px] cursor-pointer transition-colors',
                                  isSelectedDeal
                                    ? 'bg-primary/[.07] dark:bg-primary/[.1]'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/[.04]'
                                )}
                              >
                                {/* Stage dot */}
                                <div
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ background: stageColor }}
                                />
                                {/* Deal title */}
                                <span className={cn(
                                  'flex-1 text-xs truncate min-w-0',
                                  isSelectedDeal
                                    ? 'text-primary font-medium'
                                    : 'text-slate-600 dark:text-slate-300'
                                )}>
                                  {deal.title}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
      </div>
    </div>
  )
}

export type { WikiSelection }
