'use client'

import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from './EmptyState'

export function Reports() {
  const metrics = [
    { label: 'Total Closed Won', value: '--', trend: 'No data yet', color: '#16a34a' },
    { label: 'Deals Won', value: '0', trend: 'No data yet', color: undefined },
    { label: 'Deals Lost', value: '0', trend: 'No data yet', color: '#dc2626' },
    { label: 'Avg Sales Cycle', value: '--', trend: 'No data yet', color: undefined },
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1200px]">
      {/* Metrics row */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {metrics.map((m) => (
          <Card key={m.label} className="flex-[1_1_200px]">
            <CardContent>
              <div className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1.5">{m.label}</div>
              <div className="text-[22px] font-bold tabular-nums leading-none" style={{ color: m.color || undefined }}>
                {!m.color && <span className="text-text-primary">{m.value}</span>}
                {m.color && m.value}
              </div>
              <div className="text-[11px] text-text-tertiary mt-1.5">{m.trend}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state for charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardContent>
            <div className="text-[13px] font-semibold text-text-primary mb-4">
              Pipeline Value by Stage
            </div>
            <EmptyState
              icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              title="No pipeline data"
              description="Charts will populate as deals move through stages"
              compact
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-[13px] font-semibold text-text-primary mb-4">
              Pipeline Funnel
            </div>
            <EmptyState
              icon="M3 4h18M4 8h16M6 12h12M8 16h8M10 20h4"
              title="No funnel data"
              description="The funnel will show conversion rates across stages"
              compact
            />
          </CardContent>
        </Card>
      </div>

      {/* AM Performance - empty */}
      <Card className="mb-4">
        <CardContent>
          <div className="text-[13px] font-semibold text-text-primary mb-3.5">
            AM Performance
          </div>
          <EmptyState
            icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            title="No performance data"
            description="AM metrics will appear as deals are tracked and closed"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
