'use client'

import { useState, useMemo } from 'react'
import type { Deal } from '@/lib/constants'
import { BRAND_COLORS } from '@/lib/constants'
import { formatPeso, getInitials } from '@/lib/utils'
import { Badge } from './Badge'
import { Avatar } from './Avatar'
import { EmptyState } from './EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type DealsProps = {
  onOpenDeal: (id: number) => void
}

type BrandGroup = {
  brand: string
  color: string
  deals: Deal[]
  totalValue: number
  activeCount: number
}

const STAGE_DOT_COLORS: Record<string, string> = {
  lead: '#94a3b8',
  disc: '#2563eb',
  asm: '#0369a1',
  prop: '#d97706',
  fup: '#f59e0b',
  won: '#16a34a',
  lost: '#dc2626',
}

function BrandHeader({ group, expanded, onToggle }: { group: BrandGroup; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="grid grid-cols-[36px_1fr_auto_20px] sm:grid-cols-[40px_1fr_auto_auto_auto_20px] items-center gap-3 sm:gap-3.5 w-full px-4 sm:px-[18px] py-3.5 bg-surface border-0 border-b border-border cursor-pointer transition-colors text-left hover:bg-surface-2 active:scale-[0.998]"
    >
      <div
        className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center text-[15px] font-bold"
        style={{ background: `${group.color}10`, color: group.color }}
      >
        {getInitials(group.brand)}
      </div>
      <div>
        <div className="text-sm font-bold text-text-primary tracking-tight">
          {group.brand}
        </div>
        <div className="text-[11px] text-text-tertiary mt-px">
          {group.deals[0]?.industry || 'Multiple industries'}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1">
        <span className="text-[11px] font-semibold text-text-secondary">
          {group.deals.length} {group.deals.length === 1 ? 'deal' : 'deals'}
        </span>
        <span className="text-[10px] text-text-tertiary">
          ({group.activeCount} active)
        </span>
      </div>
      <div
        className="text-[13px] font-bold tabular-nums sm:min-w-[100px] text-right"
        style={{ color: group.color }}
      >
        {formatPeso(group.totalValue)}
      </div>
      <div className="hidden sm:flex gap-[3px] min-w-[60px] justify-end">
        {group.deals.map(d => (
          <div
            key={d.id}
            title={`${d.name} - ${d.stage}`}
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: STAGE_DOT_COLORS[d.stage] || '#94a3b8' }}
          />
        ))}
      </div>
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        className="stroke-text-tertiary transition-transform"
        strokeWidth={1.2}
        strokeLinecap="round"
        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}

function DealRow({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const brandColor = BRAND_COLORS[deal.brand] || '#57534e'

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[24px_1fr_auto_auto] sm:grid-cols-[40px_1.4fr_0.8fr_auto_0.6fr_0.5fr] items-center gap-3 sm:gap-3.5 py-3 pr-4 sm:pr-[18px] pl-5 sm:pl-8 border-b border-border cursor-pointer transition-colors bg-surface hover:bg-surface-2 active:scale-[0.998]"
    >
      <div className="flex items-center justify-center">
        <div
          className="w-1.5 h-1.5 rounded-full opacity-50"
          style={{ background: brandColor }}
        />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
          {deal.name}
        </div>
        <div className="text-[11px] text-text-tertiary mt-px">
          {deal.project}
        </div>
      </div>
      <div className="hidden sm:flex gap-[3px] flex-wrap">
        {deal.services.map(s => (
          <span
            key={s}
            className="text-[9px] font-medium px-1.5 py-0.5 rounded-[3px] bg-surface-3 text-text-secondary whitespace-nowrap"
          >
            {s}
          </span>
        ))}
      </div>
      <Badge stageId={deal.stage} />
      <div className="text-[13px] font-bold text-text-primary tabular-nums text-right">
        {formatPeso(deal.size)}
      </div>
      <div className="hidden sm:flex items-center gap-1.5 justify-end">
        <Avatar name={deal.am} size={20} />
        <div>
          <div className="text-[11px] font-medium text-text-secondary">{deal.am}</div>
          <div className="text-[9px] text-text-tertiary">{deal.lastActivity}</div>
        </div>
      </div>
    </div>
  )
}

