import { Injectable, Inject } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import { deals } from '@symph-crm/database'
import { DB } from '../database/database.module'
import type { Database } from '../database/database.types'

export type PipelineSummary = {
  totalDeals: number
  activeDeals: number
  totalPipeline: number      // sum of value for non-closed deals
  avgDealSize: number        // avg value across all deals with a value
  winRate: number            // closed_won / (closed_won + closed_lost) as percentage 0-100
  dealsByStage: {
    stage: string
    count: number
    totalValue: number
  }[]
}

export type PipelineSummaryParams = {
  from?: string
  to?: string
}

export type FunnelStage = {
  stage: string
  label: string
  entryCount: number
  conversionRate: number | null   // % conversion to next funnel stage; null for last funnel stage
  isBottleneck: boolean           // conversionRate !== null && conversionRate < 40
  color: string
  sortOrder: number
}

export type FunnelResponse = {
  stages: FunnelStage[]   // active (non-terminal) pipeline stages, ordered by sort_order
  totalEntered: number    // entryCount of the first stage (0 if no stages)
  wonCount: number        // unique deals that ever reached closed_won
  lostCount: number       // unique deals that ever reached closed_lost
}

@Injectable()
export class PipelineService {
  constructor(@Inject(DB) private db: Database) {}

  async getSummary(params: PipelineSummaryParams = {}): Promise<PipelineSummary> {
    // Pass as ISO strings + explicit ::timestamptz cast so postgres.js doesn't
    // trip on type inference when mixed with ::int / ::float8 casts in the same query.
    const from = params.from ?? null
    const to = params.to ?? null

    // Stage grouping query — with optional date filter
    let stageQuery
    if (from && to) {
      stageQuery = this.db.execute(sql`SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(value), 0)::float8 AS total_value FROM deals WHERE created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz GROUP BY stage`)
    } else if (from) {
      stageQuery = this.db.execute(sql`SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(value), 0)::float8 AS total_value FROM deals WHERE created_at >= ${from}::timestamptz GROUP BY stage`)
    } else if (to) {
      stageQuery = this.db.execute(sql`SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(value), 0)::float8 AS total_value FROM deals WHERE created_at <= ${to}::timestamptz GROUP BY stage`)
    } else {
      stageQuery = this.db.execute(sql`SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(value), 0)::float8 AS total_value FROM deals GROUP BY stage`)
    }
    const rows = await stageQuery

    type Row = { stage: string; count: number; total_value: number }
    const byStage = (rows as unknown as Row[]).map(r => ({
      stage: r.stage,
      count: Number(r.count),
      totalValue: Number(r.total_value),
    }))

    const CLOSED = new Set(['closed_won', 'closed_lost'])

    let totalDeals = 0
    let activeDeals = 0
    let totalPipeline = 0
    let closedWon = 0
    let closedLost = 0
    let sumAllValues = 0
    let dealsWithValue = 0

    // Value query — with optional date filter
    let valueQuery
    if (from && to) {
      valueQuery = this.db.execute(sql`SELECT value AS v FROM deals WHERE value IS NOT NULL AND created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz`)
    } else if (from) {
      valueQuery = this.db.execute(sql`SELECT value AS v FROM deals WHERE value IS NOT NULL AND created_at >= ${from}::timestamptz`)
    } else if (to) {
      valueQuery = this.db.execute(sql`SELECT value AS v FROM deals WHERE value IS NOT NULL AND created_at <= ${to}::timestamptz`)
    } else {
      valueQuery = this.db.execute(sql`SELECT value AS v FROM deals WHERE value IS NOT NULL`)
    }
    const valueRows = await valueQuery

    type ValueRow = { v: string | null }
    for (const r of valueRows as unknown as ValueRow[]) {
      const n = parseFloat(r.v ?? '0')
      if (!isNaN(n) && n > 0) {
        sumAllValues += n
        dealsWithValue++
      }
    }

    for (const s of byStage) {
      totalDeals += s.count
      if (!CLOSED.has(s.stage)) {
        activeDeals += s.count
        totalPipeline += s.totalValue
      }
      if (s.stage === 'closed_won') closedWon = s.count
      if (s.stage === 'closed_lost') closedLost = s.count
    }

    const closedTotal = closedWon + closedLost
    const winRate = closedTotal > 0 ? Math.round((closedWon / closedTotal) * 100) : 0
    const avgDealSize = dealsWithValue > 0 ? Math.round(sumAllValues / dealsWithValue) : 0

    return {
      totalDeals,
      activeDeals,
      totalPipeline: Math.round(totalPipeline),
      avgDealSize,
      winRate,
      dealsByStage: byStage,
    }
  }

