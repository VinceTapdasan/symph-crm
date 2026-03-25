'use client'

import { type Stage, type Deal } from '@/lib/constants'

type PipelineBarProps = {
  stages: Stage[]
  deals: Deal[]
}

export function PipelineBar({ stages, deals }: PipelineBarProps) {
  const stageData = stages.map((s) => ({
    ...s,
    count: deals.filter((d) => d.stage === s.id).length,
    value: deals.filter((d) => d.stage === s.id).reduce((sum, d) => sum + d.size, 0),
  }))

  const maxValue = Math.max(...stageData.map((s) => s.value), 1)

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
      {stageData.map((s) => {
        const fillPct = maxValue > 0 ? Math.max(0, Math.round((s.value / maxValue) * 100)) : 0
        const hasDeals = s.count > 0
        return (
          <div key={s.id} className="flex flex-col gap-1.5 min-w-0">
            <div
              className="text-[11px] font-medium truncate"
              style={{ color: hasDeals ? s.color : '#94a3b8' }}
            >
              {s.label}
            </div>
            <div className="h-[6px] bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${fillPct}%`,
                  background: hasDeals ? s.color : '#cbd5e1',
                }}
              />
            </div>
            <div className="text-[15px] font-bold text-slate-900 tabular-nums">{s.count}</div>
          </div>
        )
      })}
    </div>
  )
}