export function Deals({ onOpenDeal }: DealsProps) {
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  // Will be replaced with real data from API
  const allDeals: Deal[] = []

  const groups: BrandGroup[] = useMemo(() => {
    const map = new Map<string, Deal[]>()
    for (const d of allDeals) {
      const arr = map.get(d.brand) || []
      arr.push(d)
      map.set(d.brand, arr)
    }
    return Array.from(map.entries())
      .map(([brand, deals]) => ({
        brand,
        color: BRAND_COLORS[brand] || '#57534e',
        deals,
        totalValue: deals.reduce((s, d) => s + d.size, 0),
        activeCount: deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
  }, [allDeals])

  const filtered = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.toLowerCase()
    return groups
      .map(g => ({
        ...g,
        deals: g.deals.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.project.toLowerCase().includes(q) ||
          d.am.toLowerCase().includes(q) ||
          d.brand.toLowerCase().includes(q) ||
          d.services.some(s => s.toLowerCase().includes(q))
        ),
      }))
      .filter(g => g.deals.length > 0 || g.brand.toLowerCase().includes(q))
  }, [groups, search])

  function toggleBrand(brand: string) {
    setExpandedBrands(prev => {
      const next = new Set(prev)
      if (next.has(brand)) next.delete(brand)
      else next.add(brand)
      return next
    })
  }

  function expandAll() {
    setExpandedBrands(new Set(groups.map(g => g.brand)))
  }

  function collapseAll() {
    setExpandedBrands(new Set())
  }

  const totalDeals = allDeals.length
  const totalValue = allDeals.filter(d => d.stage !== 'lost').reduce((s, d) => s + d.size, 0)

  return (
    <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 shrink-0">
        <div>
          <div className="text-sm font-bold text-text-primary">
            Deals
          </div>
          <div className="text-[11px] text-text-tertiary mt-0.5">
            {groups.length} brands · {totalDeals} deals · {totalValue > 0 ? `${formatPeso(totalValue)} pipeline` : 'No pipeline value'}
          </div>
        </div>
        <div className="sm:ml-auto flex flex-wrap gap-1.5 items-center">
          <div className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-2.5 py-[5px] flex-1 sm:flex-none sm:w-[200px] min-w-[140px]">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="text-muted-foreground shrink-0" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search deals..."
              className="border-none bg-transparent outline-none text-xs text-text-primary w-full placeholder:text-text-tertiary focus:ring-0 px-0 py-0 rounded-none"
            />
          </div>
          <Button variant="outline" size="sm" onClick={expandAll}>Expand all</Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>Collapse all</Button>
        </div>
      </div>

      {allDeals.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="No deals yet"
            description="Create your first deal to start tracking your pipeline"
          />
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-[24px_1fr_auto_auto] sm:grid-cols-[40px_1.4fr_0.8fr_auto_0.6fr_0.5fr] items-center gap-3 sm:gap-3.5 py-2 pr-4 sm:pr-[18px] pl-5 sm:pl-8 border-b border-border shrink-0">
            {[
              { label: '', mobile: true },
              { label: 'Deal', mobile: true },
              { label: 'Services', mobile: false },
              { label: 'Stage', mobile: true },
              { label: 'Value', mobile: true },
              { label: 'Owner', mobile: false },
            ].map(h => (
              <div
                key={h.label}
                className={`text-[10px] font-semibold text-text-tertiary uppercase tracking-widest ${
                  h.label === 'Value' || h.label === 'Owner' ? 'text-right' : 'text-left'
                } ${!h.mobile ? 'hidden sm:block' : ''}`}
              >
                {h.label}
              </div>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto bg-surface border border-border rounded-b-[--radius-md] shadow-card">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-[13px] text-text-tertiary">
                No deals matching &quot;{search}&quot;
              </div>
            ) : (
              filtered.map(group => {
                const expanded = expandedBrands.has(group.brand)
                return (
                  <div key={group.brand}>
                    <BrandHeader group={group} expanded={expanded} onToggle={() => toggleBrand(group.brand)} />
                    {expanded && group.deals.map((deal) => (
                      <DealRow key={deal.id} deal={deal} onClick={() => onOpenDeal(deal.id)} />
                    ))}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
