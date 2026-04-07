'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetCompanies, useGetDeals } from '@/lib/hooks/queries'
import { WikiSidebar } from '@/components/WikiSidebar'
import { WikiContent } from '@/components/WikiContent'
import type { WikiSelection } from '@/components/WikiSidebar'
import type { ApiDeal, ApiCompanyDetail } from '@/lib/types'

type MobilePane = 'sidebar' | 'content'

export default function WikiPage() {
  const router = useRouter()
  const { data: companies = [], isLoading: loadingCompanies } = useGetCompanies()
  const { data: deals = [], isLoading: loadingDeals } = useGetDeals()

  const [selection, setSelection] = useState<WikiSelection>({ kind: 'none' })
  // Mobile: start on sidebar; switch to content once something is selected
  const [mobilePane, setMobilePane] = useState<MobilePane>('sidebar')

  const isLoading = loadingCompanies || loadingDeals

  function handleSelect(sel: WikiSelection) {
    setSelection(sel)
    if (sel.kind !== 'none') {
      setMobilePane('content')
    }
  }

  function handleBack() {
    setMobilePane('sidebar')
  }

  function handleSelectDeal(deal: ApiDeal, company: ApiCompanyDetail | null) {
    setSelection({ kind: 'deal', deal, company })
    setMobilePane('content')
  }

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
        // Desktop: always visible, fixed width
        'md:flex md:w-[260px] lg:w-[280px] md:shrink-0 md:h-full',
        // Mobile: full-screen, shown only when mobilePane === 'sidebar'
        'h-full w-full',
        mobilePane === 'sidebar' ? 'flex' : 'hidden md:flex',
      ].join(' ')}>
        <WikiSidebar
          companies={companies}
          deals={deals}
          selection={selection}
          onSelect={handleSelect}
          isLoading={isLoading}
        />
      </div>

      {/* ── Wiki content ──────────────────────────────────────────────────── */}
      <div className={[
        // Desktop: always visible, flex-1
        'md:flex md:flex-1 md:h-full md:overflow-y-auto',
        'bg-white dark:bg-[#161618]',
        // Mobile: full-screen, shown only when mobilePane === 'content'
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
