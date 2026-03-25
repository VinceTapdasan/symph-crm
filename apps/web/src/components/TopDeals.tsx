'use client'

import { type Deal, BRAND_COLORS } from '@/lib/constants'
import { formatPeso, getInitials } from '@/lib/utils'
import { Badge } from './Badge'
import { EmptyState } from './EmptyState'

type TopDealsProps = {
  deals: Deal[]
  onViewAll?: () => void
}

export function TopDeals({ deals, onViewAll }: TopDealsProps) {
  const sorted = [...deals]
    .filter((d) => d.stage !== 'lost')
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[13px] font-semibold text-slate-900">Top Deals</div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[12px] font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
          >
            View All
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          title="No deals yet"
          description="Deals will appear here as they're added to the pipeline"
          compact
        />
      ) : (
        <div className="flex flex-col gap-0.5">
          {sorted.map((d) => {
            const brandColor = BRAND_COLORS[d.brand] || '#57534e'
            return (
              <div
                key={d.id}
                className="grid grid-cols-[36px_1fr_auto] items-center gap-3 py-2.5 px-1 rounded cursor-pointer hover:bg-slate-100 active:scale-[0.98] transition-colors duration-150"
              >
                <div
                  className="w-9 h-9 rounded flex items-center justify-center text-xs font-bold"
                  style={{ background: `${brandColor}10`, color: brandColor }}
                >
                  {getInitials(d.brand)}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 truncate">{d.name}</div>
                  <div className="text-[11px] text-slate-400 mt-px">
                    {d.brand} · {d.am}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-slate-900 tabular-nums">{formatPeso(d.size)}</div>
                  <div className="mt-0.5">
                    <Badge stageId={d.stage} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
