'use client'

import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from './EmptyState'
import type { FunnelResponse, FunnelStage } from '@/lib/types'

// ─── Health color helpers ─────────────────────────────────────────────────────

function conversionColor(rate: number): string {
  if (rate >= 70) return '#16a34a'  // green
  if (rate >= 40) return '#d97706'  // amber
  return '#dc2626'                   // red
}

function conversionBg(rate: number): string {
  if (rate >= 70) return 'bg-green-50 dark:bg-green-950/30'
  if (rate >= 40) return 'bg-amber-50 dark:bg-amber-950/30'
  return 'bg-red-50 dark:bg-red-950/30'
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <p className="text-[12px] text-slate-400">Loading…</p>
    </div>
  )
}

// ─── Desktop row ──────────────────────────────────────────────────────────────

function FunnelRow({
  stage,
  maxCount,
  isLast,
}: {
  stage: FunnelStage
  maxCount: number
  isLast: boolean
}) {
  const barPct = maxCount > 0 ? Math.max(4, Math.round((stage.entryCount / maxCount) * 100)) : 4

  return (
    <>
      {/* Stage row */}
      <div className="grid grid-cols-[140px_1fr_72px_28px] items-center gap-3 py-1 px-1 border-b border-black/[.04] dark:border-white/[.05] last:border-0">
        {/* Stage name */}
        <div className="text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate">
          {stage.label}
        </div>

        {/* Throughput bar + count */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[14px] bg-slate-100 dark:bg-white/[.06] rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${barPct}%`,
                backgroundColor: stage.color || '#94a3b8',
                opacity: 0.75,
              }}
            />
          </div>
          <span className="text-[12px] font-semibold tabular-nums text-slate-700 dark:text-slate-300 w-[28px] text-right shrink-0">
            {stage.entryCount}
          </span>
        </div>

        {/* Conversion rate pill */}
        <div className="flex justify-end">
          {stage.conversionRate !== null ? (
            <span
              className={`inline-flex items-center justify-center text-[11px] font-bold tabular-nums rounded-full px-2 py-0.5 ${conversionBg(stage.conversionRate)}`}
              style={{ color: conversionColor(stage.conversionRate) }}
            >
              {stage.conversionRate}%
            </span>
          ) : (
            <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
          )}
        </div>

        {/* Bottleneck flag */}
        <div className="flex justify-center">
          {stage.isBottleneck && (
            <span title="Bottleneck — conversion below 40%">
              <svg
                className="w-3.5 h-3.5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </span>
          )}
        </div>
      </div>

    </>
  )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function FunnelCard({
  stage,
  maxCount,
  isLast,
}: {
  stage: FunnelStage
  maxCount: number
  isLast: boolean
}) {
  const barPct = maxCount > 0 ? Math.max(4, Math.round((stage.entryCount / maxCount) * 100)) : 4

  return (
    <div className="rounded-lg border border-black/[.08] dark:border-white/[.08] p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color || '#94a3b8' }} />
          <span className="text-[12px] font-semibold text-slate-800 dark:text-white">{stage.label}</span>
          {stage.isBottleneck && (
            <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
        </div>
        <span className="text-[18px] font-bold tabular-nums text-slate-900 dark:text-white">{stage.entryCount}</span>
      </div>

      {/* Bar */}
      <div className="h-[8px] bg-slate-100 dark:bg-white/[.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${barPct}%`,
            backgroundColor: stage.color || '#94a3b8',
            opacity: 0.8,
          }}
        />
      </div>

      {/* Conversion rate */}
      {stage.conversionRate !== null && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Conversion to next stage</span>
          <span
            className={`text-[11px] font-bold tabular-nums rounded-full px-2 py-0.5 ${conversionBg(stage.conversionRate)}`}
            style={{ color: conversionColor(stage.conversionRate) }}
          >
            {stage.conversionRate}%
          </span>
        </div>
      )}

      {/* Arrow to next card */}
      {!isLast && (
        <div className="flex justify-center pt-0.5 text-slate-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  )
}

// ─── Terminal badges (Won / Lost) ─────────────────────────────────────────────

function TerminalBadges({ wonCount, lostCount }: { wonCount: number; lostCount: number }) {
  const total = wonCount + lostCount
  const winRate = total > 0 ? Math.round((wonCount / total) * 100) : null

  return (
    <div className="mt-2 pt-2 border-t border-black/[.06] dark:border-white/[.08]">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Terminal</div>
      <div className="flex gap-1.5">
        <div className="flex-1 rounded-md bg-green-50 dark:bg-green-950/30 px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide leading-none">Won</div>
            {winRate !== null && (
              <div className="text-[9px] text-green-600 dark:text-green-500 mt-0.5 leading-none">{winRate}% win rate</div>
            )}
          </div>
          <div className="text-[16px] font-bold tabular-nums text-green-700 dark:text-green-400 shrink-0">{wonCount}</div>
        </div>
        <div className="flex-1 rounded-md bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide leading-none">Lost</div>
            {total > 0 && (
              <div className="text-[9px] text-red-600 dark:text-red-500 mt-0.5 leading-none">{total} total</div>
            )}
          </div>
          <div className="text-[16px] font-bold tabular-nums text-red-700 dark:text-red-400 shrink-0">{lostCount}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StageFunnelChartProps {
  data: FunnelResponse | undefined
  isLoading: boolean
}

export function StageFunnelChart({ data, isLoading }: StageFunnelChartProps) {
  const stages = data?.stages ?? []
  const maxCount = stages.length > 0 ? Math.max(...stages.map(s => s.entryCount), 1) : 1
  const hasData = stages.some(s => s.entryCount > 0) || (data?.wonCount ?? 0) > 0 || (data?.lostCount ?? 0) > 0
  const bottleneckCount = stages.filter(s => s.isBottleneck).length

  return (
    <Card>
      <CardContent>
        {/* Card header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-black/[.06] dark:border-white/[.08]">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-white">Stage Conversion Funnel</div>
          {bottleneckCount > 0 && !isLoading && hasData && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-full px-2 py-0.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {bottleneckCount} bottleneck{bottleneckCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Spinner />
          </div>
        ) : !hasData ? (
          <EmptyState
            icon="M3 4h18M4 8h16M6 12h12M8 16h8M10 20h4"
            title="No funnel data yet"
            description="Stage conversion data appears as deals move through the pipeline"
            compact
          />
        ) : (
          <>
            {/* Desktop: column headers (hidden on mobile) */}
            <div className="hidden sm:grid grid-cols-[140px_1fr_72px_28px] gap-3 px-1 mb-1">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Stage</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Volume</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">Conv.</div>
              <div />
            </div>

            {/* Desktop rows (hidden on mobile) */}
            <div className="hidden sm:block">
              {stages.map((stage, i) => (
                <FunnelRow
                  key={stage.stage}
                  stage={stage}
                  maxCount={maxCount}
                  isLast={i === stages.length - 1}
                />
              ))}
            </div>

            {/* Mobile cards (hidden on desktop) */}
            <div className="sm:hidden flex flex-col gap-1">
              {stages.map((stage, i) => (
                <FunnelCard
                  key={stage.stage}
                  stage={stage}
                  maxCount={maxCount}
                  isLast={i === stages.length - 1}
                />
              ))}
            </div>

            {/* Terminal section */}
            <TerminalBadges wonCount={data?.wonCount ?? 0} lostCount={data?.lostCount ?? 0} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
