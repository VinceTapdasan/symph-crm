'use client'

import { useRouter } from 'next/navigation'

type ApiDealBrief = {
  id: string
  stage: string
  value: string | null
}

type PipelineBarProps = {
  deals: ApiDealBrief[]
}

// IDs match Pipeline.tsx KANBAN_STAGES so ?stage= param resolves to the right column
const SUMMARY_STAGES = [
  { id: 'lead',         label: 'Lead',           color: '#94a3b8', matches: ['lead'] },
  { id: 'discovery',   label: 'Discovery',       color: '#2563eb', matches: ['discovery'] },
  { id: 'assessment',  label: 'Assessment',      color: '#7c3aed', matches: ['assessment', 'qualified'] },
  { id: 'demo_prop',   label: 'Demo + Proposal', color: '#d97706', matches: ['demo', 'proposal', 'proposal_demo'] },
  { id: 'followup',    label: 'Follow-up',       color: '#f59e0b', matches: ['negotiation', 'followup'] },
  { id: 'closed_won',  label: 'Won',             color: '#16a34a', matches: ['closed_won'] },
  { id: 'closed_lost', label: 'Lost',            color: '#dc2626', matches: ['closed_lost'] },
]

export function PipelineBar({ deals }: PipelineBarProps) {
  const router = useRouter()
  const stageData = SUMMARY_STAGES.map((s, index) => ({
    ...s,
    count: deals.filter(d => s.matches.includes(d.stage)).length,
    position: index + 1,
  }))

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${SUMMARY_STAGES.length}, 1fr)` }}>
      {stageData.map(s => {
        const hasDeals = s.count > 0
        // Fill proportional to stage position: lead=1/7, …, lost=7/7
        const positionPct = Math.round((s.position / SUMMARY_STAGES.length) * 100)
        const fillPct = hasDeals ? positionPct : 0

        return (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            className="flex flex-col gap-1.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity duration-150"
            onClick={() => router.push(`/pipeline?stage=${s.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') router.push(`/pipeline?stage=${s.id}`)
            }}
          >
            <div
              className="text-[11px] font-medium truncate"
              style={{ color: hasDeals ? s.color : '#94a3b8' }}
            >
              {s.label}
            </div>
            <div className="h-[6px] bg-slate-100 dark:bg-white/[.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fillPct}%`,
                  background: s.color,
                  opacity: hasDeals ? 0.85 : 0,
                }}
              />
            </div>
            <div
              className="text-[15px] font-bold tabular-nums text-slate-900 dark:text-white"
              style={!hasDeals ? { color: '#94a3b8' } : undefined}
            >
              {s.count}
            </div>
          </div>
        )
      })}
    </div>
  )
}
