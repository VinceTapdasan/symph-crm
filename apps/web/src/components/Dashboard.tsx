'use client'

import { MetricCard } from './MetricCard'
import { PipelineBar } from './PipelineBar'
import { TopDeals } from './TopDeals'
import { AMLeaderboard } from './AMLeaderboard'
import { RecentActivity } from './RecentActivity'
import { STAGES, DEALS, DASHBOARD_METRICS, AM_LEADERBOARD, RECENT_ACTIVITY } from '@/lib/constants'

export function Dashboard() {
  const m = DASHBOARD_METRICS

  return (
    <div className="p-4 md:px-6 pb-6 max-w-[1200px]">

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-[1.2fr_0.9fr_0.9fr_1fr] gap-3 md:gap-3.5 mb-5">
        <MetricCard label={m.totalPipeline.label} value={m.totalPipeline.value} trend={m.totalPipeline.trend} trendUp={m.totalPipeline.trendUp} />
        <MetricCard label={m.activeDeals.label} value={m.activeDeals.value} trend={m.activeDeals.trend} trendUp={m.activeDeals.trendUp} />
        <MetricCard label={m.winRate.label} value={m.winRate.value} trend={m.winRate.trend} trendUp={m.winRate.trendUp} accentColor="#16a34a" />
        <MetricCard label={m.avgDealSize.label} value={m.avgDealSize.value} trend={m.avgDealSize.trend} trendUp={m.avgDealSize.trendUp} />
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-black/[.06] rounded-[10px] px-5 py-[18px] shadow-[var(--shadow-card)]">
            <div className="text-[13px] font-semibold text-slate-900 mb-4">Pipeline by Stage</div>
            <PipelineBar stages={STAGES} deals={DEALS} />
          </div>
          <div className="bg-white border border-black/[.06] rounded-[10px] px-5 py-[18px] shadow-[var(--shadow-card)]">
            <TopDeals deals={DEALS} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-black/[.06] rounded-[10px] px-5 py-[18px] shadow-[var(--shadow-card)]">
            <AMLeaderboard entries={AM_LEADERBOARD} />
          </div>
          <div className="bg-white border border-black/[.06] rounded-[10px] px-5 py-[18px] shadow-[var(--shadow-card)]">
            <RecentActivity entries={RECENT_ACTIVITY} />
          </div>
        </div>
      </div>
    </div>
  )
}