  async getFunnel(params: PipelineSummaryParams = {}): Promise<FunnelResponse> {
    const from = params.from ?? null
    const to = params.to ?? null

    // Count unique deals that have ever been in each stage.
    // Source 1: audit_logs transitions (details->>'to' = stage slug)
    // Source 2: current deal stage (catches deals never transitioned, e.g. fresh leads)
    // UNION deduplicates by (entity_id, stage), then we count per stage.
    // Left-join with pipeline_stages gives us ordering, labels, and colors for ALL
    // configured stages (even empty ones show as 0).
    let funnelQuery
    if (from && to) {
      funnelQuery = this.db.execute(sql`
        WITH transitions AS (
          SELECT DISTINCT entity_id, details->>'to' AS stage
          FROM audit_logs
          WHERE audit_type = 'deal_stage_change'
            AND details->>'to' IS NOT NULL
            AND created_at >= ${from}::timestamptz
            AND created_at <= ${to}::timestamptz
        ),
        current_deal_stages AS (
          SELECT DISTINCT id::text AS entity_id, stage
          FROM deals
          WHERE created_at >= ${from}::timestamptz
            AND created_at <= ${to}::timestamptz
        ),
        all_stage_entries AS (
          SELECT entity_id, stage FROM transitions
          UNION
          SELECT entity_id, stage FROM current_deal_stages
        ),
        stage_counts AS (
          SELECT stage, COUNT(DISTINCT entity_id)::int AS entry_count
          FROM all_stage_entries
          GROUP BY stage
        )
        SELECT
          ps.slug        AS stage,
          ps.label       AS label,
          ps.sort_order  AS sort_order,
          ps.color       AS color,
          COALESCE(sc.entry_count, 0)::int AS entry_count
        FROM pipeline_stages ps
        LEFT JOIN stage_counts sc ON sc.stage = ps.slug
        WHERE ps.is_active = true
        ORDER BY ps.sort_order
      `)
    } else if (from) {
      funnelQuery = this.db.execute(sql`
        WITH transitions AS (
          SELECT DISTINCT entity_id, details->>'to' AS stage
          FROM audit_logs
          WHERE audit_type = 'deal_stage_change'
            AND details->>'to' IS NOT NULL
            AND created_at >= ${from}::timestamptz
        ),
        current_deal_stages AS (
          SELECT DISTINCT id::text AS entity_id, stage
          FROM deals
          WHERE created_at >= ${from}::timestamptz
        ),
        all_stage_entries AS (
          SELECT entity_id, stage FROM transitions
          UNION
          SELECT entity_id, stage FROM current_deal_stages
        ),
        stage_counts AS (
          SELECT stage, COUNT(DISTINCT entity_id)::int AS entry_count
          FROM all_stage_entries
          GROUP BY stage
        )
        SELECT
          ps.slug        AS stage,
          ps.label       AS label,
          ps.sort_order  AS sort_order,
          ps.color       AS color,
          COALESCE(sc.entry_count, 0)::int AS entry_count
        FROM pipeline_stages ps
        LEFT JOIN stage_counts sc ON sc.stage = ps.slug
        WHERE ps.is_active = true
        ORDER BY ps.sort_order
      `)
    } else if (to) {
      funnelQuery = this.db.execute(sql`
        WITH transitions AS (
          SELECT DISTINCT entity_id, details->>'to' AS stage
          FROM audit_logs
          WHERE audit_type = 'deal_stage_change'
            AND details->>'to' IS NOT NULL
            AND created_at <= ${to}::timestamptz
        ),
        current_deal_stages AS (
          SELECT DISTINCT id::text AS entity_id, stage
          FROM deals
          WHERE created_at <= ${to}::timestamptz
        ),
        all_stage_entries AS (
          SELECT entity_id, stage FROM transitions
          UNION
          SELECT entity_id, stage FROM current_deal_stages
        ),
        stage_counts AS (
          SELECT stage, COUNT(DISTINCT entity_id)::int AS entry_count
          FROM all_stage_entries
          GROUP BY stage
        )
        SELECT
          ps.slug        AS stage,
          ps.label       AS label,
          ps.sort_order  AS sort_order,
          ps.color       AS color,
          COALESCE(sc.entry_count, 0)::int AS entry_count
        FROM pipeline_stages ps
        LEFT JOIN stage_counts sc ON sc.stage = ps.slug
        WHERE ps.is_active = true
        ORDER BY ps.sort_order
      `)
    } else {
      funnelQuery = this.db.execute(sql`
        WITH transitions AS (
          SELECT DISTINCT entity_id, details->>'to' AS stage
          FROM audit_logs
          WHERE audit_type = 'deal_stage_change'
            AND details->>'to' IS NOT NULL
        ),
        current_deal_stages AS (
          SELECT DISTINCT id::text AS entity_id, stage
          FROM deals
        ),
        all_stage_entries AS (
          SELECT entity_id, stage FROM transitions
          UNION
          SELECT entity_id, stage FROM current_deal_stages
        ),
        stage_counts AS (
          SELECT stage, COUNT(DISTINCT entity_id)::int AS entry_count
          FROM all_stage_entries
          GROUP BY stage
        )
        SELECT
          ps.slug        AS stage,
          ps.label       AS label,
          ps.sort_order  AS sort_order,
          ps.color       AS color,
          COALESCE(sc.entry_count, 0)::int AS entry_count
        FROM pipeline_stages ps
        LEFT JOIN stage_counts sc ON sc.stage = ps.slug
        WHERE ps.is_active = true
        ORDER BY ps.sort_order
      `)
    }

    const rows = await funnelQuery
    type FunnelRow = { stage: string; label: string; sort_order: number; color: string; entry_count: number }
    const allRows = (rows as unknown as FunnelRow[]).map(r => ({
      stage: r.stage,
      label: r.label,
      sortOrder: Number(r.sort_order),
      color: r.color,
      entryCount: Number(r.entry_count),
    }))

    const TERMINAL = new Set(['closed_won', 'closed_lost'])
    const funnelRows = allRows.filter(r => !TERMINAL.has(r.stage))
    const wonRow = allRows.find(r => r.stage === 'closed_won')
    const lostRow = allRows.find(r => r.stage === 'closed_lost')

    // Compute per-stage conversion rate to the immediately next funnel stage
    const stages: FunnelStage[] = funnelRows.map((s, i) => {
      const next = funnelRows[i + 1]
      const conversionRate =
        next != null && s.entryCount > 0
          ? Math.round((next.entryCount / s.entryCount) * 100)
          : null
      const isBottleneck = conversionRate !== null && conversionRate < 40
      return {
        stage: s.stage,
        label: s.label,
        entryCount: s.entryCount,
        conversionRate,
        isBottleneck,
        color: s.color,
        sortOrder: s.sortOrder,
      }
    })

    return {
      stages,
      totalEntered: funnelRows[0]?.entryCount ?? 0,
      wonCount: wonRow?.entryCount ?? 0,
      lostCount: lostRow?.entryCount ?? 0,
    }
  }
}
