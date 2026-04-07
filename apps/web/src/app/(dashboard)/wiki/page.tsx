'use client'

import { useState, useMemo } from 'react'
import { useGetCompanies, useGetDeals } from '@/lib/hooks/queries'
import { WikiSidebar } from '@/components/WikiSidebar'
import { WikiContent } from '@/components/WikiContent'
import { DealsGraph } from '@/components/DealsGraph'
import type { WikiSelection, WikiView } from '@/components/WikiSidebar'
import type { ApiDeal, ApiCompanyDetail } from '@/lib/types'

type MobilePane = 'sidebar' | 'content'

export default function WikiPage() {
  const { data: companies = [], isLoading: loadingCompanies } = useGetCompanies()
  const { data: deals = [], isLoading: loadingDeals } = useGetDeals()

  const [selection, setSelection] = useState<WikiSelection>({ kind: 'none' })
  const [mobilePane, setMobilePane] = useState<MobilePane>('sidebar')
  const [view, setView] = useState<WikiView>('list')

  const isLoading = loadingCompanies || loadingDeals

  const companyMap = useMemo(() => {
    const m = new Map<string, ApiCompanyDetail>()
    for (const c of companies) m.set(c.id, c)
    return m
  }, [companies])

  function handleSelect(sel: WikiSelection) {
    setSelection(sel)
    if (sel.kind !== 'none') setMobilePane('content')
  }

  function handleBack() {
    setMobilePane('sidebar')
  }

  function handleSelectDeal(deal: ApiDeal, company: ApiCompanyDetail | null) {
    setSelection({ kind: 'deal', deal, company })
    setMobilePane('content')
  }

  function handleViewChange(v: WikiView) {
    setView(v)
    // When switching to graph, clear pane state so it shows full-width on mobile too
    if (v === 'graph') setMobilePane('sidebar')
  }

  // ── Graph view: full-width, no sidebar content pane split ──────────────
  if (view === 'graph') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Slim header with toggle to go back to list */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[.06] dark:border-white/[.06] bg-white dark:bg-[#1a1a1d] shrink-0">
          <span className="text-xxs font-semibold uppercase tracking-[0.06em] text-slate-400">
            Wiki — Graph View
          </span>
          <div className="ml-auto flex items-center bg-slate-100 dark:bg-white/[.06] rounded-md p-0.5 gap-0.5">
            <button
              onClick={() => handleViewChange('list')}
              title="List view"
              className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </button>
            <button
              title="Graph view"
              className="h-6 w-6 rounded flex items-center justify-center bg-white dark:bg-[#2a2a2e] text-slate-900 dark:text-white shadow-sm transition-all"
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><circle cx="12" cy="12" r="2" />
                <line x1="7" y1="12" x2="10" y2="12" /><line x1="13.4" y1="10.6" x2="17" y2="6.9" /><line x1="13.4" y1="13.4" x2="17" y2="17.1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Full-width graph */}
        <div className="flex-1 min-h-0">
          <DealsGraph
            companies={companies}
            deals={deals}
            onOpenDeal={(id) => {
              const deal = deals.find(d => d.id === id)
              if (deal) {
                handleSelect({ kind: 'deal', deal, company: companyMap.get(deal.companyId ?? '') ?? null })
                handleViewChange('list')
              }
            }}
            onOpenBrand={(companyId) => {
              const company = companyMap.get(companyId)
              if (company) {
                handleSelect({ kind: 'brand', company })
                handleViewChange('list')
              }
            }}
          />
        </div>
      </div>
    )
  }

  // ── List view: sidebar + content pane ──────────────────────────────────
  return (
    /*
     * Full-height two-pane layout.
     * Desktop: sidebar (280px) | content (flex-1), both always visible.
     * Mobile: one pane at a time — toggle via mobilePane state.
     * The CrmShell collapses the global sidebar on /wiki to maximise space.
     */
    <div className="flex h-full overflow-hidden">
      {/* ── Wiki sidebar ──────────────────────────────────────────────────── */}
      <div className={[
        'md:flex md:w-[260px] lg:w-[280px] md:shrink-0 md:h-full',
        'h-full w-full',
        mobilePane === 'sidebar' ? 'flex' : 'hidden md:flex',
      ].join(' ')}>
        <WikiSidebar
          companies={companies}
          deals={deals}
          selection={selection}
          onSelect={handleSelect}
          isLoading={isLoading}
          view={view}
          onViewChange={handleViewChange}
        />
      </div>

      {/* ── Wiki content ──────────────────────────────────────────────────── */}
      <div className={[
        'md:flex md:flex-1 md:h-full md:overflow-y-auto',
        'bg-white dark:bg-[#161618]',
        'h-full w-full',
        mobilePane === 'content' ? 'flex flex-col' : 'hidden md:flex md:flex-col',
      ].join(' ')}>
        <WikiContent
          selection={selection}
          companies={companies}
          deals={deals}
          onSelectDeal={handleSelectDeal}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}
