'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from './EmptyState'
import { cn } from '@/lib/utils'
import type { FunnelResponse, FunnelStage } from '@/lib/types'

// Conversion rate pill color helpers
function conversionPillClasses(rate: number): string {
  if (rate >= 70) return 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
  if (rate >= 40) return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
  return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <p className="text-xs text-slate-400">Loading...</p>
    </div>
  )
}

// Single stage block in the horizontal strip
function StageBlock({
  stage,
  isSelected,
  onSelect,
}: {
  stage: FunnelStage
  isSelected: boolean
  onSelect: () => void
}) {
  const isBottleneck = stage.isBottleneck && !isSelected

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-lg border px-3 py-2.5 text-left shrink-0 min-w-[120px] transition-colors duration-150 cursor-pointer',
        isSelected
          ? 'border-primary ring-1 ring-primary/20 bg-primary/[.04]'
          : isBottleneck
            ? 'border-red-200 dark:border-red-800 bg-white dark:bg-[#1e1e21]'
            : 'border-black/[.06] dark:border-white/[.08] bg-white dark:bg-[#1e1e21]'
      )}
    >
      {/* Stage name with colored dot */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: stage.color || '#94a3b8' }}
        />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
          {stage.label}
        </span>
      </div>

      {/* Deal count */}
      <div className="text-sbase font-bold tabular-nums text-slate-900 dark:text-white">
        {stage.entryCount}
      </div>

      {/* Conversion rate pill */}
      {stage.conversionRate !== null ? (
        <span
          className={cn(
            'inline-flex items-center mt-1.5 text-xxs font-semibold tabular-nums rounded-full px-2 py-0.5',
            conversionPillClasses(stage.conversionRate)
          )}
        >
          {stage.conversionRate}%
        </span>
      ) : (
        <span className="inline-block mt-1.5 text-xxs text-slate-300 dark:text-slate-600">
          --
        </span>
      )}
    </button>
  )
}

// Arrow separator between stage blocks
function StageArrow() {
  return (
    <span className="shrink-0 text-slate-300 dark:text-slate-600 text-ssm font-medium self-center select-none">
      {'\u2192'}
    </span>
  )
}

// Won and Lost terminal blocks
function TerminalBlocks({ wonCount, lostCount }: { wonCount: number; lostCount: number }) {
  const total = wonCount + lostCount
  const winRate = total > 0 ? Math.round((wonCount / total) * 100) : null

  return (
    <div className="mt-3 pt-3 border-t border-black/[.06] dark:border-white/[.08]">
      <div className="text-atom font-semibold text-slate-400 uppercase tracking-wide mb-2">
        Terminal
      </div>
      <div className="flex gap-2">
        {/* Won block */}
        <div className="flex-1 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">Won</span>
          </div>
          <div className="text-sbase font-bold tabular-nums text-green-700 dark:text-green-400">
            {wonCount}
          </div>
          {winRate !== null && (
            <span className="text-xxs text-green-600 dark:text-green-500">
              {winRate}% win rate
            </span>
          )}
        </div>

        {/* Lost block */}
        <div className="flex-1 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-400">Lost</span>
          </div>
          <div className="text-sbase font-bold tabular-nums text-red-700 dark:text-red-400">
            {lostCount}
          </div>
          {total > 0 && (
            <span className="text-xxs text-red-600 dark:text-red-500">
              {total} total closed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Main component
interface StageFunnelChartProps {
  data: FunnelResponse | undefined
  isLoading: boolean
}

export function StageFunnelChart({ data, isLoading }: StageFunnelChartProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  const stages = data?.stages ?? []
  const hasData =
    stages.some(s => s.entryCount > 0) ||
    (data?.wonCount ?? 0) > 0 ||
    (data?.lostCount ?? 0) > 0
  const bottleneckCount = stages.filter(s => s.isBottleneck).length

  return (
    <Card>
      <CardContent>
        {/* Card header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-black/[.06] dark:border-white/[.08]">
          <div className="text-ssm font-semibold text-slate-900 dark:text-white">
            Pipeline Progress
          </div>
          {bottleneckCount > 0 && !isLoading && hasData && (
            <span className="inline-flex items-center gap-1 text-atom font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-full px-2 py-0.5">
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
            {/* Horizontal stage strip */}
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <div className="flex items-stretch gap-2">
                {stages.map((stage, i) => (
                  <div key={stage.stage} className="flex items-stretch gap-2">
                    <StageBlock
                      stage={stage}
                      isSelected={selectedStage === stage.stage}
                      onSelect={() =>
                        setSelectedStage(prev =>
                          prev === stage.stage ? null : stage.stage
                        )
                      }
                    />
                    {i < stages.length - 1 && <StageArrow />}
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal Won / Lost blocks */}
            <TerminalBlocks
              wonCount={data?.wonCount ?? 0}
              lostCount={data?.lostCount ?? 0}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
